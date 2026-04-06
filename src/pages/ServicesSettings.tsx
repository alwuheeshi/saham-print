import { useState, useEffect } from 'react';
import { getServices, saveServices, CustomService } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function ServicesSettings() {
  const [services, setServices] = useState<CustomService[]>([]);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    setServices(getServices());
  }, []);

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    if (services.some(s => s.label === label)) {
      toast.error('هذه الخدمة موجودة بالفعل');
      return;
    }
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    const updated = [...services, { id, label }];
    setServices(updated);
    saveServices(updated);
    setNewLabel('');
    toast.success('تمت إضافة الخدمة');
  };

  const handleDelete = (id: string) => {
    if (services.length <= 1) {
      toast.error('يجب أن تبقى خدمة واحدة على الأقل');
      return;
    }
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    saveServices(updated);
    toast.success('تم حذف الخدمة');
  };

  const handleRename = (id: string, newName: string) => {
    const updated = services.map(s => s.id === id ? { ...s, label: newName } : s);
    setServices(updated);
    saveServices(updated);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders/new">
          <Button variant="ghost" size="icon"><ArrowRight className="w-5 h-5" /></Button>
        </Link>
        <h2 className="text-2xl font-bold">إدارة أنواع الخدمات</h2>
      </div>

      <div className="bg-card border rounded-lg p-5 shadow-sm space-y-3">
        {services.map(service => (
          <div key={service.id} className="flex items-center gap-2">
            <Input
              value={service.label}
              onChange={e => handleRename(service.id, e.target.value)}
              onBlur={() => saveServices(services)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive shrink-0"
              onClick={() => handleDelete(service.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Input
            placeholder="اسم الخدمة الجديدة..."
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button onClick={handleAdd} size="icon" className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
