from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class CrudConfig(BaseModel):
    create: bool = True
    read: bool = True
    update: bool = True
    delete: bool = True


class AppConfig(BaseModel):
    name: str = "inventory-manager"
    environment: str = "development"
    host: str = "127.0.0.1"
    port: int = 8000


class DatabaseConfig(BaseModel):
    url: str = "sqlite:///./data/inventory.db"


class FrontendConfig(BaseModel):
    dev_server_url: str = "http://localhost:5173"
    public_base_url: str = "/"


class FileConfig(BaseModel):
    app: AppConfig = Field(default_factory=AppConfig)
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    mcp: dict[str, CrudConfig] | dict[str, Any] = Field(default_factory=dict)
    frontend: FrontendConfig = Field(default_factory=FrontendConfig)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="INV_")

    config_path: str = "example.config.yaml"

    @property
    def file_config(self) -> FileConfig:
        path = Path(self.config_path)
        if not path.exists():
            return FileConfig()
        loaded = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        return FileConfig.model_validate(loaded)

    @property
    def app(self) -> AppConfig:
        return self.file_config.app

    @property
    def database(self) -> DatabaseConfig:
        return self.file_config.database

    @property
    def mcp_crud(self) -> CrudConfig:
        mcp_value = self.file_config.mcp or {}
        crud_value = mcp_value.get("crud", {}) if isinstance(mcp_value, dict) else {}
        return CrudConfig.model_validate(crud_value)


settings = Settings()
