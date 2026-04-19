import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrder, addPayment } from '@/lib/store';
import { Order, STATUS_LABELS } from '@/lib/types';
import { getServiceLabel, getServices } from '@/lib/services';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Printer, FileDown, Plus, Edit, FileText } from 'lucide-react';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payNote, setPayNote] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const reload = useCallback(async () => {
    await getServices();
    const o = await getOrder(id!);
    if (o) setOrder(o);
    else navigate('/orders');
  }, [id, navigate]);

  useEffect(() => {
    reload().catch(console.error);
  }, [reload]);

  if (!order) return null;

  const handleAddPayment = async () => {
    if (payAmount <= 0) return;
    await addPayment(order.id, payAmount, payNote);
    setPayAmount(0);
    setPayNote('');
    setDialogOpen(false);
    await reload();
    toast.success('تم إضافة الدفعة');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ putOnlyUsedFonts: true });
    
    doc.setFontSize(18);
    doc.text('Work Order / أمر عمل', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    let y = 40;
    const lines = [
      `Order # / رقم الطلب: ${order.orderNumber || order.id}`,
      `Customer / الزبون: ${order.customerName}`,
      `Phone / الهاتف: ${order.phone}`,
      `Service / الخدمة: ${getServiceLabel(order.serviceType)}`,
      `Description / التفاصيل: ${order.description}`,
      ...(order.dimensions ? [`Dimensions / المقاسات: ${order.dimensions}`] : []),
      ...(order.quantity ? [`Quantity / الكمية: ${order.quantity}`] : []),
      ...(order.notes ? [`Notes / ملاحظات: ${order.notes}`] : []),
      ...(order.assignedDesigner ? [`Designer / المصمم: ${order.assignedDesigner}`] : []),
      ...(order.assignedPrinter ? [`Printer / الطابع: ${order.assignedPrinter}`] : []),
      ...(order.assignedInstaller ? [`Installer / المركّب: ${order.assignedInstaller}`] : []),
      `Total Price / الإجمالي: ${order.totalPrice} LYD`,
      `Paid / المدفوع: ${order.paidAmount} LYD`,
      `Remaining / المتبقي: ${order.remainingAmount} LYD`,
      `Delivery Date / التسليم: ${order.deliveryDate}`,
      `Status / الحالة: ${STATUS_LABELS[order.status]}`,
    ];
    
    lines.forEach(line => {
      doc.text(line, 20, y);
      y += 10;
    });
    
    doc.save(`order-${order.orderNumber || order.id}.pdf`);
    toast.success('تم تصدير PDF');
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 no-print">
          <h2 className="text-2xl font-bold">تفاصيل الطلب</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 ml-2" />طباعة</Button>
            <Button variant="outline" onClick={handleExportPDF}><FileDown className="w-4 h-4 ml-2" />PDF</Button>
            <Link to={`/orders/${order.id}/edit`}><Button variant="outline"><Edit className="w-4 h-4 ml-2" />تعديل</Button></Link>
            <Link to={`/orders/${order.id}/invoice?type=preliminary`}><Button variant="outline"><FileText className="w-4 h-4 ml-2" />فاتورة مبدئية</Button></Link>
            <Link to={`/orders/${order.id}/invoice?type=final`}><Button variant="outline"><FileText className="w-4 h-4 ml-2" />فاتورة نهائية</Button></Link>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4">
          <div className="text-center border-b pb-4">
            <h3 className="text-xl font-bold">أمر عمل</h3>
            <p className="text-muted-foreground text-sm">رقم الطلب: {order.orderNumber || order.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">الزبون:</span> <span className="font-semibold">{order.customerName}</span></div>
            <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-semibold">{order.phone}</span></div>
            <div><span className="text-muted-foreground">الخدمة:</span> <span className="font-semibold">{getServiceLabel(order.serviceType)}</span></div>
            <div><span className="text-muted-foreground">التسليم:</span> <span className="font-semibold">{order.deliveryDate || '—'}</span></div>
            {order.dimensions && <div><span className="text-muted-foreground">المقاسات:</span> <span className="font-semibold">{order.dimensions}</span></div>}
            {order.quantity && <div><span className="text-muted-foreground">الكمية:</span> <span className="font-semibold">{order.quantity}</span></div>}
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">التفاصيل:</span>
            <p className="mt-1 bg-muted rounded p-3">{order.description || '—'}</p>
          </div>

          {order.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">ملاحظات:</span>
              <p className="mt-1 bg-muted rounded p-3">{order.notes}</p>
            </div>
          )}

          {/* Employees */}
          {(order.assignedDesigner || order.assignedPrinter || order.assignedInstaller) && (
            <div className="grid grid-cols-3 gap-3 text-sm border-t pt-3">
              {order.assignedDesigner && <div><span className="text-muted-foreground text-xs block">المصمم</span><span className="font-semibold">{order.assignedDesigner}</span></div>}
              {order.assignedPrinter && <div><span className="text-muted-foreground text-xs block">الطابع</span><span className="font-semibold">{order.assignedPrinter}</span></div>}
              {order.assignedInstaller && <div><span className="text-muted-foreground text-xs block">المركّب</span><span className="font-semibold">{order.assignedInstaller}</span></div>}
            </div>
          )}

          <div className="flex gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>

          <div className="border-t pt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-muted-foreground text-xs">الإجمالي</p>
              <p className="text-lg font-bold">{order.totalPrice.toLocaleString()} د.ل</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">المدفوع</p>
              <p className="text-lg font-bold text-success">{order.paidAmount.toLocaleString()} د.ل</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">المتبقي</p>
              <p className={`text-lg font-bold ${order.remainingAmount > 0 ? 'text-destructive' : ''}`}>
                {order.remainingAmount.toLocaleString()} د.ل
              </p>
            </div>
          </div>

          {order.payments.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 text-sm">سجل الدفعات</h4>
              <div className="space-y-1">
                {order.payments.map(p => (
                  <div key={p.id} className="flex justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
                    <span>{p.note || 'دفعة'}</span>
                    <span className="font-semibold">{p.amount.toLocaleString()} د.ل</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {order.remainingAmount > 0 && (
          <div className="mt-4 no-print">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full"><Plus className="w-4 h-4 ml-2" />إضافة دفعة</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة دفعة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="text-sm text-muted-foreground">المتبقي: {order.remainingAmount.toLocaleString()} د.ل</div>
                  <div>
                    <Label>المبلغ</Label>
                    <Input type="number" min={0} max={order.remainingAmount} value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>ملاحظة (اختياري)</Label>
                    <Input value={payNote} onChange={e => setPayNote(e.target.value)} />
                  </div>
                  <Button onClick={handleAddPayment} className="w-full">تأكيد الدفعة</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
