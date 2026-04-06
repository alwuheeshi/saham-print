import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, PlusCircle, AlertTriangle, Printer } from 'lucide-react';

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/orders', label: 'الطلبات', icon: ClipboardList },
  { to: '/orders/new', label: 'طلب جديد', icon: PlusCircle },
  { to: '/debts', label: 'الديون', icon: AlertTriangle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg no-print">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Printer className="w-7 h-7" />
          <h1 className="text-xl font-bold">نظام إدارة المطبعة</h1>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-card border-b no-print sticky top-0 z-30">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-6 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
