interface DashboardStatsProps {
  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
  };
  members_count: number;
}

export function DashboardStats({ tasks, members_count }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Total" value={tasks.total} />
      <StatCard label="A fazer" value={tasks.todo} />
      <StatCard label="Em andamento" value={tasks.in_progress} />
      <StatCard label="Concluídas" value={tasks.done} />
      <StatCard label="Atrasadas" value={tasks.overdue} />
      <StatCard label="Membros" value={members_count} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
