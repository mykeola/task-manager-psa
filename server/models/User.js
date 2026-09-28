import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'manager', 'member'],
      default: 'member',
      index: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
      validate: {
        validator: function (v) {
          // Superadmin is platform-level and has no organization constraint
          if (this.role === 'superadmin') {
            return v === null || v === undefined;
          }
          // All other roles must belong to an organization
          return v !== null && v !== undefined;
        },
        message: 'Non-superadmin users must be associated with an organization'
      }
    },
    memberships: [
      {
        organization: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Organization',
          required: true
        },
        role: {
          type: String,
          enum: ['admin', 'manager', 'member'],
          default: 'member'
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
