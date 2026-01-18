// UAE Work Hub MongoDB Initialization Script
// Creates collections with proper indexes and validation

db = db.getSiblingDB('uae_workhub');

// Create collections with schema validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'profile'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        uaePassId: { bsonType: 'string' },
        profile: {
          bsonType: 'object',
          required: ['firstName', 'lastName'],
          properties: {
            firstName: { bsonType: 'string' },
            lastName: { bsonType: 'string' },
            nationality: { bsonType: 'string' },
            preferredLanguage: { enum: ['ar', 'en'] },
            culturalPreferences: {
              bsonType: 'object',
              properties: {
                prayerTimeAlerts: { bsonType: 'bool' },
                ramadanMode: { bsonType: 'bool' },
                holidayCalendars: { bsonType: 'array' }
              }
            }
          }
        },
        permissions: {
          bsonType: 'object',
          properties: {
            role: { enum: ['user', 'admin', 'moderator'] },
            features: { bsonType: 'array' }
          }
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('organizations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'type', 'compliance'],
      properties: {
        name: { bsonType: 'string' },
        nameAr: { bsonType: 'string' },
        type: { enum: ['government', 'private', 'semi-government', 'freezone'] },
        tradeNumber: { bsonType: 'string' },
        compliance: {
          bsonType: 'object',
          required: ['dataResidency'],
          properties: {
            dataResidency: { enum: ['UAE', 'GCC', 'MENA'] },
            certifications: { bsonType: 'array' },
            auditTrail: { bsonType: 'bool' }
          }
        }
      }
    }
  }
});

db.createCollection('meetings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'organizerId', 'scheduledFor'],
      properties: {
        title: { bsonType: 'string' },
        titleAr: { bsonType: 'string' },
        organizerId: { bsonType: 'objectId' },
        participants: { bsonType: 'array' },
        scheduledFor: { bsonType: 'date' },
        duration: { bsonType: 'int' },
        culturalContext: {
          bsonType: 'object',
          properties: {
            respectsPrayerTimes: { bsonType: 'bool' },
            ramadanAdjusted: { bsonType: 'bool' },
            holidayConflicts: { bsonType: 'array' }
          }
        },
        recording: {
          bsonType: 'object',
          properties: {
            enabled: { bsonType: 'bool' },
            transcriptionEnabled: { bsonType: 'bool' },
            language: { enum: ['ar', 'en', 'both'] }
          }
        },
        encryption: {
          bsonType: 'object',
          properties: {
            level: { enum: ['standard', 'enhanced'] },
            keyId: { bsonType: 'string' }
          }
        }
      }
    }
  }
});

db.createCollection('projects', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'type', 'organizationId'],
      properties: {
        name: { bsonType: 'string' },
        nameAr: { bsonType: 'string' },
        type: { enum: ['dubai2040', 'vision2030', 'government', 'private', 'custom'] },
        organizationId: { bsonType: 'objectId' },
        template: { bsonType: 'string' },
        milestones: { bsonType: 'array' },
        culturalCalendar: {
          bsonType: 'object',
          properties: {
            considersHolidays: { bsonType: 'bool' },
            ramadanAdjustments: { bsonType: 'bool' },
            nationalityCalendars: { bsonType: 'array' }
          }
        },
        compliance: {
          bsonType: 'object',
          properties: {
            auditTrail: { bsonType: 'bool' },
            dataClassification: { enum: ['public', 'internal', 'confidential', 'restricted'] }
          }
        }
      }
    }
  }
});

db.createCollection('transcriptions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['meetingId', 'language', 'content'],
      properties: {
        meetingId: { bsonType: 'objectId' },
        language: { enum: ['ar', 'en'] },
        dialect: { enum: ['standard', 'emirati', 'saudi', 'egyptian', 'levantine'] },
        content: { bsonType: 'string' },
        confidence: { bsonType: 'double' },
        speakers: { bsonType: 'array' },
        timestamps: { bsonType: 'array' },
        aiProcessed: { bsonType: 'bool' },
        encryption: {
          bsonType: 'object',
          properties: {
            encrypted: { bsonType: 'bool' },
            keyId: { bsonType: 'string' }
          }
        }
      }
    }
  }
});

// Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "uaePassId": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "profile.nationality": 1 });
db.users.createIndex({ "createdAt": 1 });

db.organizations.createIndex({ "name": 1 });
db.organizations.createIndex({ "type": 1 });
db.organizations.createIndex({ "compliance.dataResidency": 1 });

db.meetings.createIndex({ "organizerId": 1 });
db.meetings.createIndex({ "scheduledFor": 1 });
db.meetings.createIndex({ "participants": 1 });
db.meetings.createIndex({ "createdAt": 1 });

db.projects.createIndex({ "organizationId": 1 });
db.projects.createIndex({ "type": 1 });
db.projects.createIndex({ "name": "text", "nameAr": "text" });

db.transcriptions.createIndex({ "meetingId": 1 });
db.transcriptions.createIndex({ "language": 1 });
db.transcriptions.createIndex({ "createdAt": 1 });

// Create compound indexes for common queries
db.meetings.createIndex({ "organizerId": 1, "scheduledFor": 1 });
db.projects.createIndex({ "organizationId": 1, "type": 1 });
db.transcriptions.createIndex({ "meetingId": 1, "language": 1 });

print("UAE Work Hub database initialized successfully!");
print("Collections created with validation and indexes.");