import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server/app.js';
import { Organization } from '../server/models/Organization.js';
import { Project } from '../server/models/Project.js';
import { Task } from '../server/models/Task.js';
import { AuditLog } from '../server/models/AuditLog.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/task_manager_psa';

describe('Cybersecurity & Multi-Tenant Data Isolation Test Suite', () => {
  let acmeAdminToken = '';
  let starkAdminToken = '';
  let superAdminToken = '';

  let acmeOrg = null;
  let starkOrg = null;
  let acmeTask = null;
  let starkTask = null;
  let starkProject = null;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    // 1. Authenticate Acme Admin (Org A)
    const acmeLogin = await request(app).post('/api/auth/login').send({
      email: 'alice@acme.com',
      password: 'Password123!'
    });
    acmeAdminToken = acmeLogin.body.data.accessToken;

    // 2. Authenticate Stark Admin (Org B)
    const starkLogin = await request(app).post('/api/auth/login').send({
      email: 'tony@stark.com',
      password: 'Password123!'
    });
    starkAdminToken = starkLogin.body.data.accessToken;

    // 3. Authenticate SuperAdmin (Platform Level)
    const superLogin = await request(app).post('/api/auth/login').send({
      email: 'superadmin@psa.io',
      password: 'AdminPassword123!'
    });
    superAdminToken = superLogin.body.data.accessToken;

    // Retrieve references from MongoDB
    acmeOrg = await Organization.findOne({ slug: 'acme-corp' });
    starkOrg = await Organization.findOne({ slug: 'stark-labs' });
    acmeTask = await Task.findOne({ organization: acmeOrg._id });
    starkTask = await Task.findOne({ organization: starkOrg._id });
    starkProject = await Project.findOne({ organization: starkOrg._id });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // -------------------------------------------------------------------------
  // TEST 1: Horizontal Privilege Escalation via IDOR (Cross-Tenant Read)
  // Invariant: Org A user attempting to read Org B task ID receives 404/403
  // -------------------------------------------------------------------------
  test('SECURITY INVARIANT 1: Org A admin cannot read Org B task via IDOR enumeration', async () => {
    expect(starkTask).toBeDefined();

    // Alice (Acme Corp) queries Tony Stark's task ID directly
    const res = await request(app)
      .get(`/api/tasks/${starkTask._id}`)
      .set('Authorization', `Bearer ${acmeAdminToken}`);

    // Must return 404 Not Found (or 403 Forbidden), never the sensitive task data
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeUndefined();
    expect(res.body.error).toMatch(/access denied|not found/i);
  });

  // -------------------------------------------------------------------------
  // TEST 2: Parameter Tampering & Spoofed Tenant Identifier (Write IDOR)
  // Invariant: Non-superadmin supplying foreign organizationId is rejected or overridden
  // -------------------------------------------------------------------------
  test('SECURITY INVARIANT 2: Org A admin cannot inject Org B organizationId in request body', async () => {
    expect(starkOrg).toBeDefined();

    // Alice (Acme Corp) attempts to create a project assigned to Stark Industries
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${acmeAdminToken}`)
      .send({
        name: 'Spoofed Cross-Tenant Project Attempt',
        description: 'Attempting to inject foreign organizationId',
        organizationId: starkOrg._id.toString() // Malicious injection
      });

    // The tenantScope middleware must detect the mismatch and reject with 403
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/cross-tenant IDOR access/i);
  });

  // -------------------------------------------------------------------------
  // TEST 3: Cross-Tenant Data Isolation on Collection Listing
  // Invariant: Org A list queries never return any records belonging to Org B
  // -------------------------------------------------------------------------
  test('SECURITY INVARIANT 3: GET /api/tasks returns strictly Org A tasks, zero Org B tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${acmeAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const tasks = res.body.data;
    expect(tasks.length).toBeGreaterThan(0);

    // Verify every single task belongs to Acme Corp and none belongs to Stark Industries
    tasks.forEach((task) => {
      expect(task.organization.toString()).toBe(acmeOrg._id.toString());
      expect(task.organization.toString()).not.toBe(starkOrg._id.toString());
    });
  });

  // -------------------------------------------------------------------------
  // TEST 4: Cross-Tenant Mutation & Deletion Protection
  // Invariant: Org A admin attempting to delete Org B project is rejected
  // -------------------------------------------------------------------------
  test('SECURITY INVARIANT 4: Org A admin cannot delete Org B project', async () => {
    expect(starkProject).toBeDefined();

    const res = await request(app)
      .delete(`/api/projects/${starkProject._id}`)
      .set('Authorization', `Bearer ${acmeAdminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);

    // Verify Stark project remains unharmed in database
    const verifyProject = await Project.findById(starkProject._id);
    expect(verifyProject).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // TEST 5: SuperAdmin Cross-Tenant Audit Logging
  // Invariant: Privileged SuperAdmin cross-tenant access creates permanent AuditLog
  // -------------------------------------------------------------------------
  test('SECURITY INVARIANT 5: SuperAdmin cross-tenant inspection is audit-logged to AuditLog', async () => {
    expect(starkOrg).toBeDefined();

    // SuperAdmin inspects Stark Industries data via organizationId query
    const res = await request(app)
      .get(`/api/projects?organizationId=${starkOrg._id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);

    // Allow async audit logger a brief moment to persist
    await new Promise((r) => setTimeout(r, 200));

    // Verify AuditLog contains the SUPERADMIN_TENANT_DRILLDOWN record
    const auditRecord = await AuditLog.findOne({
      action: 'SUPERADMIN_TENANT_DRILLDOWN',
      targetId: starkOrg._id.toString()
    });

    expect(auditRecord).not.toBeNull();
    expect(auditRecord.targetType).toBe('CrossTenantAccess');
    expect(auditRecord.ipAddress).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // TEST 6: NoSQL Injection Protection
  // Invariant: Malicious NoSQL operator keys ($gt, $ne) are sanitized
  // -------------------------------------------------------------------------
  test('SECURITY INVARIANT 6: NoSQL operator injection in request query/body is neutralized', async () => {
    const maliciousLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: { $gt: '' }, // NoSQL injection pattern
        password: 'Password123!'
      });

    // Should be rejected as bad request or failed auth, never bypass authentication
    expect(maliciousLogin.status).toBeGreaterThanOrEqual(400);
    expect(maliciousLogin.body.success).toBe(false);
  });
});
