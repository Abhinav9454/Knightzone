import re
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile

app = FastAPI(title="Resume Parser Service", version="1.0.0")

ALLOWED_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


def extract_text(raw: bytes) -> str:
    # Fallback parser: keep service robust and non-blocking even without heavy NLP libs.
    return raw.decode("utf-8", errors="ignore")


def parse_resume(text: str) -> dict[str, Any]:
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    phone_match = re.search(r"(?:\+?\d[\d\-\s]{8,}\d)", text)

    skills_catalog = {
        "java",
        "python",
        "spring boot",
        "react",
        "typescript",
        "mysql",
        "redis",
        "docker",
        "kubernetes",
        "javascript",
    }
    lower = text.lower()
    detected_skills = sorted(skill for skill in skills_catalog if skill in lower)

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = lines[0][:100] if lines else "Unknown"

    return {
        "name": name,
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
        "skills": detected_skills,
        "summary": text[:500],
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/parse")
async def parse(file: UploadFile = File(...)) -> dict[str, Any]:
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    text = extract_text(raw)
    parsed = parse_resume(text)
    return {"fileName": file.filename, "contentType": content_type, "parsedData": parsed}
