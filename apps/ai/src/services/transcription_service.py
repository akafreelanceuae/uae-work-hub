"""
Transcription Service - Core Arabic/English transcription with UAE dialect support
UAE Work Hub AI Service
"""

import asyncio
import logging
import time
import uuid
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import json
import base64
import io

# Audio processing
import librosa
import soundfile as sf
import numpy as np
from pydub import AudioSegment

# ML/NLP imports
import torch
import transformers
from transformers import pipeline
import whisper
from speechrecognition import Recognizer, AudioData

# Redis for caching and session management
import redis.asyncio as redis

# Our models and services
from ..models.transcription_models import (
    TranscriptionRequest,
    TranscriptionResponse,
    TranscriptionSegment,
    TranscriptionSession,
    RealTimeTranscriptionConfig,
    LanguageCode,
    ArabicDialect,
    TranscriptionStatus,
    SpeakerRole,
    CulturalContext
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranscriptionService:
    """
    Core transcription service supporting Arabic dialects and real-time processing
    Optimized for UAE Work Hub with cultural intelligence
    """
    
    def __init__(self):
        self.redis_client = None
        self.whisper_models = {}
        self.arabic_models = {}
        self.speaker_diarization_model = None
        self.active_sessions: Dict[str, TranscriptionSession] = {}
        
        # Initialize models on startup
        self._initialize_models()
        
    async def _initialize_models(self):
        """Initialize ML models for transcription and NLP"""
        try:
            logger.info("Initializing transcription models...")
            
            # Initialize Redis connection
            self.redis_client = redis.Redis(
                host='localhost',
                port=6379,
                decode_responses=True
            )
            
            # Load Whisper models for different languages
            logger.info("Loading Whisper models...")
            self.whisper_models['base'] = whisper.load_model('base')
            self.whisper_models['medium'] = whisper.load_model('medium')
            
            # Load Arabic-specific models (would be actual models in production)
            logger.info("Loading Arabic NLP models...")
            self.arabic_models['dialect_classifier'] = self._load_dialect_classifier()
            self.arabic_models['text_enhancer'] = self._load_text_enhancer()
            
            # Load speaker diarization model
            logger.info("Loading speaker diarization model...")
            self.speaker_diarization_model = self._load_speaker_diarization()
            
            logger.info("All transcription models initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize models: {str(e)}")
            raise
    
    def _load_dialect_classifier(self):
        """Load Arabic dialect classification model"""
        # In production, this would load a fine-tuned model for Arabic dialects
        # For now, we'll simulate with a simple classifier
        return {
            'model': 'arabic_dialect_classifier_v1',
            'dialects': ['emirati', 'saudi', 'egyptian', 'levantine', 'standard'],
            'confidence_threshold': 0.7
        }
    
    def _load_text_enhancer(self):
        """Load Arabic text enhancement model"""
        # This would load models for punctuation, capitalization, normalization
        return {
            'punctuation_model': 'arabic_punctuation_v1',
            'normalization_model': 'arabic_normalizer_v1',
            'enhancement_pipeline': 'arabic_text_enhancer_v1'
        }
    
    def _load_speaker_diarization(self):
        """Load speaker diarization model"""
        # In production, this would be a real speaker diarization model
        return {
            'model': 'speaker_diarization_v1',
            'min_speakers': 1,
            'max_speakers': 10
        }
    
    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: str = "ar",
        dialect: Optional[str] = "emirati",
        speaker_id: Optional[str] = None,
        meeting_id: str = None
    ) -> TranscriptionResponse:
        """
        Transcribe audio data with Arabic dialect support
        """
        start_time = time.time()
        transcription_id = str(uuid.uuid4())
        
        try:
            logger.info(f"Starting transcription {transcription_id} for meeting {meeting_id}")
            
            # Preprocess audio
            processed_audio = await self._preprocess_audio(audio_data)
            
            # Detect language if not specified
            if language == "both":
                detected_language = await self._detect_language(processed_audio)
                language = detected_language
            
            # Perform transcription
            if language in ["ar", "both"]:
                # Arabic transcription with dialect support
                segments = await self._transcribe_arabic(
                    processed_audio, dialect, speaker_id
                )
            else:
                # English transcription
                segments = await self._transcribe_english(
                    processed_audio, speaker_id
                )
            
            # Speaker diarization if multiple speakers expected
            if not speaker_id:
                segments = await self._apply_speaker_diarization(processed_audio, segments)
            
            # Build full transcript
            full_transcript = " ".join([seg.text for seg in segments])
            
            # Calculate metrics
            duration = librosa.get_duration(y=processed_audio, sr=16000)
            processing_time = time.time() - start_time
            avg_confidence = sum([seg.confidence for seg in segments]) / len(segments) if segments else 0.0
            
            # Create response
            response = TranscriptionResponse(
                transcription_id=transcription_id,
                meeting_id=meeting_id,
                status=TranscriptionStatus.COMPLETED,
                language=LanguageCode(language),
                detected_dialect=ArabicDialect(dialect) if dialect else None,
                segments=segments,
                full_transcript=full_transcript,
                duration=duration,
                word_count=len(full_transcript.split()),
                confidence_avg=avg_confidence,
                processing_time=processing_time,
                speakers_detected=[seg.speaker_id for seg in segments if seg.speaker_id],
                created_at=datetime.now()
            )
            
            # Cache the result
            await self._cache_transcription(response)
            
            logger.info(f"Transcription {transcription_id} completed in {processing_time:.2f}s")
            return response
            
        except Exception as e:
            logger.error(f"Transcription failed for {transcription_id}: {str(e)}")
            raise
    
    async def _preprocess_audio(self, audio_data: bytes) -> np.ndarray:
        """Preprocess audio data for transcription"""
        try:
            # Convert bytes to audio array
            audio_segment = AudioSegment.from_file(io.BytesIO(audio_data))
            
            # Convert to mono, 16kHz (standard for most ASR models)
            audio_segment = audio_segment.set_channels(1).set_frame_rate(16000)
            
            # Convert to numpy array
            audio_array = np.array(audio_segment.get_array_of_samples(), dtype=np.float32)
            audio_array = audio_array / np.max(np.abs(audio_array))  # Normalize
            
            return audio_array
            
        except Exception as e:
            logger.error(f"Audio preprocessing failed: {str(e)}")
            raise
    
    async def _detect_language(self, audio_data: np.ndarray) -> str:
        """Detect the primary language in audio"""
        try:
            # Use Whisper for language detection
            model = self.whisper_models['base']
            
            # Run detection on small sample
            sample_duration = min(30, len(audio_data) / 16000)  # Max 30 seconds
            sample_audio = audio_data[:int(sample_duration * 16000)]
            
            result = model.transcribe(sample_audio, language=None)
            detected_language = result.get('language', 'ar')
            
            # Map detected language to our codes
            if detected_language in ['ar', 'arabic']:
                return 'ar'
            elif detected_language in ['en', 'english']:
                return 'en'
            else:
                return 'ar'  # Default to Arabic for UAE context
                
        except Exception as e:
            logger.error(f"Language detection failed: {str(e)}")
            return 'ar'  # Default fallback
    
    async def _transcribe_arabic(
        self, 
        audio_data: np.ndarray, 
        dialect: str, 
        speaker_id: Optional[str]
    ) -> List[TranscriptionSegment]:
        """Transcribe Arabic audio with dialect awareness"""
        try:
            segments = []
            
            # Use Whisper for initial transcription
            model = self.whisper_models['medium']  # Better for Arabic
            result = model.transcribe(
                audio_data,
                language='ar',
                word_timestamps=True,
                initial_prompt=self._get_arabic_prompt(dialect)
            )
            
            # Process segments
            for i, segment in enumerate(result.get('segments', [])):
                # Extract text and timing
                text = segment['text'].strip()
                start_time = segment['start']
                end_time = segment['end']
                confidence = segment.get('avg_logprob', 0.0)
                
                # Normalize confidence to 0-1 range
                confidence = max(0.0, min(1.0, (confidence + 1.0) / 2.0))
                
                # Create segment object
                segment_obj = TranscriptionSegment(
                    id=f"seg_{uuid.uuid4().hex[:8]}",
                    text=text,
                    language=LanguageCode.ARABIC,
                    dialect=ArabicDialect(dialect) if dialect else None,
                    confidence=confidence,
                    start_time=start_time,
                    end_time=end_time,
                    speaker_id=speaker_id or f"speaker_{i % 3 + 1}",  # Simple speaker assignment
                    speaker_role=SpeakerRole.PARTICIPANT,
                    is_final=True,
                    timestamp=datetime.now()
                )
                
                segments.append(segment_obj)
            
            return segments
            
        except Exception as e:
            logger.error(f"Arabic transcription failed: {str(e)}")
            return []
    
    async def _transcribe_english(
        self, 
        audio_data: np.ndarray, 
        speaker_id: Optional[str]
    ) -> List[TranscriptionSegment]:
        """Transcribe English audio"""
        try:
            segments = []
            
            # Use Whisper for English transcription
            model = self.whisper_models['base']  # Base is sufficient for English
            result = model.transcribe(
                audio_data,
                language='en',
                word_timestamps=True
            )
            
            # Process segments
            for i, segment in enumerate(result.get('segments', [])):
                text = segment['text'].strip()
                start_time = segment['start']
                end_time = segment['end']
                confidence = segment.get('avg_logprob', 0.0)
                
                # Normalize confidence
                confidence = max(0.0, min(1.0, (confidence + 1.0) / 2.0))
                
                segment_obj = TranscriptionSegment(
                    id=f"seg_{uuid.uuid4().hex[:8]}",
                    text=text,
                    language=LanguageCode.ENGLISH,
                    confidence=confidence,
                    start_time=start_time,
                    end_time=end_time,
                    speaker_id=speaker_id or f"speaker_{i % 3 + 1}",
                    speaker_role=SpeakerRole.PARTICIPANT,
                    is_final=True,
                    timestamp=datetime.now()
                )
                
                segments.append(segment_obj)
            
            return segments
            
        except Exception as e:
            logger.error(f"English transcription failed: {str(e)}")
            return []
    
    def _get_arabic_prompt(self, dialect: str) -> str:
        """Get Arabic prompt to guide transcription based on dialect"""
        prompts = {
            'emirati': "هذا نص باللهجة الإماراتية. المتحدثون من دولة الإمارات العربية المتحدة.",
            'saudi': "هذا نص باللهجة السعودية. المتحدثون من المملكة العربية السعودية.",
            'egyptian': "هذا نص باللهجة المصرية. المتحدثون من جمهورية مصر العربية.",
            'levantine': "هذا نص باللهجة الشامية. المتحدثون من بلاد الشام.",
            'standard': "هذا نص بالعربية الفصحى المعاصرة."
        }
        return prompts.get(dialect, prompts['emirati'])
    
    async def _apply_speaker_diarization(
        self, 
        audio_data: np.ndarray, 
        segments: List[TranscriptionSegment]
    ) -> List[TranscriptionSegment]:
        """Apply speaker diarization to identify different speakers"""
        try:
            # In production, this would use a real speaker diarization model
            # For now, we'll simulate speaker detection based on audio features
            
            # Simple speaker assignment based on timing gaps
            current_speaker = "speaker_1"
            speaker_count = 1
            
            for i, segment in enumerate(segments):
                if i > 0:
                    # Check if there's a significant pause indicating speaker change
                    gap = segment.start_time - segments[i-1].end_time
                    if gap > 2.0:  # 2 second pause might indicate speaker change
                        speaker_count += 1
                        current_speaker = f"speaker_{speaker_count}"
                
                segment.speaker_id = current_speaker
                
                # Set speaker role based on position
                if current_speaker == "speaker_1":
                    segment.speaker_role = SpeakerRole.HOST
                else:
                    segment.speaker_role = SpeakerRole.PARTICIPANT
            
            return segments
            
        except Exception as e:
            logger.error(f"Speaker diarization failed: {str(e)}")
            return segments  # Return segments without diarization
    
    async def _cache_transcription(self, transcription: TranscriptionResponse):
        """Cache transcription result in Redis"""
        try:
            if self.redis_client:
                cache_key = f"transcription:{transcription.transcription_id}"
                await self.redis_client.setex(
                    cache_key, 
                    3600,  # 1 hour TTL
                    transcription.json()
                )
                
                # Also cache by meeting ID
                meeting_key = f"meeting_transcriptions:{transcription.meeting_id}"
                await self.redis_client.lpush(meeting_key, transcription.transcription_id)
                await self.redis_client.expire(meeting_key, 86400)  # 24 hours
                
        except Exception as e:
            logger.error(f"Failed to cache transcription: {str(e)}")
    
    async def get_transcription(self, transcription_id: str) -> Optional[TranscriptionResponse]:
        """Get cached transcription by ID"""
        try:
            if self.redis_client:
                cache_key = f"transcription:{transcription_id}"
                cached_data = await self.redis_client.get(cache_key)
                
                if cached_data:
                    return TranscriptionResponse.parse_raw(cached_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get transcription: {str(e)}")
            return None
    
    async def get_meeting_transcripts(
        self, 
        meeting_id: str, 
        language: Optional[str] = None
    ) -> List[TranscriptionResponse]:
        """Get all transcripts for a meeting"""
        try:
            transcripts = []
            
            if self.redis_client:
                meeting_key = f"meeting_transcriptions:{meeting_id}"
                transcript_ids = await self.redis_client.lrange(meeting_key, 0, -1)
                
                for transcript_id in transcript_ids:
                    transcript = await self.get_transcription(transcript_id)
                    if transcript:
                        # Filter by language if specified
                        if not language or transcript.language == language:
                            transcripts.append(transcript)
            
            return transcripts
            
        except Exception as e:
            logger.error(f"Failed to get meeting transcripts: {str(e)}")
            return []
    
    async def delete_meeting_transcripts(self, meeting_id: str) -> int:
        """Delete all transcripts for a meeting"""
        try:
            deleted_count = 0
            
            if self.redis_client:
                meeting_key = f"meeting_transcriptions:{meeting_id}"
                transcript_ids = await self.redis_client.lrange(meeting_key, 0, -1)
                
                # Delete individual transcripts
                for transcript_id in transcript_ids:
                    cache_key = f"transcription:{transcript_id}"
                    if await self.redis_client.delete(cache_key):
                        deleted_count += 1
                
                # Delete meeting list
                await self.redis_client.delete(meeting_key)
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to delete meeting transcripts: {str(e)}")
            return 0
    
    # Real-time transcription methods
    async def start_realtime_session(
        self,
        meeting_id: str,
        language: str = "ar",
        dialect: Optional[str] = "emirati",
        websocket = None
    ) -> TranscriptionSession:
        """Start a real-time transcription session"""
        try:
            session_id = f"session_{meeting_id}_{int(time.time())}"
            
            config = RealTimeTranscriptionConfig(
                language=LanguageCode(language),
                dialect=ArabicDialect(dialect) if dialect else None
            )
            
            session = TranscriptionSession(
                session_id=session_id,
                meeting_id=meeting_id,
                config=config,
                status="active",
                start_time=datetime.now()
            )
            
            self.active_sessions[meeting_id] = session
            
            logger.info(f"Started real-time session {session_id} for meeting {meeting_id}")
            return session
            
        except Exception as e:
            logger.error(f"Failed to start real-time session: {str(e)}")
            raise
    
    async def process_audio_chunk(
        self,
        audio_data: str,  # Base64 encoded
        meeting_id: str,
        speaker_id: Optional[str] = None,
        timestamp: str = None
    ) -> Optional[TranscriptionSegment]:
        """Process a real-time audio chunk"""
        try:
            if meeting_id not in self.active_sessions:
                logger.warning(f"No active session for meeting {meeting_id}")
                return None
            
            session = self.active_sessions[meeting_id]
            
            # Decode audio data
            audio_bytes = base64.b64decode(audio_data)
            processed_audio = await self._preprocess_audio(audio_bytes)
            
            # Quick transcription for real-time
            if session.config.language == LanguageCode.ARABIC:
                segments = await self._transcribe_arabic_realtime(
                    processed_audio, 
                    session.config.dialect,
                    speaker_id
                )
            else:
                segments = await self._transcribe_english_realtime(
                    processed_audio,
                    speaker_id
                )
            
            # Return the first/best segment
            if segments:
                segment = segments[0]
                
                # Update session metrics
                session.segments_processed += 1
                session.last_activity = datetime.now()
                
                return segment
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to process audio chunk: {str(e)}")
            return None
    
    async def _transcribe_arabic_realtime(
        self, 
        audio_data: np.ndarray, 
        dialect: Optional[ArabicDialect], 
        speaker_id: Optional[str]
    ) -> List[TranscriptionSegment]:
        """Real-time Arabic transcription optimized for speed"""
        try:
            # Use smaller/faster model for real-time
            model = self.whisper_models['base']
            
            result = model.transcribe(
                audio_data,
                language='ar',
                fp16=True,  # Faster inference
                no_speech_threshold=0.6,
                initial_prompt=self._get_arabic_prompt(dialect.value if dialect else 'emirati')
            )
            
            segments = []
            text = result.get('text', '').strip()
            
            if text:
                segment = TranscriptionSegment(
                    id=f"rt_{uuid.uuid4().hex[:8]}",
                    text=text,
                    language=LanguageCode.ARABIC,
                    dialect=dialect,
                    confidence=0.8,  # Estimated for real-time
                    start_time=0.0,
                    end_time=len(audio_data) / 16000,
                    speaker_id=speaker_id or "speaker_1",
                    is_final=False,  # Real-time segments are interim
                    timestamp=datetime.now()
                )
                segments.append(segment)
            
            return segments
            
        except Exception as e:
            logger.error(f"Real-time Arabic transcription failed: {str(e)}")
            return []
    
    async def _transcribe_english_realtime(
        self, 
        audio_data: np.ndarray, 
        speaker_id: Optional[str]
    ) -> List[TranscriptionSegment]:
        """Real-time English transcription optimized for speed"""
        try:
            model = self.whisper_models['base']
            
            result = model.transcribe(
                audio_data,
                language='en',
                fp16=True,
                no_speech_threshold=0.6
            )
            
            segments = []
            text = result.get('text', '').strip()
            
            if text:
                segment = TranscriptionSegment(
                    id=f"rt_{uuid.uuid4().hex[:8]}",
                    text=text,
                    language=LanguageCode.ENGLISH,
                    confidence=0.8,
                    start_time=0.0,
                    end_time=len(audio_data) / 16000,
                    speaker_id=speaker_id or "speaker_1",
                    is_final=False,
                    timestamp=datetime.now()
                )
                segments.append(segment)
            
            return segments
            
        except Exception as e:
            logger.error(f"Real-time English transcription failed: {str(e)}")
            return []
    
    async def stop_realtime_session(self, meeting_id: str) -> Optional[str]:
        """Stop real-time transcription session and return final transcript"""
        try:
            if meeting_id in self.active_sessions:
                session = self.active_sessions[meeting_id]
                session.status = "completed"
                
                # Generate final transcript from session data
                # In production, this would compile all segments
                final_transcript = f"Real-time session completed. Processed {session.segments_processed} segments."
                
                # Clean up session
                del self.active_sessions[meeting_id]
                
                logger.info(f"Stopped real-time session for meeting {meeting_id}")
                return final_transcript
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to stop real-time session: {str(e)}")
            return None
    
    async def cleanup_realtime_session(self, meeting_id: str):
        """Clean up real-time session resources"""
        try:
            if meeting_id in self.active_sessions:
                del self.active_sessions[meeting_id]
                logger.info(f"Cleaned up session for meeting {meeting_id}")
                
        except Exception as e:
            logger.error(f"Failed to cleanup session: {str(e)}")
    
    async def export_as_srt(self, transcripts: List[TranscriptionResponse]) -> str:
        """Export transcripts as SRT subtitle format"""
        try:
            srt_content = ""
            subtitle_index = 1
            
            for transcript in transcripts:
                for segment in transcript.segments:
                    start_time = self._seconds_to_srt_time(segment.start_time)
                    end_time = self._seconds_to_srt_time(segment.end_time)
                    
                    srt_content += f"{subtitle_index}\n"
                    srt_content += f"{start_time} --> {end_time}\n"
                    srt_content += f"{segment.text}\n\n"
                    
                    subtitle_index += 1
            
            return srt_content
            
        except Exception as e:
            logger.error(f"SRT export failed: {str(e)}")
            return ""
    
    async def export_as_vtt(self, transcripts: List[TranscriptionResponse]) -> str:
        """Export transcripts as WebVTT format"""
        try:
            vtt_content = "WEBVTT\n\n"
            
            for transcript in transcripts:
                for segment in transcript.segments:
                    start_time = self._seconds_to_vtt_time(segment.start_time)
                    end_time = self._seconds_to_vtt_time(segment.end_time)
                    
                    vtt_content += f"{start_time} --> {end_time}\n"
                    vtt_content += f"{segment.text}\n\n"
            
            return vtt_content
            
        except Exception as e:
            logger.error(f"VTT export failed: {str(e)}")
            return "WEBVTT\n\n"
    
    def _seconds_to_srt_time(self, seconds: float) -> str:
        """Convert seconds to SRT time format"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
    
    def _seconds_to_vtt_time(self, seconds: float) -> str:
        """Convert seconds to WebVTT time format"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"