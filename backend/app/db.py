import os
from functools import lru_cache

from dotenv import load_dotenv
from pymongo import MongoClient


load_dotenv()


@lru_cache(maxsize=1)
def get_mongo_client() -> MongoClient:
    uri = os.getenv('MONGODB_URI')
    if not uri:
        raise RuntimeError('MONGODB_URI is not configured.')

    return MongoClient(uri)


@lru_cache(maxsize=1)
def get_corelign_database():
    return get_mongo_client().get_database('corelign')


@lru_cache(maxsize=1)
def get_users_collection():
    collection = get_corelign_database()['users']
    collection.create_index('username', unique=True)
    collection.create_index('email', unique=True)
    return collection


@lru_cache(maxsize=1)
def get_sessions_collection():
    collection = get_corelign_database()['user_sessions']
    collection.create_index('token_hash', unique=True)
    collection.create_index('user_id')
    collection.create_index('session_id', unique=True)
    collection.create_index('expires_at', expireAfterSeconds=0)
    collection.create_index('is_active')
    return collection


@lru_cache(maxsize=1)
def get_session_activity_collection():
    collection = get_corelign_database()['session_activity']
    collection.create_index('session_id')
    collection.create_index('user_id')
    collection.create_index('timestamp')
    return collection


@lru_cache(maxsize=1)
def get_model_usage_events_collection():
    collection = get_corelign_database()['model_usage_events']
    collection.create_index('timestamp')
    collection.create_index('user_id')
    collection.create_index('model')
    collection.create_index('session_id')
    return collection


@lru_cache(maxsize=1)
def get_user_model_usage_collection():
    collection = get_corelign_database()['user_model_usage']
    collection.create_index([('user_id', 1), ('model', 1)], unique=True)
    collection.create_index('model')
    return collection
