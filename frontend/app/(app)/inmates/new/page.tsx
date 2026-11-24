'use client';

import { FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Field, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formValues, useSubmit } from '@/lib/hooks';
import { can } from '@/lib/permissions';
import { Inmate } from '@/lib/types';

export default function NewInmatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { run, busy, error } = useSubmit();

  useEffect(() => {
    if (user && !can(user.role, 'createInmate')) router.replace('/inmates');
  }, [user, router]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = formValues(e.currentTarget);
    const body: Record<string, unknown> = {
      fullName: v.fullName,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      status: v.status,
      admissionDate: v.admissionDate,
    };
    if (v.sentenceMonths) body.sentenceMonths = Number(v.sentenceMonths);
    if (v.expectedReleaseDate) body.expectedReleaseDate = v.expectedReleaseDate;
    if (v.kinName && v.kinPhone) {
      body.nextOfKin = { name: v.kinName, phone: v.kinPhone, relationship: v.kinRelationship };
    }
    run(
      async () => {
        const created = await api.post<Inmate>('/inmates', body);
        router.push(`/inmates/${created._id}`);
      },
    );
  }

  return (
    <>
      <PageHeader title="Register inmate" subtitle="The inmate number is generated automatically" />
      <form className="card" onSubmit={onSubmit}>
        <Alert>{error}</Alert>
        <div className="form-grid">
          <Field label="Full name"><input name="fullName" required minLength={2} /></Field>
          <Field label="Date of birth"><input name="dateOfBirth" type="date" required /></Field>
          <Field label="Gender">
            <select name="gender" required defaultValue="male">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="Status">
            <select name="status" defaultValue="awaiting-trial">
              <option value="awaiting-trial">Awaiting trial</option>
              <option value="convicted">Convicted</option>
              <option value="transferred-out">Transferred out</option>
            </select>
          </Field>
          <Field label="Admission date"><input name="admissionDate" type="date" required /></Field>
          <Field label="Sentence (months)" hint="Only for convicted inmates">
            <input name="sentenceMonths" type="number" min={1} max={1200} />
          </Field>
          <Field label="Expected release date"><input name="expectedReleaseDate" type="date" /></Field>
        </div>
        <h3>Next of kin</h3>
        <div className="form-grid">
          <Field label="Name"><input name="kinName" /></Field>
          <Field label="Phone"><input name="kinPhone" /></Field>
          <Field label="Relationship"><input name="kinRelationship" /></Field>
        </div>
        <div className="form-actions">
          <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Register inmate'}</button>
          <button type="button" className="btn btn-light" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </>
  );
}
