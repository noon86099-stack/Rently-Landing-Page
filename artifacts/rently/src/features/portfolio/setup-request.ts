/**
 * Persist only an opaque payload digest and request UUID, never tenant details.
 * Identical submissions retain their key after success so stale tabs and reloads
 * cannot repeat a committed write after its response was lost.
 */
export async function setupRequestId(userId: string, scope: string, payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const fingerprint = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  const key = `rently-create:${userId}:${scope}:${fingerprint}`;
  try {
    // Serialize tabs for the same payload when the Web Locks API is available.
    const readOrCreate = () => {
      const existing = localStorage.getItem(key);
      if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
      const id = crypto.randomUUID();
      localStorage.setItem(key, id);
      return id;
    };
    return navigator.locks ? await navigator.locks.request(key, readOrCreate) : readOrCreate();
  } catch {
    throw new Error('تعذّر حفظ معرّف المحاولة في المتصفح. اسمح بالتخزين المحلي ثم أعد المحاولة؛ لم تُرسل أي بيانات.');
  }
}

export function setupErrorMessage(error: unknown, fallback: string, language: 'ar' | 'en' = 'ar'): string {
  const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 0;
  if (language === 'en') {
    if (status === 401) return 'Your session expired. Sign in again and retry with the same data.';
    if (status === 403) return 'You do not have permission to save this record. Check your account and database permissions.';
    if (status === 404) return 'The property or unit is no longer available. Refresh the list and select it again.';
    if (status === 409) return 'An existing record conflicts with this change. Check for overlapping leases on this unit.';
    if (status === 400) return 'Check the fields and dates. A lease must be at most ten years and include at least one due date.';
    if (status === 503) return 'Apply the database update to enable safe saving. Your existing records remain available.';
    if (error instanceof Error && error.message.startsWith('تعذّر حفظ معرّف')) return 'Could not store the retry identifier. Allow local storage and try again; no data was sent.';
    return `${fallback} If the connection failed after saving, retry with the same data; the record will not be duplicated.`;
  }
  if (status === 401) return 'انتهت جلسة الدخول. سجّل الدخول مجددًا ثم أعد المحاولة بالبيانات نفسها.';
  if (status === 403) return 'لا تملك صلاحية حفظ هذا السجل. تأكد من الحساب وصلاحيات قاعدة البيانات.';
  if (status === 404) return 'لم يعد العقار أو الوحدة متاحًا. حدّث القائمة ثم اختر السجل مجددًا.';
  if (status === 409) return 'يوجد سجل متعارض؛ تأكد من عدم تداخل مدة العقد مع عقد محفوظ للوحدة نفسها.';
  if (status === 400) return 'راجع الحقول والتواريخ. مدة العقد بحد أقصى عشر سنوات ويجب أن تتضمن موعد استحقاق واحدًا على الأقل.';
  if (status === 503) return 'يلزم تطبيق تحديث قاعدة البيانات لتفعيل الحفظ الآمن. سجلاتك الحالية محفوظة ومتاحة.';
  if (error instanceof Error && /[\u0600-\u06ff]/.test(error.message)) return error.message;
  return `${fallback} إذا انقطع الاتصال بعد الحفظ، أعد المحاولة بالبيانات نفسها؛ لن يتكرر السجل.`;
}
