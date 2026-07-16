from __future__ import annotations
import logging
import os
from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.db_models import Challenge, ChallengeMember, Post
from app.models.schemas import (
    ChallengeResponse, ChallengeUpdate, ChallengeAttendance, MemberStats,
)
from app.api.challenges import _challenge_response

router = APIRouter(prefix="/admin")

ADMIN_PIN = os.environ.get("ADMIN_PIN", "1234")

if ADMIN_PIN == "1234":
    logging.warning(
        "[보안 경고] ADMIN_PIN이 기본값(1234)입니다. "
        "프로덕션 환경에서는 환경변수 ADMIN_PIN을 반드시 변경하세요."
    )


class PinRequest(BaseModel):
    pin: str


async def _require_pin(x_admin_pin: str = Header(..., alias="X-Admin-Pin")) -> str:
    """모든 admin 엔드포인트에 적용되는 PIN 인증 의존성."""
    if x_admin_pin != ADMIN_PIN:
        raise HTTPException(status_code=401, detail="잘못된 비밀번호입니다.")
    return x_admin_pin


@router.post("/verify")
async def verify_pin(data: PinRequest):
    if data.pin != ADMIN_PIN:
        raise HTTPException(status_code=401, detail="잘못된 비밀번호입니다.")
    return {"verified": True}


# --- 챌린지 수정/삭제 ---

@router.put("/challenges/{challenge_id}", response_model=ChallengeResponse)
async def update_challenge(
    challenge_id: int,
    data: ChallengeUpdate,
    db: AsyncSession = Depends(get_db),
    _pin: str = Depends(_require_pin),
) -> ChallengeResponse:
    challenge = await db.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")

    if data.name is not None:
        challenge.name = data.name
    if data.start_date is not None:
        challenge.start_date = data.start_date
    if data.end_date is not None:
        challenge.end_date = data.end_date
    if data.deadline_time is not None:
        challenge.deadline_time = data.deadline_time

    await db.commit()
    await db.refresh(challenge)
    return await _challenge_response(db, challenge)


@router.delete("/challenges/{challenge_id}")
async def delete_challenge(
    challenge_id: int,
    db: AsyncSession = Depends(get_db),
    _pin: str = Depends(_require_pin),
):
    challenge = await db.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")

    await db.execute(
        sa_delete(ChallengeMember).where(ChallengeMember.challenge_id == challenge_id)
    )
    await db.delete(challenge)
    await db.commit()
    return {"detail": "챌린지가 삭제되었습니다."}


# --- 멤버 관리 ---

@router.get("/challenges/{challenge_id}/members")
async def list_members(
    challenge_id: int,
    db: AsyncSession = Depends(get_db),
    _pin: str = Depends(_require_pin),
) -> List[str]:
    challenge = await db.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")

    result = await db.execute(
        select(ChallengeMember.user_email).where(
            ChallengeMember.challenge_id == challenge_id
        )
    )
    return [row[0] for row in result.all()]


@router.delete("/challenges/{challenge_id}/members/{user_email}")
async def remove_member(
    challenge_id: int,
    user_email: str,
    db: AsyncSession = Depends(get_db),
    _pin: str = Depends(_require_pin),
):
    member = await db.scalar(
        select(ChallengeMember).where(
            ChallengeMember.challenge_id == challenge_id,
            ChallengeMember.user_email == user_email,
        )
    )
    if not member:
        raise HTTPException(status_code=404, detail="해당 멤버가 없습니다.")
    await db.delete(member)
    await db.commit()
    return {"detail": f"{user_email}을(를) 제거했습니다."}


# --- 출석 대시보드 ---

def _calculate_fine(late: int, absent: int) -> int:
    converted = late * 0.5 + absent
    if converted >= 4:
        return 30000
    return int(converted * 3000)


@router.get("/challenges/{challenge_id}/attendance", response_model=ChallengeAttendance)
async def challenge_attendance(
    challenge_id: int,
    db: AsyncSession = Depends(get_db),
    _pin: str = Depends(_require_pin),
) -> ChallengeAttendance:
    challenge = await db.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")

    # 챌린지 기간 내 날짜 목록 (시작일 ~ min(종료일, 어제))
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    end = min(challenge.end_date, yesterday)
    dates: list[str] = []
    if challenge.start_date <= end:
        d = date.fromisoformat(challenge.start_date)
        end_d = date.fromisoformat(end)
        while d <= end_d:
            dates.append(d.isoformat())
            d += timedelta(days=1)

    # 오늘도 포함 (제출 현황 확인용)
    today_str = date.today().isoformat()
    if challenge.start_date <= today_str <= challenge.end_date:
        dates.append(today_str)

    # 멤버 목록
    result = await db.execute(
        select(ChallengeMember.user_email).where(
            ChallengeMember.challenge_id == challenge_id
        )
    )
    member_emails = [row[0] for row in result.all()]

    # 전체 멤버의 제출 기록을 배치 쿼리로 조회
    all_posts_result = await db.execute(
        select(Post).where(
            Post.user_email.in_(member_emails),
            Post.submitted_date.in_(dates),
        )
    )
    # {email: {date: status}} 맵 구성
    all_posts: dict[str, dict[str, str]] = {}
    for p in all_posts_result.scalars().all():
        all_posts.setdefault(p.user_email, {})[p.submitted_date] = p.status

    grid: dict[str, dict[str, str]] = {}
    members_stats: list[MemberStats] = []

    for email in member_emails:
        posts = all_posts.get(email, {})
        row: dict[str, str] = {}
        present = 0
        late = 0
        absent = 0

        for d_str in dates:
            if d_str in posts:
                row[d_str] = posts[d_str]
                if posts[d_str] == "present":
                    present += 1
                else:
                    late += 1
            elif d_str == today_str:
                row[d_str] = "pending"
            else:
                row[d_str] = "absent"
                absent += 1

        grid[email] = row
        members_stats.append(MemberStats(
            user_email=email,
            present_count=present,
            late_count=late,
            absent_count=absent,
            total_fine=_calculate_fine(late, absent),
        ))

    return ChallengeAttendance(
        challenge=await _challenge_response(db, challenge),
        members=members_stats,
        dates=dates,
        grid=grid,
    )
