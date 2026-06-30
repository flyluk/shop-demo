from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://shopuser:shoppass@postgres:5432/shopdb"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 60
    jwt_algorithm: str = "HS256"

    db_pool_size: int = 5
    db_max_overflow: int = 8
    db_pool_timeout: int = 5
    db_pool_recycle: int = 1800

    uvicorn_workers: int = 4


settings = Settings()
