"""묵상 제출 및 출석 판정 단위 테스트"""
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


@pytest.mark.asyncio
async def test_submit_present():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/posts", json={
            "user_email": "test@test.com",
            "content": "오늘 묵상",
            "submission_time": "05:30",
            "deadline_time": "06:00",
        })
    assert res.status_code == 200
    assert res.json()["status"] == "present"


@pytest.mark.asyncio
async def test_submit_late():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/posts", json={
            "user_email": "test2@test.com",
            "content": "늦은 묵상",
            "submission_time": "07:00",
            "deadline_time": "06:00",
        })
    assert res.status_code == 200
    assert res.json()["status"] == "late"


@pytest.mark.asyncio
async def test_duplicate_submission():
    payload = {
        "user_email": "dup@test.com",
        "content": "첫 번째",
        "submission_time": "05:00",
        "deadline_time": "06:00",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res1 = await client.post("/api/posts", json=payload)
        assert res1.status_code == 200
        payload["content"] = "두 번째 시도"
        res2 = await client.post("/api/posts", json=payload)
        assert res2.status_code == 409


@pytest.mark.asyncio
async def test_today_status_not_submitted():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/posts/today?user_email=nobody@test.com")
    assert res.status_code == 200
    assert res.json()["submitted"] is False


@pytest.mark.asyncio
async def test_today_status_after_submit():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/posts", json={
            "user_email": "today@test.com",
            "content": "묵상 내용",
            "submission_time": "05:00",
            "deadline_time": "06:00",
        })
        res = await client.get("/api/posts/today?user_email=today@test.com")
    assert res.status_code == 200
    data = res.json()
    assert data["submitted"] is True
    assert data["status"] == "present"


@pytest.mark.asyncio
async def test_get_posts_history():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/posts", json={
            "user_email": "hist@test.com",
            "content": "이력 테스트",
            "submission_time": "05:00",
            "deadline_time": "06:00",
        })
        res = await client.get("/api/posts?user_email=hist@test.com")
    assert res.status_code == 200
    posts = res.json()
    assert len(posts) == 1
    assert posts[0]["user_email"] == "hist@test.com"
