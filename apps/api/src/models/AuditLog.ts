import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  ts: Date;
  actorId: string;
  action: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  meta?: any;
}

const AuditLogSchema = new Schema<IAuditLog>({
  ts: { type: Date, default: () => new Date(), index: true },
  actorId: { type: String, index: true },
  action: { type: String, required: true },
  resource: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  meta: { type: Schema.Types.Mixed },
}, {
  collection: 'audit_logs',
  strict: true,
});

// TTL index based on AUDIT_TTL_DAYS (defaults to 30 days)
const ttlDays = Number(process.env.AUDIT_TTL_DAYS || 30);
AuditLogSchema.index({ ts: 1 }, { expireAfterSeconds: ttlDays * 24 * 60 * 60 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
