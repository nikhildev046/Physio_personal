import { useEffect, useMemo, useState } from "react";
import { exercisesApi, patientsApi } from "../api/services.js";
import { Avatar, SectionHeader, Spinner, Modal, Field, EmptyState } from "../components/ui.jsx";
import { Plus, Dumbbell, Video, Trash } from "../components/Icons.jsx";

const emptyForm = { patientId: "", name: "", sets: 3, reps: 12, videoUrl: "", notes: "" };

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () =>
    Promise.all([exercisesApi.list(), patientsApi.list()]).then(([e, p]) => {
      setExercises(e);
      setPatients(p);
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const byId = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p])), [patients]);

  // Group exercises by patient.
  const grouped = useMemo(() => {
    const map = new Map();
    exercises.forEach((e) => {
      if (!map.has(e.patientId)) map.set(e.patientId, []);
      map.get(e.patientId).push(e);
    });
    return [...map.entries()];
  }, [exercises]);

  const create = async () => {
    if (!form.patientId || !form.name) return;
    setSaving(true);
    const e = await exercisesApi.create({ ...form, sets: Number(form.sets), reps: Number(form.reps) });
    setExercises((prev) => [...prev, e]);
    setSaving(false);
    setModal(false);
    setForm(emptyForm);
  };

  const remove = async (id) => {
    await exercisesApi.remove(id);
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  if (loading) return <Spinner label="Loading exercise plans…" />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Exercise plans"
        subtitle="Assign home exercises to each patient."
        action={
          <button onClick={() => setModal(true)} className="btn-primary">
            <Plus width={16} height={16} /> Assign exercise
          </button>
        }
      />

      {grouped.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No exercises assigned yet" hint="Assign exercises with sets, reps and a demo video." />
      ) : (
        <div className="space-y-5">
          {grouped.map(([pid, items]) => {
            const p = byId[pid];
            return (
              <div key={pid}>
                <div className="mb-2 flex items-center gap-2.5">
                  <Avatar name={p?.name || "?"} size={32} />
                  <span className="font-semibold text-brand-900">{p?.name || "Unknown"}</span>
                  <span className="text-sm text-brand-400">· {items.length} exercise{items.length > 1 ? "s" : ""}</span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {items.map((e) => (
                    <div key={e.id} className="card p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-brand-900">{e.name}</div>
                          <div className="text-sm text-brand-500">{e.sets} sets × {e.reps} reps</div>
                        </div>
                        <button onClick={() => remove(e.id)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-400 hover:bg-rose-50">
                          <Trash width={16} height={16} />
                        </button>
                      </div>
                      {e.notes && <p className="mt-2 text-sm text-brand-500">{e.notes}</p>}
                      {e.videoUrl && (
                        <a href={e.videoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                          <Video width={16} height={16} /> Watch demo
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Assign an exercise"
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button onClick={create} className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Assign"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Patient">
            <select className="input" value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}>
              <option value="">Select…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Exercise name">
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Glute Bridge" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sets">
              <input type="number" min="1" className="input" value={form.sets} onChange={(e) => setForm((f) => ({ ...f, sets: e.target.value }))} />
            </Field>
            <Field label="Reps">
              <input type="number" min="1" className="input" value={form.reps} onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))} />
            </Field>
          </div>
          <Field label="Video link (optional)">
            <input className="input" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://…" />
          </Field>
          <Field label="Notes (optional)">
            <input className="input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
