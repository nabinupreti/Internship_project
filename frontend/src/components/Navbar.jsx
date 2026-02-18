import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const baseLink = 'text-sm font-medium text-slate-200 hover:text-white';
const activeLink = 'text-white';

export default function Navbar() {
  const { user, logout } = useAuth();

  const links = [
    { to: '/jobs', label: 'Jobs' },
    { to: '/about', label: 'About' },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: 'Contact' }
  ];

  if (user?.role === 'STUDENT') {
    links.push({ to: '/student', label: 'Student Dashboard' });
  }
  if (user?.role === 'COMPANY') {
    links.push({ to: '/company', label: 'Company Dashboard' });
  }
  if (user?.role === 'ADMIN') {
    links.push({ to: '/admin', label: 'Admin Panel' });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="text-lg font-semibold text-white">
          JobSphere
        </Link>
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `${baseLink} ${isActive ? activeLink : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-xs text-slate-300 md:block">
                {user.name} · {user.role}
              </span>
              <button className="btn-secondary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn-secondary" to="/login">
                Login
              </Link>
              <Link className="btn-primary" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
