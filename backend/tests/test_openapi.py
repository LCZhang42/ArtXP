def test_openapi_contains_phase_one_routes(client):
    schema = client.get("/openapi.json").json()
    paths = schema["paths"]

    assert "/api/v1/health" in paths
    assert "/api/v1/ready" in paths
    assert "/api/v1/me" in paths
    assert "/api/v1/me/profile" in paths
    assert "/api/v1/artworks/upload-intents" in paths
    assert "/api/v1/artworks/{artwork_id}/complete-upload" in paths
    assert "/api/v1/practice-entries" in paths