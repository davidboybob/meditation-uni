from __future__ import annotations
from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.db_models import Post, Challenge, ChallengeMember
from app.models.schemas import PostCreate, PostResponse, PostRecord, TodayStatus, AttendanceSummary

router = APIRouter()


async def _count_absent_days(
    db: AsyncSession, user_email: str, submitted_dates: set[str],
) -> int:
    """사용자가 참여 중인 챌린지의 활성 기간 내 미제출일(결석)을 계산한다."""
    result = await db.execute(
        select(ChallengeMember.challenge_id).where(
            ChallengeMember.user_email == user_email
        )
    )
    challenge_ids = [row[0] for row in result.all()]
    if not challenge_ids:
        return 0

    challenges_result = await db.execute(
        select(Challenge).where(Challenge.id.in_(challenge_ids))
    )
    challenges = challenges_result.scalars().all()

    yesterday = (date.today() - timedelta(days=1)).isoformat()
    required_dates: set[str] = set()

    for c in challenges:
        # 챌린지 기간 중 어제까지의 날짜만 결석 대상 (오늘은 아직 제출 가능)
        end = min(c.end_date, yesterday)
        start = c.start_date
        if start > end:
            continue
        d = date.fromisoformat(start)
        end_d = date.fromisoformat(end)
        while d <= end_d:
            required_dates.add(d.isoformat())
            d += timedelta(days=1)

    return len(required_dates - submitted_dates)


def _require_email(user_email: str = Query(...)) -> str:
    """쿼리 파라미터 user_email이 빈 문자열이 아닌지 검증한다."""
    if not user_email.strip():
        raise HTTPException(status_code=400, detail="user_email은 빈 문자열일 수 없습니다.")
    return user_email


def _determine_status(submission_time: str, deadline_time: str) -> tuple[str, str]:
    sub_h, sub_m = map(int, submission_time.split(":"))
    dead_h, dead_m = map(int, deadline_time.split(":"))
    if sub_h * 60 + sub_m <= dead_h * 60 + dead_m:
        return "present", f"출석이 확인되었습니다. ({submission_time} 제출)"
    return "late", f"지각 처리되었습니다. ({submission_time} 제출, 마감 {deadline_time})"


@router.post("/posts", response_model=PostResponse)
async def submit_post(data: PostCreate, db: AsyncSession = Depends(get_db)) -> PostResponse:
    today_str = date.today().isoformat()

    # 하루 1회 제출 제한
    existing = await db.scalar(
        select(Post).where(Post.user_email == data.user_email, Post.submitted_date == today_str)
    )
    if existing:
        raise HTTPException(status_code=409, detail="오늘은 이미 묵상을 제출했습니다.")

    status, message = _determine_status(data.submission_time, data.deadline_time)

    post = Post(
        user_email=data.user_email,
        content=data.content,
        submission_time=data.submission_time,
        deadline_time=data.deadline_time,
        status=status,
        submitted_date=today_str,
    )
    db.add(post)
    await db.commit()

    return PostResponse(
        status=status,
        message=message,
        submission_time=data.submission_time,
        deadline_time=data.deadline_time,
    )


@router.get("/posts/today", response_model=TodayStatus)
async def today_status(
    user_email: str = Depends(_require_email),
    db: AsyncSession = Depends(get_db),
) -> TodayStatus:
    today_str = date.today().isoformat()
    post = await db.scalar(
        select(Post).where(Post.user_email == user_email, Post.submitted_date == today_str)
    )
    if not post:
        return TodayStatus(submitted=False)

    _, message = _determine_status(post.submission_time, post.deadline_time)
    return TodayStatus(
        submitted=True,
        status=post.status,
        message=message,
        submission_time=post.submission_time,
    )


@router.get("/posts/summary", response_model=AttendanceSummary)
async def attendance_summary(
    user_email: str = Depends(_require_email),
    db: AsyncSession = Depends(get_db),
) -> AttendanceSummary:
    result = await db.execute(
        select(Post).where(Post.user_email == user_email)
    )
    posts = result.scalars().all()
    present = sum(1 for p in posts if p.status == "present")
    late = sum(1 for p in posts if p.status == "late")
    submitted_dates = {p.submitted_date for p in posts}

    # 자동 결석 계산: 참여 중인 챌린지의 활성 기간 내 미제출일 = 결석
    absent = await _count_absent_days(db, user_email, submitted_dates)

    return AttendanceSummary(
        total_days=len(posts),
        present_count=present,
        late_count=late,
        absent_count=absent,
    )


@router.get("/posts", response_model=List[PostRecord])
async def get_posts(
    user_email: str = Depends(_require_email),
    db: AsyncSession = Depends(get_db),
) -> List[PostRecord]:
    result = await db.execute(
        select(Post).where(Post.user_email == user_email).order_by(Post.submitted_date.desc())
    )
    posts = result.scalars().all()
    return [PostRecord.model_validate(p) for p in posts]
