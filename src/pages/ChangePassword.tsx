import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAccountSettings, updateAccountSettings } from '@/lib/database';

export default function ChangePassword() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  useEffect(() => {
    let cancelled = false;

    getAccountSettings()
      .then(account => {
        if (!cancelled) setNewUsername(account.username);
      })
      .catch(() => {
        toast.error('تعذر تحميل إعدادات الحساب');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername.trim()) {
      toast.error('اسم المستخدم لا يمكن أن يكون فارغاً');
      return;
    }
    if (newPass && newPass.length < 4) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل');
      return;
    }
    if (newPass && newPass !== confirmPass) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    setSaving(true);
    try {
      const account = await updateAccountSettings({
        currentPassword: currentPass,
        username: newUsername.trim(),
        newPassword: newPass || null,
      });
      setNewUsername(account.username);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      toast.success('تم حفظ التغييرات بنجاح');
    } catch {
      toast.error('كلمة المرور الحالية غير صحيحة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon"><ArrowRight className="w-5 h-5" /></Button>
        </Link>
        <h2 className="text-2xl font-bold">إعدادات الحساب</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div>
          <Label>اسم المستخدم</Label>
          <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} disabled={loading} />
        </div>
        <div>
          <Label>كلمة المرور الحالية <span className="text-destructive">*</span></Label>
          <Input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} disabled={loading} />
        </div>
        <div>
          <Label>كلمة المرور الجديدة <span className="text-xs text-muted-foreground">(اتركه فارغاً للإبقاء على الحالية)</span></Label>
          <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} disabled={loading} />
        </div>
        <div>
          <Label>تأكيد كلمة المرور الجديدة</Label>
          <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} disabled={loading} />
        </div>

        <Button type="submit" className="w-full" disabled={loading || saving}>
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </form>
    </div>
  );
}
