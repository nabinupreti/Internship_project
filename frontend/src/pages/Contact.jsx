import { useState } from 'react';
import api from '../lib/api';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await api.post('/api/contact', form);
      setInfo('Message sent! We will get back to you shortly.');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send message.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass-card rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-white">Contact</h2>
        <p className="mt-2 text-sm text-slate-200">
          Have a question or need help? Reach out and we will get back to you.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-300">Name</label>
            <input
              className="input mt-2"
              placeholder="Your name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-300">Email</label>
            <input
              className="input mt-2"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-300">Message</label>
            <textarea
              className="input mt-2 min-h-[140px]"
              placeholder="Tell us how we can help"
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              required
            />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send message'}
          </button>
          {error && <p className="mt-2 text-sm text-rose-200">{error}</p>}
          {info && <p className="mt-2 text-sm text-emerald-200">{info}</p>}
        </form>
      </div>
    </div>
  );
}
