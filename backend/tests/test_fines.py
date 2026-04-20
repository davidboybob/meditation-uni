"""벌금 계산 로직 단위 테스트"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_fine_normal():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/fines/calculate", json={"late_count": 2, "absent_count": 1})
    assert res.status_code == 200
    data = res.json()
    assert data["converted_absences"] == 2.0   # 2*0.5 + 1
    assert data["total_fine"] == 6000


@pytest.mark.asyncio
async def test_fine_cap():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/fines/calculate", json={"late_count": 0, "absent_count": 5})
    assert res.status_code == 200
    assert res.json()["total_fine"] == 30000


@pytest.mark.asyncio
async def test_fine_zero():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/fines/calculate", json={"late_count": 0, "absent_count": 0})
    assert res.status_code == 200
    assert res.json()["total_fine"] == 0


@pytest.mark.asyncio
async def test_fine_boundary():
    # 환산 결석 3.5회 (지각 1 + 결석 3) → 3.5 × 3000 = 10500
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/fines/calculate", json={"late_count": 1, "absent_count": 3})
    assert res.status_code == 200
    data = res.json()
    assert data["converted_absences"] == 3.5
    assert data["total_fine"] == 10500
