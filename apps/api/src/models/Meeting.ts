/**
 * Meeting Model
 * Meeting schema with video conferencing, cultural intelligence, and compliance features
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// Meeting status enum
export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Meeting type enum
export enum MeetingType {
  VIDEO_CONFERENCE = 'video_conference',
  AUDIO_ONLY = 'audio_only',
  HYBRID = 'hybrid',
  WEBINAR = 'webinar'
}

// Recording status enum
export enum RecordingStatus {
  NOT_RECORDED = 'not_recorded',
  RECORDING = 'recording',
  RECORDED = 'recorded',
  PROCESSING = 'processing'
}

// Participant interface
export interface Participant {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: 'host' | 'co_host' | 'participant';
  joinedAt?: Date;
  leftAt?: Date;
  duration?: number; // in seconds
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenShared: boolean;
  culturalPreferences?: {
    prayerTimeAlerts: boolean;
    preferredLanguage: 'ar' | 'en';
  };
}

// Cultural context interface
export interface CulturalContext {
  respectsPrayerTimes: boolean;
  ramadanAdjusted: boolean;
  holidayConflicts: string[];
  prayerTimeAlerts: boolean;
  culturalNotes?: string;
  culturalNotesAr?: string;
}

// Recording interface
export interface Recording {
  enabled: boolean;
  status: RecordingStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  fileSize?: number;
  filePath?: string;
  transcriptionEnabled: boolean;
  language: 'ar' | 'en' | 'both';
  encryptionKeyId?: string;
}

// Transcription interface
export interface Transcription {
  enabled: boolean;
  language: 'ar' | 'en' | 'both';
  dialect?: 'standard' | 'emirati' | 'saudi' | 'egyptian' | 'levantine';
  confidence?: number;
  segments: {
    speakerId: string;
    speakerName: string;
    text: string;
    textAr?: string;
    startTime: number;
    endTime: number;
    confidence: number;
    timestamp: Date;
  }[];
  finalTranscript?: string;
  finalTranscriptAr?: string;
}

// Security settings interface
export interface SecuritySettings {
  requireAuthentication: boolean;
  waitingRoom: boolean;
  passwordProtected: boolean;
  password?: string;
  encryptionLevel: 'standard' | 'enhanced';
  encryptionKeyId?: string;
  allowRecording: boolean;
  allowScreenSharing: boolean;
  allowChat: boolean;
  dataResidency: 'UAE' | 'GCC' | 'MENA';
}

// Meeting statistics interface
export interface MeetingStatistics {
  totalParticipants: number;
  maxConcurrentParticipants: number;
  averageDuration: number;
  totalDuration: number;
  videoMinutes: number;
  audioMinutes: number;
  screenShareMinutes: number;
  chatMessages: number;
  transcriptionWords: number;
  bandwidthUsed: number; // in bytes
  qualityRatings?: {
    video: number;
    audio: number;
    overall: number;
  }[];
}

// Meeting document interface
export interface IMeeting extends Document {
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  organizerId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  type: MeetingType;
  status: MeetingStatus;
  scheduledFor: Date;
  scheduledEnd?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  timezone: string;
  participants: Participant[];
  culturalContext: CulturalContext;
  recording: Recording;
  transcription: Transcription;
  security: SecuritySettings;
  statistics: MeetingStatistics;
  tags: string[];
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
    exceptions?: Date[];
  };
  roomId: string;
  joinUrl: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  getDuration(): number;
  isActive(): boolean;
  canJoin(userId: string): boolean;
  addParticipant(participant: Partial<Participant>): void;
  removeParticipant(userId: string): void;
  updateStatistics(): void;
  checkCulturalConflicts(): string[];
}

// Participant schema
const participantSchema = new Schema<Participant>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  role: { 
    type: String, 
    enum: ['host', 'co_host', 'participant'],
    default: 'participant'
  },
  joinedAt: { type: Date },
  leftAt: { type: Date },
  duration: { type: Number, default: 0 },
  videoEnabled: { type: Boolean, default: true },
  audioEnabled: { type: Boolean, default: true },
  screenShared: { type: Boolean, default: false },
  culturalPreferences: {
    prayerTimeAlerts: { type: Boolean, default: false },
    preferredLanguage: { type: String, enum: ['ar', 'en'], default: 'en' }
  }
}, { _id: false });

// Cultural context schema
const culturalContextSchema = new Schema<CulturalContext>({
  respectsPrayerTimes: { type: Boolean, default: true },
  ramadanAdjusted: { type: Boolean, default: false },
  holidayConflicts: [{ type: String }],
  prayerTimeAlerts: { type: Boolean, default: true },
  culturalNotes: { type: String, trim: true },
  culturalNotesAr: { type: String, trim: true }
}, { _id: false });

// Recording schema
const recordingSchema = new Schema<Recording>({
  enabled: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: Object.values(RecordingStatus),
    default: RecordingStatus.NOT_RECORDED
  },
  startedAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 },
  fileSize: { type: Number, default: 0 },
  filePath: { type: String },
  transcriptionEnabled: { type: Boolean, default: false },
  language: { 
    type: String, 
    enum: ['ar', 'en', 'both'],
    default: 'en'
  },
  encryptionKeyId: { type: String }
}, { _id: false });

// Transcription schema
const transcriptionSchema = new Schema<Transcription>({
  enabled: { type: Boolean, default: false },
  language: { 
    type: String, 
    enum: ['ar', 'en', 'both'],
    default: 'en'
  },
  dialect: { 
    type: String, 
    enum: ['standard', 'emirati', 'saudi', 'egyptian', 'levantine'],
    default: 'standard'
  },
  confidence: { type: Number, min: 0, max: 1 },
  segments: [{
    speakerId: { type: String, required: true },
    speakerName: { type: String, required: true },
    text: { type: String, required: true },
    textAr: { type: String },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    confidence: { type: Number, min: 0, max: 1 },
    timestamp: { type: Date, default: Date.now }
  }],
  finalTranscript: { type: String },
  finalTranscriptAr: { type: String }
}, { _id: false });

// Security settings schema
const securitySettingsSchema = new Schema<SecuritySettings>({
  requireAuthentication: { type: Boolean, default: true },
  waitingRoom: { type: Boolean, default: false },
  passwordProtected: { type: Boolean, default: false },
  password: { type: String, select: false },
  encryptionLevel: { 
    type: String, 
    enum: ['standard', 'enhanced'],
    default: 'enhanced'
  },
  encryptionKeyId: { type: String },
  allowRecording: { type: Boolean, default: true },
  allowScreenSharing: { type: Boolean, default: true },
  allowChat: { type: Boolean, default: true },
  dataResidency: { 
    type: String, 
    enum: ['UAE', 'GCC', 'MENA'],
    default: 'UAE'
  }
}, { _id: false });

// Statistics schema
const statisticsSchema = new Schema<MeetingStatistics>({
  totalParticipants: { type: Number, default: 0 },
  maxConcurrentParticipants: { type: Number, default: 0 },
  averageDuration: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 },
  videoMinutes: { type: Number, default: 0 },
  audioMinutes: { type: Number, default: 0 },
  screenShareMinutes: { type: Number, default: 0 },
  chatMessages: { type: Number, default: 0 },
  transcriptionWords: { type: Number, default: 0 },
  bandwidthUsed: { type: Number, default: 0 },
  qualityRatings: [{
    video: { type: Number, min: 1, max: 5 },
    audio: { type: Number, min: 1, max: 5 },
    overall: { type: Number, min: 1, max: 5 }
  }]
}, { _id: false });

// Main meeting schema
const meetingSchema = new Schema<IMeeting>({
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  titleAr: {
    type: String,
    trim: true,
    maxlength: [200, 'Arabic title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  descriptionAr: {
    type: String,
    trim: true,
    maxlength: [2000, 'Arabic description cannot exceed 2000 characters']
  },
  organizerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required']
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  type: {
    type: String,
    enum: Object.values(MeetingType),
    default: MeetingType.VIDEO_CONFERENCE
  },
  status: {
    type: String,
    enum: Object.values(MeetingStatus),
    default: MeetingStatus.SCHEDULED
  },
  scheduledFor: {
    type: Date,
    required: [true, 'Scheduled time is required'],
    validate: {
      validator: function(v: Date) {
        return v > new Date();
      },
      message: 'Meeting must be scheduled in the future'
    }
  },
  scheduledEnd: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        return !v || v > this.scheduledFor;
      },
      message: 'End time must be after start time'
    }
  },
  actualStartTime: { type: Date },
  actualEndTime: { type: Date },
  timezone: { 
    type: String, 
    default: 'Asia/Dubai',
    required: true
  },
  participants: [participantSchema],
  culturalContext: {
    type: culturalContextSchema,
    default: () => ({
      respectsPrayerTimes: true,
      ramadanAdjusted: false,
      holidayConflicts: [],
      prayerTimeAlerts: true
    })
  },
  recording: {
    type: recordingSchema,
    default: () => ({})
  },
  transcription: {
    type: transcriptionSchema,
    default: () => ({})
  },
  security: {
    type: securitySettingsSchema,
    default: () => ({})
  },
  statistics: {
    type: statisticsSchema,
    default: () => ({})
  },
  tags: [{ type: String, trim: true }],
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly']
    },
    interval: { type: Number, min: 1 },
    endDate: { type: Date },
    exceptions: [{ type: Date }]
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  joinUrl: {
    type: String,
    required: true
  },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'meetings',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
meetingSchema.index({ organizerId: 1, scheduledFor: 1 });
meetingSchema.index({ status: 1, scheduledFor: 1 });
meetingSchema.index({ organizationId: 1, scheduledFor: 1 });
meetingSchema.index({ roomId: 1 }, { unique: true });
meetingSchema.index({ 'participants.userId': 1 });
meetingSchema.index({ scheduledFor: 1, status: 1 });
meetingSchema.index({ createdAt: 1 });

// Virtual for meeting duration
meetingSchema.virtual('duration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.floor((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / 1000);
  } else if (this.scheduledFor && this.scheduledEnd) {
    return Math.floor((this.scheduledEnd.getTime() - this.scheduledFor.getTime()) / 1000);
  }
  return 0;
});

// Virtual for meeting URL
meetingSchema.virtual('meetingUrl').get(function() {
  return `${process.env.FRONTEND_URL}/meeting/${this.roomId}`;
});

// Pre-save middleware to generate room ID and join URL
meetingSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate unique room ID
    this.roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate join URL
    this.joinUrl = `${process.env.FRONTEND_URL}/join/${this.roomId}`;
  }
  next();
});

// Instance method to get duration
meetingSchema.methods.getDuration = function(): number {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.floor((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / 1000);
  } else if (this.scheduledFor && this.scheduledEnd) {
    return Math.floor((this.scheduledEnd.getTime() - this.scheduledFor.getTime()) / 1000);
  }
  return 0;
};

// Instance method to check if meeting is active
meetingSchema.methods.isActive = function(): boolean {
  const now = new Date();
  return this.status === MeetingStatus.IN_PROGRESS || 
         (this.status === MeetingStatus.SCHEDULED && this.scheduledFor <= now);
};

// Instance method to check if user can join
meetingSchema.methods.canJoin = function(userId: string): boolean {
  // Check if user is a participant
  const isParticipant = this.participants.some(p => p.userId.toString() === userId);
  if (isParticipant) return true;
  
  // Check if meeting allows public join (no authentication required)
  if (!this.security.requireAuthentication) return true;
  
  return false;
};

// Instance method to add participant
meetingSchema.methods.addParticipant = function(participant: Partial<Participant>): void {
  // Check if participant already exists
  const existingIndex = this.participants.findIndex(p => p.userId.toString() === participant.userId?.toString());
  
  if (existingIndex >= 0) {
    // Update existing participant
    this.participants[existingIndex] = { ...this.participants[existingIndex], ...participant };
  } else {
    // Add new participant
    this.participants.push(participant as Participant);
    this.statistics.totalParticipants++;
  }
  
  // Update max concurrent participants
  const currentParticipants = this.participants.filter(p => p.joinedAt && !p.leftAt).length;
  if (currentParticipants > this.statistics.maxConcurrentParticipants) {
    this.statistics.maxConcurrentParticipants = currentParticipants;
  }
};

// Instance method to remove participant
meetingSchema.methods.removeParticipant = function(userId: string): void {
  const participantIndex = this.participants.findIndex(p => p.userId.toString() === userId);
  
  if (participantIndex >= 0) {
    const participant = this.participants[participantIndex];
    participant.leftAt = new Date();
    
    if (participant.joinedAt) {
      participant.duration = Math.floor((participant.leftAt.getTime() - participant.joinedAt.getTime()) / 1000);
    }
  }
};

// Instance method to update statistics
meetingSchema.methods.updateStatistics = function(): void {
  let totalDuration = 0;
  let videoMinutes = 0;
  let audioMinutes = 0;
  let screenShareMinutes = 0;
  
  this.participants.forEach(participant => {
    if (participant.duration) {
      totalDuration += participant.duration;
      
      if (participant.videoEnabled) {
        videoMinutes += Math.floor(participant.duration / 60);
      }
      
      if (participant.audioEnabled) {
        audioMinutes += Math.floor(participant.duration / 60);
      }
      
      if (participant.screenShared) {
        screenShareMinutes += Math.floor(participant.duration / 60);
      }
    }
  });
  
  this.statistics.totalDuration = totalDuration;
  this.statistics.videoMinutes = videoMinutes;
  this.statistics.audioMinutes = audioMinutes;
  this.statistics.screenShareMinutes = screenShareMinutes;
  
  if (this.participants.length > 0) {
    this.statistics.averageDuration = Math.floor(totalDuration / this.participants.length);
  }
};

// Instance method to check cultural conflicts
meetingSchema.methods.checkCulturalConflicts = function(): string[] {
  const conflicts: string[] = [];
  
  // Check if meeting is during prayer times (would be implemented with actual prayer time API)
  // Check if meeting is during Ramadan fasting hours
  // Check if meeting conflicts with major holidays
  
  return conflicts;
};

// Static method to find meetings by user
meetingSchema.statics.findByUser = function(userId: string) {
  return this.find({
    $or: [
      { organizerId: userId },
      { 'participants.userId': userId }
    ]
  }).sort({ scheduledFor: 1 });
};

// Static method to find active meetings
meetingSchema.statics.findActive = function() {
  return this.find({
    status: { $in: [MeetingStatus.SCHEDULED, MeetingStatus.IN_PROGRESS] },
    scheduledFor: { $lte: new Date() }
  });
};

// Create and export the model
export const Meeting: Model<IMeeting> = mongoose.model<IMeeting>('Meeting', meetingSchema);

export default Meeting;