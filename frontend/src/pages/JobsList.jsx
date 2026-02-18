import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

const filters = [
  { key: 'ALL', label: 'All' },
  { key: 'JOB', label: 'Jobs' },
  { key: 'INTERNSHIP', label: 'Internships' }
];

export default function JobsList() {
  const { notify } = useToast();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const response = await api.get('/api/jobs', {
          params: filter === 'ALL' ? {} : { type: filter }
        });
        setJobs(response.data.jobs);
      } catch (error) {
        notify('Unable to load jobs.', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [filter, notify]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Open roles</h2>
          <p className="text-sm text-slate-300">Browse approved jobs and internships.</p>
        </div>
        <div className="flex gap-2">
          {filters.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`${filter === item.key ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-200'} rounded-full px-4 py-2 text-xs font-semibold`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-200">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-200">
          No jobs found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job) => (
            <div key={job.id} className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <span className="badge">{job.type}</span>
                <span className="text-xs text-slate-300">{job.location}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{job.title}</h3>
              <p className="mt-2 text-sm text-slate-200">{job.company?.companyName}</p>
              <p className="mt-4 text-sm text-slate-300">{job.description}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">{job.salaryRange || 'Salary negotiable'}</span>
                <Link className="text-sm font-semibold text-sky-300" to={`/jobs/${job.id}`}>
                  View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
