"""
Cultural Intelligence Router for UAE Work Hub
Handles prayer times, Ramadan schedules, UAE holidays, and multicultural workforce management
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time, timedelta
import structlog
from hijri_converter import Hijri, Gregorian

logger = structlog.get_logger()

router = APIRouter()

class PrayerTimesRequest(BaseModel):
    """Request model for prayer times"""
    city: str = Field(default="Dubai", description="UAE city: Dubai, Abu Dhabi, Sharjah, etc.")
    date: Optional[str] = Field(default=None, description="Date in YYYY-MM-DD format")
    method: str = Field(default="uae", description="Calculation method: uae, makkah, isna")

class CulturalEventRequest(BaseModel):
    """Request for cultural calendar events"""
    start_date: str = Field(description="Start date in YYYY-MM-DD format")
    end_date: str = Field(description="End date in YYYY-MM-DD format")
    nationalities: Optional[List[str]] = Field(default=None, description="Filter by nationalities")
    event_types: Optional[List[str]] = Field(default=None, description="Filter by event types")

class MeetingSchedulingRequest(BaseModel):
    """Request for culturally-aware meeting scheduling"""
    proposed_datetime: str = Field(description="Proposed meeting time in ISO format")
    duration_minutes: int = Field(description="Meeting duration in minutes")
    attendee_nationalities: List[str] = Field(description="List of attendee nationalities")
    priority: str = Field(default="normal", description="Priority: low, normal, high, urgent")
    respect_prayer_times: bool = Field(default=True, description="Avoid prayer time conflicts")
    respect_cultural_events: bool = Field(default=True, description="Consider cultural holidays")

@router.get("/prayer-times")
async def get_prayer_times(
    city: str = Query(default="Dubai", description="UAE city"),
    date: Optional[str] = Query(default=None, description="Date in YYYY-MM-DD format")
):
    """
    Get prayer times for UAE cities with cultural sensitivity alerts
    Supports Dubai, Abu Dhabi, Sharjah, Ajman, Fujairah, Ras Al Khaimah, Umm Al Quwain
    """
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date() if date else date.today()
        
        # Mock prayer times - in production, integrate with UAE Islamic Affairs API
        prayer_times = {
            "city": city,
            "date": target_date.isoformat(),
            "hijri_date": get_hijri_date(target_date),
            "times": {
                "fajr": "05:15",
                "sunrise": "06:35",
                "dhuhr": "12:15",
                "asr": "15:30",
                "maghrib": "18:45",
                "isha": "20:00"
            },
            "qibla_direction": get_qibla_direction(city),
            "alerts": generate_prayer_alerts(target_date)
        }
        
        logger.info("Prayer times requested", city=city, date=target_date.isoformat())
        return prayer_times
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        logger.error("Prayer times request failed", error=str(e), city=city)
        raise HTTPException(status_code=500, detail=f"Failed to get prayer times: {str(e)}")

@router.get("/ramadan-schedule")
async def get_ramadan_schedule(year: int = Query(default=None, description="Hijri year")):
    """
    Get Ramadan schedule with work hour adjustments for UAE
    Includes Suhoor/Iftar times and recommended meeting schedules
    """
    try:
        current_year = year or datetime.now().year
        
        # Mock Ramadan schedule
        ramadan_data = {
            "year": current_year,
            "ramadan_start": "2024-03-11",  # Approximate - should calculate dynamically
            "ramadan_end": "2024-04-09",
            "work_schedule_adjustments": {
                "government_hours": "09:00-15:00",
                "private_sector_hours": "09:00-16:00",
                "friday_hours": "09:00-12:00"
            },
            "recommended_meeting_times": [
                {"period": "morning", "time": "09:00-11:00", "suitability": "excellent"},
                {"period": "mid_morning", "time": "11:00-13:00", "suitability": "good"},
                {"period": "afternoon", "time": "14:00-15:30", "suitability": "fair"},
                {"period": "evening", "time": "20:30-22:00", "suitability": "good"}
            ],
            "avoid_periods": [
                {"period": "pre_iftar", "time": "17:00-19:00", "reason": "Iftar preparation"},
                {"period": "iftar", "time": "19:00-20:30", "reason": "Iftar time"},
                {"period": "late_suhoor", "time": "03:30-05:30", "reason": "Suhoor and rest"}
            ],
            "cultural_tips": [
                "Schedule shorter meetings (max 45 minutes)",
                "Provide water and dates for non-fasting attendees",
                "Consider virtual meetings during peak fasting hours",
                "Respect energy levels - avoid complex decisions before Iftar"
            ]
        }
        
        return ramadan_data
        
    except Exception as e:
        logger.error("Ramadan schedule request failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get Ramadan schedule: {str(e)}")

@router.post("/cultural-events")
async def get_cultural_events(request: CulturalEventRequest):
    """
    Get multicultural calendar events for UAE workforce
    Supports 10+ nationalities common in UAE workplaces
    """
    try:
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d").date()
        
        # Mock cultural events data
        events = [
            {
                "event_id": "uae_national_day_2024",
                "name": "UAE National Day",
                "name_arabic": "اليوم الوطني لدولة الإمارات",
                "date": "2024-12-02",
                "type": "national_holiday",
                "nationality": "uae",
                "is_public_holiday": True,
                "cultural_significance": "Celebrates UAE formation and unity",
                "business_impact": "All government and most private offices closed",
                "recommended_actions": ["Avoid scheduling meetings", "Send congratulations to UAE colleagues"]
            },
            {
                "event_id": "diwali_2024",
                "name": "Diwali",
                "name_hindi": "दिवाली",
                "date": "2024-11-01",
                "type": "religious_festival",
                "nationality": "indian",
                "is_public_holiday": False,
                "cultural_significance": "Festival of Lights - major Hindu celebration",
                "business_impact": "Indian employees may request early leave",
                "recommended_actions": ["Send Diwali greetings", "Consider flexible hours"]
            },
            {
                "event_id": "christmas_2024",
                "name": "Christmas Day",
                "date": "2024-12-25",
                "type": "religious_holiday",
                "nationality": "western",
                "is_public_holiday": True,
                "cultural_significance": "Christian celebration of Jesus Christ's birth",
                "business_impact": "Most Western expats take leave",
                "recommended_actions": ["Plan holiday coverage", "Send Christmas greetings"]
            }
        ]
        
        # Filter by nationality if requested
        if request.nationalities:
            events = [e for e in events if e["nationality"] in request.nationalities]
        
        # Filter by event type if requested
        if request.event_types:
            events = [e for e in events if e["type"] in request.event_types]
        
        return {
            "period": {
                "start": request.start_date,
                "end": request.end_date,
                "days": (end_date - start_date).days
            },
            "events": events,
            "summary": {
                "total_events": len(events),
                "public_holidays": len([e for e in events if e.get("is_public_holiday")]),
                "cultural_festivals": len([e for e in events if e["type"] == "religious_festival"]),
                "national_days": len([e for e in events if e["type"] == "national_holiday"])
            }
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        logger.error("Cultural events request failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get cultural events: {str(e)}")

@router.post("/meeting-check")
async def check_meeting_schedule(request: MeetingSchedulingRequest):
    """
    Check proposed meeting time for cultural and religious conflicts
    Provides alternative suggestions if conflicts detected
    """
    try:
        proposed_time = datetime.fromisoformat(request.proposed_datetime.replace("Z", "+00:00"))
        
        conflicts = []
        suggestions = []
        cultural_score = 100  # Start with perfect score
        
        # Check prayer time conflicts
        if request.respect_prayer_times:
            prayer_conflicts = check_prayer_conflicts(proposed_time, request.duration_minutes)
            conflicts.extend(prayer_conflicts)
            if prayer_conflicts:
                cultural_score -= 30
        
        # Check cultural event conflicts
        if request.respect_cultural_events:
            cultural_conflicts = check_cultural_conflicts(
                proposed_time.date(), 
                request.attendee_nationalities
            )
            conflicts.extend(cultural_conflicts)
            if cultural_conflicts:
                cultural_score -= 25
        
        # Check Ramadan considerations
        ramadan_conflicts = check_ramadan_conflicts(proposed_time, request.duration_minutes)
        conflicts.extend(ramadan_conflicts)
        if ramadan_conflicts:
            cultural_score -= 20
        
        # Generate suggestions if conflicts exist
        if conflicts:
            suggestions = generate_meeting_suggestions(
                proposed_time, 
                request.duration_minutes,
                request.attendee_nationalities
            )
        
        return {
            "proposed_meeting": {
                "datetime": request.proposed_datetime,
                "duration_minutes": request.duration_minutes,
                "attendees_nationalities": request.attendee_nationalities
            },
            "cultural_score": max(0, cultural_score),
            "status": "recommended" if cultural_score >= 80 else "caution" if cultural_score >= 60 else "not_recommended",
            "conflicts": conflicts,
            "suggestions": suggestions,
            "cultural_tips": get_cultural_meeting_tips(request.attendee_nationalities)
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")
    except Exception as e:
        logger.error("Meeting check failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Meeting check failed: {str(e)}")

@router.get("/nationalities")
async def get_supported_nationalities():
    """Get list of supported nationalities for cultural intelligence"""
    return {
        "nationalities": [
            {"code": "uae", "name": "Emirati", "name_arabic": "إماراتي", "population_uae": "11.5%"},
            {"code": "indian", "name": "Indian", "name_hindi": "भारतीय", "population_uae": "27.1%"},
            {"code": "pakistani", "name": "Pakistani", "name_urdu": "پاکستانی", "population_uae": "12.5%"},
            {"code": "bangladeshi", "name": "Bangladeshi", "name_bengali": "বাংলাদেশী", "population_uae": "7.5%"},
            {"code": "filipino", "name": "Filipino", "name_tagalog": "Pilipino", "population_uae": "6.1%"},
            {"code": "iranian", "name": "Iranian", "name_persian": "ایرانی", "population_uae": "4.2%"},
            {"code": "egyptian", "name": "Egyptian", "name_arabic": "مصري", "population_uae": "4.1%"},
            {"code": "nepali", "name": "Nepali", "name_nepali": "नेपाली", "population_uae": "2.8%"},
            {"code": "sri_lankan", "name": "Sri Lankan", "name_sinhala": "ශ්‍රී ලාංකික", "population_uae": "2.3%"},
            {"code": "western", "name": "Western Expat", "population_uae": "5.2%"}
        ],
        "most_common": ["indian", "pakistani", "uae", "bangladeshi", "filipino"],
        "cultural_groups": {
            "arab": ["uae", "egyptian", "lebanese", "syrian"],
            "south_asian": ["indian", "pakistani", "bangladeshi", "nepali", "sri_lankan"],
            "southeast_asian": ["filipino", "indonesian", "thai"],
            "western": ["american", "british", "canadian", "australian"]
        }
    }

# Helper functions

def get_hijri_date(gregorian_date: date) -> str:
    """Convert Gregorian date to Hijri"""
    try:
        hijri = Gregorian(gregorian_date.year, gregorian_date.month, gregorian_date.day).to_hijri()
        return f"{hijri.year}-{hijri.month:02d}-{hijri.day:02d}"
    except:
        return "1445-01-01"  # Fallback

def get_qibla_direction(city: str) -> float:
    """Get Qibla direction for UAE cities"""
    directions = {
        "Dubai": 258.32,
        "Abu Dhabi": 259.15,
        "Sharjah": 258.28,
        "Ajman": 258.25,
        "Fujairah": 257.85,
        "Ras Al Khaimah": 258.10,
        "Umm Al Quwain": 258.20
    }
    return directions.get(city, 258.32)

def generate_prayer_alerts(target_date: date) -> List[str]:
    """Generate prayer-related alerts"""
    alerts = []
    if target_date.weekday() == 4:  # Friday
        alerts.append("Friday prayers (Jummah) from 11:30 AM - 1:00 PM")
    return alerts

def check_prayer_conflicts(proposed_time: datetime, duration: int) -> List[Dict]:
    """Check for prayer time conflicts"""
    conflicts = []
    # Mock implementation - would integrate with real prayer time API
    return conflicts

def check_cultural_conflicts(proposed_date: date, nationalities: List[str]) -> List[Dict]:
    """Check for cultural event conflicts"""
    conflicts = []
    # Mock implementation
    return conflicts

def check_ramadan_conflicts(proposed_time: datetime, duration: int) -> List[Dict]:
    """Check for Ramadan-related conflicts"""
    conflicts = []
    # Mock implementation - would check if during Ramadan period
    return conflicts

def generate_meeting_suggestions(
    proposed_time: datetime, 
    duration: int, 
    nationalities: List[str]
) -> List[Dict]:
    """Generate alternative meeting times"""
    suggestions = []
    # Mock implementation
    return suggestions

def get_cultural_meeting_tips(nationalities: List[str]) -> List[str]:
    """Get cultural tips for meeting with specific nationalities"""
    tips = [
        "Begin meetings with brief personal greetings - important in UAE culture",
        "Allow extra time for relationship building with Arab colleagues",
        "Consider providing refreshments appropriate for all attendees",
        "Be mindful of fasting periods during Ramadan"
    ]
    return tips
