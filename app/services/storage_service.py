from abc import ABC, abstractmethod
import os
from pathlib import Path
from typing import Optional
import uuid
from app.core.config import settings
from app.core.errors import LendSpaceException

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


class StorageService(ABC):
    """Abstract interface for file storage implementations (local, S3, etc.)."""

    @abstractmethod
    async def save_file(
        self,
        content: bytes,
        filename: str,
        content_type: str,
        folder: str = "uploads",
    ) -> str:
        """Save a file and return its accessible storage path/URL."""
        pass

    @abstractmethod
    async def get_file(self, path: str) -> Optional[bytes]:
        """Retrieve file bytes by path."""
        pass

    @abstractmethod
    async def delete_file(self, path: str) -> bool:
        """Delete file from storage."""
        pass


class LocalDiskStorageService(StorageService):
    """Local filesystem storage with content validation and size constraints."""

    def __init__(self, base_dir: Optional[str] = None) -> None:
        self.base_dir = Path(base_dir or settings.UPLOAD_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def validate_file(self, content: bytes, content_type: str) -> None:
        """Enforce file size and MIME constraints."""
        if len(content) > MAX_FILE_SIZE:
            raise LendSpaceException(
                f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE // (1024 * 1024)}MB.",
                code="FILE_TOO_LARGE",
                status_code=400,
            )

        if content_type.lower() not in ALLOWED_MIME_TYPES:
            raise LendSpaceException(
                f"Unsupported file type '{content_type}'. Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
                code="INVALID_FILE_TYPE",
                status_code=400,
            )

    async def save_file(
        self,
        content: bytes,
        filename: str,
        content_type: str,
        folder: str = "uploads",
    ) -> str:
        self.validate_file(content, content_type)

        ext = Path(filename).suffix.lower()
        if not ext:
            ext = ".pdf" if content_type == "application/pdf" else ".jpg"

        safe_name = f"{uuid.uuid4().hex}{ext}"
        target_dir = self.base_dir / folder
        target_dir.mkdir(parents=True, exist_ok=True)

        target_path = target_dir / safe_name
        target_path.write_bytes(content)

        # Return standardized relative path for API usage
        return f"/uploads/{folder}/{safe_name}"

    async def get_file(self, path: str) -> Optional[bytes]:
        clean_path = path.lstrip("/")
        if clean_path.startswith("uploads/"):
            clean_path = clean_path[len("uploads/") :]
        full_path = self.base_dir / clean_path
        if full_path.exists() and full_path.is_file():
            return full_path.read_bytes()
        return None

    async def delete_file(self, path: str) -> bool:
        clean_path = path.lstrip("/")
        if clean_path.startswith("uploads/"):
            clean_path = clean_path[len("uploads/") :]
        full_path = self.base_dir / clean_path
        if full_path.exists() and full_path.is_file():
            try:
                full_path.unlink()
                return True
            except OSError:
                return False
        return False


# Singleton storage instance
storage_service: StorageService = LocalDiskStorageService()
