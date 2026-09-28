import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Task title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    // Denormalized tenant key: allows direct filtering on Task.organization
    // without requiring an expensive cross-collection join with Project.
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Task must belong to an organization'],
      index: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
      index: true
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
      default: 'todo',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    taskType: {
      type: String,
      enum: ['feature', 'bug', 'refactor', 'documentation'],
      default: 'feature'
    },
    // Story points / function points input for ML prediction
    storyPoints: {
      type: Number,
      default: 3,
      min: 1
    },
    // Duration predictions returned by the Python ML microservice
    estimatedDuration: {
      type: Number,
      default: 0
    },
    actualDuration: {
      type: Number,
      default: null
    },
    predictionConfidence: {
      minHours: { type: Number, default: 0 },
      maxHours: { type: Number, default: 0 }
    },
    // Feature parameters used for ML estimation (cached for auditing & future fine-tuning)
    mlFeatures: {
      teamExp: { type: Number, default: 2.0 },
      managerExp: { type: Number, default: 3.0 },
      transactions: { type: Number, default: 40.0 },
      entities: { type: Number, default: 8.0 },
      pointsAdjust: { type: Number, default: 50.0 },
      envergure: { type: Number, default: 25.0 },
      language: { type: Number, default: 1 }
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for tenant-scoped lookups
taskSchema.index({ organization: 1, project: 1, status: 1 });
taskSchema.index({ organization: 1, assignee: 1 });

export const Task = mongoose.model('Task', taskSchema);
