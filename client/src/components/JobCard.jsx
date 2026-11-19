const STATUSES = [
  { key: "saved", label: "Saved" },
  { key: "applied", label: "Applied" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
];

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function JobCard({ job, onMove, onEdit, onDelete }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const active = job.status === "saved" || job.status === "applied" || job.status === "interview";
  const overdue = active && job.followUpDate && new Date(job.followUpDate) < today;

  const href = job.link ? (/^https?:\/\//i.test(job.link) ? job.link : "https://" + job.link) : "";

  return (
    <div className="card job">
      <b className="job-title">{job.title}</b>
      <span className="muted">{job.company}</span>

      <div className="meta">
        {job.location && <span>{job.location}</span>}
        {job.salary && <span>{job.salary}</span>}
        {job.source && <span>via {job.source}</span>}
      </div>

      {job.appliedDate && <p className="small muted">Applied {formatDate(job.appliedDate)}</p>}
      {job.followUpDate && (
        <p className={"small " + (overdue ? "error" : "muted")}>
          {overdue ? "Follow up overdue: " : "Follow up: "}
          {formatDate(job.followUpDate)}
        </p>
      )}
      {job.notes && <p className="note small">{job.notes}</p>}

      <select value={job.status} onChange={(e) => onMove(job, e.target.value)} aria-label="Move to stage">
        {STATUSES.map((s) => (
          <option key={s.key} value={s.key}>Move to: {s.label}</option>
        ))}
      </select>

      <div className="card-actions">
        {href && <a href={href} target="_blank" rel="noopener noreferrer">Open post</a>}
        <button onClick={() => onEdit(job)}>Edit</button>
        <button className="danger" onClick={() => onDelete(job)}>Delete</button>
      </div>
    </div>
  );
}
