/**
 * Layout для Web Portal
 */
export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
