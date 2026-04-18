import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getOrder } from '@/lib/store';
import { Order } from '@/lib/types';
import { getServiceLabel, getServices } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Printer, ArrowRight } from 'lucide-react';

function InvoiceContent({ order, type }: { order: Order; type: 'preliminary' | 'final' }) {
  const isPreliminary = type === 'preliminary';
  const today = new Date().toLocaleDateString('ar-LY');

  return (
    <div id="invoice-print" dir="rtl" className="bg-white text-black p-8 max-w-[210mm] mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold">السهم للدعاية والإعلان</h1>
        <p className="text-sm mt-1">SAHAM Advertising</p>
        <div className="mt-3 inline-block bg-gray-100 px-4 py-1 rounded text-lg font-bold">
          {isPreliminary ? 'فاتورة مبدئية (عرض سعر)' : 'فاتورة نهائية'}
        </div>
      </div>

      {/* Invoice info */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <table>
            <tbody>
              <tr><td className="font-semibold pl-4">رقم الفاتورة:</td><td>INV-{order.orderNumber}</td></tr>
              <tr><td className="font-semibold pl-4">التاريخ:</td><td>{today}</td></tr>
              {!isPreliminary && <tr><td className="font-semibold pl-4">رقم الطلب:</td><td>{order.orderNumber}</td></tr>}
            </tbody>
          </table>
        </div>
        <div>
          <table>
            <tbody>
              <tr><td className="font-semibold pl-4">اسم العميل:</td><td>{order.customerName}</td></tr>
              <tr><td className="font-semibold pl-4">رقم الهاتف:</td><td>{order.phone}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Items table */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border border-gray-600 px-3 py-2 text-right">#</th>
            <th className="border border-gray-600 px-3 py-2 text-right">الخدمة</th>
            <th className="border border-gray-600 px-3 py-2 text-right">التفاصيل</th>
            {order.dimensions && <th className="border border-gray-600 px-3 py-2 text-right">المقاسات</th>}
            <th className="border border-gray-600 px-3 py-2 text-center">الكمية</th>
            <th className="border border-gray-600 px-3 py-2 text-left">السعر</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-3 py-2">1</td>
            <td className="border border-gray-300 px-3 py-2">{getServiceLabel(order.serviceType)}</td>
            <td className="border border-gray-300 px-3 py-2">{order.description || '—'}</td>
            {order.dimensions && <td className="border border-gray-300 px-3 py-2">{order.dimensions}</td>}
            <td className="border border-gray-300 px-3 py-2 text-center">{order.quantity || 1}</td>
            <td className="border border-gray-300 px-3 py-2 text-left">{order.totalPrice.toLocaleString()} د.ل</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-start">
        <table className="text-sm w-64">
          <tbody>
            <tr className="border-b">
              <td className="font-semibold py-2 pl-8">الإجمالي:</td>
              <td className="py-2 font-bold">{order.totalPrice.toLocaleString()} د.ل</td>
            </tr>
            {!isPreliminary && (
              <>
                <tr className="border-b">
                  <td className="font-semibold py-2 pl-8">المدفوع:</td>
                  <td className="py-2 text-green-700 font-bold">{order.paidAmount.toLocaleString()} د.ل</td>
                </tr>
                <tr>
                  <td className="font-semibold py-2 pl-8">المتبقي:</td>
                  <td className={`py-2 font-bold ${order.remainingAmount > 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {order.remainingAmount.toLocaleString()} د.ل
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment history - final invoice only */}
      {!isPreliminary && order.payments.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold mb-2 text-sm">سجل الدفعات:</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-1 text-right">التاريخ</th>
                <th className="border px-3 py-1 text-right">الملاحظة</th>
                <th className="border px-3 py-1 text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {order.payments.map(p => (
                <tr key={p.id}>
                  <td className="border px-3 py-1">{new Date(p.date).toLocaleDateString('ar-LY')}</td>
                  <td className="border px-3 py-1">{p.note || 'دفعة'}</td>
                  <td className="border px-3 py-1 text-left">{p.amount.toLocaleString()} د.ل</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="mt-4 text-sm">
          <span className="font-semibold">ملاحظات: </span>{order.notes}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
        <p>شكراً لتعاملكم معنا — السهم للدعاية والإعلان</p>
        {isPreliminary && <p className="mt-1 text-red-500 font-semibold">* هذا عرض سعر مبدئي وليس فاتورة رسمية</p>}
      </div>

      {/* Signatures - final only */}
      {!isPreliminary && (
        <div className="mt-8 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <div className="border-t border-black pt-2 mt-12">توقيع المحل</div>
          </div>
          <div>
            <div className="border-t border-black pt-2 mt-12">توقيع العميل</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoicePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const type = (searchParams.get('type') as 'preliminary' | 'final') || 'final';

  useEffect(() => {
    const load = async () => {
      await getServices();
      const o = await getOrder(id!);
      if (o) setOrder(o);
      else navigate('/orders');
    };
    load().catch(console.error);
  }, [id, navigate]);

  if (!order) return null;

  const handlePrint = () => {
    const content = document.getElementById('invoice-print');
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(`<html dir="rtl"><head><title>فاتورة - ${order.orderNumber}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; direction: rtl; }
      table { border-collapse: collapse; }
      .grid { display: grid; } .grid-cols-2 { grid-template-columns: 1fr 1fr; }
      .gap-4 { gap: 16px; } .gap-8 { gap: 32px; }
      .text-center { text-align: center; } .text-right { text-align: right; } .text-left { text-align: left; }
      .font-bold { font-weight: 700; } .font-semibold { font-weight: 600; }
      .text-2xl { font-size: 24px; } .text-lg { font-size: 18px; } .text-sm { font-size: 13px; } .text-xs { font-size: 11px; }
      .mb-2 { margin-bottom: 8px; } .mb-6 { margin-bottom: 24px; } .mt-1 { margin-top: 4px; }
      .mt-3 { margin-top: 12px; } .mt-4 { margin-top: 16px; } .mt-6 { margin-top: 24px; } .mt-8 { margin-top: 32px; } .mt-12 { margin-top: 48px; }
      .px-3 { padding: 0 12px; } .px-4 { padding: 0 16px; } .py-1 { padding: 4px 0; } .py-2 { padding: 8px 0; }
      .p-8 { padding: 32px; } .pt-2 { padding-top: 8px; } .pt-4 { padding-top: 16px; } .pb-4 { padding-bottom: 16px; }
      .pl-4 { padding-left: 16px; } .pl-8 { padding-left: 32px; }
      .border { border: 1px solid #d1d5db; } .border-t { border-top: 1px solid #000; } .border-b { border-bottom: 1px solid #d1d5db; }
      .border-b-2 { border-bottom: 2px solid #000; }
      .bg-gray-100 { background: #f3f4f6; } .bg-gray-800 { background: #1f2937; }
      .text-white { color: white; } .text-green-700 { color: #15803d; } .text-red-600 { color: #dc2626; } .text-red-500 { color: #ef4444; } .text-gray-500 { color: #6b7280; }
      .border-gray-300 { border-color: #d1d5db; } .border-gray-600 { border-color: #4b5563; }
      .inline-block { display: inline-block; } .rounded { border-radius: 4px; }
      .w-full { width: 100%; } .w-64 { width: 256px; }
      .flex { display: flex; } .justify-start { justify-content: flex-start; }
      @media print { body { padding: 10px; } }
    </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <Link to={`/orders/${order.id}`}>
            <Button variant="ghost" size="sm"><ArrowRight className="w-4 h-4 ml-1" />العودة للطلب</Button>
          </Link>
          <h2 className="text-xl font-bold">
            {type === 'preliminary' ? 'فاتورة مبدئية' : 'فاتورة نهائية'}
          </h2>
        </div>
        <div className="flex gap-2">
          {type === 'preliminary' ? (
            <Link to={`/orders/${order.id}/invoice?type=final`}>
              <Button variant="outline" size="sm">عرض الفاتورة النهائية</Button>
            </Link>
          ) : (
            <Link to={`/orders/${order.id}/invoice?type=preliminary`}>
              <Button variant="outline" size="sm">عرض الفاتورة المبدئية</Button>
            </Link>
          )}
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />طباعة
          </Button>
        </div>
      </div>
      <div className="border rounded-lg shadow-sm overflow-hidden">
        <InvoiceContent order={order} type={type} />
      </div>
    </div>
  );
}
