from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi.responses import Response
from app.core.deps import get_current_user
from app.models.user import User
from app.services.storage_service import storage_service

router = APIRouter(prefix="/storage", tags=["File Storage"])


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
    summary="Upload image or PDF document (max 5 MB)",
)
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("uploads"),
    current_user: User = Depends(get_current_user),
) -> dict:
    content = await file.read()
    content_type = file.content_type or "application/octet-stream"
    file_path = await storage_service.save_file(
        content=content,
        filename=file.filename or "file",
        content_type=content_type,
        folder=folder,
    )
    return {
        "url": file_path,
        "filename": file.filename,
        "content_type": content_type,
        "size_bytes": len(content),
    }


@router.get(
    "/files/{folder}/{filename}",
    summary="Retrieve an uploaded file",
)
async def get_file(folder: str, filename: str) -> Response:
    path = f"/uploads/{folder}/{filename}"
    content = await storage_service.get_file(path)
    if not content:
        return Response(status_code=404, content="File not found")

    content_type = "application/pdf" if filename.endswith(".pdf") else "image/jpeg"
    return Response(content=content, media_type=content_type)
