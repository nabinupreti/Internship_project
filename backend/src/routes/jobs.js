import express from 'express';
import prisma from '../lib/prisma.js';
import redis from '../lib/redis.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

function normalizeParam(value) {
  if (!value) return 'ALL';
  return encodeURIComponent(String(value).trim().toLowerCase());
}

function getJobsCacheKey({ type, location, search }) {
  return `jobs:${normalizeParam(type)}:${normalizeParam(location)}:${normalizeParam(search)}`;
}

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

async function getCompanyProfile(userId) {
  return prisma.companyProfile.findUnique({ where: { userId } });
}

async function getStudentProfile(userId) {
  return prisma.studentProfile.findUnique({ where: { userId } });
}

router.get('/', async (req, res) => {
  const { type, location, search, mine } = req.query;

  if (mine === 'true') {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const cacheKey = getJobsCacheKey({ type, location, search });

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('CACHE_HIT', cacheKey);
      return res.json({ jobs: JSON.parse(cached) });
    }
  } catch (error) {
    console.error('Cache read failed:', error.message);
  }

  console.log('CACHE_MISS', cacheKey);

  const filters = [{ isApproved: true }];
  if (type && ['JOB', 'INTERNSHIP'].includes(type)) {
    filters.push({ type });
  }
  if (location) {
    filters.push({ location: { contains: location, mode: 'insensitive' } });
  }
  if (search) {
    filters.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { companyName: { contains: search, mode: 'insensitive' } } }
      ]
    });
  }

  const jobs = await prisma.job.findMany({
    where: { AND: filters },
    include: {
      company: { select: { companyName: true, website: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  try {
    await redis.set(cacheKey, JSON.stringify(jobs), 'EX', 60);
  } catch (error) {
    console.error('Cache write failed:', error.message);
  }

  return res.json({ jobs });
});

router.get('/mine', authenticate, authorizeRoles('COMPANY'), async (req, res) => {
  const companyProfile = await getCompanyProfile(req.user.userId);
  if (!companyProfile) {
    return res.status(404).json({ message: 'Company profile not found.' });
  }

  const jobs = await prisma.job.findMany({
    where: { companyId: companyProfile.id },
    include: {
      _count: { select: { applications: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({ jobs });
});

router.get('/:id', async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      company: { select: { companyName: true, website: true, description: true } }
    }
  });

  if (!job) {
    return res.status(404).json({ message: 'Job not found.' });
  }

  if (!job.isApproved) {
    return res.status(404).json({ message: 'Job not available.' });
  }

  return res.json({ job });
});

router.post('/', authenticate, authorizeRoles('COMPANY'), async (req, res) => {
  const { title, type, location, salaryRange, description } = req.body || {};
  if (!title || !type || !location || !description) {
    return res.status(400).json({ message: 'Title, type, location, and description are required.' });
  }

  if (!['JOB', 'INTERNSHIP'].includes(type)) {
    return res.status(400).json({ message: 'Type must be JOB or INTERNSHIP.' });
  }

  const companyProfile = await getCompanyProfile(req.user.userId);
  if (!companyProfile) {
    return res.status(404).json({ message: 'Company profile not found.' });
  }

  const job = await prisma.job.create({
    data: {
      companyId: companyProfile.id,
      title,
      type,
      location,
      salaryRange: salaryRange || null,
      description,
      isApproved: true
    }
  });

  await invalidateJobsCache();
  return res.status(201).json({ job });
});

router.patch('/:id', authenticate, authorizeRoles('COMPANY', 'ADMIN'), async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) {
    return res.status(404).json({ message: 'Job not found.' });
  }

  if (req.user.role === 'COMPANY') {
    const companyProfile = await getCompanyProfile(req.user.userId);
    if (!companyProfile || job.companyId !== companyProfile.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
  }

  const { title, type, location, salaryRange, description, isApproved } = req.body || {};
  const updates = {};

  if (title) updates.title = title;
  if (type) updates.type = type;
  if (location) updates.location = location;
  if (typeof salaryRange !== 'undefined') updates.salaryRange = salaryRange || null;
  if (description) updates.description = description;
  if (req.user.role === 'ADMIN' && typeof isApproved === 'boolean') updates.isApproved = isApproved;

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: updates
  });

  await invalidateJobsCache();
  return res.json({ job: updated });
});

router.delete('/:id', authenticate, authorizeRoles('COMPANY', 'ADMIN'), async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) {
    return res.status(404).json({ message: 'Job not found.' });
  }

  if (req.user.role === 'COMPANY') {
    const companyProfile = await getCompanyProfile(req.user.userId);
    if (!companyProfile || job.companyId !== companyProfile.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
  }

  await prisma.application.deleteMany({ where: { jobId: job.id } });
  await prisma.job.delete({ where: { id: job.id } });
  await invalidateJobsCache();
  return res.json({ message: 'Job deleted.' });
});

router.post('/:id/apply', authenticate, authorizeRoles('STUDENT'), async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job || !job.isApproved) {
    return res.status(404).json({ message: 'Job not found.' });
  }

  const studentProfile = await getStudentProfile(req.user.userId);
  if (!studentProfile) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const existing = await prisma.application.findUnique({
    where: { jobId_studentId: { jobId: job.id, studentId: studentProfile.id } }
  });

  if (existing) {
    return res.status(409).json({ message: 'You already applied to this job.' });
  }

  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      studentId: studentProfile.id,
      coverLetter: req.body?.coverLetter || null
    }
  });

  return res.status(201).json({ application });
});

router.patch('/:id/approve', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  const job = await prisma.job.update({
    where: { id: req.params.id },
    data: { isApproved: true }
  });

  await invalidateJobsCache();
  return res.json({ job });
});

export default router;
