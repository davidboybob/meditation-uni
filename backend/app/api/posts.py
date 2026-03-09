from __future__ import annotations
from fastapi import APIRouter
from app.models.schemas import PostCreate, PostResponse

router = APIRouter()

@router.post("/posts", response_model=PostResponse)
async def submit_post(data: PostCreate) -> PostResponse:
    sub_h, sub_m = map(int, data.submission_time.split(":"))
    dead_h, dead_m = map(int, data.deadline_time.split(":"))
    sub_total = sub_h * 60 + sub_m
    dead_total = dead_h * 60 + dead_m
    if sub_total <= dead_total:
        status = "present"
        message = f"출석이 확인되었습니다. ({data.submission_time} 제출)"
    else:
        status = "late"
        message = f"지각 처리되었습니다. ({data.submission_time} 제출, 마감 {data.deadline_time})"
    return PostResponse(
        status=status,
        message=message,
        submission_time=data.submission_time,
        deadline_time=data.deadline_time,
    )
