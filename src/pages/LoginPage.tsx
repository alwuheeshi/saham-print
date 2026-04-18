import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';
import logo from '@/assets/logo.jpg';
import { login } from '@/lib/database';

interface LoginPageProps {
  onAuthenticated: () => void;
}

export default function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await login(username, password);
      onAuthenticated();
    } catch {
      toast.error('اسم المستخدم أو كلمة المرور غير صحيحة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border rounded-xl p-8 shadow-lg space-y-6">
          <div className="flex flex-col items-center gap-3">
            <img src={logo} alt="شعار السهم" className="w-20 h-20 object-contain" />
            <h1 className="text-xl font-bold">السهم للدعاية والإعلان</h1>
            <p className="text-sm text-muted-foreground">تسجيل الدخول إلى النظام</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>اسم المستخدم</Label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                autoFocus
              />
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              <LogIn className="w-4 h-4 ml-2" />
              {submitting ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            اليوزر: admin | الباسورد: admin123
          </p>
        </div>
      </div>
    </div>
  );
}
