# app/routes/upload_demand_docs.py

import os
import io
import zipfile
from typing import List, Optional

from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import StreamingResponse
import aiofiles

from app.utils.global_vars import global_state

router = APIRouter()

# Directory under your main upload folder
os.makedirs(global_state.DEMAND_DIR, exist_ok=True)

# Adjust as needed
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"}

@router.post("/upload-demand-docs/")
async def upload_demand_docs(files: List[UploadFile] = File(...)):
    """
    Upload multiple documents (PDF, Word, text, scanned images, etc.)
    """
    saved = []
    for upload in files:
        ext = os.path.splitext(upload.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"{upload.filename} has unsupported extension"
            )

        dest_path = os.path.join(global_state.DEMAND_DIR, upload.filename)
        async with aiofiles.open(dest_path, "wb") as out:
            while chunk := await upload.read(1024 * 1024):
                await out.write(chunk)

        saved.append(upload.filename)

    return {"uploaded": saved}


@router.get("/download-demand-docs/")
def download_demand_docs(
    filenames: Optional[List[str]] = Query(
        None,
        description="List of filenames to include; omit to download all"
    )
):
    """
    Download selected (or all) demand-docs as a ZIP archive.
    """
    # determine which files to zip
    if filenames:
        paths = []
        for fn in filenames:
            p = os.path.join(global_state.DEMAND_DIR, fn)
            if not os.path.isfile(p):
                raise HTTPException(status_code=404, detail=f"{fn} not found")
            paths.append(p)
    else:
        # all files
        paths = [
            os.path.join(global_state.DEMAND_DIR, f)
            for f in os.listdir(global_state.DEMAND_DIR)
            if os.path.isfile(os.path.join(global_state.DEMAND_DIR, f))
        ]
        if not paths:
            raise HTTPException(status_code=404, detail="No documents available")

    # build ZIP in-memory
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in paths:
            zf.write(file_path, arcname=os.path.basename(file_path))
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": "attachment; filename=demand_docs.zip"}
    )


@router.delete("/clear-demand-docs/")
async def clear_demand_docs():
    """
    Delete *all* demand-docs currently stored.
    """
    # list all files in the directory
    files = [
        f for f in os.listdir(global_state.DEMAND_DIR)
        if os.path.isfile(os.path.join(global_state.DEMAND_DIR, f))
    ]
    if not files:
        raise HTTPException(status_code=404, detail="No documents to delete")

    deleted = []
    errors = []
    for fn in files:
        path = os.path.join(global_state.DEMAND_DIR, fn)
        try:
            os.remove(path)
            deleted.append(fn)
        except Exception as e:
            errors.append({"file": fn, "error": str(e)})

    resp = {"deleted": deleted}
    if errors:
        resp["errors"] = errors
    return resp



@router.get("/list-demand-docs/")
async def list_demand_docs():
    """
    List all uploaded demand-docs (filenames only).
    """
    files = [
        f for f in os.listdir(global_state.DEMAND_DIR)
        if os.path.isfile(os.path.join(global_state.DEMAND_DIR, f))
    ]
    return {"files": files}



@router.delete("/delete-demand-doc/")
async def delete_demand_doc(filename: str):
    """
    Delete a specific file by filename.
    """
    path = os.path.join(global_state.DEMAND_DIR, filename)

    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found")

    try:
        os.remove(path)
        return {"deleted": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
