from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import uuid

from fastapi import Header, HTTPException, status

from app.db import get_session_activity_collection, get_sessions_collection


SESSION_TTL_DAYS = 5
MAX_HEARTBEAT_GAP_SECONDS = 600


def _now_utc():
    return datetime.now(timezone.utc)


def _as_aware_utc(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    return None


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def create_session(user_doc, device_info: dict | None = None):
    sessions = get_sessions_collection()
    now = _now_utc()
    expires_at = now + timedelta(days=SESSION_TTL_DAYS)
    raw_token = secrets.token_urlsafe(48)

    session_doc = {
        'session_id': str(uuid.uuid4()),
        'user_id': str(user_doc['_id']),
        'username': user_doc.get('username'),
        'token_hash': _token_hash(raw_token),
        'created_at': now,
        'updated_at': now,
        'last_seen_at': now,
        'expires_at': expires_at,
        'ended_at': None,
        'is_active': True,
        'total_active_seconds': 0,
        'device_info': device_info or {},
    }

    sessions.insert_one(session_doc)

    return {
        'session_token': raw_token,
        'session_expires_at': expires_at.isoformat(),
        'session_id': session_doc['session_id'],
    }


def verify_session_token(session_token: str):
    sessions = get_sessions_collection()
    now = _now_utc()
    session_doc = sessions.find_one({'token_hash': _token_hash(session_token)})

    if not session_doc:
        return None

    if not session_doc.get('is_active', True):
        return None

    expires_at = _as_aware_utc(session_doc.get('expires_at'))
    if not expires_at or expires_at <= now:
        sessions.update_one(
            {'_id': session_doc['_id']},
            {
                '$set': {
                    'is_active': False,
                    'ended_at': now,
                    'updated_at': now,
                }
            },
        )
        return None

    return session_doc


def get_active_session(authorization: str | None = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing authorization token.')

    prefix = 'bearer '
    auth_lower = authorization.lower()
    if not auth_lower.startswith(prefix):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid authorization scheme.')

    session_token = authorization[len(prefix):].strip()
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing session token.')

    session_doc = verify_session_token(session_token)
    if not session_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Session is invalid or expired.')

    return session_doc


def heartbeat_session(session_doc, duration_seconds: int = 60):
    sessions = get_sessions_collection()
    activity = get_session_activity_collection()

    now = _now_utc()
    safe_duration = int(max(0, min(MAX_HEARTBEAT_GAP_SECONDS, int(duration_seconds or 0))))

    sessions.update_one(
        {'_id': session_doc['_id']},
        {
            '$set': {
                'last_seen_at': now,
                'updated_at': now,
            },
            '$inc': {
                'total_active_seconds': safe_duration,
            },
        },
    )

    activity.insert_one(
        {
            'session_id': session_doc.get('session_id'),
            'user_id': session_doc.get('user_id'),
            'duration_seconds': safe_duration,
            'timestamp': now,
            'event': 'heartbeat',
        }
    )


def close_session(session_doc, reason: str = 'logout'):
    sessions = get_sessions_collection()
    activity = get_session_activity_collection()

    now = _now_utc()
    sessions.update_one(
        {'_id': session_doc['_id']},
        {
            '$set': {
                'is_active': False,
                'ended_at': now,
                'updated_at': now,
                'last_seen_at': now,
            }
        },
    )

    activity.insert_one(
        {
            'session_id': session_doc.get('session_id'),
            'user_id': session_doc.get('user_id'),
            'duration_seconds': 0,
            'timestamp': now,
            'event': reason,
        }
    )
