import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { addOrder, getOrder, updateOrder } from '@/lib/store';
import { Order, OrderStatus, STATUS_LABELS } from '@/lib/types';
import { getServices, getServiceLabel, CustomService } from '@/lib/services';
import { getCustomers, Customer } from '@/lib/customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Settings, Users, Search, Printer } from 'lucide-react';

function PrintableOrderTicket({ order }: { order: Order }) {
  return (
    <div id="print-ticket" className="p-6 text-sm print-area" dir="rtl" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="text-center border-b pb-3 mb-4">
        <h2 className="text-xl font-bold">أمر تنفيذ</h2>
        <p className="text-muted-foreground text-xs mt-1">نسخة الزبون</p>
      </div>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td className="py-1.5 font-semibold w-32 align-top">رقم الطلب:</td><td className="py-1.5">{order.orderNumber}</td></tr>
          <tr><td className="py-1.5 font-semibold align-top">التاريخ:</td><td className="py-1.5">{new Date(order.createdAt).toLocaleDateString('ar-LY')}</td></tr>
          <tr><td className="py-1.5 font-semibold align-top">اسم العميل:</td><td className="py-1.5">{order.customerName}</td></tr>
          <tr><td className="py-1.5 font-semibold align-top">رقم الهاتف:</td><td className="py-1.5">{order.phone}</td></tr>
          <tr><td className="py-1.5 font-semibold align-top">نوع الخدمة:</td><td className="py-1.5">{getServiceLabel(order.serviceType)}</td></tr>
          {order.description && <tr><td className="py-1.5 font-semibold align-top">التفاصيل:</td><td className="py-1.5">{order.description}</td></tr>}
          {order.dimensions && <tr><td className="py-1.5 font-semibold align-top">المقاسات:</td><td className="py-1.5">{order.dimensions}</td></tr>}
          {order.quantity && order.quantity > 1 && <tr><td className="py-1.5 font-semibold align-top">الكمية:</td><td className="py-1.5">{order.quantity}</td></tr>}
          {order.notes && <tr><td className="py-1.5 font-semibold align-top">ملاحظات:</td><td className="py-1.5">{order.notes}</td></tr>}
          {order.assignedDesigner && <tr><td className="py-1.5 font-semibold align-top">المصمم:</td><td className="py-1.5">{order.assignedDesigner}</td></tr>}
          {order.assignedPrinter && <tr><td className="py-1.5 font-semibold align-top">مسؤول الطباعة:</td><td className="py-1.5">{order.assignedPrinter}</td></tr>}
          {order.assignedInstaller && <tr><td className="py-1.5 font-semibold align-top">مسؤول التركيب:</td><td className="py-1.5">{order.assignedInstaller}</td></tr>}
        </tbody>
      </table>
      <div className="border-t mt-4 pt-3 space-y-1.5">
        <div className="flex justify-between"><span className="font-semibold">السعر الإجمالي:</span><span>{order.totalPrice.toLocaleString()} د.ل</span></div>
        <div className="flex justify-between"><span className="font-semibold">العربون:</span><span>{order.deposit.toLocaleString()} د.ل</span></div>
        <div className="flex justify-between font-bold text-base"><span>المتبقي:</span><span>{order.remainingAmount.toLocaleString()} د.ل</span></div>
      </div>
      {order.deliveryDate && (
        <div className="border-t mt-3 pt-3 text-center">
          <span className="font-semibold">تاريخ التسليم المتوقع: </span>
          <span>{new Date(order.deliveryDate).toLocaleDateString('ar-LY')}</span>
        </div>
      )}
    </div>
  );
}

