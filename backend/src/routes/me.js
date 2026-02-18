import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { formatUserForResponse } from '../lib/user.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      studentProfile: true,
      companyProfile: true
    }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const safeUser = await formatUserForResponse(user);
  return res.json({ user: safeUser });
});

export default router;
