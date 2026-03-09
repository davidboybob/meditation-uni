from __future__ import annotations
from pydantic import BaseModel

class PostCreate(BaseModel):
    user_email: str
    content: str
    submission_time: str  # "HH:MM"
    deadline_time: str    # "HH:MM"

class PostResponse(BaseModel):
    status: str  # "present" or "late"
    message: str
    submission_time: str
    deadline_time: str

class FineRequest(BaseModel):
    late_count: float
    absent_count: float

class FineResponse(BaseModel):
    total_fine: int
    converted_absences: float
    detail: str
