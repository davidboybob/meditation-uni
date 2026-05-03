"""관리자 API 테스트 (PIN 인증, 챌린지 수정/삭제, 멤버 관리, 출석 대시보드)"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.main import app
from app.database import Base, get_db

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DB_URL)
TestSession = async_sessionmaker(test_engine, expire_on_commit=False)

PIN = "1234"  # default ADMIN_PIN
HEADERS = {"X-Admin-Pin": PIN}


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
    "name": "테스트 챌린지",
    "start_date": "2026-04-01",
    "end_date": "2026-04-30",
    "deadline_time": "06:00",
}


async def _create_challenge(c: AsyncClient) -> int:
    res = await c.post("/api/challenges", json=CHALLENGE_DATA)
    return res.json()["id"]


# --- PIN 인증 ---

@pytest.mark.asyncio
async def test_verify_pin_correct():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        res = await c.post("/api/admin/verify", json={"pin": PIN})
    assert res.status_code == 200
    assert res.json()["verified"] is True


@pytest.mark.asyncio
async def test_verify_pin_wrong():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        res = await c.post("/api/admin/verify", json={"pin": "wrong"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_admin_endpoints_require_pin():
    """PIN 헤더 없으면 400 (RequestValidationError → 400 변환 핸들러)"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        cid = await _create_challenge(c)
        # PUT without PIN
        res = await c.put(f"/api/admin/challenges/{cid}", json={"name": "변경"})
        assert res.status_code == 400

        # DELETE without PIN
        res = await c.delete(f"/api/admin/challenges/{cid}")
        assert res.status_code == 400

        # GET members without PIN
        res = await c.get(f"/api/admin/challenges/{cid}/members")
        assert res.status_code == 400

        # GET attendance without PIN
        res = await c.get(f"/api/admin/challenges/{cid}/attendance")
        assert res.status_code == 400


@pytest.mark.asyncio
async def test_admin_wrong_pin():
    """잘못된 PIN이면 401"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        cid = await _create_challenge(c)
        res = await c.put(
            f"/api/admin/challenges/{cid}",
            json={"name": "변경"},
            headers={"X-Admin-Pin": "wrong"},
        )
    assert res.status_code == 401


# --- 챌린지 수정/삭제 ---

@pytest.mark.asyncio
async def test_update_challenge():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        cid = await _create_challenge(c)
        res = await c.put(
            f"/api/admin/challenges/{cid}",
            json={"name": "수정된 챌린지", "deadline_time": "07:00"},
            headers=HEADERS,
        )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "수정된 챌린지"
    assert data["deadline_time"] == "07:00"


@pytest.mark.asyncio
async def test_update_challenge_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        res = await c.put(
            "/api/admin/challenges/9999",
            json={"name": "없는 챌린지"},
            headers=HEADERS,
        )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_update_challenge_invalid_dates():
    """수정 시 시작일 > 종료일이면 400"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        cid = await _create_challenge(c)
        res = await c.put(
            f"/api/admin/challenges/{cid}",
            json={"start_date": "2026-05-01", "end_date": "2026-04-01"},
            headers=HEADERS,
        )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_delete_challenge():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        cid = await _create_challenge(c)
        # 멤버 추가 후 삭제 — 연관 멤버도 함께 삭제되는지 확인
        await c.post(f"/api/challenges/{cid}/join?user_email=a@test.com")

        res = await c.delete(f"/api/admin/challenges/{cid}", headers=HEADERS)
        assert res.status_code == 200

        # 삭제 확인
        res = await c.get(f"/api/challenges/{cid}")
        assert res.status_code == 404


@pytest.mark.asyncio
async def test_delete_challenge_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        res = await c.delete("/api/admin/challenges/9999", headers=HEADERS)
    assert res.status_code == 404


# --- 멤버 관리 ---

@pytest.mark.asyncio
async def test_list_members():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        cid = await _create_challenge(c)
        await c.post(f"/api/challenges/{cid}/join?user_email=a@test.com")
        await c.post(f"/api/challenges/{cid}/join?user_email=b@test.com")

        res = await c.get(f"/api/admin/challenges/{cid}/members", headers=HEADERS)
    assert res.status_code == 200
    assert sorted(res.json()) == ["a@test.com", "b@test.com"]


@pytest.mark.asyncio
async def test_remove_member():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        cid = await _create_challenge(c)
        await c.post(f"/api/challenges/{cid}/join?user_email=a@test.com")

        res = await c.delete(f"/api/admin/challenges/{cid}/members/a@test.com", headers=HEADERS)
        assert res.status_code == 200

        members = await c.get(f"/api/admin/challenges/{cid}/members", headers=HEADERS)
        assert members.json() == []


@pytest.mark.asyncio
async def test_remove_member_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        cid = await _create_challenge(c)
        res = await c.delete(f"/api/admin/challenges/{cid}/members/nobody@test.com", headers=HEADERS)
    assert res.status_code == 404


# --- 출석 대시보드 ---

@pytest.mark.asyncio
async def test_attendance_dashboard():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        cid = await _create_challenge(c)
        await c.post(f"/api/challenges/{cid}/join?user_email=a@test.com")

        res = await c.get(f"/api/admin/challenges/{cid}/attendance", headers=HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["challenge"]["id"] == cid
    assert len(data["members"]) == 1
    assert "dates" in data
    assert "grid" in data


@pytest.mark.asyncio
async def test_attendance_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        res = await c.get("/api/admin/challenges/9999/attendance", headers=HEADERS)
    assert res.status_code == 404
