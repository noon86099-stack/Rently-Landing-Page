import type { Language } from './i18n';

const errors: Record<string, string> = {
  'Invalid login credentials': 'البريد أو كلمة المرور غير صحيحة.',
  'Email not confirmed': 'لم يتم تأكيد البريد. راجع إعدادات التسجيل في Supabase.',
  'User already registered': 'الحساب مسجّل بالفعل. سجّل الدخول.',
  'Signup is disabled': 'إنشاء الحسابات غير متاح حاليًا.',
  'Failed to fetch': 'تعذّر الاتصال. تحقق من الإنترنت وحاول مجددًا.',
  'Authentication required.': 'سجّل الدخول لإكمال العملية.',
  'Authentication could not be verified.': 'تعذّر التحقق من الجلسة. سجّل الدخول مجددًا.',
  'Rently authentication is not configured.': 'إعداد تسجيل الدخول غير مكتمل.',
  'The requested record was not found.': 'السجل غير موجود أو غير متاح لهذا الحساب.',
  'The requested change conflicts with an existing record.': 'يتعارض التغيير مع سجل موجود. راجع التواريخ والبيانات.',
  'The submitted information is invalid.': 'تحقق من البيانات المدخلة وحاول مجددًا.',
  'The data request could not be completed.': 'تعذّر إكمال الحفظ. حاول مجددًا.',
  'The request could not be completed.': 'تعذّر إكمال الطلب. حاول مجددًا.',
  'The Supabase rent-management migration must be applied before using this feature.': 'يلزم تطبيق تحديث إدارة الإيجارات على قاعدة البيانات لتفعيل هذه الميزة.',
  'This change is not permitted. The database may still need its owner-write policies.': 'الحفظ غير مسموح. راجع صلاحيات المالك في قاعدة البيانات.',
  'Invalid property details.': 'تحقق من بيانات العقار.',
  'Property name and type are required.': 'اسم العقار ونوعه مطلوبان.',
  'Invalid unit details.': 'تحقق من بيانات الوحدة.',
  'Unit label is required.': 'اسم أو رقم الوحدة مطلوب.',
  'Invalid lease details.': 'تحقق من بيانات المستأجر والعقد والتواريخ.',
  'Invalid payment details.': 'تحقق من تاريخ الدفع.',
  'The lease could not be loaded after creation.': 'تم إنشاء العقد لكن تعذّر تحميله. حدّث السجلات قبل المحاولة مجددًا.',
  'Lease not found.': 'العقد غير موجود أو شروطه غير مكتملة.',
  'Lease details were not found.': 'تفاصيل العقد غير متاحة.',
  'Payment date cannot be in the future': 'لا يمكن أن يكون تاريخ الدفع في المستقبل.',
};

export function translateSystemMessage(value: string, language: Language): string {
  if (language === 'en') {
    return Object.entries(errors).find(([, ar]) => ar === value)?.[0] ?? value;
  }
  if (errors[value]) return errors[value];
  if (/Email address .* is invalid/i.test(value)) return 'عنوان البريد غير مقبول. تحقق من كتابته.';
  if (/rate.limit|too many requests|security purposes.*request/i.test(value)) return 'محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.';
  if (/password.*at least|weak.password/i.test(value)) return 'كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل.';
  return value;
}
