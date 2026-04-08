import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, PlusCircle, AlertTriangle, LogOut, Lock, Users, Database, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/pages/LoginPage';
import logo from '@/assets/logo.jpg';

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/orders', label: 'الطلبات', icon: ClipboardList },
  { to: '/orders/new', label: 'طلب جديد', icon: PlusCircle },
  { to: '/customers', label: 'العملاء', icon: Users },
  { to: '/debts', label: 'الديون', icon: AlertTriangle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-lg no-print">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="شعار السهم" className="w-10 h-10 rounded-md object-contain bg-primary-foreground p-0.5" />
            <div>
              <h1 className="text-lg font-bold leading-tight">السهم للدعاية والإعلان</h1>
              <p className="text-xs opacity-80">SAHAM - نظام إدارة المطبعة</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/backup">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Database className="w-4 h-4 ml-1" />
                <span className="hidden sm:inline">نسخ احتياطي</span>
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Settings className="w-4 h-4 ml-1" />
                <span className="hidden sm:inline">الخدمات</span>
              </Button>
            </Link>
            <Link to="/change-password">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Lock className="w-4 h-4 ml-1" />
                <span className="hidden sm:inline">كلمة المرور</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 ml-1" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

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

      <main className="flex-1 container mx-auto px-4 py-6 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
