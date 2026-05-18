export const metadata = { title: "Dashboard · Admin" };

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-700">Quick overview of the store.</p>
      </header>
    </div>
  );
}
