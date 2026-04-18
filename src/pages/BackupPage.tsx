import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Upload } from 'lucide-react';

export default function BackupPage() {
  const handleExport = () => {
    toast.info('سيتم إضافة نسخ احتياطي لقاعدة SQLite في خطوة النسخ الاحتياطي.');
  };

  const handleImport = () => {
    toast.info('سيتم إضافة استعادة نسخ SQLite الاحتياطية في خطوة النسخ الاحتياطي.');
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">النسخ الاحتياطي</h2>
      <div className="bg-card border rounded-lg p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-semibold mb-2">تصدير نسخة احتياطية</h3>
          <p className="text-sm text-muted-foreground mb-3">تصدير جميع بيانات النظام (طلبات، عملاء، خدمات) كملف JSON</p>
          <Button onClick={handleExport} className="w-full">
            <Download className="w-4 h-4 ml-2" />تصدير النسخة الاحتياطية
          </Button>
        </div>
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-2">استعادة نسخة احتياطية</h3>
          <p className="text-sm text-muted-foreground mb-3">استيراد ملف نسخة احتياطية سابقة. سيتم استبدال البيانات الحالية.</p>
          <Button variant="outline" onClick={handleImport} className="w-full">
            <Upload className="w-4 h-4 ml-2" />استيراد نسخة احتياطية
          </Button>
        </div>
      </div>
    </div>
  );
}
