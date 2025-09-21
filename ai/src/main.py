from fastapi import FastAPI

app = FastAPI(title="UAE Work Hub AI", version="0.1.0")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/transcribe")
async def transcribe() -> dict[str, str]:
    # Placeholder endpoint until transcription pipeline is implemented.
    return {"message": "Transcription service pending implementation."}
