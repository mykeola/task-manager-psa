import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true
    },
    plan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'enterprise'
    }
  },
  {
    timestamps: true
  }
);

export const Organization = mongoose.model('Organization', organizationSchema);
