"""
Transcription Models - Data models for Arabic transcription and NLP
UAE Work Hub AI Service
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Enums
class LanguageCode(str, Enum):
    ARABIC = "ar"
    ENGLISH = "en" 
    BOTH = "both"

class ArabicDialect(str, Enum):
    EMIRATI = "emirati"
    SAUDI = "saudi"
    EGYPTIAN = "egyptian"
    LEVANTINE = "levantine"
    STANDARD = "standard"
    GULF = "gulf"
    MAGHREBI = "maghrebi"

class TranscriptionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class SpeakerRole(str, Enum):
    HOST = "host"
    PARTICIPANT = "participant"
    INTERPRETER = "interpreter"
    UNKNOWN = "unknown"

# Base Models
class TranscriptionSegment(BaseModel):
    """Individual transcription segment with timing and metadata"""
    id: str = Field(..., description="Unique segment identifier")
    text: str = Field(..., description="Transcribed text")
    text_ar: Optional[str] = Field(None, description="Arabic text if translated")
    language: LanguageCode = Field(default=LanguageCode.ARABIC)
    dialect: Optional[ArabicDialect] = Field(None, description="Detected Arabic dialect")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Confidence score")
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    speaker_id: Optional[str] = Field(None, description="Speaker identifier")
    speaker_name: Optional[str] = Field(None, description="Speaker display name")
    speaker_role: SpeakerRole = Field(default=SpeakerRole.UNKNOWN)
    is_final: bool = Field(default=False, description="Is this a final segment")
    enhanced_text: Optional[str] = Field(None, description="NLP enhanced text")
    dialect_confidence: Optional[float] = Field(None, description="Dialect detection confidence")
    keywords: Optional[List[str]] = Field(default=[], description="Extracted keywords")
    sentiment: Optional[str] = Field(None, description="Sentiment analysis result")
    timestamp: datetime = Field(default_factory=datetime.now)

    @validator('end_time')
    def end_time_after_start(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

class TranscriptionRequest(BaseModel):
    """Request model for transcription processing"""
    meeting_id: str = Field(..., description="Meeting room identifier")
    language: LanguageCode = Field(default=LanguageCode.ARABIC)
    dialect: Optional[ArabicDialect] = Field(default=ArabicDialect.EMIRATI)
    speaker_id: Optional[str] = Field(None, description="Speaker identifier")
    enable_diarization: bool = Field(default=True, description="Enable speaker separation")
    enable_punctuation: bool = Field(default=True, description="Add punctuation")
    enable_capitalization: bool = Field(default=True, description="Apply capitalization") 
    enable_profanity_filter: bool = Field(default=False, description="Filter profanity")
    return_alternatives: bool = Field(default=False, description="Return alternative transcriptions")
    max_alternatives: int = Field(default=3, ge=1, le=10, description="Max alternatives to return")
    custom_vocabulary: Optional[List[str]] = Field(default=[], description="Custom vocabulary words")
    cultural_context: Optional[Dict[str, Any]] = Field(default={}, description="Cultural context hints")

class TranscriptionResponse(BaseModel):
    """Response model for completed transcription"""
    transcription_id: str = Field(..., description="Unique transcription identifier")
    meeting_id: str = Field(..., description="Meeting room identifier")
    status: TranscriptionStatus = Field(default=TranscriptionStatus.COMPLETED)
    language: LanguageCode = Field(..., description="Primary language")
    detected_dialect: Optional[ArabicDialect] = Field(None, description="Detected Arabic dialect")
    segments: List[TranscriptionSegment] = Field(default=[], description="Transcription segments")
    full_transcript: Optional[str] = Field(None, description="Complete transcript text")
    full_transcript_ar: Optional[str] = Field(None, description="Complete Arabic transcript")
    duration: float = Field(default=0.0, description="Audio duration in seconds")
    word_count: int = Field(default=0, description="Total word count")
    confidence_avg: float = Field(default=0.0, description="Average confidence score")
    speakers_detected: List[str] = Field(default=[], description="Detected speaker IDs")
    processing_time: float = Field(default=0.0, description="Processing time in seconds")
    created_at: datetime = Field(default_factory=datetime.now)
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")
    
    # Cultural intelligence fields
    cultural_markers: Optional[Dict[str, Any]] = Field(default={}, description="Cultural markers found")
    prayer_times_mentioned: Optional[List[str]] = Field(default=[], description="Prayer times referenced")
    ramadan_context: Optional[bool] = Field(default=False, description="Ramadan context detected")
    formal_language_score: Optional[float] = Field(None, description="Formality level (0-1)")

class RealTimeTranscriptionConfig(BaseModel):
    """Configuration for real-time transcription"""
    language: LanguageCode = Field(default=LanguageCode.ARABIC)
    dialect: Optional[ArabicDialect] = Field(default=ArabicDialect.EMIRATI)
    chunk_duration: float = Field(default=2.0, description="Audio chunk duration in seconds")
    overlap_duration: float = Field(default=0.5, description="Overlap between chunks")
    interim_results: bool = Field(default=True, description="Send interim results")
    auto_punctuation: bool = Field(default=True, description="Automatically add punctuation")
    speaker_diarization: bool = Field(default=True, description="Identify different speakers")
    noise_reduction: bool = Field(default=True, description="Apply noise reduction")
    echo_cancellation: bool = Field(default=True, description="Cancel echo/feedback")
    
    # Arabic-specific settings
    diacritics_restoration: bool = Field(default=False, description="Restore Arabic diacritics")
    normalize_arabic: bool = Field(default=True, description="Normalize Arabic text")
    detect_code_switching: bool = Field(default=True, description="Detect Arabic-English switching")
    
    # Cultural intelligence
    detect_prayer_references: bool = Field(default=True, description="Detect prayer time references")
    detect_cultural_terms: bool = Field(default=True, description="Detect cultural terminology")
    ramadan_mode: bool = Field(default=False, description="Optimize for Ramadan context")

class DialectDetectionRequest(BaseModel):
    """Request for Arabic dialect detection"""
    text: Optional[str] = Field(None, description="Text to analyze for dialect")
    audio_data: Optional[str] = Field(None, description="Base64 encoded audio data")
    context_hints: Optional[Dict[str, str]] = Field(default={}, description="Context hints for better detection")
    return_confidence: bool = Field(default=True, description="Return confidence scores")
    return_features: bool = Field(default=False, description="Return linguistic features detected")

class DialectDetectionResponse(BaseModel):
    """Response for dialect detection"""
    detected_dialect: ArabicDialect = Field(..., description="Most likely dialect")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence")
    alternatives: List[Dict[str, Union[ArabicDialect, float]]] = Field(default=[], description="Alternative dialects with scores")
    linguistic_features: Optional[Dict[str, Any]] = Field(None, description="Detected linguistic features")
    processing_time: float = Field(default=0.0, description="Processing time in seconds")

class SpeakerDiarizationResult(BaseModel):
    """Speaker diarization results"""
    speaker_id: str = Field(..., description="Unique speaker identifier")
    segments: List[Dict[str, float]] = Field(..., description="Time segments for this speaker")
    confidence: float = Field(..., description="Speaker identification confidence")
    voice_characteristics: Optional[Dict[str, Any]] = Field(None, description="Voice characteristics")
    estimated_gender: Optional[str] = Field(None, description="Estimated gender")
    estimated_age_range: Optional[str] = Field(None, description="Estimated age range")
    cultural_accent: Optional[str] = Field(None, description="Detected cultural accent")

class ArabicTextAnalysis(BaseModel):
    """Arabic text analysis results"""
    text: str = Field(..., description="Original text")
    normalized_text: str = Field(..., description="Normalized Arabic text")
    dialect: Optional[ArabicDialect] = Field(None, description="Detected dialect")
    dialect_confidence: float = Field(default=0.0, description="Dialect confidence")
    formality_level: float = Field(default=0.0, description="Text formality level (0-1)")
    readability_score: float = Field(default=0.0, description="Readability score")
    
    # Linguistic features
    word_count: int = Field(default=0, description="Word count")
    sentence_count: int = Field(default=0, description="Sentence count")
    avg_word_length: float = Field(default=0.0, description="Average word length")
    
    # Cultural markers
    religious_terms: List[str] = Field(default=[], description="Religious terms found")
    cultural_references: List[str] = Field(default=[], description="Cultural references")
    honorifics: List[str] = Field(default=[], description="Honorific titles found")
    
    # Sentiment and emotion
    sentiment: Optional[str] = Field(None, description="Overall sentiment")
    sentiment_score: Optional[float] = Field(None, description="Sentiment score (-1 to 1)")
    emotions: Optional[Dict[str, float]] = Field(None, description="Emotion scores")
    
    # Keywords and topics
    keywords: List[str] = Field(default=[], description="Extracted keywords")
    topics: List[str] = Field(default=[], description="Identified topics")
    entities: Optional[List[Dict[str, Any]]] = Field(None, description="Named entities")

class TranscriptionSession(BaseModel):
    """Active transcription session state"""
    session_id: str = Field(..., description="Unique session identifier")
    meeting_id: str = Field(..., description="Meeting room identifier")
    status: str = Field(default="active", description="Session status")
    config: RealTimeTranscriptionConfig = Field(..., description="Session configuration")
    start_time: datetime = Field(default_factory=datetime.now)
    last_activity: datetime = Field(default_factory=datetime.now)
    
    # Session statistics
    segments_processed: int = Field(default=0, description="Number of segments processed")
    total_duration: float = Field(default=0.0, description="Total audio duration processed")
    avg_confidence: float = Field(default=0.0, description="Average confidence score")
    speakers_active: List[str] = Field(default=[], description="Currently active speakers")
    
    # Real-time metrics
    processing_latency: float = Field(default=0.0, description="Average processing latency")
    connection_quality: float = Field(default=1.0, description="Connection quality score")
    buffer_health: float = Field(default=1.0, description="Audio buffer health")

class CulturalContext(BaseModel):
    """Cultural context for UAE-specific transcription enhancement"""
    prayer_times_today: Optional[List[str]] = Field(None, description="Today's prayer times")
    is_ramadan: bool = Field(default=False, description="Is it currently Ramadan")
    islamic_calendar_date: Optional[str] = Field(None, description="Current Islamic date")
    uae_holidays: Optional[List[str]] = Field(None, description="Current UAE holidays")
    business_hours: Optional[Dict[str, str]] = Field(None, description="Local business hours")
    cultural_events: Optional[List[str]] = Field(None, description="Ongoing cultural events")
    
    # Language context
    code_switching_expected: bool = Field(default=True, description="Expect Arabic-English switching")
    formality_level: str = Field(default="mixed", description="Expected formality level")
    technical_domain: Optional[str] = Field(None, description="Technical domain context")

class TranscriptionError(BaseModel):
    """Error information for failed transcriptions"""
    error_code: str = Field(..., description="Error code")
    error_message: str = Field(..., description="Error message")
    error_message_ar: Optional[str] = Field(None, description="Arabic error message")
    error_type: str = Field(..., description="Error type")
    recoverable: bool = Field(default=False, description="Is error recoverable")
    suggested_action: Optional[str] = Field(None, description="Suggested user action")
    technical_details: Optional[Dict[str, Any]] = Field(None, description="Technical error details")
    timestamp: datetime = Field(default_factory=datetime.now)

# Export all models
__all__ = [
    "LanguageCode",
    "ArabicDialect", 
    "TranscriptionStatus",
    "SpeakerRole",
    "TranscriptionSegment",
    "TranscriptionRequest",
    "TranscriptionResponse",
    "RealTimeTranscriptionConfig",
    "DialectDetectionRequest",
    "DialectDetectionResponse",
    "SpeakerDiarizationResult",
    "ArabicTextAnalysis",
    "TranscriptionSession",
    "CulturalContext",
    "TranscriptionError"
]