import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { PredictionLog } from '../models/PredictionLog.js';
import { AuditLog } from '../models/AuditLog.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/task_manager_psa';

export const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Seeder] Connected to MongoDB.');

    // Clear existing collections
    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      Team.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      PredictionLog.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
    console.log('[Seeder] Cleared old collections.');

    // 1. Create SuperAdmin
    const superAdmin = await User.create({
      name: 'Platform SuperAdmin',
      email: 'superadmin@psa.io',
      password: 'AdminPassword123!',
      role: 'superadmin',
      organization: null
    });
    console.log('[Seeder] Created SuperAdmin:', superAdmin.email);

    // 2. Create Organization A: Acme Corp
    const acmeOrg = await Organization.create({
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'enterprise',
      status: 'active'
    });

    const acmeAdmin = await User.create({
      name: 'Alice Vance (Admin)',
      email: 'alice@acme.com',
      password: 'Password123!',
      role: 'admin',
      organization: acmeOrg._id
    });

    const acmeManager = await User.create({
      name: 'Bob Miller (Manager)',
      email: 'bob@acme.com',
      password: 'Password123!',
      role: 'manager',
      organization: acmeOrg._id
    });

    const acmeMember = await User.create({
      name: 'Charlie Brown (Engineer)',
      email: 'charlie@acme.com',
      password: 'Password123!',
      role: 'member',
      organization: acmeOrg._id
    });

    const acmeTeam = await Team.create({
      name: 'Core Engineering',
      organization: acmeOrg._id,
      members: [acmeAdmin._id, acmeManager._id, acmeMember._id]
    });

    const acmeProject1 = await Project.create({
      name: 'Payment Gateway Integration',
      description: 'Stripe, PayPal, and multi-currency enterprise billing system',
      organization: acmeOrg._id,
      owner: acmeAdmin._id,
      team: acmeTeam._id,
      status: 'active'
    });

    const acmeProject2 = await Project.create({
      name: 'Cloud Microservices Migration',
      description: 'Containerize monolithic APIs and migrate to Kubernetes cluster',
      organization: acmeOrg._id,
      owner: acmeManager._id,
      team: acmeTeam._id,
      status: 'active'
    });

    // Create Tasks for Acme Project 1
    const acmeTasks = [
      {
        title: 'Design Stripe webhook idempotency handler',
        description: 'Ensure double-spend protection with distributed Redis lock',
        organization: acmeOrg._id,
        project: acmeProject1._id,
        assignee: acmeMember._id,
        status: 'done',
        priority: 'high',
        taskType: 'feature',
        storyPoints: 5,
        estimatedDuration: 18.5,
        actualDuration: 16.0,
        predictionConfidence: { minHours: 13.0, maxHours: 24.0 },
        startedAt: new Date(Date.now() - 14 * 86400000),
        completedAt: new Date(Date.now() - 12 * 86400000)
      },
      {
        title: 'Implement OAuth2 token refresh rotation',
        description: 'Cryptographic refresh token rotation with family revocation',
        organization: acmeOrg._id,
        project: acmeProject1._id,
        assignee: acmeAdmin._id,
        status: 'done',
        priority: 'critical',
        taskType: 'feature',
        storyPoints: 8,
        estimatedDuration: 28.0,
        actualDuration: 30.0,
        predictionConfidence: { minHours: 20.0, maxHours: 36.0 },
        startedAt: new Date(Date.now() - 10 * 86400000),
        completedAt: new Date(Date.now() - 7 * 86400000)
      },
      {
        title: 'Automate weekly invoice reconciliation job',
        description: 'Cron scheduler matching ledger entries against bank API',
        organization: acmeOrg._id,
        project: acmeProject1._id,
        assignee: acmeMember._id,
        status: 'done',
        priority: 'medium',
        taskType: 'feature',
        storyPoints: 3,
        estimatedDuration: 11.2,
        actualDuration: 12.0,
        predictionConfidence: { minHours: 8.0, maxHours: 15.0 },
        startedAt: new Date(Date.now() - 6 * 86400000),
        completedAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        title: 'Add PayPal Checkout multi-currency support',
        description: 'Dynamic currency conversion for EUR, GBP, and JPY checkout',
        organization: acmeOrg._id,
        project: acmeProject1._id,
        assignee: acmeMember._id,
        status: 'in_progress',
        priority: 'high',
        taskType: 'feature',
        storyPoints: 5,
        estimatedDuration: 19.4,
        predictionConfidence: { minHours: 13.5, maxHours: 25.2 },
        startedAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        title: 'Perform PCI-DSS security compliance review',
        description: 'Audit cardholder data environment against PCI SAQ-D controls',
        organization: acmeOrg._id,
        project: acmeProject1._id,
        assignee: acmeAdmin._id,
        status: 'review',
        priority: 'critical',
        taskType: 'documentation',
        storyPoints: 5,
        estimatedDuration: 15.0,
        predictionConfidence: { minHours: 10.5, maxHours: 19.5 },
        startedAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        title: 'Set up Prometheus alerting for failed transactions',
        description: 'Alert on Slack if webhook failure rate exceeds 2% in 5m',
        organization: acmeOrg._id,
        project: acmeProject1._id,
        assignee: null,
        status: 'todo',
        priority: 'medium',
        taskType: 'refactor',
        storyPoints: 3,
        estimatedDuration: 10.5,
        predictionConfidence: { minHours: 7.3, maxHours: 13.6 }
      },
      {
        title: 'Write automated Supertest integration tests',
        description: 'End-to-end API coverage for subscription lifecycle',
        organization: acmeOrg._id,
        project: acmeProject1._id,
        assignee: null,
        status: 'backlog',
        priority: 'low',
        taskType: 'bug',
        storyPoints: 2,
        estimatedDuration: 7.2,
        predictionConfidence: { minHours: 5.0, maxHours: 9.4 }
      }
    ];

    for (const t of acmeTasks) {
      const created = await Task.create(t);
      await PredictionLog.create({
        organization: acmeOrg._id,
        task: created._id,
        predictedValue: t.estimatedDuration,
        modelVersion: '1.0.0-desharnais',
        inputFeatures: { storyPoints: t.storyPoints },
        confidenceRange: t.predictionConfidence
      });
    }
    console.log(`[Seeder] Created Acme Corp with ${acmeTasks.length} tasks.`);

    // 3. Create Organization B: Stark Labs (Cross-Tenant Isolation Test Target)
    const starkOrg = await Organization.create({
      name: 'Stark Industries',
      slug: 'stark-labs',
      plan: 'enterprise',
      status: 'active'
    });

    const starkAdmin = await User.create({
      name: 'Tony Stark (Admin)',
      email: 'tony@stark.com',
      password: 'Password123!',
      role: 'admin',
      organization: starkOrg._id
    });

    const starkMember = await User.create({
      name: 'Peter Parker (Engineer)',
      email: 'peter@stark.com',
      password: 'Password123!',
      role: 'member',
      organization: starkOrg._id
    });

    const starkProject = await Project.create({
      name: 'Arc Reactor Clean Energy Grid',
      description: 'High-density palladium-free energy distribution network',
      organization: starkOrg._id,
      owner: starkAdmin._id,
      status: 'active'
    });

    const starkTask = await Task.create({
      title: 'Calibrate quantum harmonic output',
      description: 'Confidential research item belonging strictly to Stark Labs',
      organization: starkOrg._id,
      project: starkProject._id,
      assignee: starkMember._id,
      status: 'todo',
      priority: 'critical',
      taskType: 'feature',
      storyPoints: 8,
      estimatedDuration: 32.0,
      predictionConfidence: { minHours: 22.4, maxHours: 41.6 }
    });
    console.log('[Seeder] Created Stark Industries with isolated task:', starkTask._id.toString());

    // 4. Create Suspended Organization (For Negative Verification)
    const suspendedOrg = await Organization.create({
      name: 'Suspended Dynamics',
      slug: 'suspended-corp',
      plan: 'starter',
      status: 'suspended'
    });

    await User.create({
      name: 'Dave Suspended',
      email: 'dave@suspended.com',
      password: 'Password123!',
      role: 'admin',
      organization: suspendedOrg._id
    });
    console.log('[Seeder] Created Suspended Organization.');

    console.log('\n======================================================');
    console.log('             DATABASE SEEDING COMPLETE               ');
    console.log('======================================================');
    console.log('Credentials Summary:');
    console.log('1. SuperAdmin:  superadmin@psa.io  / AdminPassword123!');
    console.log('2. Acme Admin:  alice@acme.com     / Password123!');
    console.log('3. Acme Member: charlie@acme.com   / Password123!');
    console.log('4. Stark Admin: tony@stark.com     / Password123!');
    console.log('5. Suspended:   dave@suspended.com / Password123!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('[Seeder Error]', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

// Direct script execution
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
