import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { withTenantScope } from '../services/tenantQueryHelper.js';
import { mlServiceClient } from '../services/mlServiceClient.js';
import { logAuditEvent } from '../services/auditService.js';

export const getProjects = async (req, res, next) => {
  try {
    const filter = withTenantScope({}, req);
    const projects = await Project.find(filter)
      .populate('owner', 'name email')
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    // Enrich with task counts and progress
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const taskFilter = withTenantScope({ project: p._id }, req);
        const totalTasks = await Task.countDocuments(taskFilter);
        const completedTasks = await Task.countDocuments({ ...taskFilter, status: 'done' });
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return {
          ...p.toObject(),
          taskStats: {
            total: totalTasks,
            completed: completedTasks,
            progress
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const filter = withTenantScope({ _id: req.params.id }, req);
    const project = await Project.findOne(filter)
      .populate('owner', 'name email')
      .populate('team', 'name members');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied by tenant boundary.'
      });
    }

    const taskFilter = withTenantScope({ project: project._id }, req);
    const totalTasks = await Task.countDocuments(taskFilter);
    const completedTasks = await Task.countDocuments({ ...taskFilter, status: 'done' });
    const inProgressTasks = await Task.countDocuments({ ...taskFilter, status: 'in_progress' });
    const todoTasks = await Task.countDocuments({ ...taskFilter, status: 'todo' });

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        taskStats: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description, team, status, plannedDurationWeeks, deadline } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required.'
      });
    }

    let organization = req.user.organization || req.body.organization;
    if (organization && typeof organization === 'object') {
      organization = organization._id ? organization._id.toString() : organization.id;
    } else if (organization) {
      const match = String(organization).match(/[0-9a-fA-F]{24}/);
      if (match) organization = match[0];
    }

    const project = await Project.create({
      name,
      description,
      organization,
      owner: req.user.id,
      team: team || null,
      status: status || 'active',
      plannedDurationWeeks: plannedDurationWeeks ? Number(plannedDurationWeeks) : 6,
      deadline: deadline ? new Date(deadline) : null
    });

    await logAuditEvent({
      req,
      action: 'PROJECT_CREATED',
      targetType: 'Project',
      targetId: project._id,
      details: { name: project.name }
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const filter = withTenantScope({ _id: req.params.id }, req);
    const { name, description, team, status, plannedDurationWeeks, deadline } = req.body;

    const project = await Project.findOneAndUpdate(
      filter,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(team !== undefined && { team }),
        ...(status && { status }),
        ...(plannedDurationWeeks !== undefined && { plannedDurationWeeks: Number(plannedDurationWeeks) }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null })
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or cross-tenant access prohibited.'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const filter = withTenantScope({ _id: req.params.id }, req);
    const project = await Project.findOneAndDelete(filter);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or cross-tenant access prohibited.'
      });
    }

    // Delete associated tasks strictly within the tenant boundary
    await Task.deleteMany({ project: project._id, organization: project.organization });

    await logAuditEvent({
      req,
      action: 'PROJECT_DELETED',
      targetType: 'Project',
      targetId: project._id,
      details: { name: project.name }
    });

    res.status(200).json({
      success: true,
      message: 'Project and associated tasks successfully removed.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Monte Carlo Project Completion Forecast Endpoint
 * Aggregates this project's historical throughput and triggers the Python simulation engine.
 */
export const getProjectForecast = async (req, res, next) => {
  try {
    const filter = withTenantScope({ _id: req.params.id }, req);
    const project = await Project.findOne(filter);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied by tenant boundary.'
      });
    }

    // Count remaining incomplete tasks for this project
    const remainingTasks = await Task.countDocuments(
      withTenantScope({ project: project._id, status: { $ne: 'done' } }, req)
    );

    // Aggregate completed tasks grouped by completion week (historical throughput)
    // strictly within this organization's boundary
    const completedTasks = await Task.find(
      withTenantScope({ project: project._id, status: 'done' }, req)
    ).select('completedAt createdAt');

    // Group completions into weekly bins
    let throughput = [];
    if (completedTasks.length >= 3) {
      const weeklyBuckets = {};
      completedTasks.forEach((t) => {
        const date = t.completedAt || t.createdAt;
        const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate()) / 7)}`;
        weeklyBuckets[weekKey] = (weeklyBuckets[weekKey] || 0) + 1;
      });
      throughput = Object.values(weeklyBuckets);
    }

    // Baseline fallback throughput if project is new
    if (throughput.length === 0) {
      throughput = [3, 4, 5, 4, 6];
    }

    // Invoke Python ML microservice for Monte Carlo simulation
    const forecastResponse = await mlServiceClient.forecastProjectCompletion({
      remainingTasks: Math.max(1, remainingTasks),
      historicalThroughput: throughput,
      simulationRuns: 10000,
      startDate: new Date().toISOString().split('T')[0]
    });

    // Compute backlog story points and complexity for empirical schedule adherence prediction (China Model N=499)
    const remainingTaskDocs = await Task.find(
      withTenantScope({ project: project._id, status: { $ne: 'done' } }, req)
    ).select('storyPoints complexity');

    let totalStoryPoints = 0;
    let highComplexityCount = 0;
    remainingTaskDocs.forEach((t) => {
      totalStoryPoints += (t.storyPoints || 3);
      if (t.complexity === 'high') highComplexityCount++;
    });
    if (totalStoryPoints === 0) totalStoryPoints = Math.max(15, remainingTasks * 5);

    let plannedDurationWeeks = 6.0;
    const requestedWeeks = parseFloat(req.query.plannedWeeks);
    if (!isNaN(requestedWeeks) && requestedWeeks > 0) {
      plannedDurationWeeks = Number(requestedWeeks.toFixed(1));
    } else if (project.plannedDurationWeeks && project.plannedDurationWeeks > 0) {
      plannedDurationWeeks = Number(project.plannedDurationWeeks);
    } else if (project.deadline) {
      const msDiff = new Date(project.deadline).getTime() - Date.now();
      const weeks = msDiff / (1000 * 60 * 60 * 24 * 7);
      if (weeks > 0.5) plannedDurationWeeks = Number(weeks.toFixed(1));
    }

    const scheduleAdherenceResponse = await mlServiceClient.predictScheduleAdherence({
      plannedDurationWeeks,
      storyPoints: totalStoryPoints,
      teamSize: project.team ? 3 : 2,
      complexity: (highComplexityCount / Math.max(1, remainingTaskDocs.length)) > 0.4 ? 'high' : 'medium',
      developmentType: 'NewDev'
    });

    res.status(200).json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.name,
        officialPlannedWeeks: project.plannedDurationWeeks || 6.0,
        plannedDurationWeeks,
        deadline: project.deadline || null,
        remainingTasks: Math.max(1, remainingTasks),
        totalStoryPoints,
        throughputSample: throughput,
        forecast: forecastResponse.data,
        scheduleAdherence: scheduleAdherenceResponse.data
      }
    });
  } catch (error) {
    next(error);
  }
};
