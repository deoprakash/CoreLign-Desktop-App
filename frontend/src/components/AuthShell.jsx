export default function AuthShell({ title, subtitle, eyebrow, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/70 bg-white/80 shadow-2xl shadow-slate-200/60 backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden bg-slate-950 px-8 py-10 text-white sm:px-10">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at top left, rgba(45, 212, 191, 0.45), transparent 35%), radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.25), transparent 30%)' }} />
          <div className="relative z-10 max-w-xl">
            <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">
              {eyebrow}
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
              {subtitle}
            </p>
            <div className="mt-8 grid gap-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Secure MongoDB-backed user records in the <span className="font-semibold text-white">corelign</span> database.</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Separate login and registration flows with persistent sign-in state.</div>
            </div>
          </div>
        </div>

        <div className="px-8 py-10 sm:px-10">
          {children}
        </div>
      </div>
    </div>
  )
}