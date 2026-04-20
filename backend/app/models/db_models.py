from __future__ import annotations
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Post(Base):
    __tablename__ = "posts"
    __table_args__ = (
        UniqueConstraint("user_email", "submitted_date", name="uq_post_user_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    submission_time: Mapped[str] = mapped_column(String(5), nullable=False)  # HH:MM
    deadline_time: Mapped[str] = mapped_column(String(5), nullable=False)    # HH:MM
    status: Mapped[str] = mapped_column(String(10), nullable=False)           # present | late
    submitted_date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[str] = mapped_column(String(10), nullable=False)   # YYYY-MM-DD
    end_date: Mapped[str] = mapped_column(String(10), nullable=False)     # YYYY-MM-DD
    deadline_time: Mapped[str] = mapped_column(String(5), nullable=False)  # HH:MM
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())


class ChallengeMember(Base):
    __tablename__ = "challenge_members"
    __table_args__ = (
        UniqueConstraint("challenge_id", "user_email", name="uq_challenge_member"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    challenge_id: Mapped[int] = mapped_column(Integer, ForeignKey("challenges.id"), nullable=False, index=True)
    user_email: Mapped[str] = mapped_column(String(255), nullable=False)
    joined_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
