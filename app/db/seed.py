import asyncio
from datetime import datetime, timedelta, timezone
import logging
from sqlalchemy import select
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import async_engine, async_session_maker
from app.models.audit import AuditEvent
from app.models.booking import Booking
from app.models.credential import Credential
from app.models.organization import Organization
from app.models.resource import (
    AvailabilityWindow,
    BlackoutDate,
    Resource,
    ResourceManager,
    ResourceRequirement,
)
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_demo_data() -> None:
    """Seed initial sample organization, users for all roles, resources, and credentials."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as session:
        # Check if already seeded
        check_user = await session.execute(select(User).limit(1))
        if check_user.scalar_one_or_none():
            logger.info("Database already seeded. Skipping initial seed.")
            return

        logger.info("Seeding production prototype data...")

        # 1. Organization
        org = Organization(
            name="Apex Institute of Technology",
            type="academic",
            verified=True,
        )
        session.add(org)
        await session.flush()

        # 2. Users for all 4 roles
        hashed_pw = hash_password("password123")

        user_booker = User(
            email="user@example.com",
            password_hash=hashed_pw,
            full_name="Alex Booker (Student)",
            role="user",
            org_id=org.id,
            status="active",
            privacy_settings={"profile_visibility": "members", "show_activity": True},
        )
        user_owner = User(
            email="owner@example.com",
            password_hash=hashed_pw,
            full_name="Dr. Sarah Jenkins (Lab Director)",
            role="owner",
            org_id=org.id,
            status="active",
            privacy_settings={"profile_visibility": "public", "show_activity": True},
        )
        user_manager = User(
            email="manager@example.com",
            password_hash=hashed_pw,
            full_name="Morgan Lee (Lab Safety Manager)",
            role="manager",
            org_id=org.id,
            status="active",
            privacy_settings={"profile_visibility": "members", "show_activity": True},
        )
        user_admin = User(
            email="admin@example.com",
            password_hash=hashed_pw,
            full_name="Elena Vance (Platform Administrator)",
            role="admin",
            org_id=org.id,
            status="active",
            privacy_settings={"profile_visibility": "private", "show_activity": False},
        )
        session.add_all([user_booker, user_owner, user_manager, user_admin])
        await session.flush()

        # 3. Credentials for booker
        now = datetime.now(timezone.utc)
        cred_laser = Credential(
            user_id=user_booker.id,
            type="training",
            name="Laser Safety Tier 2",
            status="verified",
            expiry_date=now + timedelta(days=180),
            reviewed_by=user_owner.id,
            review_reason="Completed practical lab safety checkout with 100% score.",
        )
        cred_member = Credential(
            user_id=user_booker.id,
            type="membership",
            name="Makerspace Basic Membership",
            status="verified",
            expiry_date=now + timedelta(days=365),
            reviewed_by=user_manager.id,
            review_reason="Active registered student membership.",
        )
        session.add_all([cred_laser, cred_member])

        # 4. Resources
        # Resource 1: SLA 3D Printer
        res_printer = Resource(
            owner_id=user_owner.id,
            org_id=org.id,
            kind="equipment",
            title="Formlabs Form 3+ SLA 3D Printer",
            description="High precision stereolithography 3D printer capable of 25 micron layer heights for engineering and dental prototyping.",
            category="3D Printing",
            location="Room 102, Innovation Wing",
            building="Engineering Hall",
            room="102",
            capacity=1,
            asset_tag="EQ-3DP-001",
            condition_notes="Excellent operational condition. Resin tank fresh.",
            images=[
                "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
            ],
            status="live",
            approval_mode="auto",
            supervision_required=False,
            deposit_amount=0.0,
            max_hours_per_booking=4,
            max_hours_per_week_per_user=12,
            cooldown_hours=0,
            max_advance_days=14,
            buffer_minutes=15,
            allowed_audience="anyone_verified",
            waitlist_enabled=True,
            safety_notes="Nitrile gloves required when handling liquid photopolymer resin and IPA wash stations.",
            usage_rules=[
                "Perform pre-use inspection before powering on.",
                "Log resin volume consumed in grams.",
                "Submerge prints in isopropyl wash station for minimum 15 minutes.",
            ],
            condition_checklist=[
                "Build platform free of cured resin",
                "Optical window clear of dust",
                "IPA wash tanks filled to minimum level",
            ],
        )
        res_printer.requirements.append(
            ResourceRequirement(
                type="membership",
                name="Makerspace Basic Membership",
                required_credential_name="Makerspace Basic Membership",
            )
        )
        for wd in range(0, 6):
            res_printer.availability_windows.append(
                AvailabilityWindow(weekday=wd, start_time="08:00", end_time="20:00")
            )
        res_printer.managers.append(
            ResourceManager(
                user_id=user_manager.id,
                can_approve=True,
                can_confirm_returns=True,
                can_handle_incidents=True,
            )
        )

        # Resource 2: Laser Cutter
        res_laser = Resource(
            owner_id=user_owner.id,
            org_id=org.id,
            kind="equipment",
            title="Epilog Fusion Pro 48 Laser Cutter (120W)",
            description="Large-format industrial CO2 laser cutter for acrylic, birch plywood, and Delrin sheet fabrication. 48x36 inch bed.",
            category="Fabrication",
            location="Bay 4, Makerspace",
            building="Innovation Wing",
            room="B4",
            capacity=2,
            asset_tag="EQ-LSR-004",
            condition_notes="Optics calibrated weekly. Air assist active.",
            images=[
                "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80"
            ],
            status="live",
            approval_mode="manual",
            supervision_required=True,
            deposit_amount=50.0,
            max_hours_per_booking=2,
            max_hours_per_week_per_user=6,
            cooldown_hours=2,
            max_advance_days=7,
            buffer_minutes=15,
            allowed_audience="anyone_verified",
            waitlist_enabled=True,
            safety_notes="Strictly prohibited materials: PVC, vinyl, polycarbonate, and carbon fiber (chlorine gas / toxic fumes hazard).",
            usage_rules=[
                "Never leave laser cutter unattended while firing.",
                "Confirm exhaust damper is 100% open.",
                "Inspect honeycomb bed for flammable debris before homing.",
            ],
            condition_checklist=[
                "Exhaust ventilation operational",
                "Focus lens clean and unscratched",
                "Chiller temperature reading between 18-22C",
            ],
        )
        res_laser.requirements.append(
            ResourceRequirement(
                type="training",
                name="Laser Safety Tier 2",
                required_credential_name="Laser Safety Tier 2",
            )
        )
        for wd in range(0, 5):
            res_laser.availability_windows.append(
                AvailabilityWindow(weekday=wd, start_time="09:00", end_time="19:00")
            )
        res_laser.managers.append(
            ResourceManager(
                user_id=user_manager.id,
                can_approve=True,
                can_confirm_returns=True,
                can_handle_incidents=True,
            )
        )

        # Resource 3: Wet Lab Station
        res_lab = Resource(
            owner_id=user_owner.id,
            org_id=org.id,
            kind="lab",
            title="BSL-1 Cell Culture Station #3",
            description="Biosafety cabinet, inverted phase-contrast microscope, and CO2 incubator bench for mammalian cell culture.",
            category="Wet Lab",
            location="Lab 305, Research Block",
            building="Life Sciences",
            room="305",
            capacity=2,
            asset_tag="LB-BSL1-003",
            condition_notes="HEPA certification verified this quarter.",
            images=[
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
            ],
            status="live",
            approval_mode="manual",
            supervision_required=False,
            deposit_amount=100.0,
            max_hours_per_booking=6,
            max_hours_per_week_per_user=18,
            cooldown_hours=0,
            max_advance_days=14,
            buffer_minutes=30,
            allowed_audience="anyone_verified",
            waitlist_enabled=True,
            safety_notes="Standard laboratory safety protocols apply.",
            usage_rules=[
                "UV sterilization cycle must run for 20 minutes post-session.",
                "Dispose of biohazard waste in marked red receptacles.",
            ],
            condition_checklist=[
                "Laminar flow airflow sash alarm normal",
                "Surface wiped with 70% ethanol",
                "Incubator CO2 level at 5.0%",
            ],
        )
        for wd in range(0, 7):
            res_lab.availability_windows.append(
                AvailabilityWindow(weekday=wd, start_time="08:00", end_time="22:00")
            )

        session.add_all([res_printer, res_laser, res_lab])
        await session.flush()

        # Seed initial audit event
        audit = AuditEvent(
            actor_id=user_admin.id,
            actor_role="admin",
            action="SYSTEM_INITIALIZED",
            entity_type="system",
            entity_id="init",
            reason="Platform seed data populated with demo users, organizations, and equipment listings",
        )
        session.add(audit)

        await session.commit()
        logger.info("Successfully seeded LendSpace prototype database.")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
