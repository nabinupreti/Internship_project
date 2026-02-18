import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await login(form);
      notify('Welcome back!', 'success');
      if (response.user.role === 'STUDENT') navigate('/student');
      if (response.user.role === 'COMPANY') navigate('/company');
      if (response.user.role === 'ADMIN') navigate('/admin');
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to login.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="glass-card rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-200">Log in to manage your portal activity.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-300">
          New here?{' '}
          <Link className="text-sky-300 hover:text-sky-200" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
