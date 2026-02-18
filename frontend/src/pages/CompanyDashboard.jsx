import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

const tabs = ['Post Job', 'My Jobs', 'Applicants'];

export default function CompanyDashboard() {
  const { notify } = useToast();
  const [activeTab, setActiveTab] = useState('Post Job');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    type: 'JOB',
    location: '',
    salaryRange: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.get('/api/jobs/mine'),
        api.get('/api/company/applications')
      ]);
      setJobs(jobsRes.data.jobs);
      setApplications(appsRes.data.applications);
    } catch (error) {
      notify('Unable to load company data.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handlePostJob(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/jobs', form);
      notify('Job posted successfully!', 'success');
      setForm({ title: '', type: 'JOB', location: '', salaryRange: '', description: '' });
      await fetchData();
      setActiveTab('My Jobs');
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to post job.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-200">Loading...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="glass-card rounded-2xl p-4">
        <p className="text-sm font-semibold text-white">Company Dashboard</p>
        <div className="mt-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                activeTab === tab ? 'bg-sky-500 text-white' : 'text-slate-200 hover:bg-white/10'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-6">
        {activeTab === 'Post Job' && (
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-white">Post a new job</h3>
            <form className="mt-6 grid gap-4" onSubmit={handlePostJob}>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-300">Title</label>
                <input
                  className="input mt-2"
                  required
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-300">Type</label>
                  <select
                    className="input mt-2"
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value })}
                  >
                    <option value="JOB">Job</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-300">Location</label>
                  <input
                    className="input mt-2"
                    required
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-300">Salary Range</label>
                <input
                  className="input mt-2"
                  value={form.salaryRange}
                  onChange={(event) => setForm({ ...form, salaryRange: event.target.value })}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-300">Description</label>
                <textarea
                  className="input mt-2 min-h-[140px]"
                  required
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>
              <button className="btn-primary w-full" type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post job'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'My Jobs' && (
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-white">My jobs</h3>
            <div className="mt-6 space-y-4">
              {jobs.length === 0 ? (
                <p className="text-sm text-slate-200">No jobs posted yet.</p>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{job.title}</p>
                        <p className="text-xs text-slate-300">{job.location}</p>
                      </div>
                      <span className="badge">{job.type}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">Applications: {job._count?.applications || 0}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'Applicants' && (
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-white">Applicants</h3>
            <div className="mt-6 space-y-4">
              {applications.length === 0 ? (
                <p className="text-sm text-slate-200">No applications yet.</p>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{app.student.user.name}</p>
                        <p className="text-xs text-slate-300">{app.student.user.email}</p>
                      </div>
                      <span className="badge">{app.status}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">Applied for {app.job.title}</p>
                    {app.coverLetter && (
                      <p className="mt-2 text-xs text-slate-400">Cover letter: {app.coverLetter}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
