import { getSignedResumeUrl } from './s3.js';

function looksLikeUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

export async function formatUserForResponse(user) {
  if (!user) return null;

  let resumeUrl = user.studentProfile?.resumeUrl || null;
  if (resumeUrl && !looksLikeUrl(resumeUrl)) {
    const signed = await getSignedResumeUrl(resumeUrl);
    if (signed) {
      resumeUrl = signed;
    }
  }

  const {
    passwordHash,
    emailVerificationCodeHash,
    emailVerificationExpiresAt,
    ...safeUser
  } = user;

  if (safeUser.studentProfile) {
    safeUser.studentProfile = { ...safeUser.studentProfile, resumeUrl };
  }

  return safeUser;
}
