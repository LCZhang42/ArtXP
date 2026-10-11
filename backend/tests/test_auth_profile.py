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
            "goal_id": "portraits",
            "goal_emoji": "person",
            "self_reported_level": "beginner",
            "daily_minutes": 30,
            "medium_preferences": ["digital"],
        },
    )

    assert updated.status_code == 200
    profile = updated.json()["profile"]
    assert profile["goal"] == "Improve portrait anatomy"
    assert profile["goal_id"] == "portraits"
    assert profile["daily_minutes"] == 30

def test_oidc_login_requires_configuration(client):
    response = client.get('/api/v1/auth/login')

    assert response.status_code == 503
