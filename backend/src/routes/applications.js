import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/company/applications', authenticate, authorizeRoles('COMPANY'), async (req, res) => {
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: req.user.userId }
  });

  if (!companyProfile) {
    return res.status(404).json({ message: 'Company profile not found.' });
  }

  const applications = await prisma.application.findMany({
    where: { job: { companyId: companyProfile.id } },
    include: {
      job: { select: { id: true, title: true, type: true, location: true } },
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({ applications });
});

router.get('/student/applications', authenticate, authorizeRoles('STUDENT'), async (req, res) => {
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: req.user.userId }
  });

  if (!studentProfile) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const applications = await prisma.application.findMany({
    where: { studentId: studentProfile.id },
    include: {
      job: {
        include: {
          company: { select: { companyName: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({ applications });
});

export default router;