export default function OrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    serviceType: 'printing' as string,
    description: '',
    dimensions: '',
    quantity: 1,
    notes: '',
    assignedDesigner: '',
    assignedPrinter: '',
    assignedInstaller: '',
    totalPrice: 0,
    deposit: 0,
    deliveryDate: '',
    status: 'new' as OrderStatus,
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomers, setShowCustomers] = useState(false);
  const [printDialog, setPrintDialog] = useState(false);
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<CustomService[]>([]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, customerSearch]);

  useEffect(() => {
    const load = async () => {
      const [loadedCustomers, loadedServices] = await Promise.all([getCustomers(), getServices()]);
      setCustomers(loadedCustomers);
      setServices(loadedServices);

      if (!id) return;
      const order = await getOrder(id);
      if (order) {
        setForm({
          customerName: order.customerName,
          phone: order.phone,
          serviceType: order.serviceType,
          description: order.description,
          dimensions: order.dimensions || '',
          quantity: order.quantity || 1,
          notes: order.notes || '',
          assignedDesigner: order.assignedDesigner || '',
          assignedPrinter: order.assignedPrinter || '',
          assignedInstaller: order.assignedInstaller || '',
          totalPrice: order.totalPrice,
          deposit: order.deposit,
          deliveryDate: order.deliveryDate,
          status: order.status,
        });
      }
    };
    load().catch(console.error);
  }, [id]);

  const selectCustomer = (c: Customer) => {
    setForm(f => ({ ...f, customerName: c.name, phone: c.phone }));
    setShowCustomers(false);
    setCustomerSearch('');
  };

  const handlePrint = () => {
    const content = document.getElementById('print-ticket');
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(`<html dir="rtl"><head><title>أمر تنفيذ</title><style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 16px; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 4px 0; vertical-align: top; }
      .font-semibold { font-weight: 600; } .font-bold { font-weight: 700; }
      .border-t { border-top: 1px solid #ccc; } .border-b { border-bottom: 1px solid #ccc; }
      .text-center { text-align: center; }
      .flex { display: flex; justify-content: space-between; }
      @media print { body { margin: 0; } }
    </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.phone) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    if (isEdit) {
      await updateOrder(id!, { ...form });
      toast.success('تم تعديل الطلب بنجاح');
      navigate('/orders');
    } else {
      const order = await addOrder(form);
      toast.success('تم إضافة الطلب بنجاح');
      setNewOrder(order);
      setPrintDialog(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{isEdit ? 'تعديل الطلب' : 'طلب جديد'}</h2>
      <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-5 shadow-sm">
        {/* Customer info */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3 w-full">بيانات العميل</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>اسم الزبون *</Label>
                {customers.length > 0 && (
                  <Popover open={showCustomers} onOpenChange={setShowCustomers}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-primary gap-1 px-2">
                        <Users className="w-3 h-3" />
                        اختيار زبون
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2" align="start">
                      <div className="relative mb-2">
                        <Search className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث بالاسم أو الهاتف..."
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          className="pr-8 h-9 text-sm"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                        {filteredCustomers.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-3">لا توجد نتائج</p>
                        ) : (
                          filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCustomer(c)}
                              className="w-full text-right px-3 py-2 rounded-md hover:bg-accent/10 text-sm transition-colors"
                            >
                              <div className="font-medium">{c.name}</div>
                              <div className="text-xs text-muted-foreground">{c.phone}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
            </div>
            <div>
              <Label>رقم الهاتف *</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
        </fieldset>

        {/* Order details */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3 w-full">تفاصيل الطلب</legend>
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
                {services.map(s => (
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
              <Label>المقاسات</Label>
              <Input placeholder="مثال: 3م × 1م" value={form.dimensions} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} />
            </div>
            <div>
              <Label>الكمية</Label>
              <Input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
            </div>
          </div>

          <div>
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="ملاحظات إضافية..." />
          </div>
        </fieldset>

        {/* Employees - Optional */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3 w-full">المسؤولون <span className="text-xs font-normal">(اختياري)</span></legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>المصمم</Label>
              <Input placeholder="اسم المصمم" value={form.assignedDesigner} onChange={e => setForm(f => ({ ...f, assignedDesigner: e.target.value }))} />
            </div>
            <div>
              <Label>مسؤول الطباعة</Label>
              <Input placeholder="اسم الطابع" value={form.assignedPrinter} onChange={e => setForm(f => ({ ...f, assignedPrinter: e.target.value }))} />
            </div>
            <div>
              <Label>مسؤول التركيب</Label>
              <Input placeholder="اسم المركّب" value={form.assignedInstaller} onChange={e => setForm(f => ({ ...f, assignedInstaller: e.target.value }))} />
            </div>
          </div>
        </fieldset>

        {/* Pricing */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3 w-full">الأسعار والتسليم</legend>
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
              <span className="font-bold">{(form.totalPrice - form.deposit).toLocaleString()} د.ل</span>
            </div>
          )}
        </fieldset>

        <div className="flex gap-3 pt-2">
          <Button type="submit">{isEdit ? 'حفظ التعديلات' : 'إضافة الطلب'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/orders')}>إلغاء</Button>
        </div>
      </form>

      {/* Print dialog after new order */}
      <Dialog open={printDialog} onOpenChange={(open) => {
        if (!open) navigate('/orders');
        setPrintDialog(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تم إضافة الطلب بنجاح ✓</DialogTitle>
          </DialogHeader>
          {newOrder && <PrintableOrderTicket order={newOrder} />}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة نسخة للزبون
            </Button>
            <Button variant="outline" onClick={() => { setPrintDialog(false); navigate('/orders'); }}>
              تخطي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
