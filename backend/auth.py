# ============================================================
# AUTHENTICATION AND SECURITY
# Land Acquisition AI
# ============================================================

import os
import sqlite3
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel


# ============================================================
# DATABASE
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "projects.db")


# ============================================================
# JWT CONFIGURATION
# ============================================================

# IMPORTANT:
# In production, set SECRET_KEY as an environment variable.
#
# Example:
# export SECRET_KEY="your-long-random-secret-key"

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "CHANGE_THIS_SECRET_KEY_IN_PRODUCTION"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# OAUTH2
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/login"
)


# ============================================================
# USER MODEL
# ============================================================

class User(BaseModel):
    username: str
    role: str


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    bcrypt supports passwords up to 72 bytes.
    We explicitly enforce this limit.
    """

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        raise ValueError(
            "Password must be 72 bytes or less."
        )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


# ============================================================
# PASSWORD VERIFICATION
# ============================================================

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    try:

        password_bytes = plain_password.encode("utf-8")

        if len(password_bytes) > 72:
            return False

        return bcrypt.checkpw(
            password_bytes,
            hashed_password.encode("utf-8")
        )

    except (ValueError, TypeError):

        return False


# ============================================================
# CREATE JWT TOKEN
# ============================================================

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
) -> str:

    to_encode = data.copy()

    if expires_delta:

        expire = datetime.now(
            timezone.utc
        ) + expires_delta

    else:

        expire = datetime.now(
            timezone.utc
        ) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# ============================================================
# VERIFY JWT TOKEN
# ============================================================

def verify_token(token: str) -> dict:

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")
        role = payload.get("role")

        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

        return {
            "username": username,
            "role": role
        }

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    return verify_token(token)


# ============================================================
# REQUIRE ADMIN
# ============================================================

def require_admin(
    current_user: dict = Depends(get_current_user)
):

    if current_user.get("role") != "admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# ============================================================
# GET USER FROM DATABASE
# ============================================================

def get_user(username: str):

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            username,
            password_hash,
            role
        FROM users
        WHERE username = ?
        """,
        (username,)
    )

    user = cursor.fetchone()

    connection.close()

    if user is None:
        return None

    return dict(user)


# ============================================================
# CREATE USER
# ============================================================

def create_user(
    username: str,
    password: str,
    role: str = "user"
):

    if role not in ["user", "admin"]:

        raise ValueError(
            "Role must be either 'user' or 'admin'"
        )

    existing_user = get_user(username)

    if existing_user:

        raise ValueError(
            "Username already exists"
        )

    password_hash = hash_password(
        password
    )

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO users (
            username,
            password_hash,
            role
        )
        VALUES (?, ?, ?)
        """,
        (
            username,
            password_hash,
            role
        )
    )

    connection.commit()

    user_id = cursor.lastrowid

    connection.close()

    return user_id


# ============================================================
# AUTHENTICATE USER
# ============================================================

def authenticate_user(
    username: str,
    password: str
):

    user = get_user(username)

    if not user:

        return False

    if not verify_password(
        password,
        user["password_hash"]
    ):

        return False

    return user
