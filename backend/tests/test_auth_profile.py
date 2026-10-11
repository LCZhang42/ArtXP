def test_me_requires_session(client):
    response = client.get("/api/v1/me")

    assert response.status_code == 401


def test_development_session_and_profile_update(authenticated_client):
    initial = authenticated_client.get("/api/v1/me")
    assert initial.status_code == 200
    assert initial.json()["email"] == "developer@artxp.local"

    updated = authenticated_client.patch(
        "/api/v1/me/profile",
        json={
            "goal": "Improve portrait anatomy",
            "self_reported_level": "beginner",
            "daily_minutes": 30,
            "medium_preferences": ["digital"],
        },
    )

    assert updated.status_code == 200
    assert updated.json()["profile"]["goal"] == "Improve portrait anatomy"
    assert updated.json()["profile"]["daily_minutes"] == 30