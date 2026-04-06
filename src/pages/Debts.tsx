import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '@/lib/store';
import { Order } from '@/lib/types';
import { getServiceLabel } from '@/lib/services';
import { PaymentStatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export default function Debts() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setOrders(getOrders().filter(o => o.remainingAmount > 0));
  }, []);

  const filtered = orders.filter(o =>
    o.customerName.includes(search) || o.phone.includes(search)
  );

  const totalDebt = filtered.reduce((s, o) => s + o.remainingAmount, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">الديون</h2>

      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="بحث باسم الزبون أو رقم الهاتف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg font-semibold text-sm">
          إجمالي الديون: {totalDebt.toLocaleString()} ₪
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">لا توجد ديون</div>
      ) : (
        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-right font-semibold">الزبون</th>
                <th className="p-3 text-right font-semibold">الهاتف</th>
                <th className="p-3 text-right font-semibold">الخدمة</th>
                <th className="p-3 text-right font-semibold">الإجمالي</th>
                <th className="p-3 text-right font-semibold">المدفوع</th>
                <th className="p-3 text-right font-semibold">المتبقي</th>
                <th className="p-3 text-right font-semibold">الحالة</th>
                <th className="p-3 text-right font-semibold">عرض</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{order.customerName}</td>
                  <td className="p-3">{order.phone}</td>
                  <td className="p-3">{SERVICE_LABELS[order.serviceType]}</td>
                  <td className="p-3">{order.totalPrice.toLocaleString()} ₪</td>
                  <td className="p-3">{order.paidAmount.toLocaleString()} ₪</td>
                  <td className="p-3 font-semibold text-destructive">{order.remainingAmount.toLocaleString()} ₪</td>
                  <td className="p-3"><PaymentStatusBadge status={order.paymentStatus} /></td>
                  <td className="p-3">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                    </Link>
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
