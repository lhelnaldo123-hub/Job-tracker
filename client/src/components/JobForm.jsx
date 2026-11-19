import { useState } from "react";

const STATUSES = [
  { key: "saved", label: "Saved" },
  { key: "applied", label: "Applied" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
];

const toDateInput = (d) => (d ? String(d).slice(0, 10) : "");

export default function JobForm({ job, onSave, onCancel }) {
  const editing = Boolean(job && job._id);
  const [form, setForm] = useState({
    company: job?.company || "",
    title: job?.title || "",
    link: job?.link || "",
    location: job?.location || "",
    salary: job?.salary || "",
    source: job?.source || "",
    status: job?.status || "saved",
    appliedDate: toDateInput(job?.appliedDate),
    followUpDate: toDateInput(job?.followUpDate),
    notes: job?.notes || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{editing ? "Edit job" : "Add a job"}</h2>

        <div className="row">
          <label>
            Company *
            <input value={form.company} onChange={set("company")} required />
          </label>
          <label>
            Job title *
            <input value={form.title} onChange={set("title")} required />
          </label>
        </div>

        <label>
          Link to the job post
          <input value={form.link} onChange={set("link")} placeholder="https://..." />
        </label>

        <div className="row">
          <label>
            Location
            <input value={form.location} onChange={set("location")} placeholder="Remote, Ghana" />
          </label>
          <label>
            Salary
            <input value={form.salary} onChange={set("salary")} placeholder="$1,000 / month" />
          </label>
        </div>

        <div className="row">
          <label>
            Where you found it
            <input value={form.source} onChange={set("source")} placeholder="LinkedIn, Remote OK..." />
          </label>
          <label>
            Stage
            <select value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="row">
          <label>
            Date applied
            <input type="date" value={form.appliedDate} onChange={set("appliedDate")} />
          </label>
          <label>
            Follow up on
            <input type="date" value={form.followUpDate} onChange={set("followUpDate")} />
          </label>
        </div>

        <label>
          Notes
          <textarea rows="3" value={form.notes} onChange={set("notes")} placeholder="Contact person, email sent, interview questions..." />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn small-btn" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
