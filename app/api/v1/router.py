from fastapi import APIRouter
from app.api.v1.admin import router as admin_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.audit import router as audit_router
from app.api.v1.auth import router as auth_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.checkins import router as checkins_router
from app.api.v1.credentials import router as credentials_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.resources import router as resources_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.storage import router as storage_router
from app.api.v1.teams import router as teams_router
from app.api.v1.users import router as users_router
from app.api.v1.waitlist import router as waitlist_router
from app.api.v1.wallet import router as wallet_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(resources_router)
api_v1_router.include_router(bookings_router)
api_v1_router.include_router(waitlist_router)
api_v1_router.include_router(credentials_router)
api_v1_router.include_router(checkins_router)
api_v1_router.include_router(incidents_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(teams_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(storage_router)
api_v1_router.include_router(wallet_router)
api_v1_router.include_router(reviews_router)
