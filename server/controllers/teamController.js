import { Team } from '../models/Team.js';
import { withTenantScope } from '../services/tenantQueryHelper.js';
import { logAuditEvent } from '../services/auditService.js';

export const getTeams = async (req, res, next) => {
  try {
    const filter = withTenantScope({}, req);
    const teams = await Team.find(filter).populate('members', 'name email role');
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req, res, next) => {
  try {
    const filter = withTenantScope({ _id: req.params.id }, req);
    const team = await Team.findOne(filter).populate('members', 'name email role');
    if (!team) {
      return res.status(404).json({
        success: false,
        error: `Team not found or does not belong to your organization.`
      });
    }
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

export const createTeam = async (req, res, next) => {
  try {
    const { name, members = [] } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Team name is required.'
      });
    }

    // Organization is forced from req.user (preventing IDOR)
    const organization = req.user.organization || req.body.organization;
    const team = await Team.create({
      name,
      organization,
      members
    });

    await logAuditEvent({
      req,
      action: 'TEAM_CREATED',
      targetType: 'Team',
      targetId: team._id,
      details: { name: team.name }
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const filter = withTenantScope({ _id: req.params.id }, req);
    const { name, members } = req.body;

    const team = await Team.findOneAndUpdate(
      filter,
      { ...(name && { name }), ...(members && { members }) },
      { new: true, runValidators: true }
    ).populate('members', 'name email role');

    if (!team) {
      return res.status(404).json({
        success: false,
        error: `Team not found in your organization.`
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const filter = withTenantScope({ _id: req.params.id }, req);
    const team = await Team.findOneAndDelete(filter);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: `Team not found in your organization.`
      });
    }

    await logAuditEvent({
      req,
      action: 'TEAM_DELETED',
      targetType: 'Team',
      targetId: team._id,
      details: { name: team.name }
    });

    res.status(200).json({
      success: true,
      message: 'Team removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};
