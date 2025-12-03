import WebHeader from '@/components/web/Header';
import WebFooter from '@/components/web/Footer';

/**
 * Layout для Web Portal
 * Полноразмерный дизайн с Header и Footer
 */
export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <WebHeader />
      
      <main className="flex-1">
        {children}
      </main>
      
      <WebFooter />
    </div>
  );
}
