import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { addOrder, getOrder, updateOrder } from '@/lib/store';
import { OrderStatus, STATUS_LABELS } from '@/lib/types';
import { getServices } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';

export default function OrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    serviceType: 'printing' as ServiceType,
    description: '',
    totalPrice: 0,
    deposit: 0,
    deliveryDate: '',
    status: 'new' as OrderStatus,
  });

  useEffect(() => {
    if (id) {
      const order = getOrder(id);
      if (order) {
        setForm({
          customerName: order.customerName,
          phone: order.phone,
          serviceType: order.serviceType,
          description: order.description,
          totalPrice: order.totalPrice,
          deposit: order.deposit,
          deliveryDate: order.deliveryDate,
          status: order.status,
        });
      }
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.phone) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    if (isEdit) {
      updateOrder(id!, { ...form });
      toast.success('تم تعديل الطلب بنجاح');
    } else {
      addOrder(form);
      toast.success('تم إضافة الطلب بنجاح');
    }
    navigate('/orders');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{isEdit ? 'تعديل الطلب' : 'طلب جديد'}</h2>
      <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>اسم الزبون *</Label>
            <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
          </div>
          <div>
            <Label>رقم الهاتف *</Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>نوع الخدمة</Label>
            <Link to="/services" className="text-xs text-primary hover:underline flex items-center gap-1">
              <Settings className="w-3 h-3" />إدارة الخدمات
            </Link>
          </div>
          <Select value={form.serviceType} onValueChange={v => setForm(f => ({ ...f, serviceType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {getServices().map(s => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>التفاصيل</Label>
          <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>السعر الإجمالي</Label>
            <Input type="number" min={0} value={form.totalPrice} onChange={e => setForm(f => ({ ...f, totalPrice: Number(e.target.value) }))} />
          </div>
          {!isEdit && (
            <div>
              <Label>العربون (دفعة مقدمة)</Label>
              <Input type="number" min={0} value={form.deposit} onChange={e => setForm(f => ({ ...f, deposit: Number(e.target.value) }))} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>تاريخ التسليم</Label>
            <Input type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} />
          </div>
          {isEdit && (
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as OrderStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {!isEdit && form.totalPrice > 0 && (
          <div className="bg-muted rounded-lg p-3 text-sm">
            <span className="text-muted-foreground">المتبقي بعد العربون: </span>
            <span className="font-bold">{(form.totalPrice - form.deposit).toLocaleString()} ₪</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit">{isEdit ? 'حفظ التعديلات' : 'إضافة الطلب'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/orders')}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}
