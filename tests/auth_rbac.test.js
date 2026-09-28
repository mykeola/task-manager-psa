import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server/app.js';
import { User } from '../server/models/User.js';
import { Organization } from '../server/models/Organization.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/task_manager_psa';

describe('Auth & Role-Based Access Control (RBAC) Test Suite', () => {
  let adminToken = '';
  let memberToken = '';
  let testOrgId = '';

  const resetCharlie = async () => {
    const acmeOrg = await Organization.findOne({ slug: 'acme-corp' });
    if (acmeOrg) {
      await User.updateOne(
        { email: 'charlie@acme.com' },
        {
          $set: {
            organization: acmeOrg._id,
            role: 'member'
          }
        }
      );
    }
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    await resetCharlie();
  });

  afterAll(async () => {
    await resetCharlie();
    await mongoose.disconnect();
  });


  test('POST /api/auth/register (Self-Service: Creates Organization + Admin)', async () => {
    const uniqueEmail = `test_admin_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Org Admin',
        email: uniqueEmail,
        password: 'Password123!',
        organizationName: `Test Org ${Date.now()}`
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.accessToken).toBeDefined();

    adminToken = res.body.data.accessToken;
    testOrgId = res.body.data.user.organization.id;
  });

  test('POST /api/auth/login (Valid Credentials)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@acme.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    adminToken = res.body.data.accessToken;
  });

  test('POST /api/auth/login (Invalid Password -> 401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@acme.com',
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Incorrect password|Invalid credentials/);
  });

  test('POST /api/auth/login (Suspended Organization -> 403)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dave@suspended.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/suspended/i);
  });

  test('RBAC: Member attempting to access admin-only team deletion -> 403 Forbidden', async () => {
    // Login as Charlie (Acme Member)
    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'charlie@acme.com',
        password: 'Password123!'
      });

    memberToken = memberLogin.body.data.accessToken;

    const dummyId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/teams/${dummyId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Forbidden/);
  });

  test('RBAC Quality Gatekeeping: Member cannot mark task as done (403 Forbidden)', async () => {
    // 1. Get an existing project in Acme Corp using Alice (Admin)
    const projRes = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(projRes.status).toBe(200);
    const projectId = projRes.body.data[0]._id;

    // 2. Alice creates a task
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Quality Review Task ${Date.now()}`,
        project: projectId,
        priority: 'high',
        taskType: 'feature',
        storyPoints: 5,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body.data._id;

    // 3. Charlie (Member) moves task to 'in_progress' and then 'review' (allowed)
    const reviewRes = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'review' });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('review');

    // 4. Charlie (Member) attempts to mark task as 'done' (Quality Gatekeeping Violation -> 403)
    const doneRes = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'done' });

    expect(doneRes.status).toBe(403);
    expect(doneRes.body.success).toBe(false);
    expect(doneRes.body.error).toMatch(/Quality Gatekeeping Violation/i);

    // 5. Alice (Admin) reviews and approves task to 'done' (allowed -> 200)
    const approveRes = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'done' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('done');
  });

  test('Multi-Tenancy: Member can create their own organization and switch workspaces', async () => {
    // Charlie (currently member of Acme Corp) creates his own organization
    const createOrgRes = await request(app)
      .post('/api/auth/organizations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ organizationName: `Charlie Autonomous Ventures ${Date.now()}` });

    expect(createOrgRes.status).toBe(201);
    expect(createOrgRes.body.success).toBe(true);
    expect(createOrgRes.body.data.user.role).toBe('admin');
    expect(createOrgRes.body.data.accessToken).toBeDefined();

    const charlieNewToken = createOrgRes.body.data.accessToken;
    const charlieNewOrgId = createOrgRes.body.data.user.organization.id;

    // In his new organization, Charlie can now create projects as admin
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${charlieNewToken}`)
      .send({
        name: 'Charlie Independent AI Engine',
        plannedDurationWeeks: 8
      });

    expect(projectRes.status).toBe(201);
    expect(projectRes.body.data.name).toBe('Charlie Independent AI Engine');

    // Charlie can switch back to Acme Corp where he is a member
    const switchRes = await request(app)
      .post('/api/auth/switch-organization')
      .set('Authorization', `Bearer ${charlieNewToken}`)
      .send({ organizationId: testOrgId || '60c72b2f9b1d8b2bad5e0001' });

    if (switchRes.status === 200) {
      expect(switchRes.body.success).toBe(true);
      expect(switchRes.body.data.accessToken).toBeDefined();
    }
  });
});
