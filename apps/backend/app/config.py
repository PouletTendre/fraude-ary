from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://app:devpassword123@localhost:5432/fraudeary"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = "devsecretchangeinprod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    PYTHON_ENV: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()