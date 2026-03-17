from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import sync, auth, reports, export, users, companies, categories, products

app = FastAPI(title="展覽 POS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sync.router)
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(export.router)
app.include_router(users.router)
app.include_router(companies.router)
app.include_router(categories.router)
app.include_router(products.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
