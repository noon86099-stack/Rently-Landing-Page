import { useEffect, useRef, useState } from 'react';
import { Download, FileText, RefreshCw, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'rently-lease-documents';
const MAX_FILE_SIZE = 25 * 1024 * 1024;

type LeaseDocument = {
  id: string;
  lease_id: string;
  owner_id: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  file_size: number;
  created_at: string;
};

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'تعذر إتمام العملية. حاول مرة أخرى.';
}

export function LeaseDocumentControl({ leaseId }: { leaseId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<LeaseDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    async function loadDocument() {
      setLoading(true);
      setError('');
      if (!supabase) {
        setError('إعداد اتصال Supabase غير مكتمل.');
        setLoading(false);
        return;
      }
      try {
        const { data, error: queryError } = await supabase
          .from('lease_documents')
          .select(
            'id, lease_id, owner_id, storage_path, file_name, content_type, file_size, created_at',
          )
          .eq('lease_id', leaseId)
          .maybeSingle();
        if (queryError) throw queryError;
        if (active) setDocument(data as LeaseDocument | null);
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDocument();
    return () => {
      active = false;
    };
  }, [leaseId]);

  async function upload(file: File) {
    setError('');
    setNotice('');
    if (!supabase) {
      setError('إعداد اتصال Supabase غير مكتمل.');
      return;
    }
    if (file.size < 1 || file.size > MAX_FILE_SIZE) {
      setError('يجب أن يكون الملف PDF وألا يتجاوز 25 ميغابايت.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('ارفع ملفًا بصيغة PDF فقط.');
      return;
    }
    const signature = await file.slice(0, 5).text();
    if (signature !== '%PDF-') {
      setError('تعذر التحقق من أن الملف مستند PDF صالح.');
      return;
    }

    setUploading(true);
    let newPath: string | undefined;
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('سجّل الدخول لرفع عقد الإيجار.');

      const { data: lease, error: leaseError } = await supabase
        .from('rently_leases')
        .select('id')
        .eq('id', leaseId)
        .eq('owner_id', authData.user.id)
        .maybeSingle();
      if (leaseError) throw leaseError;
      if (!lease) {
        throw new Error('العقد غير موجود أو لا تملك صلاحية الوصول إليه.');
      }

      const { data: previous, error: previousError } = await supabase
        .from('lease_documents')
        .select('storage_path')
        .eq('lease_id', leaseId)
        .maybeSingle();
      if (previousError) throw previousError;

      newPath = `${authData.user.id}/${leaseId}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, file, {
          cacheControl: '0',
          contentType: 'application/pdf',
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data, error: saveError } = await supabase
        .from('lease_documents')
        .upsert(
          {
            owner_id: authData.user.id,
            lease_id: leaseId,
            storage_path: newPath,
            file_name: file.name.slice(0, 255),
            content_type: 'application/pdf',
            file_size: file.size,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'owner_id,lease_id' },
        )
        .select(
          'id, lease_id, owner_id, storage_path, file_name, content_type, file_size, created_at',
        )
        .single();
      if (saveError) throw saveError;

      setDocument(data as LeaseDocument);
      if (previous?.storage_path && previous.storage_path !== newPath) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([previous.storage_path]);
        if (removeError) {
          setNotice(
            'تم حفظ العقد الجديد، لكن تعذر حذف النسخة السابقة من التخزين.',
          );
        } else {
          setNotice('تم حفظ ملف العقد الخاص بهذا العقد.');
        }
      } else {
        setNotice('تم حفظ ملف العقد الخاص بهذا العقد.');
      }
    } catch (uploadError) {
      let cleanupFailed = false;
      if (newPath) {
        const cleanup = await supabase.storage.from(BUCKET).remove([newPath]);
        cleanupFailed = Boolean(cleanup.error);
      }
      setError(`${errorMessage(uploadError)}${cleanupFailed ? ' تعذر تنظيف الملف غير المرتبط؛ لم يتم حفظه كعقد.' : ''}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function download() {
    setError('');
    setNotice('');
    if (!supabase || !document) return;
    setDownloading(true);
    try {
      const { data, error: urlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(document.storage_path, 60, {
          download: document.file_name,
        });
      if (urlError) throw urlError;
      window.location.assign(data.signedUrl);
    } catch (downloadError) {
      setError(errorMessage(downloadError));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section
      data-testid={`lease-document-${leaseId}`}
      className="border border-[#d8e1e8] bg-[#f8fafb] p-3"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center border border-[#cbd8e2] bg-[#e8eef3] text-[#3f7cff]">
          <FileText size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold">ملف عقد الإيجار</p>
          {loading ? (
            <p data-testid="status-document-loading" className="mt-1 text-[11px] text-[#6b8094]">
              جارٍ التحقق من الملف…
            </p>
          ) : document ? (
            <p data-testid={`text-document-name-${leaseId}`} className="mt-1 truncate text-[11px] text-[#536c83]">
              {document.file_name}
            </p>
          ) : (
            <p data-testid={`text-document-empty-${leaseId}`} className="mt-1 text-[11px] text-[#6b8094]">
              لا يوجد ملف محفوظ لهذا العقد بعد.
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {document && (
          <button
            type="button"
            data-testid={`button-download-lease-${leaseId}`}
            onClick={() => void download()}
            disabled={downloading || loading}
            className="inline-flex h-9 items-center gap-2 bg-[#102238] px-3 text-[11px] font-semibold text-white hover:bg-[#214a83] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff]"
          >
            <Download size={13} />
            {downloading ? 'جارٍ تجهيز التنزيل…' : 'تنزيل العقد'}
          </button>
        )}
        <button
          type="button"
          data-testid={`button-upload-lease-${leaseId}`}
          onClick={() => inputRef.current?.click()}
          disabled={uploading || loading}
          className="inline-flex h-9 items-center gap-2 border border-[#c6d3df] bg-[#f4f7f9] px-3 text-[11px] font-semibold text-[#102238] hover:border-[#3f7cff] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff]"
        >
          {uploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
          {uploading ? 'جارٍ رفع الملف…' : document ? 'استبدال الملف' : 'رفع ملف العقد'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          data-testid={`input-lease-file-${leaseId}`}
          className="sr-only"
          onChange={event => {
            const file = event.currentTarget.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>

      {error && (
        <p
          role="alert"
          data-testid={`text-document-error-${leaseId}`}
          className="mt-2 border-r-2 border-[#d4452c] bg-[#fbe9e5] px-2 py-1.5 text-[11px] text-[#a33421]"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          data-testid={`text-document-notice-${leaseId}`}
          className="mt-2 text-[11px] text-[#1d6b45]"
        >
          {notice}
        </p>
      )}
      <p className="mt-2 font-mono text-[9px] text-[#8192a3]">
        خاص ومتاح للمالك فقط · PDF حتى 25 MB
      </p>
    </section>
  );
}
