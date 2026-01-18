/**
 * User Model
 * User schema with UAE-specific fields and cultural preferences
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// UAE nationalities enum
export enum UAENationality {
  EMIRATI = 'AE',
  INDIAN = 'IN',
  PAKISTANI = 'PK',
  FILIPINO = 'PH',
  EGYPTIAN = 'EG',
  JORDANIAN = 'JO',
  SYRIAN = 'SY',
  LEBANESE = 'LB',
  SUDANESE = 'SD',
  BANGLADESHI = 'BD',
  IRANIAN = 'IR',
  BRITISH = 'GB',
  AMERICAN = 'US',
  CANADIAN = 'CA',
  AUSTRALIAN = 'AU',
  GERMAN = 'DE',
  FRENCH = 'FR',
  OTHER = 'OTHER'
}

// User roles enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  ORGANIZATION_ADMIN = 'org_admin'
}

// Language preference enum
export enum LanguagePreference {
  ARABIC = 'ar',
  ENGLISH = 'en'
}

// Cultural preferences interface
export interface CulturalPreferences {
  prayerTimeAlerts: boolean;
  ramadanMode: boolean;
  holidayCalendars: string[]; // Array of nationality codes for holiday calendars
  workingDays: number[]; // 0-6, 0 = Sunday
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  meetingDurationPreference: number; // minutes, e.g., 30, 45, 60
  timeZone: string; // "Asia/Dubai"
}

// User profile interface
export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  nationality: UAENationality;
  preferredLanguage: LanguagePreference;
  phoneNumber?: string;
  emiratesId?: string; // UAE ID for Emiratis
  companyName?: string;
  jobTitle?: string;
  department?: string;
  culturalPreferences: CulturalPreferences;
}

// User permissions interface
export interface UserPermissions {
  role: UserRole;
  features: string[];
  organizations: mongoose.Types.ObjectId[];
  canCreateMeetings: boolean;
  canCreateProjects: boolean;
  canManageUsers: boolean;
  maxMeetingDuration: number; // minutes
  storageQuota: number; // bytes
}

// User document interface
export interface IUser extends Document {
  email: string;
  password?: string;
  uaePassId?: string;
  profile: UserProfile;
  permissions: UserPermissions;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  toJSON(): Partial<IUser>;
  getDisplayName(): string;
  isEmirate(): boolean;
  getPreferredHolidays(): string[];
}

// Cultural preferences schema
const culturalPreferencesSchema = new Schema<CulturalPreferences>({
  prayerTimeAlerts: { type: Boolean, default: true },
  ramadanMode: { type: Boolean, default: true },
  holidayCalendars: [{ 
    type: String, 
    enum: Object.values(UAENationality),
    default: []
  }],
  workingDays: [{ 
    type: Number, 
    min: 0, 
    max: 6,
    default: [1, 2, 3, 4, 5] // Monday to Friday
  }],
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' }
  },
  meetingDurationPreference: { type: Number, default: 60, min: 15, max: 480 },
  timeZone: { type: String, default: 'Asia/Dubai' }
}, { _id: false });

// User profile schema
const userProfileSchema = new Schema<UserProfile>({
  firstName: { 
    type: String, 
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  displayName: { 
    type: String, 
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  avatar: { 
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Avatar must be a valid URL'
    }
  },
  nationality: { 
    type: String, 
    enum: Object.values(UAENationality),
    required: [true, 'Nationality is required'],
    default: UAENationality.OTHER
  },
  preferredLanguage: { 
    type: String, 
    enum: Object.values(LanguagePreference),
    default: LanguagePreference.ENGLISH
  },
  phoneNumber: { 
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^(\+971|971)?[0-9]{8,9}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Phone number must be a valid UAE number'
    }
  },
  emiratesId: { 
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^784-[0-9]{4}-[0-9]{7}-[0-9]$/.test(v);
      },
      message: 'Emirates ID must be in format: 784-YYYY-XXXXXXX-X'
    }
  },
  companyName: { type: String, trim: true, maxlength: 200 },
  jobTitle: { type: String, trim: true, maxlength: 100 },
  department: { type: String, trim: true, maxlength: 100 },
  culturalPreferences: { type: culturalPreferencesSchema, default: () => ({}) }
}, { _id: false });

// User permissions schema
const userPermissionsSchema = new Schema<UserPermissions>({
  role: { 
    type: String, 
    enum: Object.values(UserRole),
    default: UserRole.USER
  },
  features: [{ type: String }],
  organizations: [{ type: Schema.Types.ObjectId, ref: 'Organization' }],
  canCreateMeetings: { type: Boolean, default: true },
  canCreateProjects: { type: Boolean, default: true },
  canManageUsers: { type: Boolean, default: false },
  maxMeetingDuration: { type: Number, default: 240, min: 15, max: 480 }, // 4 hours max
  storageQuota: { type: Number, default: 5 * 1024 * 1024 * 1024 } // 5GB default
}, { _id: false });

// Main user schema
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: function() { return !this.uaePassId; }, // Password required if not using UAE Pass
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in query results by default
  },
  uaePassId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9]{15}$/.test(v); // UAE Pass ID format
      },
      message: 'UAE Pass ID must be 15 digits'
    }
  },
  profile: {
    type: userProfileSchema,
    required: true
  },
  permissions: {
    type: userPermissionsSchema,
    default: () => ({})
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'users',
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance and compliance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ uaePassId: 1 }, { unique: true, sparse: true });
userSchema.index({ 'profile.nationality': 1 });
userSchema.index({ 'permissions.role': 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ lastLoginAt: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get display name
userSchema.methods.getDisplayName = function(): string {
  return this.profile.displayName || `${this.profile.firstName} ${this.profile.lastName}`;
};

// Instance method to check if user is Emirati
userSchema.methods.isEmirate = function(): boolean {
  return this.profile.nationality === UAENationality.EMIRATI;
};

// Instance method to get preferred holidays
userSchema.methods.getPreferredHolidays = function(): string[] {
  const holidays = ['UAE']; // Always include UAE holidays
  
  if (this.profile.culturalPreferences.holidayCalendars.length > 0) {
    holidays.push(...this.profile.culturalPreferences.holidayCalendars);
  } else if (this.profile.nationality !== UAENationality.EMIRATI) {
    holidays.push(this.profile.nationality);
  }
  
  return [...new Set(holidays)]; // Remove duplicates
};

// Static method to find by UAE Pass ID
userSchema.statics.findByUAEPassId = function(uaePassId: string) {
  return this.findOne({ uaePassId });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true, isVerified: true });
};

// Create and export the model
export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;