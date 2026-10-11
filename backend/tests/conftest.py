import pytest
from fastapi.testclient import TestClient

from app.core.settings import Settings
from app.main import create_app


class FakeObjectStorage:
    def __init__(self) -> None:
        self.objects: dict[str, dict] = {}

    def create_upload_url(self, object_key: str, content_type: str) -> str:
        self.objects[object_key] = {"ContentType": content_type}
        return f"http://objects.test/{object_key}"

    def create_download_url(self, object_key: str) -> str:
        return f"http://downloads.test/{object_key}"

    def head(self, object_key: str) -> dict:
        return self.objects[object_key]

    def delete(self, object_key: str) -> None:
        self.objects.pop(object_key, None)

    def assert_bucket_available(self) -> None:
        return None


@pytest.fixture
def client(tmp_path):
    database_path = (tmp_path / "test.db").as_posix()
    settings = Settings(
        database_url=f"sqlite+aiosqlite:///{database_path}",
        session_secret="test-secret",
        auto_create_schema=True,
        infrastructure_required=False,
    )
    with TestClient(create_app(settings)) as test_client:
        test_client.app.state.object_storage = FakeObjectStorage()
        yield test_client


@pytest.fixture
def authenticated_client(client):
    response = client.post("/api/v1/auth/dev-session")
    assert response.status_code == 204
    return client