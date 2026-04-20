from __future__ import annotations
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.db_models import Challenge, ChallengeMember, Post
from app.models.schemas import (
    ChallengeCreate, ChallengeResponse, ChallengeTodayResponse, MemberAttendance,
)

router = APIRouter()


async def _challenge_response(db: AsyncSession, challenge: Challenge) -> ChallengeResponse:
    count = await db.scalar(
        select(sa_func.count()).where(ChallengeMember.challenge_id == challenge.id)
    )
    return ChallengeResponse(
        id=challenge.id,
        name=challenge.name,
        start_date=challenge.start_date,
        end_date=challenge.end_date,
        deadline_time=challenge.deadline_time,
        member_count=count or 0,
    )


@router.post("/challenges", response_model=ChallengeResponse)
async def create_challenge(data: ChallengeCreate, db: AsyncSession = Depends(get_db)) -> ChallengeResponse:
    challenge = Challenge(
        name=data.name,
        start_date=data.start_date,
        end_date=data.end_date,
        deadline_time=data.deadline_time,
    )
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)
    return await _challenge_response(db, challenge)


@router.get("/challenges", response_model=List[ChallengeResponse])
async def list_challenges(db: AsyncSession = Depends(get_db)) -> List[ChallengeResponse]:
    result = await db.execute(select(Challenge).order_by(Challenge.id.desc()))
    challenges = result.scalars().all()
    return [await _challenge_response(db, c) for c in challenges]


@router.get("/challenges/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(challenge_id: int, db: AsyncSession = Depends(get_db)) -> ChallengeResponse:
    challenge = await db.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")
    return await _challenge_response(db, challenge)


@router.post("/challenges/{challenge_id}/join")
async def join_challenge(
    challenge_id: int,
    user_email: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    challenge = await db.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")

    existing = await db.scalar(
        select(ChallengeMember).where(
            ChallengeMember.challenge_id == challenge_id,
            ChallengeMember.user_email == user_email,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="이미 참여 중인 챌린지입니다.")

    db.add(ChallengeMember(challenge_id=challenge_id, user_email=user_email))
    await db.commit()
    return {"detail": "챌린지에 참여했습니다."}


@router.delete("/challenges/{challenge_id}/leave")
async def leave_challenge(
    challenge_id: int,
    user_email: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    member = await db.scalar(
        select(ChallengeMember).where(
            ChallengeMember.challenge_id == challenge_id,
            ChallengeMember.user_email == user_email,
        )
    )
    if not member:
        raise HTTPException(status_code=404, detail="참여 중이 아닙니다.")
    await db.delete(member)
    await db.commit()
    return {"detail": "챌린지에서 나갔습니다."}


@router.get("/challenges/{challenge_id}/today", response_model=ChallengeTodayResponse)
async def challenge_today(
    challenge_id: int,
    db: AsyncSession = Depends(get_db),
) -> ChallengeTodayResponse:
    challenge = await db.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")

    today_str = date.today().isoformat()

    # 멤버 목록
    result = await db.execute(
        select(ChallengeMember).where(ChallengeMember.challenge_id == challenge_id)
    )
    members = result.scalars().all()

    # 오늘 제출된 포스트 (멤버 이메일 기준) - 배치 쿼리
    member_emails = [m.user_email for m in members]
    attendance: list[MemberAttendance] = []

    posts_result = await db.execute(
        select(Post).where(
            Post.user_email.in_(member_emails),
            Post.submitted_date == today_str,
        )
    )
    posts_map = {p.user_email: p for p in posts_result.scalars().all()}

    for email in member_emails:
        post = posts_map.get(email)
        if post:
            attendance.append(MemberAttendance(
                user_email=email,
                submitted=True,
                status=post.status,
                submission_time=post.submission_time,
            ))
        else:
            attendance.append(MemberAttendance(user_email=email, submitted=False))

    return ChallengeTodayResponse(
        challenge=await _challenge_response(db, challenge),
        date=today_str,
        members=attendance,
    )
