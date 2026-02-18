import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <p className="badge">Job & Internship Portal</p>
        <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
          Discover opportunities that match your ambition.
        </h1>
        <p className="text-lg text-slate-200">
          JobSphere helps students, companies, and admins collaborate on the next generation of hiring.
          Track applications, post roles, and move faster with a focused hiring workflow.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link className="btn-primary" to="/jobs">
            Explore Jobs
          </Link>
          {!user && (
            <Link className="btn-secondary" to="/register">
              Create an account
            </Link>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: 'Students', copy: 'Build your profile and apply in minutes.' },
            { title: 'Companies', copy: 'Publish roles and manage applicants.' },
            { title: 'Admins', copy: 'Maintain quality and approve postings.' }
          ].map((card) => (
            <div key={card.title} className="glass-card rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-200">{card.copy}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-white">How it works</h2>
        <div className="mt-6 space-y-4 text-sm text-slate-200">
          <div>
            <p className="font-semibold text-white">1. Build your profile</p>
            <p>Showcase skills, experience, and preferences.</p>
          </div>
          <div>
            <p className="font-semibold text-white">2. Discover roles</p>
            <p>Filter jobs and internships that match your goals.</p>
          </div>
          <div>
            <p className="font-semibold text-white">3. Apply and track</p>
            <p>Manage status updates from a single dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
