import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roles = [
  { key: 'STUDENT', label: 'Student' },
  { key: 'COMPANY', label: 'Company' }
];

export default function Register() {
  const navigate = useNavigate();
  const { register, verifyEmail, resendVerification } = useAuth();
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationInfo, setVerificationInfo] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerInfo, setRegisterInfo] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    studentProfile: { skills: '', bio: '' },
    companyProfile: { companyName: '', website: '', description: '' }
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setRegisterError('');
    setRegisterInfo('');
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('email', form.email);
      payload.append('password', form.password);
      payload.append('role', role);

      if (role === 'STUDENT') {
        payload.append('skills', form.studentProfile.skills);
        payload.append('bio', form.studentProfile.bio);
        if (resumeFile) {
          payload.append('resume', resumeFile);
        }
      }

      if (role === 'COMPANY') {
        payload.append('companyName', form.companyProfile.companyName);
        payload.append('website', form.companyProfile.website);
        payload.append('description', form.companyProfile.description);
      }

      const response = await register(payload);
      if (response?.needsVerification) {
        setPendingVerification(true);
        setVerificationEmail(form.email);
        setRegisterInfo('Check your email for a verification code.');
        return;
      }
      setRegisterInfo('Account created!');
      if (response.user?.role === 'STUDENT') navigate('/student');
      if (response.user?.role === 'COMPANY') navigate('/company');
    } catch (error) {
      setRegisterError(error.response?.data?.message || 'Unable to register.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setVerificationError('');
    setVerificationInfo('');
    setVerificationLoading(true);
    try {
      const response = await verifyEmail({
        email: verificationEmail,
        code: verificationCode
      });
      if (response.needsApproval) {
        setVerificationInfo('Email verified. Your account is pending admin approval.');
        return;
      }
      setVerificationInfo('Email verified!');
      if (response.user?.role === 'STUDENT') navigate('/student');
      if (response.user?.role === 'COMPANY') navigate('/company');
    } catch (error) {
      setVerificationError(error.response?.data?.message || 'Invalid code.');
    } finally {
      setVerificationLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setVerificationInfo('');
    setVerificationError('');
    try {
      await resendVerification({ email: verificationEmail });
      setVerificationInfo('Verification code sent. Check your inbox or spam.');
    } catch (error) {
      setVerificationError(error.response?.data?.message || 'Unable to resend code.');
    } finally {
      setResendLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-2xl font-semibold text-white">Verify your email</h2>
          <p className="mt-2 text-sm text-slate-200">
            We sent a 6-digit code to <span className="text-white">{verificationEmail}</span>.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleVerify}>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-300">Verification code</label>
              <input
                className="input mt-2"
                required
                inputMode="numeric"
                value={verificationCode}
                onChange={(event) => {
                  setVerificationCode(event.target.value);
                  if (verificationError) setVerificationError('');
                }}
              />
            </div>
            <button className="btn-primary w-full" type="submit" disabled={verificationLoading}>
              {verificationLoading ? 'Verifying...' : 'Verify email'}
            </button>
            {verificationError && (
              <p className="mt-2 text-sm text-rose-200">{verificationError}</p>
            )}
            {verificationInfo && (
              <p className="mt-2 text-sm text-emerald-200">{verificationInfo}</p>
            )}
          </form>
          <button
            type="button"
            className="mt-4 w-full rounded-full border border-white/20 py-2 text-sm font-semibold text-white hover:border-white/40"
            onClick={handleResend}
            disabled={resendLoading}
          >
            {resendLoading ? 'Sending...' : 'Resend code'}
          </button>
          <p className="mt-6 text-sm text-slate-300">
            Need to change your email?{' '}
            <button
              type="button"
              onClick={() => setPendingVerification(false)}
              className="text-sky-300 hover:text-sky-200"
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="glass-card rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-white">Create your account</h2>
        <p className="mt-2 text-sm text-slate-200">Get started in just a few steps.</p>
        <div className="mt-6 flex gap-3">
          {roles.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRole(item.key)}
              className={`${role === item.key ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-200'} rounded-full px-4 py-2 text-xs font-semibold`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-300">Name</label>
              <input
                className="input mt-2"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-300">Email</label>
              <input
                className="input mt-2"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-300">Password</label>
            <input
              className="input mt-2"
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </div>

          {role === 'STUDENT' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-300">Skills</label>
                <input
                  className="input mt-2"
                  value={form.studentProfile.skills}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      studentProfile: { ...form.studentProfile, skills: event.target.value }
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-300">Bio</label>
                <textarea
                  className="input mt-2 min-h-[120px]"
                  value={form.studentProfile.bio}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      studentProfile: { ...form.studentProfile, bio: event.target.value }
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-300">Upload Resume (PDF)</label>
                <input
                  className="input mt-2"
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                />
                {resumeFile && (
                  <p className="mt-2 text-xs text-slate-300">Selected: {resumeFile.name}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-300">Company Name</label>
                <input
                  className="input mt-2"
                  required
                  value={form.companyProfile.companyName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      companyProfile: { ...form.companyProfile, companyName: event.target.value }
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-300">Website</label>
                <input
                  className="input mt-2"
                  type="url"
                  value={form.companyProfile.website}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      companyProfile: { ...form.companyProfile, website: event.target.value }
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-300">Description</label>
                <textarea
                  className="input mt-2 min-h-[120px]"
                  value={form.companyProfile.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      companyProfile: { ...form.companyProfile, description: event.target.value }
                    })
                  }
                />
              </div>
            </div>
          )}

          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
          {registerError && <p className="mt-2 text-sm text-rose-200">{registerError}</p>}
          {registerInfo && <p className="mt-2 text-sm text-emerald-200">{registerInfo}</p>}
        </form>
        <p className="mt-6 text-sm text-slate-300">
          Already have an account?{' '}
          <Link className="text-sky-300 hover:text-sky-200" to="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
