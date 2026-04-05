from datetime import datetime, timezone
import base64
import hashlib
import hmac
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from app.db import get_users_collection
from app.session import close_session, create_session, get_active_session, heartbeat_session


router = APIRouter()


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    email: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=6, max_length=128)
    display_name: Optional[str] = Field(default=None, max_length=80)
    device_info: Optional[dict] = None


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=1, max_length=128)
    device_info: Optional[dict] = None
    
class ChangePasswordRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=120)
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)

class ForgotPasswordRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=120)
    new_password: str = Field(min_length=6, max_length=128)


class SessionHeartbeatRequest(BaseModel):
    duration_seconds: int = Field(default=60, ge=0, le=600)


def normalize_email(value: str) -> str:
    return value.strip().lower()


def normalize_username(value: str) -> str:
    return value.strip().lower()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    iterations = 260000
    derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
    return 'pbkdf2_sha256${}${}${}'.format(
        iterations,
        base64.b64encode(salt).decode('utf-8'),
        base64.b64encode(derived).decode('utf-8'),
    )


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt_b64, hash_b64 = encoded.split('$', 3)
        if algorithm != 'pbkdf2_sha256':
            return False
        salt = base64.b64decode(salt_b64.encode('utf-8'))
        expected = base64.b64decode(hash_b64.encode('utf-8'))
        derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, int(iterations))
        return hmac.compare_digest(derived, expected)
    except Exception:
        return False


def serialize_user(user_doc):
    return {
        'id': str(user_doc['_id']),
        'username': user_doc['username'],
        'email': user_doc['email'],
        'display_name': user_doc.get('display_name') or user_doc['username'],
        'created_at': user_doc.get('created_at'),
        'updated_at': user_doc.get('updated_at'),
    }


def _sanitize_device_info(device_info: Optional[dict]) -> dict:
    if not isinstance(device_info, dict):
        return {}

    # Browser builds cannot access physical MAC; desktop can provide it via Electron bridge.
    return {
        'device_name': str(device_info.get('device_name') or '').strip()[:120],
        'platform': str(device_info.get('platform') or '').strip()[:80],
        'user_agent': str(device_info.get('user_agent') or '').strip()[:400],
        'mac_address': str(device_info.get('mac_address') or '').strip()[:80],
    }

def find_user_by_identifier(users, identifier: str):
    normalized = identifier.strip().lower()
    return users.find_one(
        {
            '$or': [
                {'username': normalized},
                {'email': normalized},
            ]
        }
    )


@router.post('/register')
def register_user(payload: RegisterRequest):
    users = get_users_collection()
    username = normalize_username(payload.username)
    email = normalize_email(payload.email)
    display_name = (payload.display_name or payload.username).strip()

    if not username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username is required.')
    if '@' not in email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email is invalid.')

    existing = users.find_one({
        '$or': [
            {'username': username},
            {'email': email},
        ]
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='User already exists.')

    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        'username': username,
        'email': email,
        'display_name': display_name,
        'password_hash': hash_password(payload.password),
        'created_at': now,
        'updated_at': now,
    }

    try:
        result = users.insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='User already exists.')

    stored = users.find_one({'_id': result.inserted_id})
    if not stored:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Failed to create user.')

    session = create_session(stored, device_info=_sanitize_device_info(payload.device_info))

    return {
        'message': 'Registration successful.',
        'user': serialize_user(stored),
        'session_token': session['session_token'],
        'session_expires_at': session['session_expires_at'],
        'session_id': session['session_id'],
    }


@router.post('/login')
def login_user(payload: LoginRequest):
    users = get_users_collection()
    user_doc = find_user_by_identifier(users, payload.identifier)

    if not user_doc or not verify_password(payload.password, user_doc.get('password_hash', '')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials.')

    users.update_one(
        {'_id': user_doc['_id']},
        {'$set': {'updated_at': datetime.now(timezone.utc).isoformat()}},
    )

    updated_user = users.find_one({'_id': user_doc['_id']}) or user_doc
    session = create_session(updated_user, device_info=_sanitize_device_info(payload.device_info))
    return {
        'message': 'Login successful.',
        'user': serialize_user(updated_user),
        'session_token': session['session_token'],
        'session_expires_at': session['session_expires_at'],
        'session_id': session['session_id'],
    }

@router.post('/change-password')
def change_password(payload: ChangePasswordRequest):
    users = get_users_collection()
    user_doc = find_user_by_identifier(users, payload.identifier)

    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')

    if not verify_password(payload.current_password, user_doc.get('password_hash', '')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Current password is invalid.')

    users.update_one(
        {'_id': user_doc['_id']},
        {
            '$set': {
                'password_hash': hash_password(payload.new_password),
                'updated_at': datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    return {'message': 'Password changed successfully.'}

@router.post('/forgot-password')
def forgot_password(payload: ForgotPasswordRequest):
    users = get_users_collection()
    user_doc = find_user_by_identifier(users, payload.identifier)

    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')

    users.update_one(
        {'_id': user_doc['_id']},
        {
            '$set': {
                'password_hash': hash_password(payload.new_password),
                'updated_at': datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    return {'message': 'Password reset successful. You can now log in with the new password.'}


@router.post('/session/heartbeat')
def session_heartbeat(payload: SessionHeartbeatRequest, session_doc=Depends(get_active_session)):
    heartbeat_session(session_doc, duration_seconds=payload.duration_seconds)
    return {
        'message': 'Session heartbeat recorded.',
        'session_id': session_doc.get('session_id'),
    }


@router.post('/logout')
def logout_user(session_doc=Depends(get_active_session)):
    close_session(session_doc, reason='logout')
    return {'message': 'Logged out successfully.'}