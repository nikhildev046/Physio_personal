import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { patientsApi } from "../api/services.js";
import { Avatar, Badge, SectionHeader, Spinner, Modal, Field, ProgressBar, EmptyState } from "../components/ui.jsx";
import { Plus, Search, Users, Chevron } from "../components/Icons.jsx";

const emptyForm = { name: "", age: "", gender: "Female", phone: "", condition: "", notes: "" };

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("active");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    patientsApi.list().then(setPatients).finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    return patients
      .filter((p) => (filter === "all" ? true : p.status === filter))
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.condition.toLowerCase().includes(q.toLowerCase())
      );
  }, [patients, q, filter]);

  const create = async () => {
    if (!form.name) return;
    setSaving(true);
    const p = await patientsApi.create({
      ...form,
      age: Number(form.age) || null,
      startedOn: new Date().toISOString().slice(0, 10),
    });
    setPatients((prev) => [p, ...prev]);
    setSaving(false);
    setModal(false);
    setForm(emptyForm);
  };

  if (loading) return <Spinner label="Loading patients…" />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Patients"
        subtitle={`${patients.filter((p) => p.status === "active").length} active`}
        action={
          <button onClick={() => setModal(true)} className="btn-primary">
            <Plus width={16} height={16} /> New patient
          </button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            className="input pl-10"
            placeholder="Search by name or condition…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="inline-flex rounded-xl bg-brand-100/70 p-1">
          {[["active", "Active"], ["discharged", "Discharged"], ["all", "All"]].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                filter === k ? "bg-white text-brand-800 shadow-sm" : "text-brand-500"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Users} title="No patients found" hint="Try a different search or add a new patient." />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {shown.map((p) => (
            <Link key={p.id} to={`/patients/${p.id}`} className="card p-4 transition hover:shadow-soft">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} size={46} tone={p.status === "active" ? "brand" : "slate"} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-brand-900">{p.name}</span>
                    {p.status === "discharged" && <Badge tone="slate">Discharged</Badge>}
                  </div>
                  <div className="truncate text-sm text-brand-500">{p.condition}</div>
                </div>
                <Chevron width={18} height={18} className="text-brand-300" />
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-brand-400">
                  <span>Recovery</span>
                  <span className="font-semibold text-brand-600">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} tone={p.progress >= 100 ? "emerald" : "brand"} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="New patient"
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button onClick={create} className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Add patient"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name">
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Anita Rao" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <input type="number" className="input" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
            </Field>
            <Field label="Gender">
              <select className="input" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </Field>
          </div>
          <Field label="Phone">
            <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 …" />
          </Field>
          <Field label="Condition">
            <input className="input" value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))} placeholder="e.g. Lower back pain" />
          </Field>
          <Field label="Notes">
            <textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
