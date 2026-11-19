const router = require("express").Router();
const auth = require("../middleware/auth");

router.use(auth);

// Job sources. To add another one later, write a function that returns jobs in the
// same shape (see "shape" below) and add it to SOURCES at the bottom.
// Every source must be credited and linked back. The client page does this.
const UA = { "User-Agent": "JobTrackerApp/1.0 (learning project)", Accept: "application/json" };
const CACHE_MS = 30 * 60 * 1000; // keep results 30 minutes so we don't spam their servers

const SENIOR = /\b(senior|sr\.?|lead|staff|principal|head|director|manager|architect|vp|chief)\b/i;
const OPEN_REGION = /(worldwide|anywhere|global|africa|ghana|emea|remote)/i;

const money = (n) => Number(n).toLocaleString("en-US");

function toIso(value) {
  if (!value) return "";
  // Unix seconds (Arbeitnow) or a date string (the others)
  const d = typeof value === "number" ? new Date(value * 1000) : new Date(String(value).replace(" ", "T"));
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

function decode(text = "") {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#039;|&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function getJson(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(url + " returned " + r.status);
  return r.json();
}

// Small helper: cache by key for CACHE_MS, and fall back to old results if the site is down
function cached(store, key, loader) {
  return async () => {
    const hit = store.get(key);
    if (hit && Date.now() - hit.time < CACHE_MS) return hit.jobs;
    try {
      const jobs = await loader();
      store.set(key, { time: Date.now(), jobs });
      if (store.size > 50) store.delete(store.keys().next().value); // keep memory small
      return jobs;
    } catch (e) {
      if (hit) return hit.jobs;
      throw e;
    }
  };
}

/* ---------- Source 1: Remote OK ---------- */
const remoteOkStore = new Map();
async function fromRemoteOk() {
  return cached(remoteOkStore, "all", async () => {
    const data = await getJson("https://remoteok.com/api");
    // The first item in the feed is a legal notice, so we keep only real jobs
    return data
      .filter((j) => j && j.position && j.company)
      .map((j) => {
        const min = Number(j.salary_min) || 0;
        const max = Number(j.salary_max) || 0;
        let salary = "";
        if (min > 0) salary = "$" + money(min) + (max > min ? " - $" + money(max) : "") + " / year";
        return {
          id: "remoteok-" + (j.id || j.slug),
          source: "Remote OK",
          title: j.position,
          company: j.company,
          location: j.location || "",
          tags: Array.isArray(j.tags) ? j.tags.slice(0, 5) : [],
          salary,
          url: j.url || j.apply_url || "https://remoteok.com/",
          date: toIso(j.date),
        };
      });
  })();
}

/* ---------- Source 2: Jobicy (free, no key) ---------- */
const jobicyStore = new Map();
async function fromJobicy(q) {
  const key = q.toLowerCase();
  return cached(jobicyStore, key, async () => {
    const url = "https://jobicy.com/api/v2/remote-jobs?count=100" + (q ? "&tag=" + encodeURIComponent(q) : "");
    const data = await getJson(url);
    return (data.jobs || [])
      .filter((j) => j && j.jobTitle && j.companyName)
      .map((j) => {
        const min = Number(j.salaryMin) || 0;
        const max = Number(j.salaryMax) || 0;
        let salary = "";
        if (min > 0) {
          const cur = j.salaryCurrency || "USD";
          salary = money(min) + (max > min ? " - " + money(max) : "") + " " + cur + (j.salaryPeriod ? " / " + j.salaryPeriod : "");
        }
        const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
        return {
          id: "jobicy-" + j.id,
          source: "Jobicy",
          title: decode(j.jobTitle),
          company: decode(j.companyName),
          location: Array.isArray(j.jobGeo) ? j.jobGeo.join(", ") : j.jobGeo || "",
          tags: [...list(j.jobIndustry), ...list(j.jobType)].map(decode).slice(0, 5),
          salary,
          url: j.url,
          date: toIso(j.pubDate),
        };
      });
  })();
}

/* ---------- Source 3: Arbeitnow (free, no key, mostly Europe) ---------- */
const arbeitStore = new Map();
async function fromArbeitnow() {
  return cached(arbeitStore, "all", async () => {
    const data = await getJson("https://www.arbeitnow.com/api/job-board-api");
    return (data.data || [])
      .filter((j) => j && j.title && j.company_name && j.remote) // this is a remote job finder
      .map((j) => ({
        id: "arbeitnow-" + j.slug,
        source: "Arbeitnow",
        title: decode(j.title),
        company: decode(j.company_name),
        location: j.location || "",
        tags: [...(j.tags || []), ...(j.job_types || [])].slice(0, 5),
        salary: "",
        url: j.url,
        date: toIso(j.created_at),
      }));
  })();
}

const SOURCES = {
  remoteok: { name: "Remote OK", load: () => fromRemoteOk() },
  jobicy: { name: "Jobicy", load: (q) => fromJobicy(q) },
  arbeitnow: { name: "Arbeitnow", load: () => fromArbeitnow() },
};

// GET /api/remote?q=react&junior=1&region=1&sources=remoteok,jobicy,arbeitnow
router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const wanted = String(req.query.sources || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => SOURCES[s]);
    const keys = wanted.length ? wanted : Object.keys(SOURCES);

    // Ask every source at the same time. If one is down, the others still work.
    const results = await Promise.allSettled(keys.map((k) => SOURCES[k].load(q)));
    const failed = [];
    let jobs = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") jobs = jobs.concat(r.value);
      else failed.push(SOURCES[keys[i]].name);
    });

    if (failed.length === keys.length) {
      return res.status(502).json({ error: "Could not load jobs right now. Try again in a minute." });
    }

    // Remove duplicates (same job title at the same company from two sources)
    const seen = new Set();
    jobs = jobs.filter((j) => {
      const k = (j.title + "|" + j.company).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length) {
      jobs = jobs.filter((j) => {
        const hay = (j.title + " " + j.company + " " + j.tags.join(" ")).toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }
    if (req.query.junior === "1") jobs = jobs.filter((j) => !SENIOR.test(j.title));
    if (req.query.region === "1") jobs = jobs.filter((j) => !j.location || OPEN_REGION.test(j.location));

    // Newest first, mixing all sources together
    jobs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    res.json({ jobs: jobs.slice(0, 80), total: jobs.length, failed });
  } catch (e) {
    res.status(502).json({ error: "Could not load jobs right now. Try again in a minute." });
  }
});

module.exports = router;
