const router = require("express").Router();
const auth = require("../middleware/auth");

router.use(auth);

// Remote OK asks apps to credit them and link back. The client page does this.
const FEED = "https://remoteok.com/api";
const CACHE_MS = 15 * 60 * 1000; // keep results for 15 minutes so we don't spam their server
let cache = { time: 0, jobs: [] };

const SENIOR = /\b(senior|sr\.?|lead|staff|principal|head|director|manager|architect|vp|chief)\b/i;
const OPEN_REGION = /(worldwide|anywhere|global|africa|ghana|emea|remote)/i;

const money = (n) => Number(n).toLocaleString("en-US");

function shape(j) {
  const min = Number(j.salary_min) || 0;
  const max = Number(j.salary_max) || 0;
  let salary = "";
  if (min > 0) salary = "$" + money(min) + (max > min ? " - $" + money(max) : "") + " / year";
  return {
    id: String(j.id || j.slug),
    title: j.position,
    company: j.company,
    location: j.location || "",
    tags: Array.isArray(j.tags) ? j.tags.slice(0, 5) : [],
    salary,
    url: j.url || j.apply_url || "https://remoteok.com/",
    date: j.date || "",
  };
}

async function loadJobs() {
  if (cache.jobs.length && Date.now() - cache.time < CACHE_MS) return cache.jobs;
  try {
    const r = await fetch(FEED, {
      headers: { "User-Agent": "JobTrackerApp/1.0 (learning project)", Accept: "application/json" },
    });
    if (!r.ok) throw new Error("Remote OK returned " + r.status);
    const data = await r.json();
    // The first item in the feed is a legal notice, so we keep only real jobs
    const jobs = data.filter((j) => j && j.position && j.company).map(shape);
    cache = { time: Date.now(), jobs };
    return jobs;
  } catch (e) {
    if (cache.jobs.length) return cache.jobs; // use older results if the feed is down
    throw e;
  }
}

// GET /api/remote?q=react&junior=1&region=1
router.get("/", async (req, res) => {
  try {
    let jobs = await loadJobs();

    const words = String(req.query.q || "").toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length) {
      jobs = jobs.filter((j) => {
        const hay = (j.title + " " + j.company + " " + j.tags.join(" ")).toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }
    if (req.query.junior === "1") jobs = jobs.filter((j) => !SENIOR.test(j.title));
    if (req.query.region === "1") jobs = jobs.filter((j) => !j.location || OPEN_REGION.test(j.location));

    res.json({ jobs: jobs.slice(0, 60), total: jobs.length });
  } catch (e) {
    res.status(502).json({ error: "Could not load remote jobs right now. Try again in a minute." });
  }
});

module.exports = router;
