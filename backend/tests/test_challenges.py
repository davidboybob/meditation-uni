"""챌린지 CRUD 및 참여/탈퇴 테스트"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.main import app
from app.database import Base, get_db

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


CHALLENGE_DATA = {
    "name": "4월 챌린지",
    "start_date": "2026-04-01",
    "end_date": "2026-04-30",
    "deadline_time": "06:00",
}


@pytest.mark.asyncio
async def test_create_challenge():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        res = await c.post("/api/challenges", json=CHALLENGE_DATA)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "4월 챌린지"
    assert data["member_count"] == 0


@pytest.mark.asyncio
async def test_list_challenges():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        await c.post("/api/challenges", json=CHALLENGE_DATA)
        res = await c.get("/api/challenges")
    assert res.status_code == 200
    assert len(res.json()) == 1


@pytest.mark.asyncio
async def test_get_challenge():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        create = await c.post("/api/challenges", json=CHALLENGE_DATA)
        cid = create.json()["id"]
        res = await c.get(f"/api/challenges/{cid}")
    assert res.status_code == 200
    assert res.json()["id"] == cid


@pytest.mark.asyncio
async def test_get_challenge_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        res = await c.get("/api/challenges/9999")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_join_and_leave():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        create = await c.post("/api/challenges", json=CHALLENGE_DATA)
        cid = create.json()["id"]

        # 참여
        res = await c.post(f"/api/challenges/{cid}/join?user_email=a@test.com")
        assert res.status_code == 200

        # 멤버 수 확인
        info = await c.get(f"/api/challenges/{cid}")
        assert info.json()["member_count"] == 1

        # 중복 참여
        res = await c.post(f"/api/challenges/{cid}/join?user_email=a@test.com")
        assert res.status_code == 409

        # 탈퇴
        res = await c.request("DELETE", f"/api/challenges/{cid}/leave?user_email=a@test.com")
        assert res.status_code == 200

        info = await c.get(f"/api/challenges/{cid}")
        assert info.json()["member_count"] == 0


@pytest.mark.asyncio
async def test_leave_not_joined():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        create = await c.post("/api/challenges", json=CHALLENGE_DATA)
        cid = create.json()["id"]
        res = await c.request("DELETE", f"/api/challenges/{cid}/leave?user_email=nobody@test.com")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_challenge_today():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        create = await c.post("/api/challenges", json=CHALLENGE_DATA)
        cid = create.json()["id"]
        await c.post(f"/api/challenges/{cid}/join?user_email=a@test.com")

        res = await c.get(f"/api/challenges/{cid}/today")
    assert res.status_code == 200
    data = res.json()
    assert len(data["members"]) == 1
    assert data["members"][0]["submitted"] is False


@pytest.mark.asyncio
async def test_create_challenge_invalid_dates():
    """시작일 > 종료일이면 400"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        res = await c.post("/api/challenges", json={
            "name": "잘못된 챌린지",
            "start_date": "2026-05-01",
            "end_date": "2026-04-01",
            "deadline_time": "06:00",
        })
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_create_challenge_bad_date_format():
    """날짜 형식이 잘못되면 400"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        res = await c.post("/api/challenges", json={
            "name": "형식 오류",
            "start_date": "04/01/2026",
            "end_date": "2026-04-30",
            "deadline_time": "06:00",
        })
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_create_challenge_empty_name():
    """빈 이름이면 400"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        res = await c.post("/api/challenges", json={
            "name": "  ",
            "start_date": "2026-04-01",
            "end_date": "2026-04-30",
            "deadline_time": "06:00",
        })
    assert res.status_code == 400
