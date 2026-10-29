import pytest
from httpx import AsyncClient
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_resource_crud_lifecycle(client: AsyncClient, seed_test_data):
    owner = seed_test_data["owner"]
    headers = auth_headers(owner.id, "owner", str(owner.org_id))

    # 1. Create Resource
    payload = {
        "title": "Ultimaker S5 Dual Extrusion 3D Printer",
        "description": "Composite and dual material 3D printing setup",
        "kind": "equipment",
        "category": "3D Printing",
        "location": "Innovation Room 201",
        "status": "live",
        "approval_mode": "auto",
        "max_hours_per_booking": 4,
        "max_hours_per_week_per_user": 12,
        "buffer_minutes": 15,
        "requirements": [],
        "availability_windows": [
            {"weekday": 0, "start_time": "08:00", "end_time": "20:00"}
        ],
        "blackout_dates": [],
        "managers": [],
    }
    resp = await client.post("/api/v1/resources/", json=payload, headers=headers)
    assert resp.status_code == 201
    created = resp.json()
    resource_id = created["id"]
    assert created["title"] == payload["title"]

    # 2. Get Resource details
    get_resp = await client.get(f"/api/v1/resources/{resource_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == resource_id

    # 3. Update Resource
    update_resp = await client.patch(
        f"/api/v1/resources/{resource_id}",
        json={"title": "Ultimaker S5 Pro Bundle"},
        headers=headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Ultimaker S5 Pro Bundle"

    # 4. List Resources
    list_resp = await client.get("/api/v1/resources/?category=3D%20Printing")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1
