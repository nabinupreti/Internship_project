import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

const tabs = ['Overview', 'Users', 'Jobs', 'Applications'];

export default function AdminDashboard() {
  const { notify } = useToast();
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  async function fetchData() {
    setLoading(true);
    try {
      const [overviewRes, usersRes, jobsRes, appsRes] = await Promise.all([
        api.get('/api/admin/overview'),
        api.get('/api/admin/users'),
        api.get('/api/admin/jobs'),
        api.get('/api/admin/applications')
      ]);
      setStats(overviewRes.data.stats);
      setUsers(usersRes.data.users);
      setJobs(jobsRes.data.jobs);
      setApplications(appsRes.data.applications);
    } catch (error) {
      notify('Unable to load admin data.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleUserDelete(userId) {
    try {
      await api.delete(`/api/admin/users/${userId}`);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      notify('User deleted.', 'success');
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to delete user.', 'error');
    }
  }

  async function handleUserUpdate(userId, updates) {
    try {
      const response = await api.patch(`/api/admin/users/${userId}`, updates);
      setUsers((prev) => prev.map((user) => (user.id === userId ? response.data.user : user)));
      notify('User updated.', 'success');
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to update user.', 'error');
    }
  }

  async function handlePasswordReset(userId) {
    const newPassword = window.prompt('Enter a new password for this user:');
    if (!newPassword) return;
    await handleUserUpdate(userId, { password: newPassword });
  }

  async function handleJobApproval(jobId, isApproved) {
    try {
      const response = await api.patch(`/api/admin/jobs/${jobId}`, { isApproved });
      setJobs((prev) => prev.map((job) => (job.id === jobId ? response.data.job : job)));
      notify('Job updated.', 'success');
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to update job.', 'error');
    }
  }

  async function handleJobDelete(jobId) {
    try {
      await api.delete(`/api/admin/jobs/${jobId}`);
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      notify('Job deleted.', 'success');
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to delete job.', 'error');
    }
  }

  if (loading) {
    return <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-200">Loading...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="glass-card rounded-2xl p-4">
        <p className="text-sm font-semibold text-white">Admin Panel</p>
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
          <button
            className="mt-4 w-full rounded-xl border border-white/15 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
            onClick={fetchData}
          >
            Refresh data
          </button>
        </div>
      </aside>

      <section className="space-y-6">
        {activeTab === 'Overview' && (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: 'Users', value: stats?.users ?? 0 },
              { label: 'Jobs', value: stats?.jobs ?? 0 },
              { label: 'Applications', value: stats?.applications ?? 0 },
              { label: 'Pending Jobs', value: stats?.pendingJobs ?? 0 },
              { label: 'Pending Users', value: stats?.pendingUsers ?? 0 }
            ].map((card) => (
              <div key={card.label} className="glass-card rounded-3xl p-6">
                <p className="text-xs uppercase tracking-wide text-slate-300">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Users' && (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white">Users</h3>
            <div className="mt-6 space-y-3">
              {users.length === 0 ? (
                <p className="text-sm text-slate-200">No users found.</p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-slate-300">{user.email}</p>
                      <p className="text-xs text-slate-400">
                        {user.role} · {user.emailVerified ? 'Verified' : 'Unverified'} ·{' '}
                        {user.isApproved ? 'Approved' : 'Pending'}
                      </p>
                      {user.studentProfile?.resumeUrl && (
                        <a
                          className="mt-2 block text-xs text-sky-300"
                          href={user.studentProfile.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View resume
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="rounded-full border border-white/15 bg-transparent px-3 py-2 text-xs text-slate-100"
                        value={user.role}
                        onChange={(event) => handleUserUpdate(user.id, { role: event.target.value })}
                        disabled={user.role === 'ADMIN'}
                      >
                        <option className="text-slate-900" value="STUDENT">
                          STUDENT
                        </option>
                        <option className="text-slate-900" value="COMPANY">
                          COMPANY
                        </option>
                        <option className="text-slate-900" value="ADMIN">
                          ADMIN
                        </option>
                      </select>
                      <button
                        className="rounded-full border border-emerald-300/40 px-3 py-2 text-xs font-semibold text-emerald-100 hover:border-emerald-200"
                        onClick={() => handleUserUpdate(user.id, { isApproved: !user.isApproved })}
                        disabled={user.role === 'ADMIN'}
                      >
                        {user.isApproved ? 'Block' : 'Approve'}
                      </button>
                      <button
                        className="rounded-full border border-sky-300/40 px-3 py-2 text-xs font-semibold text-sky-100 hover:border-sky-200"
                        onClick={() => handlePasswordReset(user.id)}
                      >
                        Reset password
                      </button>
                      <button
                        className="rounded-full border border-rose-300/40 px-3 py-2 text-xs font-semibold text-rose-200 hover:border-rose-200"
                        onClick={() => handleUserDelete(user.id)}
                        disabled={user.role === 'ADMIN'}
                      >
                        {user.role === 'ADMIN' ? 'Primary Admin' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'Jobs' && (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white">Jobs</h3>
            <div className="mt-6 space-y-4">
              {jobs.length === 0 ? (
                <p className="text-sm text-slate-200">No jobs found.</p>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{job.title}</p>
                        <p className="text-xs text-slate-300">
                          {job.company?.companyName || 'Unknown company'} · {job.location}
                        </p>
                        <p className="text-xs text-slate-400">
                          {job.type} · {job._count?.applications || 0} applications
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-full border border-emerald-300/40 px-4 py-2 text-xs font-semibold text-emerald-100 hover:border-emerald-200"
                          onClick={() => handleJobApproval(job.id, true)}
                          disabled={job.isApproved}
                        >
                          Approve
                        </button>
                        <button
                          className="rounded-full border border-amber-300/40 px-4 py-2 text-xs font-semibold text-amber-100 hover:border-amber-200"
                          onClick={() => handleJobApproval(job.id, false)}
                          disabled={!job.isApproved}
                        >
                          Unapprove
                        </button>
                        <button
                          className="rounded-full border border-rose-300/40 px-4 py-2 text-xs font-semibold text-rose-200 hover:border-rose-200"
                          onClick={() => handleJobDelete(job.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">{job.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'Applications' && (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white">Applications</h3>
            <div className="mt-6 space-y-3">
              {applications.length === 0 ? (
                <p className="text-sm text-slate-200">No applications found.</p>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="rounded-2xl border border-white/10 p-4">
                    <p className="text-sm font-semibold text-white">{app.job?.title}</p>
                    <p className="text-xs text-slate-300">
                      {app.job?.company?.companyName || 'Unknown company'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Student: {app.student?.user?.name} ({app.student?.user?.email})
                    </p>
                    <p className="text-xs text-slate-400">
                      Status: {app.status} · {new Date(app.createdAt).toLocaleDateString()}
                    </p>
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
