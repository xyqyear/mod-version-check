from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Mod Version Checker"
    api_prefix: str = "/api"
    database_url: str = "sqlite+aiosqlite:///./data/db.sqlite3"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    debug: bool = False

    sync_interval_minutes: int = 360
    sync_on_startup: bool = True
    modrinth_base_url: str = "https://api.modrinth.com/v2"
    modrinth_user_agent: str = "xyqyear/mod-version-checker/0.1.0"
    curseforge_base_url: str = "https://api.curseforge.com"
    curseforge_api_key: str | None = None
    http_timeout: int = 30


settings = Settings()
