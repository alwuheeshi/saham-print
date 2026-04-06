import { useEffect, useState, useMemo } from 'react';
import { getOrders } from '@/lib/store';
import { Order } from '@/lib/types';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, DollarSign, Ban, CalendarIcon } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type Period = 'month' | 'year' | 'custom';

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
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  useEffect(() => {
    setAllOrders(getOrders());
  }, []);

  const orders = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (period === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (period === 'year') {
      start = startOfYear(now);
      end = endOfYear(now);
    } else {
      if (!customFrom || !customTo) return allOrders;
      start = customFrom;
      end = customTo;
      end.setHours(23, 59, 59, 999);
    }

    return allOrders.filter(o => {
      const date = parseISO(o.createdAt);
      return isWithinInterval(date, { start, end });
    });
  }, [allOrders, period, customFrom, customTo]);

  const total = orders.length;
  const inProgress = orders.filter(o => o.status === 'in_progress').length;
  const done = orders.filter(o => o.status === 'done').length;
  const unpaidCount = orders.filter(o => o.paymentStatus !== 'paid').length;
  const totalDebts = orders.reduce((s, o) => s + o.remainingAmount, 0);
  const totalSales = orders.reduce((s, o) => s + o.totalPrice, 0);

  const periodButtons: { key: Period; label: string }[] = [
    { key: 'month', label: 'هذا الشهر' },
    { key: 'year', label: 'هذا العام' },
    { key: 'custom', label: 'مخصص' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">لوحة التحكم</h2>

        <div className="flex items-center gap-2 flex-wrap">
          {periodButtons.map(p => (
            <Button
              key={p.key}
              variant={period === p.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">من:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-40 justify-start", !customFrom && "text-muted-foreground")}>
                  <CalendarIcon className="w-4 h-4 ml-2" />
                  {customFrom ? format(customFrom, 'yyyy/MM/dd') : 'اختر تاريخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">إلى:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-40 justify-start", !customTo && "text-muted-foreground")}>
                  <CalendarIcon className="w-4 h-4 ml-2" />
                  {customTo ? format(customTo, 'yyyy/MM/dd') : 'اختر تاريخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} label="إجمالي الطلبات" value={total} color="bg-primary/10 text-primary" />
        <StatCard icon={Clock} label="قيد التنفيذ" value={inProgress} color="bg-warning/10 text-warning" />
        <StatCard icon={CheckCircle} label="جاهزة" value={done} color="bg-success/10 text-success" />
        <StatCard icon={Ban} label="طلبات غير مدفوعة" value={unpaidCount} color="bg-destructive/10 text-destructive" />
        <StatCard icon={AlertTriangle} label="إجمالي الديون" value={`${totalDebts.toLocaleString()} ₪`} color="bg-destructive/10 text-destructive" />
        <StatCard icon={DollarSign} label="إجمالي المبيعات" value={`${totalSales.toLocaleString()} ₪`} color="bg-success/10 text-success" />
      </div>
    </div>
  );
}
