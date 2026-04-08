import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCustomers, deleteCustomer, updateCustomer, Customer } from '@/lib/customers';
import { getOrders } from '@/lib/store';
import { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit, Eye, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { getServiceLabel } from '@/lib/services';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const reload = () => {
    setCustomers(getCustomers());
    setAllOrders(getOrders());
  };
  useEffect(reload, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, search]);

  const getCustomerOrders = (name: string, phone: string) =>
    allOrders.filter(o => o.customerName === name && o.phone === phone);

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      deleteCustomer(id);
      reload();
      toast.success('تم حذف العميل');
    }
  };

  const handleSaveEdit = () => {
    if (!editCustomer) return;
    updateCustomer(editCustomer.id, editCustomer);
    setEditCustomer(null);
    reload();
    toast.success('تم تعديل بيانات العميل');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">إدارة العملاء</h2>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الهاتف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} عميل</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">لا يوجد عملاء</div>
      ) : (
        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-right font-semibold">الاسم</th>
                <th className="p-3 text-right font-semibold">الهاتف</th>
                <th className="p-3 text-right font-semibold">النشاط</th>
                <th className="p-3 text-right font-semibold">الطلبات</th>
                <th className="p-3 text-right font-semibold">الديون</th>
                <th className="p-3 text-right font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const cOrders = getCustomerOrders(c.name, c.phone);
                const debt = cOrders.reduce((s, o) => s + o.remainingAmount, 0);
                return (
                  <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">{c.phone}</td>
                    <td className="p-3 text-muted-foreground">{c.business || '—'}</td>
                    <td className="p-3">{cOrders.length}</td>
                    <td className={`p-3 font-semibold ${debt > 0 ? 'text-destructive' : ''}`}>
                      {debt > 0 ? `${debt.toLocaleString()} د.ل` : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedCustomer(c)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCustomer({ ...c })}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Profile Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              ملف العميل - {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-semibold">{selectedCustomer.phone}</span></div>
                <div><span className="text-muted-foreground">النشاط:</span> <span className="font-semibold">{selectedCustomer.business || '—'}</span></div>
                <div><span className="text-muted-foreground">العنوان:</span> <span className="font-semibold">{selectedCustomer.address || '—'}</span></div>
              </div>
              {selectedCustomer.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">ملاحظات:</span>
                  <p className="bg-muted rounded p-2 mt-1">{selectedCustomer.notes}</p>
                </div>
              )}
              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-2">الطلبات ({getCustomerOrders(selectedCustomer.name, selectedCustomer.phone).length})</h4>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {getCustomerOrders(selectedCustomer.name, selectedCustomer.phone).map(o => (
                    <Link key={o.id} to={`/orders/${o.id}`} onClick={() => setSelectedCustomer(null)}
                      className="flex justify-between items-center bg-muted/50 rounded px-3 py-2 text-sm hover:bg-muted transition-colors">
                      <div>
                        <span className="font-medium">{getServiceLabel(o.serviceType)}</span>
                        <span className="text-muted-foreground text-xs mr-2">#{o.orderNumber || o.id}</span>
                      </div>
                      <span className="font-semibold">{o.totalPrice.toLocaleString()} د.ل</span>
                    </Link>
                  ))}
                  {getCustomerOrders(selectedCustomer.name, selectedCustomer.phone).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">لا توجد طلبات</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={!!editCustomer} onOpenChange={() => setEditCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات العميل</DialogTitle>
          </DialogHeader>
          {editCustomer && (
            <div className="space-y-4 pt-2">
              <div>
                <Label>الاسم</Label>
                <Input value={editCustomer.name} onChange={e => setEditCustomer({ ...editCustomer, name: e.target.value })} />
              </div>
              <div>
                <Label>الهاتف</Label>
                <Input value={editCustomer.phone} onChange={e => setEditCustomer({ ...editCustomer, phone: e.target.value })} />
              </div>
              <div>
                <Label>النشاط التجاري</Label>
                <Input value={editCustomer.business || ''} onChange={e => setEditCustomer({ ...editCustomer, business: e.target.value })} />
              </div>
              <div>
                <Label>العنوان</Label>
                <Input value={editCustomer.address || ''} onChange={e => setEditCustomer({ ...editCustomer, address: e.target.value })} />
              </div>
              <div>
                <Label>ملاحظات</Label>
                <Textarea value={editCustomer.notes || ''} onChange={e => setEditCustomer({ ...editCustomer, notes: e.target.value })} rows={2} />
              </div>
              <Button onClick={handleSaveEdit} className="w-full">حفظ التعديلات</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
