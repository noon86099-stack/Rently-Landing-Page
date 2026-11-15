import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, Plus, X } from 'lucide-react';
import { useCreateRentlyProperty } from '@workspace/api-client-react';
import { FormNotice, authRequest, errorMessage, ghostBtn, inputCls, invalidatePortfolio, labelCls, primaryBtn } from './shared';

const TYPES = ['Apartment', 'House', 'Duplex', 'Townhouse', 'Condo', 'Mixed-use'];

export function CreatePropertyForm({ token, userId, onCreated }: { token: string; userId: string; onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Apartment');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const create = useCreateRentlyProperty({ request: authRequest(token) });

  const nameErr = !name.trim() ? 'Name required.' : '';
  const typeErr = !type.trim() ? 'Type required.' : '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError('');
    setSuccess('');
    if (nameErr || typeErr) return;
    try {
      const p = await create.mutateAsync({
        data: { name: name.trim(), propertyType: type.trim(), streetAddress: street.trim() || null, city: city.trim() || null, region: region.trim() || null },
      });
      await invalidatePortfolio(qc, userId, p.id);
      onCreated(p.id);
      setSuccess(`${p.name} created.`);
      setName(''); setStreet(''); setCity(''); setRegion(''); setTouched(false);
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err, 'Property could not be created.'));
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" data-testid="button-open-create-property" onClick={() => { setOpen(true); setSuccess(''); }} className={ghostBtn}><Plus size={11} /> Property</button>
        {success && <FormNotice success={success} />}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-2 grid gap-2 border border-[#cdd9e3] bg-[#f7f9fb] p-3" aria-label="New property">
      <div className="flex items-center justify-between"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#47617a]">New property</p><button type="button" aria-label="Close" onClick={() => setOpen(false)} className="text-[#61768b]"><X size={13} /></button></div>
      <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr]">
        <label className={labelCls}>Name *<input data-testid="input-property-name" value={name} maxLength={160} aria-invalid={touched && !!nameErr} onChange={(e) => setName(e.target.value)} className={inputCls} />{touched && nameErr && <span className="normal-case text-red-700">{nameErr}</span>}</label>
        <label className={labelCls}>Type *<select data-testid="select-property-type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr_.8fr]">
        <label className={labelCls}>Street<input data-testid="input-property-street" value={street} maxLength={240} onChange={(e) => setStreet(e.target.value)} className={inputCls} /></label>
        <label className={labelCls}>City<input data-testid="input-property-city" value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} className={inputCls} /></label>
        <label className={labelCls}>Region<input data-testid="input-property-region" value={region} maxLength={120} onChange={(e) => setRegion(e.target.value)} className={inputCls} /></label>
      </div>
      <FormNotice error={error} success={success} />
      <div><button data-testid="button-create-property" disabled={create.isPending} className={primaryBtn}>{create.isPending && <LoaderCircle size={12} className="animate-spin" />}Create property</button></div>
    </form>
  );
}
