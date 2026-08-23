export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm text-zinc-500">Phase 1 foundation</p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Library Management System
      </h1>
      <p className="text-base leading-relaxed text-zinc-600">
        A web application for school and educational libraries. This phase only
        sets up the project so later work can add authentication, catalogue, and
        circulation features.
      </p>
    </main>
  );
}
