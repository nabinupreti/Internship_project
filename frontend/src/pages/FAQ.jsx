const faqs = [
  {
    q: 'How do I register?',
    a: 'Create an account, verify your email, and wait for admin approval.'
  },
  {
    q: 'Why is my account pending?',
    a: 'New accounts require admin approval to keep the platform clean and safe.'
  },
  {
    q: 'How do I upload my resume?',
    a: 'Register as a student and upload a PDF during sign up.'
  },
  {
    q: 'Can companies edit or delete jobs?',
    a: 'Yes, companies can manage their own jobs. Admins can manage all jobs.'
  }
];

export default function FAQ() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="glass-card rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-white">Frequently Asked Questions</h2>
        <p className="mt-2 text-sm text-slate-200">Quick answers to common questions.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((item) => (
          <div key={item.q} className="glass-card rounded-3xl p-6">
            <p className="text-sm font-semibold text-white">{item.q}</p>
            <p className="mt-2 text-xs text-slate-300">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
