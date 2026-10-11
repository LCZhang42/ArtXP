SHA256 = "a" * 64


def create_uploaded_artwork(client):
    intent = client.post(
        "/api/v1/artworks/upload-intents",
        json={
            "filename": "portrait study.png",
            "content_type": "image/png",
            "size_bytes": 1024,
            "sha256": SHA256,
            "context": {"skill": "anatomy"},
        },
    )
    assert intent.status_code == 201
    payload = intent.json()
    object_key = payload["upload_url"].removeprefix("http://objects.test/")
    client.app.state.object_storage.objects[object_key]["ContentLength"] = 1024
    completed = client.post(f"/api/v1/artworks/{payload['artwork_id']}/complete-upload")
    assert completed.status_code == 200
    return payload["artwork_id"]


def test_artwork_upload_lifecycle(authenticated_client):
    artwork_id = create_uploaded_artwork(authenticated_client)

    stored = authenticated_client.get(f"/api/v1/artworks/{artwork_id}")
    assert stored.status_code == 200
    assert stored.json()["status"] == "uploaded"
    assert stored.json()["download_url"].startswith("http://downloads.test/")

    deleted = authenticated_client.delete(f"/api/v1/artworks/{artwork_id}")
    assert deleted.status_code == 204
    assert authenticated_client.get(f"/api/v1/artworks/{artwork_id}").status_code == 404


def test_artwork_is_hidden_from_another_user(authenticated_client):
    artwork_id = create_uploaded_artwork(authenticated_client)

    authenticated_client.post("/api/v1/auth/logout")
    second_session = authenticated_client.post(
        "/api/v1/auth/dev-session", json={"email": "second-user@artxp.local"}
    )
    assert second_session.status_code == 204

    assert authenticated_client.get(f"/api/v1/artworks/{artwork_id}").status_code == 404


def test_rejects_oversized_artwork(authenticated_client):
    response = authenticated_client.post(
        "/api/v1/artworks/upload-intents",
        json={
            "filename": "huge.png",
            "content_type": "image/png",
            "size_bytes": 20 * 1024 * 1024 + 1,
            "sha256": SHA256,
        },
    )

    assert response.status_code == 413