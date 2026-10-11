SHA256 = "a" * 64


def test_artwork_upload_lifecycle(authenticated_client):
    intent = authenticated_client.post(
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
    assert payload["method"] == "PUT"
    assert payload["headers"] == {"Content-Type": "image/png"}
    artwork_id = payload["artwork_id"]

    pending = authenticated_client.get(f"/api/v1/artworks/{artwork_id}")
    assert pending.status_code == 200
    assert pending.json()["status"] == "pending_upload"
    assert pending.json()["download_url"] is None

    object_key = payload["upload_url"].removeprefix("http://objects.test/")
    authenticated_client.app.state.object_storage.objects[object_key]["ContentLength"] = 1024

    completed = authenticated_client.post(f"/api/v1/artworks/{artwork_id}/complete-upload")
    assert completed.status_code == 200
    assert completed.json()["status"] == "uploaded"

    stored = authenticated_client.get(f"/api/v1/artworks/{artwork_id}")
    assert stored.status_code == 200
    assert stored.json()["download_url"].startswith("http://downloads.test/")

    deleted = authenticated_client.delete(f"/api/v1/artworks/{artwork_id}")
    assert deleted.status_code == 204
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