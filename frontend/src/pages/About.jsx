export default function About() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="glass-card rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-white">About JobSphere</h2>
        <p className="mt-3 text-sm text-slate-200">
          JobSphere connects students, companies, and recruiters in one clean, fast portal.
          It is built to keep applications simple, hiring transparent, and discovery painless.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'For Students',
            body: 'Apply quickly, track your applications, and keep your resume ready.'
          },
          {
            title: 'For Companies',
            body: 'Post openings, review applicants, and manage roles in one place.'
          },
          {
            title: 'For Admins',
            body: 'Approve users and jobs, maintain quality, and keep the platform safe.'
          }
        ].map((card) => (
          <div key={card.title} className="glass-card rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-xs text-slate-300">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
