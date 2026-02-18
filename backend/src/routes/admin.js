import express from 'express';
import prisma from '../lib/prisma.js';
import redis from '../lib/redis.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { formatUserForResponse } from '../lib/user.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.use(authenticate, authorizeRoles('ADMIN'));

async function invalidateJobsCache() {
  try {
    let cursor = '0';
    const keysToDelete = [];
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'jobs:*', 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length) keysToDelete.push(...keys);
    } while (cursor !== '0');

    if (keysToDelete.length) {
      await redis.del(keysToDelete);
    }
  } catch (error) {
    console.error('Cache invalidation failed:', error.message);
  }
}

router.get('/overview', async (req, res) => {
  const [users, jobs, applications, pendingJobs, pendingUsers] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.job.count({ where: { isApproved: false } }),
    prisma.user.count({ where: { isApproved: false } })
  ]);

  return res.json({ stats: { users, jobs, applications, pendingJobs, pendingUsers } });
});

router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    include: { studentProfile: true, companyProfile: true },
    orderBy: { createdAt: 'desc' }
  });

  const safeUsers = await Promise.all(users.map((user) => formatUserForResponse(user)));
  return res.json({ users: safeUsers });
});

router.patch('/users/:id', async (req, res) => {
  const { role, isApproved, emailVerified, password } = req.body || {};

  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { studentProfile: true, companyProfile: true }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (user.role === 'ADMIN' && adminEmail && user.email === adminEmail) {
    if (role && role !== 'ADMIN') {
      return res.status(403).json({ message: 'Cannot change role of primary admin.' });
    }
    if (typeof isApproved === 'boolean' && !isApproved) {
      return res.status(403).json({ message: 'Cannot disable the primary admin.' });
    }
  }

  const updates = {};

  if (typeof isApproved === 'boolean') {
    updates.isApproved = isApproved;
  }

  if (typeof emailVerified === 'boolean') {
    updates.emailVerified = emailVerified;
    if (emailVerified) {
      updates.emailVerificationCodeHash = null;
      updates.emailVerificationExpiresAt = null;
    }
  }

  if (password) {
    updates.passwordHash = await bcrypt.hash(password, 10);
  }

  if (role) {
    const normalizedRole = String(role).toUpperCase();
    if (!['STUDENT', 'COMPANY', 'ADMIN'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    if (normalizedRole === 'ADMIN') {
      if (!adminEmail || user.email !== adminEmail) {
        return res.status(403).json({ message: 'Admin role is restricted to ADMIN_EMAIL.' });
      }
    }

    if (normalizedRole === 'STUDENT') {
      if (user.companyProfile) {
        return res.status(400).json({ message: 'Remove company profile before changing to STUDENT.' });
      }
      if (!user.studentProfile) {
        await prisma.studentProfile.create({
          data: { userId: user.id, skills: '', bio: '', resumeUrl: null }
        });
      }
    }

    if (normalizedRole === 'COMPANY') {
      if (user.studentProfile) {
        return res.status(400).json({ message: 'Remove student profile before changing to COMPANY.' });
      }
      if (!user.companyProfile) {
        await prisma.companyProfile.create({
          data: { userId: user.id, companyName: 'New Company', website: null, description: '' }
        });
      }
    }

    updates.role = normalizedRole;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updates,
    include: { studentProfile: true, companyProfile: true }
  });

  const safeUser = await formatUserForResponse(updated);
  return res.json({ user: safeUser });
});

router.delete('/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { studentProfile: true, companyProfile: true }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (user.role === 'ADMIN' && adminEmail && user.email === adminEmail) {
    return res.status(403).json({ message: 'Cannot delete the primary admin account.' });
  }

  if (user.studentProfile) {
    await prisma.application.deleteMany({ where: { studentId: user.studentProfile.id } });
    await prisma.studentProfile.delete({ where: { id: user.studentProfile.id } });
  }

  if (user.companyProfile) {
    await prisma.application.deleteMany({
      where: { job: { companyId: user.companyProfile.id } }
    });
    await prisma.job.deleteMany({ where: { companyId: user.companyProfile.id } });
    await prisma.companyProfile.delete({ where: { id: user.companyProfile.id } });
  }

  await prisma.user.delete({ where: { id: user.id } });
  return res.json({ message: 'User deleted.' });
});

router.get('/jobs', async (req, res) => {
  const jobs = await prisma.job.findMany({
    include: {
      company: { select: { companyName: true, website: true } },
      _count: { select: { applications: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({ jobs });
});

router.patch('/jobs/:id', async (req, res) => {
  const { isApproved } = req.body || {};
  if (typeof isApproved !== 'boolean') {
    return res.status(400).json({ message: 'isApproved must be boolean.' });
  }

  const job = await prisma.job.update({
    where: { id: req.params.id },
    data: { isApproved }
  });

  await invalidateJobsCache();
  return res.json({ job });
});

router.delete('/jobs/:id', async (req, res) => {
  await prisma.application.deleteMany({ where: { jobId: req.params.id } });
  await prisma.job.delete({ where: { id: req.params.id } });
  await invalidateJobsCache();
  return res.json({ message: 'Job deleted.' });
});

router.get('/applications', async (req, res) => {
  const applications = await prisma.application.findMany({
    include: {
      job: { include: { company: { select: { companyName: true } } } },
      student: { include: { user: { select: { id: true, name: true, email: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({ applications });
});

export default router;
