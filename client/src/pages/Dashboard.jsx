import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import JobForm from "../components/JobForm.jsx";
import JobCard from "../components/JobCard.jsx";
import Layout from "../components/Layout.jsx";

const STAGES = [
  { key: "saved", label: "Saved" },
  { key: "applied", label: "Applied" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new job, job = edit
  const [query, setQuery] = useState("");

  useEffect(() => {
    api("/api/jobs")
      .then((d) => setJobs(d.jobs))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function saveJob(data) {
    if (editing && editing._id) {
      const d = await api("/api/jobs/" + editing._id, { method: "PUT", body: data });
      setJobs((list) => list.map((j) => (j._id === d.job._id ? d.job : j)));
    } else {
      const d = await api("/api/jobs", { method: "POST", body: data });
      setJobs((list) => [d.job, ...list]);
    }
    setEditing(null);
  }

  async function moveJob(job, status) {
    setError("");
    const body = { status };
    if (status === "applied" && !job.appliedDate) {
      body.appliedDate = new Date().toISOString().slice(0, 10);
    }
    try {
      const d = await api("/api/jobs/" + job._id, { method: "PUT", body });
      setJobs((list) => list.map((j) => (j._id === d.job._id ? d.job : j)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeJob(job) {
    if (!window.confirm("Delete " + job.title + " at " + job.company + "?")) return;
    setError("");
    try {
      await api("/api/jobs/" + job._id, { method: "DELETE" });
      setJobs((list) => list.filter((j) => j._id !== job._id));
    } catch (e) {
      setError(e.message);
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.title, j.company, j.location, j.source, j.notes].join(" ").toLowerCase().includes(q)
    );
  }, [jobs, query]);

  const countOf = (key) => jobs.filter((j) => j.status === key).length;

  // Applications sent in the last 7 days, compared with the weekly goal
  const weekAgo = Date.now() - 7 * 86400000;
  const thisWeek = jobs.filter((j) => j.appliedDate && new Date(j.appliedDate).getTime() >= weekAgo).length;
  const goal = user.weeklyGoal || 5;
  const pct = Math.min(100, Math.round((thisWeek / goal) * 100));

  return (
    <Layout>

      <div className="toolbar">
        <h2>Your jobs ({jobs.length})</h2>
        <button className="btn small-btn" onClick={() => setEditing({})}>+ Add job</button>
      </div>

      <div className="card goal">
        <div className="goal-top">
          <b>Weekly goal</b>
          <span className="muted small">{thisWeek} of {goal} applications in the last 7 days</span>
        </div>
        <div className="bar"><div className="bar-fill" style={{ width: pct + "%" }} /></div>
        {thisWeek >= goal && <p className="ok small">Goal reached. Great work!</p>}
      </div>

      <div className="stat-grid">
        {STAGES.map((s) => (
          <div className="card stat" data-stage={s.key} key={s.key}>
            <b>{countOf(s.key)}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <input
        className="search"
        placeholder="Search by title, company, location or notes"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading your jobs...</p>}

      {!loading && jobs.length === 0 && (
        <div className="card empty">
          <b>No jobs yet</b>
          <p className="muted">Tap "+ Add job" to save your first one.</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="board">
          {STAGES.map((s) => {
            const col = visible.filter((j) => j.status === s.key);
            return (
              <section className="column" data-stage={s.key} key={s.key}>
                <h3>{s.label} <span className="muted">({col.length})</span></h3>
                {col.length === 0 && <p className="muted small">Nothing here</p>}
                {col.map((job) => (
                  <JobCard key={job._id} job={job} onMove={moveJob} onEdit={setEditing} onDelete={removeJob} />
                ))}
              </section>
            );
          })}
        </div>
      )}

      {editing && <JobForm job={editing} onSave={saveJob} onCancel={() => setEditing(null)} />}
    </Layout>
  );
}
