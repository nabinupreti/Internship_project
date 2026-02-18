import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const tabs = ['Profile', 'My Applications'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [activeTab, setActiveTab] = useState('Profile');
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [meRes, appRes] = await Promise.all([
          api.get('/api/me'),
          api.get('/api/student/applications')
        ]);
        setProfile(meRes.data.user);
        setApplications(appRes.data.applications);
      } catch (error) {
        notify('Unable to load dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [notify]);

  if (loading) {
    return <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-200">Loading...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="glass-card rounded-2xl p-4">
        <p className="text-sm font-semibold text-white">Student Dashboard</p>
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
        {activeTab === 'Profile' && (
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-white">Profile</h3>
            <p className="mt-2 text-sm text-slate-200">Welcome, {user?.name}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                <p className="text-sm text-slate-200">{profile?.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Skills</p>
                <p className="text-sm text-slate-200">{profile?.studentProfile?.skills || 'Add skills'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Bio</p>
                <p className="text-sm text-slate-200">{profile?.studentProfile?.bio || 'Add a short bio'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Resume</p>
                {profile?.studentProfile?.resumeUrl ? (
                  <a
                    href={profile.studentProfile.resumeUrl}
                    className="text-sm text-sky-300"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View resume
                  </a>
                ) : (
                  <p className="text-sm text-slate-200">No resume uploaded</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'My Applications' && (
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-white">My Applications</h3>
            <div className="mt-6 space-y-4">
              {applications.length === 0 ? (
                <p className="text-sm text-slate-200">No applications yet.</p>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{app.job.title}</p>
                        <p className="text-xs text-slate-300">{app.job.company?.companyName}</p>
                      </div>
                      <span className="badge">{app.status}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
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
