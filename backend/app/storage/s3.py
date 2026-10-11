import boto3
from botocore.client import BaseClient

from app.core.settings import Settings


class ObjectStorage:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        credentials = {
            "aws_access_key_id": settings.s3_access_key,
            "aws_secret_access_key": settings.s3_secret_key,
            "region_name": settings.s3_region,
        }
        self.client: BaseClient = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            **credentials,
        )
        self.public_client: BaseClient = boto3.client(
            "s3",
            endpoint_url=settings.s3_public_endpoint_url,
            **credentials,
        )

    def create_upload_url(self, object_key: str, content_type: str) -> str:
        return self.public_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.settings.s3_bucket,
                "Key": object_key,
                "ContentType": content_type,
            },
            ExpiresIn=self.settings.upload_url_ttl_seconds,
        )

    def create_download_url(self, object_key: str) -> str:
        return self.public_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.settings.s3_bucket, "Key": object_key},
            ExpiresIn=self.settings.download_url_ttl_seconds,
        )

    def head(self, object_key: str) -> dict:
        return self.client.head_object(Bucket=self.settings.s3_bucket, Key=object_key)

    def delete(self, object_key: str) -> None:
        self.client.delete_object(Bucket=self.settings.s3_bucket, Key=object_key)

    def assert_bucket_available(self) -> None:
        self.client.head_bucket(Bucket=self.settings.s3_bucket)