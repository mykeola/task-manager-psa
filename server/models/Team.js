import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [80, 'Team name cannot exceed 80 characters']
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Team must be associated with an organization'],
      index: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate team names inside the same tenant
teamSchema.index({ organization: 1, name: 1 }, { unique: true });

export const Team = mongoose.model('Team', teamSchema);
