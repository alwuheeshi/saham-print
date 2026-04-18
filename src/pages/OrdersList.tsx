import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, deleteOrder, updateOrder } from '@/lib/store';
import { Order, STATUS_LABELS, PAYMENT_STATUS_LABELS, OrderStatus } from '@/lib/types';
import { getServiceLabel, getServices } from '@/lib/services';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Edit, Eye, FileSpreadsheet, Search } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const reload = async () => {
    await getServices();
    setOrders(await getOrders());
  };
  useEffect(() => {
    reload().catch(console.error);
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingOrderId(id);
    try {
      await deleteOrder(id);
      await reload();
      toast.success('تم حذف الطلب');
    } catch (error) {
      console.error(error);
      toast.error('تعذر حذف الطلب');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    await updateOrder(id, { status });
    await reload();
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.customerName.includes(search) || o.phone.includes(search) || o.orderNumber?.toString().includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExportExcel = () => {
    if (filtered.length === 0) return toast.error('لا توجد طلبات للتصدير');
    const data = filtered.map(o => ({
      'رقم الطلب': o.orderNumber || o.id,
      'الزبون': o.customerName,
      'الهاتف': o.phone,
      'الخدمة': getServiceLabel(o.serviceType),
      'التفاصيل': o.description,
      'المقاسات': o.dimensions || '',
      'الكمية': o.quantity || '',
      'الإجمالي': o.totalPrice,
      'المدفوع': o.paidAmount,
      'المتبقي': o.remainingAmount,
      'حالة الدفع': PAYMENT_STATUS_LABELS[o.paymentStatus],
      'الحالة': STATUS_LABELS[o.status] || o.status,
      'تاريخ التسليم': o.deliveryDate,
      'تاريخ الإنشاء': new Date(o.createdAt).toLocaleDateString('ar'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الطلبات');
    XLSX.writeFile(wb, `orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('تم تصدير الملف بنجاح');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">الطلبات</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 ml-2" />تصدير Excel
          </Button>
          <Link to="/orders/new">
            <Button>+ طلب جديد</Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الهاتف أو رقم الطلب..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">لا توجد طلبات</div>
      ) : (
        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-right font-semibold">#</th>
                <th className="p-3 text-right font-semibold">الزبون</th>
                <th className="p-3 text-right font-semibold">الخدمة</th>
                <th className="p-3 text-right font-semibold">الإجمالي</th>
                <th className="p-3 text-right font-semibold">المتبقي</th>
                <th className="p-3 text-right font-semibold">الدفع</th>
                <th className="p-3 text-right font-semibold">الحالة</th>
                <th className="p-3 text-right font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr
                  key={order.id}
                  className={`border-b hover:bg-muted/30 transition-colors ${order.remainingAmount > 0 ? 'bg-destructive/5' : ''}`}
                >
                  <td className="p-3 text-muted-foreground">{order.orderNumber || '—'}</td>
                  <td className="p-3 font-medium">{order.customerName}</td>
                  <td className="p-3">{getServiceLabel(order.serviceType)}</td>
                  <td className="p-3">{order.totalPrice.toLocaleString()} د.ل</td>
                  <td className="p-3 font-semibold">{order.remainingAmount > 0 ? `${order.remainingAmount.toLocaleString()} د.ل` : '—'}</td>
                  <td className="p-3"><PaymentStatusBadge status={order.paymentStatus} /></td>
                  <td className="p-3">
                    <Select value={order.status} onValueChange={v => handleStatusChange(order.id, v as OrderStatus)}>
                      <SelectTrigger className="h-8 w-36 text-xs">
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            disabled={deletingOrderId === order.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الطلب</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف الطلب رقم {order.orderNumber || order.id}؟ سيتم حذف كل الدفعات المرتبطة به أيضاً.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(order.id)}
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
