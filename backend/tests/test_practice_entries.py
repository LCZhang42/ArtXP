from test_artworks import create_uploaded_artwork


def test_practice_entry_is_durable_and_private(authenticated_client):
    artwork_id = create_uploaded_artwork(authenticated_client)

    created = authenticated_client.post(
        "/api/v1/practice-entries",
        json={
            "artwork_id": artwork_id,
            "note": "The jaw angle improved.",
            "exercise": "Portrait planes",
            "skill": "anatomy",
        },
    )

    assert created.status_code == 201
    assert created.json()["image_url"].startswith("http://downloads.test/")

    entries = authenticated_client.get("/api/v1/practice-entries")
    assert entries.status_code == 200
    assert len(entries.json()) == 1
    assert entries.json()[0]["note"] == "The jaw angle improved."

    authenticated_client.post("/api/v1/auth/logout")
    authenticated_client.post(
        "/api/v1/auth/dev-session", json={"email": "other-user@artxp.local"}
    )
    assert authenticated_client.get("/api/v1/practice-entries").json() == []


def test_note_only_practice_entry(authenticated_client):
    response = authenticated_client.post(
        "/api/v1/practice-entries",
        json={"note": "Warm-up complete.", "exercise": "Lines", "skill": "linework"},
    )

    assert response.status_code == 201
    assert response.json()["artwork_id"] is None
    assert response.json()["image_url"] is None

def test_delete_practice_entries_removes_owned_objects(authenticated_client):
    artwork_id = create_uploaded_artwork(authenticated_client)
    created = authenticated_client.post(
        "/api/v1/practice-entries",
        json={"artwork_id": artwork_id, "skill": "anatomy"},
    )
    assert created.status_code == 201
    object_count = len(authenticated_client.app.state.object_storage.objects)
    assert object_count == 1

    deleted = authenticated_client.delete("/api/v1/practice-entries")

    assert deleted.status_code == 204
    assert authenticated_client.get("/api/v1/practice-entries").json() == []
    assert authenticated_client.app.state.object_storage.objects == {}
    assert authenticated_client.get(f"/api/v1/artworks/{artwork_id}").status_code == 404