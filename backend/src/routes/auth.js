import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import { sendVerificationEmail } from '../lib/email.js';
import { uploadResumePdf } from '../lib/s3.js';
import { formatUserForResponse } from '../lib/user.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      (file.originalname || '').toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return cb(new Error('Resume must be a PDF file.'));
    }
    return cb(null, true);
  }
});

function buildToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function generateVerificationCode() {
  return `${crypto.randomInt(0, 1000000)}`.padStart(6, '0');
}

function hashVerificationCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function getVerificationExpiry() {
  return new Date(Date.now() + 15 * 60 * 1000);
}

async function handleRegister(req, res) {
  const {
    name,
    email,
    password,
    role,
    skills,
    bio,
    resumeUrl,
    companyName,
    website,
    description
  } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required.' });
  }

  const normalizedRole = role.toUpperCase();

  if (!['STUDENT', 'COMPANY'].includes(normalizedRole)) {
    return res.status(400).json({ message: 'Role must be STUDENT or COMPANY.' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ message: 'Email already in use.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationCode = generateVerificationCode();
  const verificationExpiresAt = getVerificationExpiry();

  const userData = {
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: normalizedRole,
    isApproved: false,
    emailVerified: false,
    emailVerificationCodeHash: hashVerificationCode(verificationCode),
    emailVerificationExpiresAt: verificationExpiresAt
  };

  if (normalizedRole === 'STUDENT') {
    userData.studentProfile = {
      create: {
        skills: skills || '',
        bio: bio || '',
        resumeUrl: resumeUrl || null
      }
    };
  }

  if (normalizedRole === 'COMPANY') {
    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required.' });
    }

    userData.companyProfile = {
      create: {
        companyName,
        website: website || null,
        description: description || ''
      }
    };
  }

  let user = await prisma.user.create({
    data: userData,
    include: { studentProfile: true, companyProfile: true }
  });

  if (normalizedRole === 'STUDENT' && req.file) {
    const uploadedUrl = await uploadResumePdf({ userId: user.id, file: req.file });
    const updatedProfile = await prisma.studentProfile.update({
      where: { userId: user.id },
      data: { resumeUrl: uploadedUrl }
    });
    user = { ...user, studentProfile: updatedProfile };
  }

  await sendVerificationEmail({ to: user.email, code: verificationCode });

  const safeUser = await formatUserForResponse(user);
  return res.status(201).json({ user: safeUser, needsVerification: true });
}

router.post('/register', (req, res) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    return handleRegister(req, res);
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { studentProfile: true, companyProfile: true }
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (user.role === 'ADMIN') {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (adminEmail && user.email !== adminEmail) {
      return res.status(403).json({ message: 'Unauthorized admin account.' });
    }
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ message: 'Please verify your email before logging in.' });
  }

  if (!user.isApproved) {
    return res.status(403).json({ message: 'Your account is pending admin approval.' });
  }

  const token = buildToken(user);
  const safeUser = await formatUserForResponse(user);
  return res.json({ token, user: safeUser });
});

router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required.' });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { studentProfile: true, companyProfile: true }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (user.emailVerified) {
    const token = buildToken(user);
    const safeUser = await formatUserForResponse(user);
    return res.json({ token, user: safeUser, alreadyVerified: true });
  }

  if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
    return res.status(400).json({ message: 'Verification code not found.' });
  }

  if (user.emailVerificationExpiresAt < new Date()) {
    return res.status(400).json({ message: 'Verification code expired.' });
  }

  if (hashVerificationCode(code) !== user.emailVerificationCodeHash) {
    return res.status(400).json({ message: 'Invalid verification code.' });
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null
    },
    include: { studentProfile: true, companyProfile: true }
  });

  const safeUser = await formatUserForResponse(verifiedUser);
  if (!verifiedUser.isApproved) {
    return res.json({ user: safeUser, needsApproval: true });
  }

  const token = buildToken(verifiedUser);
  return res.json({ token, user: safeUser });
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.emailVerified) {
    return res.json({ message: 'If the account exists, a code was sent.' });
  }

  const verificationCode = generateVerificationCode();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCodeHash: hashVerificationCode(verificationCode),
      emailVerificationExpiresAt: getVerificationExpiry()
    }
  });

  await sendVerificationEmail({ to: user.email, code: verificationCode });
  return res.json({ message: 'Verification code sent.' });
});

export default router;
