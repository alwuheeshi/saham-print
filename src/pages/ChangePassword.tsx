import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const CREDS_KEY = 'printshop_creds';

export function getCredentials(): { username: string; password: string } {
  const data = localStorage.getItem(CREDS_KEY);
  if (data) return JSON.parse(data);
  return { username: 'admin', password: 'admin123' };
}

export function saveCredentials(creds: { username: string; password: string }) {
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
}

export default function ChangePassword() {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const creds = getCredentials();

    if (currentPass !== creds.password) {
      toast.error('كلمة المرور الحالية غير صحيحة');
      return;
    }
    if (newPass.length < 4) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل');
      return;
    }
    if (newPass !== confirmPass) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    saveCredentials({ ...creds, password: newPass });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    toast.success('تم تغيير كلمة المرور بنجاح');
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon"><ArrowRight className="w-5 h-5" /></Button>
        </Link>
        <h2 className="text-2xl font-bold">تغيير كلمة المرور</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div>
          <Label>كلمة المرور الحالية</Label>
          <Input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} />
        </div>
        <div>
          <Label>كلمة المرور الجديدة</Label>
          <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
        </div>
        <div>
          <Label>تأكيد كلمة المرور الجديدة</Label>
          <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
        </div>

        <Button type="submit" className="w-full">حفظ كلمة المرور</Button>
      </form>
    </div>
  );
}
