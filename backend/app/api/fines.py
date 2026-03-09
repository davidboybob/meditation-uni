from __future__ import annotations
from fastapi import APIRouter
from app.models.schemas import FineRequest, FineResponse

router = APIRouter()

@router.post("/fines/calculate", response_model=FineResponse)
async def calculate_fine(data: FineRequest) -> FineResponse:
    converted = data.late_count * 0.5 + data.absent_count
    if converted < 4:
        total_fine = int(converted * 3000)
        detail = f"환산 결석 {converted}회 × 3,000원 = {total_fine:,}원"
    else:
        total_fine = 30000
        detail = f"환산 결석 {converted}회 → 상한 벌금 30,000원 적용"
    return FineResponse(
        total_fine=total_fine,
        converted_absences=converted,
        detail=detail,
    )
