from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/pos_dev"
    ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173"
    JWT_SECRET: str = "change-me-in-production"
    JWT_EXPIRE_DAYS: int = 30

    model_config = {"env_file": ".env"}


settings = Settings()
