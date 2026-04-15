import { useEffect, useState, useMemo } from 'react';
import { getOrders } from '@/lib/store';
import { Order, STATUS_LABELS } from '@/lib/types';
import { getServiceLabel } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear,
  isWithinInterval, subMonths
} from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  CalendarIcon, ClipboardList, DollarSign, TrendingUp, Users,
  BarChart3, Printer
} from 'lucide-react';

type Period = 'today' | 'week' | 'month' | 'quarter' | 'half' | 'year' | 'custom';

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'هذا الأسبوع' },
  { key: 'month', label: 'هذا الشهر' },
  { key: 'quarter', label: 'ربع سنوي' },
  { key: 'half', label: 'نصف سنوي' },
  { key: 'year', label: 'سنوي' },
  { key: 'custom', label: 'مخصص' },
];

function getDateRange(period: Period, customFrom?: Date, customTo?: Date): { start: Date; end: Date } | null {
  const now = new Date();
  switch (period) {
    case 'today': return { start: startOfDay(now), end: endOfDay(now) };
    case 'week': return { start: startOfWeek(now, { locale: ar }), end: endOfWeek(now, { locale: ar }) };
    case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'quarter': return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case 'half': return { start: subMonths(startOfMonth(now), 5), end: endOfMonth(now) };
    case 'year': return { start: startOfYear(now), end: endOfYear(now) };
    case 'custom':
      if (!customFrom || !customTo) return null;
      return { start: startOfDay(customFrom), end: endOfDay(customTo) };
  }
}

function ProgressBar({ value, max, color = 'bg-primary' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-muted rounded-full h-3">
      <div className={`h-3 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ReportsPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  useEffect(() => { setAllOrders(getOrders()); }, []);

  const filtered = useMemo(() => {
    const range = getDateRange(period, customFrom, customTo);
    if (!range) return allOrders;
    return allOrders.filter(o => {
      const d = parseISO(o.createdAt);
      return isWithinInterval(d, range);
    });
  }, [allOrders, period, customFrom, customTo]);

  // Stats
  const totalOrders = filtered.length;
  const totalSales = filtered.reduce((s, o) => s + o.totalPrice, 0);
  const totalPaid = filtered.reduce((s, o) => s + o.paidAmount, 0);
  const totalDebts = filtered.reduce((s, o) => s + o.remainingAmount, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Services breakdown
  const serviceStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    filtered.forEach(o => {
      if (!map[o.serviceType]) map[o.serviceType] = { count: 0, revenue: 0 };
      map[o.serviceType].count++;
      map[o.serviceType].revenue += o.totalPrice;
    });
    return Object.entries(map)
      .map(([id, data]) => ({ id, label: getServiceLabel(id), ...data }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  // Top customers
  const customerStats = useMemo(() => {
    const map: Record<string, { name: string; phone: string; count: number; revenue: number; debt: number }> = {};
    filtered.forEach(o => {
      const key = o.phone || o.customerName;
      if (!map[key]) map[key] = { name: o.customerName, phone: o.phone, count: 0, revenue: 0, debt: 0 };
      map[key].count++;
      map[key].revenue += o.totalPrice;
      map[key].debt += o.remainingAmount;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filtered]);

  // Status breakdown
  const statusStats = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(o => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return Object.entries(map)
      .map(([status, count]) => ({ status, label: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const maxServiceCount = serviceStats.length > 0 ? serviceStats[0].count : 1;
  const maxCustomerRevenue = customerStats.length > 0 ? customerStats[0].revenue : 1;

  const handlePrint = () => window.print();

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />التقارير
        </h2>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 ml-2" />طباعة التقرير
        </Button>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap mb-5 no-print">
        {PERIOD_OPTIONS.map(p => (
          <Button key={p.key} variant={period === p.key ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p.key)}>
            {p.label}
          </Button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-3 mb-5 flex-wrap no-print">
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard icon={ClipboardList} label="عدد الطلبات" value={totalOrders.toString()} color="bg-primary/10 text-primary" />
        <SummaryCard icon={DollarSign} label="إجمالي المبيعات" value={`${totalSales.toLocaleString()} د.ل`} color="bg-success/10 text-success" />
        <SummaryCard icon={DollarSign} label="المحصّل" value={`${totalPaid.toLocaleString()} د.ل`} color="bg-success/10 text-success" />
        <SummaryCard icon={TrendingUp} label="الديون" value={`${totalDebts.toLocaleString()} د.ل`} color="bg-destructive/10 text-destructive" />
        <SummaryCard icon={BarChart3} label="متوسط الطلب" value={`${avgOrderValue.toLocaleString()} د.ل`} color="bg-accent/50 text-accent-foreground" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services */}
        <div className="bg-card border rounded-lg p-5 shadow-sm">
          <h3 className="font-bold mb-4 text-lg">الخدمات الأكثر طلباً</h3>
          {serviceStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد بيانات</p>
          ) : (
            <div className="space-y-3">
              {serviceStats.map(s => (
                <div key={s.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">{s.count} طلب — {s.revenue.toLocaleString()} د.ل</span>
                  </div>
                  <ProgressBar value={s.count} max={maxServiceCount} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order status */}
        <div className="bg-card border rounded-lg p-5 shadow-sm">
          <h3 className="font-bold mb-4 text-lg">حالة الطلبات</h3>
          {statusStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد بيانات</p>
          ) : (
            <div className="space-y-3">
              {statusStats.map(s => (
                <div key={s.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">{s.count} طلب</span>
                  </div>
                  <ProgressBar value={s.count} max={totalOrders} color="bg-primary/70" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top customers */}
        <div className="bg-card border rounded-lg p-5 shadow-sm lg:col-span-2">
          <h3 className="font-bold mb-4 text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />العملاء الأكثر تعاملاً
          </h3>
          {customerStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد بيانات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-right py-2 pr-2">#</th>
                    <th className="text-right py-2">العميل</th>
                    <th className="text-right py-2">الهاتف</th>
                    <th className="text-center py-2">عدد الطلبات</th>
                    <th className="text-left py-2">الإيرادات</th>
                    <th className="text-left py-2">الديون</th>
                    <th className="py-2 w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {customerStats.map((c, i) => (
                    <tr key={c.phone} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2.5 pr-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2.5 font-medium">{c.name}</td>
                      <td className="py-2.5">{c.phone}</td>
                      <td className="py-2.5 text-center">{c.count}</td>
                      <td className="py-2.5 text-left font-semibold">{c.revenue.toLocaleString()} د.ل</td>
                      <td className={`py-2.5 text-left ${c.debt > 0 ? 'text-destructive font-semibold' : ''}`}>
                        {c.debt > 0 ? `${c.debt.toLocaleString()} د.ل` : '—'}
                      </td>
                      <td className="py-2.5">
                        <ProgressBar value={c.revenue} max={maxCustomerRevenue} color="bg-primary/60" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}
