import { useEffect, useState } from "react";
import { api } from "../api.js";
import Topbar from "../components/Topbar.jsx";

const QUICK = ["front end", "react", "javascript", "full stack", "node"];

function timeAgo(date) {
  if (!date) return "";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return days + " days ago";
}

export default function Jobs() {
  const [draft, setDraft] = useState("front end");
  const [params, setParams] = useState({ q: "front end", junior: true, region: true });
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedLinks, setSavedLinks] = useState(new Set());
  const [savingId, setSavingId] = useState("");

  // Remember which jobs are already on my board, so I don't save them twice
  useEffect(() => {
    api("/api/jobs")
      .then((d) => setSavedLinks(new Set(d.jobs.map((j) => j.link).filter(Boolean))))
      .catch(() => {});
  }, []);

  // Load jobs from my server (which reads the Remote OK feed) when the search changes
  useEffect(() => {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams({
      q: params.q,
      junior: params.junior ? "1" : "0",
      region: params.region ? "1" : "0",
    });
    api("/api/remote?" + qs.toString())
      .then((d) => {
        setJobs(d.jobs);
        setTotal(d.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params]);

  function search(e) {
    e.preventDefault();
    setParams({ ...params, q: draft.trim() });
  }

  function quick(word) {
    setDraft(word);
    setParams({ ...params, q: word });
  }

  async function save(job) {
    setSavingId(job.id);
    setError("");
    try {
      await api("/api/jobs", {
        method: "POST",
        body: {
          company: job.company,
          title: job.title,
          link: job.url,
          location: job.location || "Remote",
          salary: job.salary,
          source: "Remote OK",
          status: "saved",
        },
      });
      setSavedLinks((s) => new Set(s).add(job.url));
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="page">
      <Topbar />

      <h2>Find remote jobs</h2>
      <p className="muted small">Live remote jobs. Tap "Save to board" to track one.</p>

      <form className="finder" onSubmit={search}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search, e.g. react" />
        <button className="btn small-btn">Search</button>
      </form>

      <div className="chips">
        {QUICK.map((w) => (
          <button key={w} type="button" className={"chip" + (params.q === w ? " on" : "")} onClick={() => quick(w)}>
            {w}
          </button>
        ))}
      </div>

      <div className="filters">
        <label>
          <input type="checkbox" checked={params.junior} onChange={(e) => setParams({ ...params, junior: e.target.checked })} />
          Hide senior and lead roles
        </label>
        <label>
          <input type="checkbox" checked={params.region} onChange={(e) => setParams({ ...params, region: e.target.checked })} />
          Open to Ghana, Africa or worldwide
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading jobs...</p>}
      {!loading && !error && <p className="muted small">Showing {jobs.length} of {total} jobs</p>}

      <div className="results">
        {jobs.map((job) => {
          const saved = savedLinks.has(job.url);
          return (
            <div className="card result" key={job.id}>
              <div>
                <b>{job.title}</b>
                <p className="muted">{job.company}</p>
                <div className="meta">
                  <span>{job.location || "Remote"}</span>
                  {job.salary && <span>{job.salary}</span>}
                  {job.date && <span>{timeAgo(job.date)}</span>}
                </div>
                {job.tags.length > 0 && <p className="small muted">{job.tags.join(" · ")}</p>}
              </div>
              <div className="card-actions">
                <a href={job.url} target="_blank" rel="noopener noreferrer">View and apply</a>
                <button className="save-btn" disabled={saved || savingId === job.id} onClick={() => save(job)}>
                  {saved ? "Saved ✓" : savingId === job.id ? "Saving..." : "Save to board"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !error && jobs.length === 0 && (
        <div className="card empty">
          <b>No jobs match</b>
          <p className="muted">Try another word, or switch off a filter.</p>
        </div>
      )}

      <p className="muted small credit">
        Jobs come from <a href="https://remoteok.com" target="_blank" rel="noopener noreferrer">Remote OK</a>. Always check the job post before you apply.
      </p>
    </div>
  );
}
