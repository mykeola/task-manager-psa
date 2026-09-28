import mongoose from 'mongoose';

const predictionLogSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    predictedValue: {
      type: Number,
      required: true
    },
    modelVersion: {
      type: String,
      required: true
    },
    inputFeatures: {
      type: Object,
      required: true
    },
    confidenceRange: {
      minHours: Number,
      maxHours: Number
    }
  },
  {
    timestamps: true
  }
);

predictionLogSchema.index({ organization: 1, createdAt: -1 });

export const PredictionLog = mongoose.model('PredictionLog', predictionLogSchema);
