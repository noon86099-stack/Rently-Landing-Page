import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, Plus } from 'lucide-react';
import { useCreateRentlyUnit } from '@workspace/api-client-react';
import { FormNotice, authRequest, errorMessage, inputCls, invalidatePortfolio, primaryBtn } from './shared';

export function AddUnitForm({ token, userId, propertyId }: { token: string; userId: string; propertyId: string }) {
  const qc = useQueryClient();
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const create = useCreateRentlyUnit({ request: authRequest(token) });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!label.trim()) { setError('Unit label required.'); return; }
    try {
      const u = await create.mutateAsync({ propertyId, data: { unitLabel: label.trim() } });
      await invalidatePortfolio(qc, userId, propertyId);
      setSuccess(`Unit ${u.unitLabel} added.`);
      setLabel('');
    } catch (err) {
      setError(errorMessage(err, 'Unit could not be added.'));
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-1.5" aria-label="Add unit">
      <div className="flex gap-1.5">
        <input data-testid="input-unit-label" aria-label="Unit label" placeholder="Unit label, e.g. 2B" value={label} maxLength={80} aria-invalid={!!error} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
        <button data-testid="button-add-unit" disabled={create.isPending} className={primaryBtn}>{create.isPending ? <LoaderCircle size={12} className="animate-spin" /> : <Plus size={12} />}Unit</button>
      </div>
      <FormNotice error={error} success={success} />
    </form>
  );
}
