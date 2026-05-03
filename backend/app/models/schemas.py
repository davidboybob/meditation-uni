from __future__ import annotations
import re
from datetime import date as _date
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from typing import Optional

_TIME_RE = re.compile(r"^\d{2}:\d{2}$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _validate_date(value: str, field_name: str) -> str:
    """YYYY-MM-DD 형식이고 유효한 날짜인지 검증한다."""
    if not _DATE_RE.match(value):
        raise ValueError(f"{field_name}은 YYYY-MM-DD 형식이어야 합니다.")
    try:
        _date.fromisoformat(value)
    except ValueError:
        raise ValueError(f"{field_name}이 유효한 날짜가 아닙니다: {value}")
    return value


def _validate_time(value: str, field_name: str) -> str:
    """HH:MM 형식이고 유효한 시각인지 검증한다."""
    if not _TIME_RE.match(value):
        raise ValueError(f"{field_name}은 HH:MM 형식이어야 합니다.")
    h, m = int(value[:2]), int(value[3:])
    if not (0 <= h <= 23):
        raise ValueError(f"{field_name}의 시(hour)는 0-23 사이여야 합니다. 입력값: {h}")
    if not (0 <= m <= 59):
        raise ValueError(f"{field_name}의 분(minute)은 0-59 사이여야 합니다. 입력값: {m}")
    return value


class PostCreate(BaseModel):
    user_email: str
    content: str
    submission_time: str  # "HH:MM"
    deadline_time: str    # "HH:MM"

    @field_validator("user_email")
    @classmethod
    def user_email_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("user_email은 빈 문자열일 수 없습니다.")
        return v

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("content는 빈 문자열일 수 없습니다.")
        return v

    @field_validator("submission_time")
    @classmethod
    def submission_time_format(cls, v: str) -> str:
        return _validate_time(v, "submission_time")

    @field_validator("deadline_time")
    @classmethod
    def deadline_time_format(cls, v: str) -> str:
        return _validate_time(v, "deadline_time")


class PostResponse(BaseModel):
    status: str  # "present" or "late"
    message: str
    submission_time: str
    deadline_time: str


class PostRecord(BaseModel):
    id: int
    user_email: str
    content: str
    submission_time: str
    deadline_time: str
    status: str
    submitted_date: str

    model_config = ConfigDict(from_attributes=True)


class TodayStatus(BaseModel):
    submitted: bool
    status: Optional[str] = None   # "present" | "late" | None
    message: Optional[str] = None
    submission_time: Optional[str] = None


class AttendanceSummary(BaseModel):
    total_days: int
    present_count: int
    late_count: int
    absent_count: int


class ChallengeCreate(BaseModel):
    name: str
    start_date: str   # YYYY-MM-DD
    end_date: str     # YYYY-MM-DD
    deadline_time: str  # HH:MM

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("챌린지 이름은 빈 문자열일 수 없습니다.")
        return v

    @field_validator("start_date")
    @classmethod
    def start_date_format(cls, v: str) -> str:
        return _validate_date(v, "start_date")

    @field_validator("end_date")
    @classmethod
    def end_date_format(cls, v: str) -> str:
        return _validate_date(v, "end_date")

    @field_validator("deadline_time")
    @classmethod
    def deadline_format(cls, v: str) -> str:
        return _validate_time(v, "deadline_time")

    @model_validator(mode="after")
    def start_before_end(self) -> "ChallengeCreate":
        if self.start_date > self.end_date:
            raise ValueError("시작일이 종료일보다 늦을 수 없습니다.")
        return self


class ChallengeResponse(BaseModel):
    id: int
    name: str
    start_date: str
    end_date: str
    deadline_time: str
    member_count: int

    model_config = ConfigDict(from_attributes=True)


class MemberAttendance(BaseModel):
    user_email: str
    submitted: bool
    status: Optional[str] = None
    submission_time: Optional[str] = None


class ChallengeTodayResponse(BaseModel):
    challenge: ChallengeResponse
    date: str
    members: list[MemberAttendance]


class ChallengeUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    deadline_time: Optional[str] = None

    @field_validator("start_date")
    @classmethod
    def start_date_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return _validate_date(v, "start_date")
        return v

    @field_validator("end_date")
    @classmethod
    def end_date_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return _validate_date(v, "end_date")
        return v

    @field_validator("deadline_time")
    @classmethod
    def deadline_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return _validate_time(v, "deadline_time")
        return v

    @model_validator(mode="after")
    def start_before_end(self) -> "ChallengeUpdate":
        if self.start_date is not None and self.end_date is not None:
            if self.start_date > self.end_date:
                raise ValueError("시작일이 종료일보다 늦을 수 없습니다.")
        return self


class MemberStats(BaseModel):
    user_email: str
    present_count: int
    late_count: int
    absent_count: int
    total_fine: int


class ChallengeAttendance(BaseModel):
    challenge: ChallengeResponse
    members: list[MemberStats]
    dates: list[str]
    grid: dict[str, dict[str, str]]  # {user_email: {date: status}}


class FineRequest(BaseModel):
    late_count: float
    absent_count: float

    @field_validator("late_count")
    @classmethod
    def late_count_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("late_count는 0 이상이어야 합니다.")
        return v

    @field_validator("absent_count")
    @classmethod
    def absent_count_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("absent_count는 0 이상이어야 합니다.")
        return v


class FineResponse(BaseModel):
    total_fine: int
    converted_absences: float
    detail: str
