import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null, // Nullable strictly for platform-wide SuperAdmin actions
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Audit log requires an acting user reference'],
      index: true
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      index: true
    },
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      enum: ['Organization', 'User', 'Team', 'Project', 'Task', 'Security', 'CrossTenantAccess'],
      index: true
    },
    targetId: {
      type: String,
      default: null
    },
    details: {
      type: Object,
      default: {}
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ organization: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
