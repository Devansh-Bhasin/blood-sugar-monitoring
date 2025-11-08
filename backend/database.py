import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use DATABASE_URL from environment, fallback to SQLite for local dev
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./blood_sugar.db")

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=2,         # limit pool size for Render free DB
        max_overflow=1,      # limit overflow
        pool_timeout=30,     # seconds
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
