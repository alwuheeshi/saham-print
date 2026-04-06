import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, deleteOrder, updateOrder } from '@/lib/store';
import { Order, STATUS_LABELS, SERVICE_LABELS, OrderStatus } from '@/lib/types';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);

  const reload = () => setOrders(getOrders());
  useEffect(reload, []);

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      deleteOrder(id);
      reload();
      toast.success('تم حذف الطلب');
    }
  };

  const handleStatusChange = (id: string, status: OrderStatus) => {
    updateOrder(id, { status });
    reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">الطلبات</h2>
        <Link to="/orders/new">
          <Button>+ طلب جديد</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">لا توجد طلبات بعد</div>
      ) : (
        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-right font-semibold">الزبون</th>
                <th className="p-3 text-right font-semibold">الخدمة</th>
                <th className="p-3 text-right font-semibold">الإجمالي</th>
                <th className="p-3 text-right font-semibold">المدفوع</th>
                <th className="p-3 text-right font-semibold">المتبقي</th>
                <th className="p-3 text-right font-semibold">الدفع</th>
                <th className="p-3 text-right font-semibold">الحالة</th>
                <th className="p-3 text-right font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr
                  key={order.id}
                  className={`border-b hover:bg-muted/30 transition-colors ${order.remainingAmount > 0 ? 'bg-destructive/5' : ''}`}
                >
                  <td className="p-3 font-medium">{order.customerName}</td>
                  <td className="p-3">{SERVICE_LABELS[order.serviceType]}</td>
                  <td className="p-3">{order.totalPrice.toLocaleString()} ₪</td>
                  <td className="p-3">{order.paidAmount.toLocaleString()} ₪</td>
                  <td className="p-3 font-semibold">{order.remainingAmount > 0 ? `${order.remainingAmount.toLocaleString()} ₪` : '—'}</td>
                  <td className="p-3"><PaymentStatusBadge status={order.paymentStatus} /></td>
                  <td className="p-3">
                    <Select value={order.status} onValueChange={v => handleStatusChange(order.id, v as OrderStatus)}>
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                      </Link>
                      <Link to={`/orders/${order.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(order.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
