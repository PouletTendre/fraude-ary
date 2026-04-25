import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    PYTHON_ENV: str = "development"

    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URL:
            raise RuntimeError("DATABASE_URL is required — set via env var or .env file")
        if not self.JWT_SECRET or self.JWT_SECRET in ("devsecretchangeinprod", "change_this_secret_in_production"):
            raise RuntimeError("JWT_SECRET must be changed from its default — set via env var or .env file")

settings = Settings()