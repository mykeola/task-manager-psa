import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [120, 'Project name cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Project must belong to an organization'],
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
      index: true
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed'],
      default: 'active',
      index: true
    },
    plannedDurationWeeks: {
      type: Number,
      default: 6,
      min: [1, 'Planned schedule must be at least 1 week'],
      max: [104, 'Planned schedule cannot exceed 104 weeks (2 years)']
    },
    deadline: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for unique project names within the tenant
projectSchema.index({ organization: 1, name: 1 }, { unique: true });

export const Project = mongoose.model('Project', projectSchema);
