import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import type {
  IssueCategory,
  PortalSubmission,
  RemarkEntry,
  ServiceType,
  SubmissionStatus,
  UrgencyLevel,
} from './src/types/portal.ts';
import {
  ISSUE_CATEGORIES,
  PUROK_LIST,
  SERVICE_TYPES,
  SUBMISSION_STATUSES,
  computeSummaryStats,
  generateReferenceNumber,
  generateSummaryCsv,
  validateIssueReport,
  validateResidentRegistration,
  validateServiceRequest,
} from './src/utils/portalLogic.ts';
import {
  createPortalRepository,
  toPublicUser,
  type PublicUser,
} from './server/db.ts';
import {
  hashPassword,
  isSafePhotoAttachment,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from './server/security.ts';

interface AuthenticatedRequest extends Request {
  authUser?: PublicUser;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

const ENV_STAFF_EMAIL = (
  process.env.STAFF_ADMIN_EMAIL?.trim() || 'staff@barangaysanmiguel.ph'
).toLowerCase();
const ENV_STAFF_PASSWORD = process.env.STAFF_ADMIN_PASSWORD || '';

function safeEqualStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

type AsyncRouteHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

function asyncHandler(fn: AsyncRouteHandler) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function sanitizeSubmissionForPublic(item: PortalSubmission) {
  return {
    ...item,
    residentContact: 'Hidden for privacy',
  };
}

async function startServer() {
  const repo = await createPortalRepository();
  const app = express();

  app.use(express.json({ limit: '6mb' }));

  const attachAuth = asyncHandler(async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }
    const token = authHeader.slice(7).trim();
    const claims = verifySessionToken(token, SESSION_SECRET);
    if (!claims) {
      next();
      return;
    }

    if (claims.sub === 'env-staff-admin' && claims.role === 'staff' && ENV_STAFF_PASSWORD) {
      req.authUser = {
        id: 'env-staff-admin',
        role: 'staff',
        fullName: 'Barangay Staff Administrator',
        email: ENV_STAFF_EMAIL,
        purok: PUROK_LIST[0],
        address: 'Barangay San Miguel Hall',
        phone: '',
        officialTitle: 'Barangay Secretary',
      };
      next();
      return;
    }

    const user = await repo.getUserById(claims.sub);
    if (user && user.role === claims.role) {
      req.authUser = toPublicUser(user);
    }
    next();
  });

  const requireAuth = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }
    next();
  };

  const requireStaff = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Barangay staff sign-in required.' });
      return;
    }
    if (req.authUser.role !== 'staff') {
      res.status(403).json({
        error: 'Access restricted to authorized Barangay San Miguel staff.',
      });
      return;
    }
    next();
  };

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: repo.driverName });
  });

  // Public portal overview (masked contacts, aggregate KPIs + recent titles)
  app.get('/api/portal/overview', asyncHandler(async (_req, res) => {
    const all = await repo.listSubmissions();
    const stats = computeSummaryStats(all);
    const recent = all.slice(0, 6).map(sanitizeSubmissionForPublic);
    res.json({ stats, recent });
  }));

  // Current authenticated user
  app.get('/api/auth/me', attachAuth, (req: AuthenticatedRequest, res) => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Not signed in.' });
      return;
    }
    res.json({ user: req.authUser });
  });

  // Resident Registration
  app.post('/api/auth/resident/register', asyncHandler(async (req, res) => {
    const { fullName, purok, address, phone, email, password } = req.body ?? {};
    const validation = validateResidentRegistration({
      fullName: String(fullName ?? ''),
      purok: String(purok ?? ''),
      address: String(address ?? ''),
      phone: String(phone ?? ''),
      email: String(email ?? ''),
    });

    const errors = { ...validation.errors };
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    const rawPassword = String(password ?? '');

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Enter a valid email address for resident sign-in.';
    }
    if (rawPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: 'Please fix the highlighted fields.', errors });
      return;
    }

    const existing = await repo.getUserByEmail(cleanEmail);
    if (existing) {
      res.status(409).json({
        error: 'An account with this email already exists. Please sign in instead.',
      });
      return;
    }

    const created = await repo.createUser({
      id: `res-${crypto.randomUUID()}`,
      role: 'resident',
      fullName: String(fullName).trim(),
      email: cleanEmail,
      passwordHash: hashPassword(rawPassword),
      purok: String(purok).trim(),
      address: String(address).trim(),
      phone: String(phone).trim(),
      officialTitle: '',
      createdAt: new Date().toISOString(),
    });

    const token = signSessionToken(created.id, 'resident', SESSION_SECRET);
    res.status(201).json({ token, user: created });
  }));

  // Resident Login
  app.post('/api/auth/resident/login', asyncHandler(async (req, res) => {
    const cleanEmail = String(req.body?.email ?? '').trim().toLowerCase();
    const rawPassword = String(req.body?.password ?? '');

    if (!cleanEmail || !rawPassword) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await repo.getUserByEmail(cleanEmail);
    if (!user || user.role !== 'resident' || !verifyPassword(rawPassword, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid resident email or password.' });
      return;
    }

    const publicUser = toPublicUser(user);
    const token = signSessionToken(publicUser.id, 'resident', SESSION_SECRET);
    res.json({ token, user: publicUser });
  }));

  // Staff First-Run Status
  app.get('/api/auth/staff/status', asyncHandler(async (_req, res) => {
    const staffCount = await repo.countStaffUsers();
    const envAdminConfigured = ENV_STAFF_PASSWORD.length > 0;
    res.json({
      needsSetup: staffCount === 0 && !envAdminConfigured,
      envAdminConfigured,
      staffCount,
    });
  }));

  // One-time First-Run Staff Admin Claim
  app.post('/api/auth/staff/setup', asyncHandler(async (req, res) => {
    const staffCount = await repo.countStaffUsers();
    if (staffCount > 0 || ENV_STAFF_PASSWORD.length > 0) {
      res.status(403).json({
        error: 'Initial Barangay Staff setup is already completed. Please sign in.',
      });
      return;
    }

    const fullName = String(req.body?.fullName ?? '').trim();
    const officialTitle = String(req.body?.officialTitle ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    const errors: Record<string, string> = {};
    if (fullName.length < 3) errors.fullName = 'Enter the official full name.';
    if (officialTitle.length < 3) {
      errors.officialTitle = 'Enter official position (e.g., Barangay Secretary).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid official email address.';
    }
    if (password.length < 8) {
      errors.password = 'Staff password must be at least 8 characters.';
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: 'Please fix the highlighted fields.', errors });
      return;
    }

    const existing = await repo.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'This email is already registered.' });
      return;
    }

    const created = await repo.createUser({
      id: `staff-${crypto.randomUUID()}`,
      role: 'staff',
      fullName,
      email,
      passwordHash: hashPassword(password),
      purok: PUROK_LIST[0],
      address: 'Barangay San Miguel Hall',
      phone: '',
      officialTitle,
      createdAt: new Date().toISOString(),
    });

    const token = signSessionToken(created.id, 'staff', SESSION_SECRET);
    res.status(201).json({ token, user: created });
  }));

  // Staff Login
  app.post('/api/auth/staff/login', asyncHandler(async (req, res) => {
    const cleanEmail = String(req.body?.email ?? '').trim().toLowerCase();
    const rawPassword = String(req.body?.password ?? '');

    if (!cleanEmail || !rawPassword) {
      res.status(400).json({ error: 'Official email and password are required.' });
      return;
    }

    // Check configured env admin first if set (constant-time comparison)
    if (
      ENV_STAFF_PASSWORD &&
      cleanEmail === ENV_STAFF_EMAIL &&
      safeEqualStrings(rawPassword, ENV_STAFF_PASSWORD)
    ) {
      const envAdmin: PublicUser = {
        id: 'env-staff-admin',
        role: 'staff',
        fullName: 'Barangay Staff Administrator',
        email: ENV_STAFF_EMAIL,
        purok: PUROK_LIST[0],
        address: 'Barangay San Miguel Hall',
        phone: '',
        officialTitle: 'Barangay Secretary',
      };
      const token = signSessionToken(envAdmin.id, 'staff', SESSION_SECRET);
      res.json({ token, user: envAdmin });
      return;
    }

    const user = await repo.getUserByEmail(cleanEmail);
    if (!user || user.role !== 'staff' || !verifyPassword(rawPassword, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid barangay official email or password.' });
      return;
    }

    const publicUser = toPublicUser(user);
    const token = signSessionToken(publicUser.id, 'staff', SESSION_SECRET);
    res.json({ token, user: publicUser });
  }));

  // Public Reference Tracking (safe masked contact for unauthenticated callers)
  app.get('/api/submissions/track/:referenceNumber', attachAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
    const ref = String(req.params.referenceNumber || '').trim();
    if (!ref) {
      res.status(400).json({ error: 'Reference number is required.' });
      return;
    }

    const found = await repo.findSubmissionByReference(ref);
    if (!found) {
      res.status(404).json({ error: `No submission found for ${ref}.` });
      return;
    }

    const isOwnerOrStaff =
      req.authUser?.role === 'staff' || req.authUser?.id === found.residentId;

    res.json({
      submission: isOwnerOrStaff ? found : sanitizeSubmissionForPublic(found),
    });
  }));

  // Authenticated Resident/User Submissions List
  app.get('/api/submissions/mine', attachAuth, requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
    const items = await repo.listSubmissionsByResident(req.authUser!.id);
    res.json({ submissions: items });
  }));

  // Submit Issue Report or Service Request (Authenticated Resident or Staff)
  app.post('/api/submissions', attachAuth, requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const kind = req.body?.kind === 'service' ? 'service' : 'issue';
    const allExisting = await repo.listSubmissions();
    const now = new Date().toISOString();

    if (kind === 'issue') {
      const input = {
        title: String(req.body?.title ?? ''),
        category: String(req.body?.category ?? '') as IssueCategory | '',
        purok: String(req.body?.purok ?? ''),
        location: String(req.body?.location ?? ''),
        description: String(req.body?.description ?? ''),
        urgency: (['Low', 'Medium', 'High'].includes(String(req.body?.urgency))
          ? String(req.body?.urgency)
          : 'Medium') as UrgencyLevel,
        photoDataUrl: req.body?.photoDataUrl
          ? String(req.body.photoDataUrl)
          : undefined,
        photoName: req.body?.photoName ? String(req.body.photoName) : undefined,
      };

      const validation = validateIssueReport(input);
      if (!validation.valid || !ISSUE_CATEGORIES.includes(input.category as IssueCategory)) {
        res.status(400).json({
          error: 'Please check the issue report fields.',
          errors: validation.errors,
        });
        return;
      }

      if (!isSafePhotoAttachment(input.photoDataUrl)) {
        res.status(400).json({
          error: 'Unsupported photo format. Attach a JPG, PNG, or WebP image.',
        });
        return;
      }

      const referenceNumber = generateReferenceNumber(
        'issue',
        allExisting,
        new Date().getFullYear(),
      );
      const record: PortalSubmission = {
        id: `sub-${crypto.randomUUID()}`,
        referenceNumber,
        kind: 'issue',
        title: input.title.trim(),
        category: input.category as IssueCategory,
        purok: input.purok.trim(),
        location: input.location.trim(),
        description: input.description.trim(),
        urgency: input.urgency,
        photoDataUrl: input.photoDataUrl,
        photoName: input.photoName?.trim().slice(0, 180),
        residentId: user.id,
        residentName: user.fullName,
        residentContact: user.phone || user.email,
        status: 'Received',
        createdAt: now,
        updatedAt: now,
        remarks: [
          {
            id: `rem-${crypto.randomUUID()}`,
            timestamp: now,
            status: 'Received',
            authorName: 'Portal Intake',
            authorRole: 'Barangay Desk',
            note: input.photoDataUrl
              ? 'Issue report received with attached photo evidence and queued for barangay review.'
              : 'Issue report received and queued for barangay review.',
          },
        ],
      };

      const created = await repo.createSubmission(record);
      res.status(201).json({ submission: created });
      return;
    }

    // Service Request
    const svcInput = {
      serviceType: String(req.body?.serviceType ?? '') as ServiceType | '',
      purok: String(req.body?.purok ?? ''),
      location: String(req.body?.location ?? ''),
      purpose: String(req.body?.purpose ?? ''),
      preferredPickupDate: String(req.body?.preferredPickupDate ?? ''),
      notes: String(req.body?.notes ?? ''),
    };

    const validation = validateServiceRequest(svcInput);
    if (!validation.valid || !SERVICE_TYPES.includes(svcInput.serviceType as ServiceType)) {
      res.status(400).json({
        error: 'Please check the service request fields.',
        errors: validation.errors,
      });
      return;
    }

    const referenceNumber = generateReferenceNumber(
      'service',
      allExisting,
      new Date().getFullYear(),
    );
    const record: PortalSubmission = {
      id: `sub-${crypto.randomUUID()}`,
      referenceNumber,
      kind: 'service',
      title: `${svcInput.serviceType} — ${svcInput.purpose.trim()}`,
      category: svcInput.serviceType as ServiceType,
      purok: svcInput.purok.trim(),
      location: svcInput.location.trim(),
      description:
        svcInput.notes.trim() ||
        `Pickup request for ${svcInput.serviceType} (${svcInput.purpose.trim()}).`,
      purpose: svcInput.purpose.trim(),
      preferredPickupDate: svcInput.preferredPickupDate.trim(),
      residentId: user.id,
      residentName: user.fullName,
      residentContact: user.phone || user.email,
      status: 'Received',
      createdAt: now,
      updatedAt: now,
      remarks: [
        {
          id: `rem-${crypto.randomUUID()}`,
          timestamp: now,
          status: 'Received',
          authorName: 'Portal Intake',
          authorRole: 'Barangay Desk',
          note: 'Service request logged for Barangay Secretary verification.',
        },
      ],
    };

    const created = await repo.createSubmission(record);
    res.status(201).json({ submission: created });
  }));

  // Staff-only Queue
  app.get('/api/staff/submissions', attachAuth, requireStaff, asyncHandler(async (_req, res) => {
    const submissions = await repo.listSubmissions();
    res.json({ submissions });
  }));

  // Staff-only Status & Remarks Update
  app.patch(
    '/api/staff/submissions/:id/status',
    attachAuth,
    requireStaff,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const submissionId = String(req.params.id || '');
      const nextStatus = String(req.body?.status ?? '') as SubmissionStatus;
      const remarkNote = String(req.body?.remarkNote ?? '').trim();
      const photoDataUrl = req.body?.photoDataUrl
        ? String(req.body.photoDataUrl)
        : undefined;
      const photoName = req.body?.photoName
        ? String(req.body.photoName).trim().slice(0, 180)
        : undefined;

      if (!SUBMISSION_STATUSES.includes(nextStatus)) {
        res.status(400).json({ error: 'Invalid submission status.' });
        return;
      }

      if (!isSafePhotoAttachment(photoDataUrl)) {
        res.status(400).json({
          error: 'Unsupported photo format. Attach a JPG, PNG, or WebP image.',
        });
        return;
      }

      const staffUser = req.authUser!;
      const now = new Date().toISOString();
      const remark: RemarkEntry = {
        id: `rem-${crypto.randomUUID()}`,
        timestamp: now,
        status: nextStatus,
        authorName: staffUser.fullName,
        authorRole: staffUser.officialTitle || 'Barangay Staff',
        note:
          remarkNote.length > 0
            ? remarkNote
            : `Status updated to ${nextStatus} by ${staffUser.fullName}.`,
        photoDataUrl,
        photoName,
      };

      const updated = await repo.updateSubmissionStatus(
        submissionId,
        nextStatus,
        remark,
        now,
      );

      if (!updated) {
        res.status(404).json({ error: 'Submission record not found.' });
        return;
      }

      res.json({ submission: updated });
    }),
  );

  // Staff-only Summary Report
  app.get('/api/staff/summary', attachAuth, requireStaff, asyncHandler(async (_req, res) => {
    const submissions = await repo.listSubmissions();
    const stats = computeSummaryStats(submissions);
    res.json({ stats, submissions });
  }));

  // Staff-only CSV Export
  app.get('/api/staff/summary.csv', attachAuth, requireStaff, asyncHandler(async (_req, res) => {
    const submissions = await repo.listSubmissions();
    const csv = generateSummaryCsv(submissions);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="barangay-san-miguel-summary-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }));

  // Staff-only Official Directory & Create Additional Staff Account
  app.get('/api/staff/users', attachAuth, requireStaff, asyncHandler(async (_req, res) => {
    const users = await repo.listStaffUsers();
    res.json({ staffUsers: users });
  }));

  app.post('/api/staff/users', attachAuth, requireStaff, asyncHandler(async (req, res) => {
    const fullName = String(req.body?.fullName ?? '').trim();
    const officialTitle = String(req.body?.officialTitle ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (
      fullName.length < 3 ||
      officialTitle.length < 3 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8
    ) {
      res.status(400).json({
        error:
          'Provide valid full name, official title, email, and an 8+ character password.',
      });
      return;
    }

    const existing = await repo.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const created = await repo.createUser({
      id: `staff-${crypto.randomUUID()}`,
      role: 'staff',
      fullName,
      email,
      passwordHash: hashPassword(password),
      purok: PUROK_LIST[0],
      address: 'Barangay San Miguel Hall',
      phone: '',
      officialTitle,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ staffUser: created });
  }));

  // Staff-only Reset Sample Submissions
  app.post('/api/staff/reset-sample', attachAuth, requireStaff, asyncHandler(async (_req, res) => {
    const submissions = await repo.resetSampleSubmissions();
    res.json({ submissions });
  }));

  // Return clean JSON 404 for unknown /api routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Frontend Hosting: Vite middleware in dev, dist/ static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Production build not found.');
      }
    });
  }

  // Express global error handler (avoids leaking internal stack traces)
  app.use(
    (
      err: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      console.error('[api] Unhandled server error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error.' });
      }
    },
  );

  const port = Number.parseInt(process.env.PORT || '3000', 10) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Barangay San Miguel Portal server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
