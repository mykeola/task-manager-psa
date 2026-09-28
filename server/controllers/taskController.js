import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { PredictionLog } from '../models/PredictionLog.js';
import { withTenantScope } from '../services/tenantQueryHelper.js';
import { mlServiceClient } from '../services/mlServiceClient.js';
import { logAuditEvent } from '../services/auditService.js';

export const getTasks = async (req, res, next) => {
  try {
    const { project, status, assignee, priority } = req.query;

    const baseQuery = {};
    if (project) baseQuery.project = project;
    if (status) baseQuery.status = status;
    if (assignee) baseQuery.assignee = assignee;
    if (priority) baseQuery.priority = priority;

    const filter = withTenantScope(baseQuery, req);
    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const filter = withTenantScope({ _id: req.params.id }, req);
    const task = await Task.findOne(filter)
      .populate('assignee', 'name email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or access denied by organization boundary.'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      project: projectId,
      assignee,
      priority,
      taskType,
      storyPoints = 3,
      dueDate,
      mlFeatures
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        error: 'Task title and project identifier are required.'
      });
    }

    let organization = req.user.organization || req.body.organization;
    if (organization && typeof organization === 'object') {
      organization = organization._id ? organization._id.toString() : organization.id;
    } else if (organization) {
      const match = String(organization).match(/[0-9a-fA-F]{24}/);
      if (match) organization = match[0];
    }

    // Boundary Check: Ensure project belongs to the same organization
    const projectFilter = withTenantScope({ _id: projectId }, req);
    const project = await Project.findOne(projectFilter);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Specified project does not exist within your organization.'
      });
    }

    // Call Python ML Microservice to estimate duration
    const featurePayload = {
      teamExp: mlFeatures?.teamExp ?? 2.5,
      managerExp: mlFeatures?.managerExp ?? 3.0,
      transactions: mlFeatures?.transactions ?? storyPoints * 12.0,
      entities: mlFeatures?.entities ?? Math.max(2.0, storyPoints * 2.0),
      pointsAdjust: mlFeatures?.pointsAdjust ?? storyPoints * 10.0,
      envergure: mlFeatures?.envergure ?? 25.0,
      language: mlFeatures?.language ?? 1
    };

    const mlResult = await mlServiceClient.predictTaskDuration(featurePayload);
    const predictedDuration = mlResult.data.predicted_duration_hours;
    const confidenceRange = mlResult.data.confidence_range_hours;

    // Create the task with denormalized organization reference
    const task = await Task.create({
      title,
      description,
      organization,
      project: projectId,
      assignee: assignee || null,
      priority: priority || 'medium',
      taskType: taskType || 'feature',
      storyPoints,
      estimatedDuration: predictedDuration,
      predictionConfidence: {
        minHours: confidenceRange?.min_hours || Math.round(predictedDuration * 0.7),
        maxHours: confidenceRange?.max_hours || Math.round(predictedDuration * 1.3)
      },
      mlFeatures: featurePayload,
      dueDate: dueDate || null
    });

    // Record inference audit in PredictionLog
    await PredictionLog.create({
      organization,
      task: task._id,
      predictedValue: predictedDuration,
      modelVersion: mlResult.data.model_version || '1.0.0-desharnais',
      inputFeatures: featurePayload,
      confidenceRange: confidenceRange || {}
    });

    await logAuditEvent({
      req,
      action: 'TASK_CREATED',
      targetType: 'Task',
      targetId: task._id,
      details: { title: task.title, estimatedDuration: predictedDuration }
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('project', 'name');

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const filter = withTenantScope({ _id: req.params.id }, req);
    const updates = { ...req.body };
    delete updates.organization; // Protect tenant key from being modified

    // Quality Gatekeeping: Members cannot mark tasks as completed/done
    if (updates.status === 'done' && req.user.role === 'member') {
      return res.status(403).json({
        success: false,
        error: 'Quality Gatekeeping Violation: Only a project manager or organization admin can review and approve a task to completed status.'
      });
    }

    const task = await Task.findOneAndUpdate(
      filter,
      updates,
      { new: true, runValidators: true }
    )
      .populate('assignee', 'name email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found in your organization.'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, actualDuration } = req.body;
    if (!['backlog', 'todo', 'in_progress', 'review', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value. Must be 'backlog', 'todo', 'in_progress', 'review', or 'done'."
      });
    }

    // Quality Gatekeeping: Members can request review but cannot mark tasks as done
    if (status === 'done' && req.user.role === 'member') {
      return res.status(403).json({
        success: false,
        error: 'Quality Gatekeeping Violation: Only a project manager or organization admin can review and approve a task to completed status.'
      });
    }

    const filter = withTenantScope({ _id: req.params.id }, req);
    const existingTask = await Task.findOne(filter);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found in your organization.'
      });
    }

    const updates = { status };
    if (status === 'in_progress' && !existingTask.startedAt) {
      updates.startedAt = new Date();
    }
    if (status === 'done' && !existingTask.completedAt) {
      updates.completedAt = new Date();
      if (actualDuration !== undefined) {
        updates.actualDuration = Number(actualDuration);
      } else if (!existingTask.actualDuration) {
        // Fallback realistic actual duration if not provided by user
        updates.actualDuration = existingTask.estimatedDuration || 8.0;
      }
    }

    const updatedTask = await Task.findOneAndUpdate(filter, updates, { new: true })
      .populate('assignee', 'name email')
      .populate('project', 'name');

    res.status(200).json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const filter = withTenantScope({ _id: req.params.id }, req);
    const task = await Task.findOneAndDelete(filter);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found in your organization.'
      });
    }

    await logAuditEvent({
      req,
      action: 'TASK_DELETED',
      targetType: 'Task',
      targetId: task._id,
      details: { title: task.title }
    });

    res.status(200).json({
      success: true,
      message: 'Task successfully deleted.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Predict Preview Endpoint
 * Queries the Python ML microservice without persisting the task.
 * Used by frontend interactive task forms to display live duration estimations.
 */
export const predictPreview = async (req, res, next) => {
  try {
    const { storyPoints = 3, mlFeatures } = req.body;

    const featurePayload = {
      teamExp: mlFeatures?.teamExp ?? 2.5,
      managerExp: mlFeatures?.managerExp ?? 3.0,
      transactions: mlFeatures?.transactions ?? storyPoints * 12.0,
      entities: mlFeatures?.entities ?? Math.max(2.0, storyPoints * 2.0),
      pointsAdjust: mlFeatures?.pointsAdjust ?? storyPoints * 10.0,
      envergure: mlFeatures?.envergure ?? 25.0,
      language: mlFeatures?.language ?? 1
    };

    const mlResult = await mlServiceClient.predictTaskDuration(featurePayload);
    res.status(200).json({
      success: true,
      data: mlResult.data
    });
  } catch (error) {
    next(error);
  }
};
