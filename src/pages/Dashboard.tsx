import { useEffect, useState } from 'react';
import { getOrders } from '@/lib/store';
import { Order } from '@/lib/types';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, DollarSign, Ban } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card rounded-lg border p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const total = orders.length;
  const inProgress = orders.filter(o => o.status === 'in_progress').length;
  const done = orders.filter(o => o.status === 'done').length;
  const unpaidCount = orders.filter(o => o.paymentStatus !== 'paid').length;
  const totalDebts = orders.reduce((s, o) => s + o.remainingAmount, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">لوحة التحكم</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} label="إجمالي الطلبات" value={total} color="bg-primary/10 text-primary" />
        <StatCard icon={Clock} label="قيد التنفيذ" value={inProgress} color="bg-warning/10 text-warning" />
        <StatCard icon={CheckCircle} label="جاهزة" value={done} color="bg-success/10 text-success" />
        <StatCard icon={Ban} label="طلبات غير مدفوعة" value={unpaidCount} color="bg-destructive/10 text-destructive" />
        <StatCard icon={AlertTriangle} label="إجمالي الديون" value={`${totalDebts.toLocaleString()} ₪`} color="bg-destructive/10 text-destructive" />
        <StatCard icon={DollarSign} label="إجمالي المبيعات" value={`${orders.reduce((s, o) => s + o.totalPrice, 0).toLocaleString()} ₪`} color="bg-success/10 text-success" />
      </div>
    </div>
  );
}
