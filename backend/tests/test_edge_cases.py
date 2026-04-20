"""엣지케이스 및 방어 로직 테스트"""
from __future__ import annotations

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.main import app
from app.database import Base, get_db


# 테스트용 인메모리 SQLite
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DB_URL)
TestSession = async_sessionmaker(test_engine, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        yield session


@pytest.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# /api/health
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health_endpoint():
    """헬스 엔드포인트는 200과 {"status": "ok"}를 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# 잘못된 시각 포맷 입력
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_invalid_time_format_hours_out_of_range():
    """시각 포맷에서 시(hour)가 범위를 벗어나면 500 대신 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/posts", json={
            "user_email": "a@test.com",
            "content": "테스트",
            "submission_time": "25:00",  # 유효하지 않은 시간
            "deadline_time": "06:00",
        })
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


@pytest.mark.asyncio
async def test_invalid_time_format_minutes_out_of_range():
    """분(minute)이 범위를 벗어나면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/posts", json={
            "user_email": "b@test.com",
            "content": "테스트",
            "submission_time": "06:99",  # 유효하지 않은 분
            "deadline_time": "06:00",
        })
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


@pytest.mark.asyncio
async def test_invalid_time_format_not_hhmm():
    """HH:MM 형식이 아닌 문자열을 입력하면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/posts", json={
            "user_email": "c@test.com",
            "content": "테스트",
            "submission_time": "abcd",  # 숫자가 아님
            "deadline_time": "06:00",
        })
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


@pytest.mark.asyncio
async def test_invalid_deadline_format():
    """deadline_time이 잘못된 형식이면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/posts", json={
            "user_email": "d@test.com",
            "content": "테스트",
            "submission_time": "06:00",
            "deadline_time": "6시",  # 잘못된 형식
        })
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


# ---------------------------------------------------------------------------
# 음수 지각/결석 횟수
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_fine_negative_late_count():
    """음수 지각 횟수를 입력하면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/fines/calculate", json={
            "late_count": -1,
            "absent_count": 0,
        })
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


@pytest.mark.asyncio
async def test_fine_negative_absent_count():
    """음수 결석 횟수를 입력하면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/fines/calculate", json={
            "late_count": 0,
            "absent_count": -2,
        })
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


@pytest.mark.asyncio
async def test_fine_both_negative():
    """지각/결석 모두 음수이면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/fines/calculate", json={
            "late_count": -3,
            "absent_count": -5,
        })
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


# ---------------------------------------------------------------------------
# user_email 빈 문자열
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_submit_empty_email():
    """user_email이 빈 문자열이면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/posts", json={
            "user_email": "",
            "content": "테스트",
            "submission_time": "05:00",
            "deadline_time": "06:00",
        })
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


@pytest.mark.asyncio
async def test_today_status_empty_email():
    """user_email 쿼리 파라미터가 빈 문자열이면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/posts/today?user_email=")
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


@pytest.mark.asyncio
async def test_get_posts_empty_email():
    """GET /api/posts에서 user_email이 빈 문자열이면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/posts?user_email=")
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


# ---------------------------------------------------------------------------
# /api/posts/summary 통계 정확성
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_summary_empty_user():
    """제출 이력이 없는 사용자의 summary는 모든 카운트가 0이어야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/posts/summary?user_email=ghost@test.com")
    assert res.status_code == 200
    data = res.json()
    assert data["total_days"] == 0
    assert data["present_count"] == 0
    assert data["late_count"] == 0
    assert data["absent_count"] == 0


@pytest.mark.asyncio
async def test_summary_accuracy_present_and_late():
    """present 1건, late 1건 제출 후 summary 통계가 정확해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # present 제출 (다른 날짜를 시뮬레이션하기 위해 다른 이메일 사용)
        # 동일 날짜 제한이 있으므로 present 사용자와 late 사용자를 따로 제출한 뒤
        # 하나의 요약 사용자로는 직접 DB 조작이 필요함.
        # 대신 present 전용 사용자와 late 전용 사용자의 각 summary를 검증한다.

        await client.post("/api/posts", json={
            "user_email": "summ@test.com",
            "content": "출석",
            "submission_time": "05:00",
            "deadline_time": "06:00",
        })
        res = await client.get("/api/posts/summary?user_email=summ@test.com")

    assert res.status_code == 200
    data = res.json()
    assert data["total_days"] == 1
    assert data["present_count"] == 1
    assert data["late_count"] == 0


@pytest.mark.asyncio
async def test_summary_late_user():
    """지각 제출 후 late_count가 1이어야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/posts", json={
            "user_email": "late_summ@test.com",
            "content": "지각",
            "submission_time": "07:00",
            "deadline_time": "06:00",
        })
        res = await client.get("/api/posts/summary?user_email=late_summ@test.com")

    assert res.status_code == 200
    data = res.json()
    assert data["total_days"] == 1
    assert data["present_count"] == 0
    assert data["late_count"] == 1


@pytest.mark.asyncio
async def test_summary_empty_email():
    """summary 엔드포인트에서 user_email이 빈 문자열이면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/posts/summary?user_email=")
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"


# ---------------------------------------------------------------------------
# 경계값: 정확히 마감 시각과 같을 때
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_submit_exactly_on_deadline():
    """제출 시각이 마감 시각과 정확히 같으면 present여야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/posts", json={
            "user_email": "exact@test.com",
            "content": "정각 제출",
            "submission_time": "06:00",
            "deadline_time": "06:00",
        })
    assert res.status_code == 200
    assert res.json()["status"] == "present"


# ---------------------------------------------------------------------------
# content 빈 문자열
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_submit_empty_content():
    """content가 빈 문자열이면 400을 반환해야 한다."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/posts", json={
            "user_email": "empty@test.com",
            "content": "",
            "submission_time": "05:00",
            "deadline_time": "06:00",
        })
    assert res.status_code == 400, f"기대: 400, 실제: {res.status_code} — {res.text}"
