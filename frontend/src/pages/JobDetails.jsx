import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { notify } = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function fetchJob() {
      setLoading(true);
      try {
        const response = await api.get(`/api/jobs/${id}`);
        setJob(response.data.job);
      } catch (error) {
        notify('Unable to load job details.', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [id, notify]);

  async function handleApply() {
    if (!user) {
      notify('Please login to apply.', 'error');
      return;
    }
    setApplying(true);
    try {
      await api.post(`/api/jobs/${id}/apply`, { coverLetter });
      notify('Application submitted!', 'success');
      setCoverLetter('');
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to apply.', 'error');
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-200">Loading...</div>;
  }

  if (!job) {
    return <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-200">Job not found.</div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="glass-card rounded-3xl p-8">
        <div className="flex items-center justify-between">
          <span className="badge">{job.type}</span>
          <span className="text-xs text-slate-300">{job.location}</span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-white">{job.title}</h2>
        <p className="mt-2 text-sm text-slate-300">{job.company?.companyName}</p>
        <p className="mt-6 text-sm text-slate-200">{job.description}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
          <span>{job.salaryRange || 'Salary negotiable'}</span>
          {job.company?.website && (
            <a
              className="text-sky-300"
              href={job.company.website}
              target="_blank"
              rel="noreferrer"
            >
              Company website
            </a>
          )}
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-white">Apply now</h3>
        <p className="mt-2 text-sm text-slate-200">Share a quick note for the hiring team.</p>
        <textarea
          className="input mt-4 min-h-[140px]"
          value={coverLetter}
          onChange={(event) => setCoverLetter(event.target.value)}
          placeholder="Tell us why you're a great fit..."
        />
        <button
          className="btn-primary mt-4 w-full"
          disabled={applying || user?.role !== 'STUDENT'}
          onClick={handleApply}
        >
          {user?.role === 'STUDENT' ? (applying ? 'Submitting...' : 'Apply') : 'Login as student to apply'}
        </button>
      </div>
    </div>
  );
}
