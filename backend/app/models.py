import enum
import json
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator


class JSONList(TypeDecorator[list[str] | None]):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value: list[str] | None, dialect) -> str | None:
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value: str | None, dialect) -> list[str] | None:
        if value is None:
            return None
        return json.loads(value)

naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(AsyncAttrs, DeclarativeBase):
    metadata = MetaData(naming_convention=naming_convention)


class LoaderType(str, enum.Enum):
    forge = "forge"
    fabric = "fabric"
    neoforge = "neoforge"
    quilt = "quilt"


profile_mods = Table(
    "profile_mods",
    Base.metadata,
    Column("profile_id", Integer, ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("mod_id", Integer, ForeignKey("mods.id", ondelete="CASCADE"), primary_key=True),
)


class Mod(Base):
    __tablename__ = "mods"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True)
    icon_url: Mapped[str | None] = mapped_column(String(500))
    modrinth_id: Mapped[str | None] = mapped_column(String(50), unique=True)
    curseforge_id: Mapped[int | None] = mapped_column(Integer, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    profiles: Mapped[list["Profile"]] = relationship(secondary=profile_mods, back_populates="mods")
    versions: Mapped[list["ModVersion"]] = relationship(back_populates="mod", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    loader: Mapped[LoaderType] = mapped_column(Enum(LoaderType))
    game_versions: Mapped[list[str] | None] = mapped_column(JSONList, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    mods: Mapped[list["Mod"]] = relationship(secondary=profile_mods, back_populates="profiles", lazy="selectin")


class ModVersion(Base):
    __tablename__ = "mod_versions"
    __table_args__ = (
        UniqueConstraint("mod_id", "provider", "loader", "game_version", "provider_version_id"),
        Index("ix_mod_versions_mod_id", "mod_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    mod_id: Mapped[int] = mapped_column(ForeignKey("mods.id", ondelete="CASCADE"))
    provider: Mapped[str] = mapped_column(String(20))
    loader: Mapped[str] = mapped_column(String(20))
    game_version: Mapped[str] = mapped_column(String(20))
    version_number: Mapped[str] = mapped_column(String(100))
    version_name: Mapped[str | None] = mapped_column(String(255))
    version_type: Mapped[str] = mapped_column(String(20))
    date_published: Mapped[datetime] = mapped_column(DateTime)
    provider_version_id: Mapped[str] = mapped_column(String(50))
    fetched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    mod: Mapped["Mod"] = relationship(back_populates="versions")


class SyncStatus(Base):
    __tablename__ = "sync_status"

    id: Mapped[int] = mapped_column(primary_key=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    mods_checked: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="running")
    error_message: Mapped[str | None] = mapped_column(Text)
