import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Home, LoaderCircle, RotateCcw } from 'lucide-react';
import type { RentlyLease } from '@workspace/api-client-react';
import { loadOwnerProperties, loadPropertyDetails } from '@/lib/rently-data';
import { LeaseDocumentControl, type LeaseDocumentStatus } from '@/features/leases/lease-document-control';
import { CreatePropertyForm } from './create-property-form';
import { AddUnitForm } from './add-unit-form';
import { CreateLeaseForm } from './create-lease-form';
import { useI18n, useLocalizedFormats } from '@/lib/i18n';

type Props = { token: string; userId: string; onOpenRecords: (propertyId: string) => void };

const chip = 'border px-2 py-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff] disabled:opacity-50';

function StepHead({ n, title, state, saved }: { n: string; title: string; state: 'done' | 'active' | 'locked'; saved?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid h-6 w-6 shrink-0 place-items-center font-mono text-[10px] ${state === 'done' ? 'bg-[#b5f06b] text-[#102238]' : state === 'active' ? 'bg-[#3f7cff] text-white' : 'border border-[#c5d2de] text-[#8192a3]'}`}>{state === 'done' ? <Check size={12} /> : n}</span>
      <p className={`text-[13px] font-semibold ${state === 'locked' ? 'text-[#8192a3]' : ''}`}>{title}</p>
      {saved && <span data-testid={`text-saved-step-${n}`} className="ms-auto truncate border border-[#cfe0bb] bg-[#eef6e6] px-2 py-0.5 text-[11px] text-[#3d6324]">{t('Saved:', 'محفوظ:')} <bdi>{saved}</bdi></span>}
    </div>
  );
}

function LeaseDueSchedule({ dueDay, payments }: {
  dueDay: number;
  payments: RentlyLease['payments'];
}) {
  const { t, direction } = useI18n();
  const { formatDate } = useLocalizedFormats();
  const dueDates = [...payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div data-testid="lease-due-schedule" className="mt-3 grid gap-1.5 border-t border-[#dce3e9] pt-2 text-[11px]">
      <p className="flex items-center gap-2">
        <span className="text-[#667b8e]">{t('Monthly due day', 'يوم الاستحقاق الشهري')}</span>
        <bdi data-testid="text-lease-due-day" dir="ltr" className="font-mono font-semibold">{dueDay}</bdi>
      </p>
      <div>
        <p className="mb-1 text-[#667b8e]">{t('Generated due dates', 'مواعيد الاستحقاق المحفوظة')}</p>
        <div className="flex flex-wrap gap-1.5">
          {dueDates.slice(0, 3).map((payment) => (
            <span key={payment.id} dir={direction} className="border border-[#cbd8e2] bg-white px-2 py-1 font-mono text-[10px]">
              {formatDate(payment.dueDate)}
            </span>
          ))}
          {dueDates.length > 3 && (
            <span className="px-1 py-1 text-[10px] text-[#667b8e]">
              +{dueDates.length - 3} {t('more', 'مواعيد أخرى')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SetupCompletion({ hasDocument, dueDay, payments, onOpenRecords, onGoHome, onStartAnother }: {
  hasDocument: boolean;
  dueDay: number;
  payments: RentlyLease['payments'];
  onOpenRecords: () => void;
  onGoHome: () => void;
  onStartAnother: () => void;
}) {
  const { t, direction } = useI18n();
  return (
    <section data-testid="card-setup-complete" dir={direction} className="grid gap-3 bg-[#f3f9ec] p-4">
      <div className="flex items-start gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center bg-[#b5f06b] text-[#102238]"><Check size={15} /></span>
        <div>
          <p role="status" className="text-[13px] font-semibold">{t('Setup complete', 'اكتملت الخطوات')}</p>
          <p className="mt-1 text-[11px] text-[#536c83]">
            {hasDocument
              ? t('The lease and its signed file are saved.', 'تم حفظ العقد وملفه الموقّع.')
              : t('The lease is saved. You can upload the signed file later from the lease record.', 'تم حفظ العقد. يمكنك رفع الملف الموقّع لاحقًا من سجل الإيجار.')}
          </p>
        </div>
      </div>
      <LeaseDueSchedule dueDay={dueDay} payments={payments} />
      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid="button-open-records" onClick={onOpenRecords} className="inline-flex items-center gap-1.5 bg-[#102238] px-3 py-2 text-[11px] font-semibold text-white">
          {t('View records', 'عرض السجلات')} <ArrowLeft size={12} className="ltr:rotate-180" />
        </button>
        <button type="button" data-testid="button-go-home" onClick={onGoHome} className="inline-flex items-center gap-1.5 border border-[#c5d4e0] bg-white px-3 py-2 text-[11px] text-[#315b91]">
          <Home size={12} /> {t('Go to homepage', 'الصفحة الرئيسية')}
        </button>
        <button type="button" data-testid="button-next-lease" onClick={onStartAnother} className="border border-[#c5d4e0] px-3 py-2 text-[11px] text-[#315b91]">
          {t('Set up another unit', 'إعداد وحدة أخرى')}
        </button>
      </div>
    </section>
  );
}

export function GuidedSetup({ token, userId, onOpenRecords }: Props) {
  const { t, direction } = useI18n();
  const { formatDate, formatMoney } = useLocalizedFormats();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [newProperty, setNewProperty] = useState(false);
  const [newUnit, setNewUnit] = useState(false);
  const [lease, setLease] = useState<RentlyLease | null>(null);
  const [documentStatus, setDocumentStatus] = useState<LeaseDocumentStatus>('loading');
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const props = useQuery({ queryKey: ['rently-properties', userId], queryFn: () => loadOwnerProperties(userId), staleTime: 0 });
  const details = useQuery({
    queryKey: ['rently-property-details', userId, propertyId],
    queryFn: () => loadPropertyDetails(userId, propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 0,
  });

  const property = props.data?.find((p) => p.id === propertyId);
  const unit = details.data?.units.find((u) => u.id === unitId);
  const properties = props.data ?? [];
  const showPropertyForm = newProperty || (props.isSuccess && properties.length === 0);
  const units = details.data?.units ?? [];
  const showUnitForm = newUnit || (details.isSuccess && units.length === 0);

  function pickProperty(id: string) { setPropertyId(id); setUnitId(null); setLease(null); setDocumentStatus('loading'); setFinished(false); setNewProperty(false); setNewUnit(false); }
  function pickUnit(id: string) { setUnitId(id); setLease(null); setDocumentStatus('loading'); setFinished(false); setNewUnit(false); }
  function restart() { setPropertyId(null); setUnitId(null); setLease(null); setDocumentStatus('loading'); setFinished(false); setNewProperty(false); setNewUnit(false); }
  function startAnotherLease() { setUnitId(null); setLease(null); setDocumentStatus('loading'); setFinished(false); }
  function finishSetup() { setFinished(true); }

  const next = !propertyId ? t('Choose a saved property or add a new one.', 'اختر عقارًا محفوظًا أو أضف عقارًا جديدًا.') : !unitId ? t('Choose or add a unit in this property.', 'اختر وحدة في هذا العقار أو أضف وحدة.') : !lease ? t('Add the tenant and lease for this unit.', 'أضف المستأجر وبيانات العقد لهذه الوحدة.') : documentStatus === 'saved' ? t('The signed file is saved. Finish setup.', 'تم حفظ الملف الموقّع. أنهِ الإعداد.') : t('Upload the signed file, or finish and upload later.', 'ارفع الملف الموقّع أو أنهِ الإعداد وارفعه لاحقًا.');

  return (
    <section dir={direction} id="setup" data-testid="section-guided-setup" className="mt-3 border border-[#3f7cff]/40 bg-[#f8fafb] text-start">
      <fieldset disabled={saving} aria-busy={saving} className="min-w-0">
      {finished && lease && propertyId ? (
        <SetupCompletion
          hasDocument={documentStatus === 'saved'}
          dueDay={lease.dueDay}
          payments={lease.payments}
          onOpenRecords={() => onOpenRecords(propertyId)}
          onGoHome={() => document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' })}
          onStartAnother={startAnotherLease}
        />
      ) : (
      <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8e1e8] bg-[#102238] px-3 py-2.5 text-[#f0f5f8] md:px-4">
        <div>
          <p className="text-[14px] font-semibold">{t('Guided setup: property → unit → tenant and lease', 'إعداد موجّه: عقار ← وحدة ← مستأجر وعقد')}</p>
          <p data-testid="text-next-action" className="mt-0.5 text-[11px] text-[#b5f06b]">{t('Next:', 'الخطوة التالية:')} {next}</p>
        </div>
        {(propertyId || lease) && <button type="button" data-testid="button-restart-setup" onClick={restart} className="inline-flex items-center gap-1.5 border border-[#506175] px-2 py-1 text-[11px] hover:border-[#b5f06b]"><RotateCcw size={12} />{t('Start over', 'بدء من جديد')}</button>}
      </div>

      <div className="grid gap-0 divide-y divide-[#dce3e9]">
        {/* Step 1 */}
        <div className="p-3 md:p-4">
          <StepHead n="1" title={t('Property', 'العقار')} state={property ? 'done' : 'active'} saved={property?.name} />
          {!property && (
            <div className="mt-3 grid gap-2">
              {props.isPending ? (
                <div role="status" aria-label={t('Loading properties', 'جارٍ تحميل العقارات')} className="flex gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-8 w-24 animate-pulse bg-[#e4ebf1]" />)}</div>
              ) : props.isError ? (
                <p role="alert" className="text-[11px] text-red-700">{t('Could not load your properties.', 'تعذّر تحميل عقاراتك.')} <button type="button" onClick={() => void props.refetch()} className="underline">{t('Retry', 'إعادة المحاولة')}</button></p>
              ) : (
                <>
                  {properties.length > 0 && !newProperty && (
                    <div className="flex flex-wrap gap-1.5">
                      {properties.map((p) => (
                        <button key={p.id} type="button" data-testid={`button-setup-property-${p.id}`} onClick={() => pickProperty(p.id)} className={`${chip} border-[#cbd7e1] bg-white hover:border-[#3f7cff]`}><bdi>{p.name}</bdi> <span className="font-mono text-[9px] text-[#8192a3]">{p.units.length} {t('units', 'وحدات')}</span></button>
                      ))}
                      <button type="button" data-testid="button-setup-new-property" onClick={() => setNewProperty(true)} className={`${chip} border-dashed border-[#3f7cff] text-[#315b91]`}>{t('+ New property', '+ عقار جديد')}</button>
                    </div>
                  )}
                  {showPropertyForm && (
                    <div className="border border-[#d8e1e8] bg-white p-3">
                      {properties.length === 0 && <p className="mb-2 text-[11px] text-[#667b8e]">{t('No properties yet. Save your first property.', 'لا توجد عقارات بعد. ابدأ بحفظ أول عقار.')}</p>}
                      <CreatePropertyForm embedded token={token} userId={userId} onCreated={pickProperty} onSavingChange={setSaving} />
                      {newProperty && <button type="button" onClick={() => setNewProperty(false)} className="mt-2 text-[11px] text-[#315b91] underline">{t('Choose a saved property instead', 'العودة لاختيار عقار محفوظ')}</button>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {propertyId && !property && props.isSuccess && <p className="mt-2 text-[11px] text-[#667b8e]">{t('Saved. Updating the list…', 'تم الحفظ. جارٍ تحديث القائمة…')} <button type="button" onClick={() => void props.refetch()} className="underline">{t('Refresh', 'تحديث')}</button></p>}
          {property && <button type="button" onClick={restart} className="mt-2 text-[11px] text-[#315b91] underline">{t('Change property', 'تغيير العقار')}</button>}
        </div>

        {/* Step 2 */}
        <div className="p-3 md:p-4">
          <StepHead n="2" title={t('Unit', 'الوحدة')} state={!propertyId ? 'locked' : unit ? 'done' : 'active'} saved={unit?.unit_label} />
          {propertyId && !unit && (
            <div className="mt-3 grid gap-2">
              {details.isPending ? (
                <div role="status" aria-label={t('Loading units', 'جارٍ تحميل الوحدات')} className="flex gap-2">{[0, 1].map((i) => <div key={i} className="h-8 w-24 animate-pulse bg-[#e4ebf1]" />)}</div>
              ) : details.isError ? (
                <p role="alert" className="text-[11px] text-red-700">{t('Could not load units for this property.', 'تعذّر تحميل وحدات هذا العقار.')} <button type="button" onClick={() => void details.refetch()} className="underline">{t('Retry', 'إعادة المحاولة')}</button></p>
              ) : (
                <>
                  {unitId && <p className="text-[11px] text-[#667b8e]">{t('Unit saved. Updating the list…', 'تم حفظ الوحدة. جارٍ تحديث القائمة…')} <button type="button" onClick={() => void details.refetch()} className="underline">{t('Refresh', 'تحديث')}</button></p>}
                  {units.length > 0 && !newUnit && (
                    <div className="flex flex-wrap gap-1.5">
                      {units.map((u) => (
                        <button key={u.id} type="button" data-testid={`button-setup-unit-${u.id}`} onClick={() => pickUnit(u.id)} className={`${chip} border-[#cbd7e1] bg-white hover:border-[#3f7cff]`}><bdi>{u.unit_label}</bdi> <span className="text-[10px] text-[#8192a3]">{u.leases.length ? `${u.leases.length} ${t('leases', 'عقود')}` : t('Vacant', 'شاغرة')}</span></button>
                      ))}
                      <button type="button" data-testid="button-setup-new-unit" onClick={() => setNewUnit(true)} className={`${chip} border-dashed border-[#3f7cff] text-[#315b91]`}>{t('+ New unit', '+ وحدة جديدة')}</button>
                    </div>
                  )}
                  {showUnitForm && (
                    <div className="border border-[#d8e1e8] bg-white p-3">
                      <AddUnitForm key={propertyId} token={token} userId={userId} propertyId={propertyId} onCreated={pickUnit} onSavingChange={setSaving} />
                      {newUnit && <button type="button" onClick={() => setNewUnit(false)} className="mt-2 text-[11px] text-[#315b91] underline">{t('Choose a saved unit instead', 'العودة لاختيار وحدة محفوظة')}</button>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {unit && !lease && <button type="button" onClick={() => setUnitId(null)} className="mt-2 text-[11px] text-[#315b91] underline">{t('Change unit', 'تغيير الوحدة')}</button>}
        </div>

        {/* Step 3 */}
        <div className="p-3 md:p-4">
          <StepHead n="3" title={t('Tenant and lease', 'المستأجر والعقد')} state={!unit ? 'locked' : lease ? 'done' : 'active'} saved={lease?.tenant.fullName} />
          {unit && !lease && propertyId && details.data && (
            <div className="mt-3 border border-[#d8e1e8] bg-white p-3">
              {details.data.rentSetupRequired ? (
                <p role="alert" className="border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900">{t('Apply the database update before adding a lease. Existing records remain available.', 'إدارة الإيجار تحتاج إلى تحديث قاعدة البيانات قبل إضافة عقد. سجلاتك الحالية ما زالت متاحة.')}</p>
              ) : (
              <CreateLeaseForm key={unit.id} token={token} userId={userId} propertyId={propertyId} units={[unit]} initialUnitId={unit.id} onCreated={(_id, l) => { setDocumentStatus('loading'); setFinished(false); setLease(l); }} onSavingChange={setSaving} />
              )}
            </div>
          )}
            {lease && propertyId && (
            <div data-testid="card-lease-summary" className="mt-3 border border-[#cfe0bb] bg-[#f3f9ec] p-3">
              <p className="text-[12px] font-semibold text-[#3d6324]">{t('The lease was saved in your records.', 'تم حفظ العقد في سجلاتك.')}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-4">
                <div><dt className="text-[#667b8e]">{t('Property / unit', 'العقار / الوحدة')}</dt><dd className="font-semibold"><bdi>{property?.name ?? ''}</bdi> / <bdi>{unit?.unit_label ?? ''}</bdi></dd></div>
                <div><dt className="text-[#667b8e]">{t('Term', 'المدة')}</dt><dd className="font-semibold">{formatDate(lease.startDate)} - {formatDate(lease.endDate)}</dd></div>
                <div><dt className="text-[#667b8e]">{t('Monthly rent', 'الإيجار الشهري')}</dt><dd className="font-semibold">{formatMoney(lease.monthlyRent)} ({t('day', 'يوم')} {lease.dueDay})</dd></div>
                <div><dt className="text-[#667b8e]">{t('Dues', 'المستحقات')}</dt><dd className="font-semibold">{lease.payments.length} {t('monthly payments', 'دفعة شهرية')}</dd></div>
              </dl>
              <LeaseDueSchedule dueDay={lease.dueDay} payments={lease.payments} />
            </div>
          )}
          {details.isFetching && propertyId && <span className="sr-only"><LoaderCircle /></span>}
        </div>
      </div>
      {lease && !finished && (
        <div data-testid="step-contract-upload" className="grid gap-3 border-t border-[#dce3e9] p-3 md:p-4">
          <StepHead
            n="4"
            title={t('Upload signed lease', 'رفع العقد الموقّع')}
            state={documentStatus === 'saved' ? 'done' : 'active'}
            saved={documentStatus === 'saved' ? t('File saved', 'تم رفع الملف') : undefined}
          />
          <p className="text-[11px] text-[#667b8e]">{t('Upload the signed PDF to finish. You can also finish now and upload it later.', 'ارفع ملف PDF الموقّع لإنهاء الخطوات، أو أنهِ الآن وارفعه لاحقًا.')}</p>
          <LeaseDocumentControl leaseId={lease.id} onStatusChange={setDocumentStatus} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="button-finish-setup"
              disabled={documentStatus !== 'saved'}
              onClick={finishSetup}
              className="inline-flex min-h-9 items-center gap-2 bg-[#102238] px-3 py-2 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('Finish setup', 'إنهاء الإعداد')}
            </button>
            {documentStatus !== 'saved' && (
              <button
                type="button"
                data-testid="button-finish-upload-later"
                disabled={documentStatus === 'loading' || documentStatus === 'uploading'}
                onClick={finishSetup}
                className="min-h-9 border border-[#c5d4e0] px-3 py-2 text-[11px] text-[#315b91] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('Finish and upload later', 'إنهاء ورفع الملف لاحقًا')}
              </button>
            )}
          </div>
        </div>
      )}
      </>
      )}
      </fieldset>
    </section>
  );
}
