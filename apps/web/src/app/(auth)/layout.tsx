export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">FlowManager</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie projetos e tarefas com seu time
          </p>
        </div>
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
