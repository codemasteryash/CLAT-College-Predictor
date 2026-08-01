import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Scale, TrendingUp, MapPin, GraduationCap, History, Info, X } from "lucide-react";
import axios from "axios";


const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

const CATEGORY_MARGINS = {
  general: { safe: 0.85, ambitious: 1.15 },
  ews: { safe: 0.70, ambitious: 1.30 },
  obc: { safe: 0.65, ambitious: 1.40 },
  sc: { safe: 0.55, ambitious: 1.55 },
  st: { safe: 0.55, ambitious: 1.60 },
};

const CATEGORIES = [
  { key: "general", label: "General" },
  { key: "ews", label: "EWS" },
  { key: "obc", label: "OBC" },
  { key: "sc", label: "SC" },
  { key: "st", label: "ST" },
];

const PROGRAMS = [
  { key: "ballb", label: "BA LLB (Hons.)" },
  { key: "bscllb", label: "BSc LLB (Hons.)" },
  { key: "bballb", label: "BBA LLB (Hons.)" },
  { key: "bcomllb", label: "BCom LLB (Hons.)" },
];

const TIER_STYLES = {
  safe: { label: "Safe", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200", hint: "Comfortably inside recent closing ranks" },
  moderate: { label: "Moderate", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700 border-amber-200", hint: "Right around where recent counselling closed" },
  ambitious: { label: "Ambitious", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700 border-rose-200", hint: "A stretch — possible if later rounds move like recent years" },
};

const SOURCES = [
  { label: "Consortium of National Law Universities — official CLAT counselling portal (primary source for all official cutoffs)", url: "https://consortiumofnlus.ac.in" },
  { label: "Careers360 — CLAT cutoff master lists (round-wise, sourced from Consortium PDFs)", url: "https://law.careers360.com/articles/clat-marks-vs-rank" },
  { label: "CollegeDekho — CLAT Round 1 Cutoff archive (2023-2025)", url: "https://www.collegedekho.com/articles/clat-cut-off-opening-closing-ranks-round-1-general-obc-sc-st/" },
  { label: "LawPrepTutorial — NLSIU / NUJS / NLIU Bhopal cut-off archives (multi-year, program-wise)", url: "https://www.lawpreptutorial.com" },
  { label: "CollegeDunia — NLU Jodhpur cutoff archive (BBA LLB)", url: "https://s3.collegedunia.com/university/25834-national-law-university-nlu-jodhpur/cutoff" },
];


const MULTI_YEAR_COLLEGES = [
  "NLSIU Bengaluru", "NALSAR Hyderabad", "WBNUJS Kolkata",
  "GNLU Gandhinagar", "RMLNLU Lucknow", "GNLU Silvassa Campus",
];



async function fetchClosingRanks(category, programLabel) {
  const res = await api.get("/closing-ranks", {
    params: {
      category: category.toUpperCase(),
      program: programLabel,
      quota: "ALL_INDIA",
    },
  });
  return res.data;
}

async function fetchHistory(collegeName, programLabel) {
  try {
    const res = await api.get(`/colleges/${encodeURIComponent(collegeName)}/history`, {
      params: { category: "GENERAL", program: programLabel },
    });
    return res.data; 
  } catch {
    return [];
  }
}

async function logPrediction(payload) {
  try {
    await api.post("/predictions-log", payload);
  } catch {}
}
function computeMarginsFromHistory(history, category) {
  const base = CATEGORY_MARGINS[category];
  if (!history || history.length < 2) return { ...base, source: "category-default" };

  const vals = history.map((h) => h.closingRank);
  const changes = [];
  for (let i = 1; i < vals.length; i++) {
    changes.push(Math.abs(vals[i] - vals[i - 1]) / vals[i - 1]);
  }
  const avgSwing = changes.reduce((a, b) => a + b, 0) / changes.length;

  const safe = Math.max(0.55, 1 - avgSwing * 1.2 - (1 - base.safe) * 0.3);
  const ambitious = Math.min(1.9, 1 + avgSwing * 1.5 + (base.ambitious - 1) * 0.3);
  return { safe, ambitious, source: "trend-adjusted", yearsUsed: history.map((h) => h.year) };
}

function pushToTier(collegeMeta, closing, year, margins, r, tiers, programLabel) {
  const entry = { ...collegeMeta, closing, year, programLabel, marginInfo: margins };
  if (r <= closing * margins.safe) tiers.safe.push(entry);
  else if (r <= closing) tiers.moderate.push(entry);
  else if (r <= closing * margins.ambitious) tiers.ambitious.push(entry);
}

export default function CLATPredictor() {
  const [rank, setRank] = useState("");
  const [category, setCategory] = useState("general");
  const [program, setProgram] = useState("ballb");
  const [homeState, setHomeState] = useState(false);
  const [homeStateMultiplier, setHomeStateMultiplier] = useState(2.5);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [showBacktest, setShowBacktest] = useState(false);
  const [backtestData, setBacktestData] = useState(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const resultsRef = useRef(null);

  
  useEffect(() => {
    if (!showBacktest || backtestData !== null) return;
    (async () => {
      setBacktestLoading(true);
      try {
        const rows = await Promise.all(
          MULTI_YEAR_COLLEGES.map(async (name) => {
            const history = await fetchHistory(name, "BA LLB (Hons.)");
            if (history.length < 2) return null;
            const trainYrs = history.slice(0, -1);
            const testPoint = history[history.length - 1];
            const margins = computeMarginsFromHistory(trainYrs, "general");
            const lastTrainVal = trainYrs[trainYrs.length - 1].closingRank;
            const safeBound = Math.round(lastTrainVal * margins.safe);
            const ambitiousBound = Math.round(lastTrainVal * margins.ambitious);
            const hit = testPoint.closingRank >= safeBound && testPoint.closingRank <= ambitiousBound;
            return {
              name,
              trainYrs: trainYrs.map((h) => h.year),
              testYear: testPoint.year,
              safeBound,
              ambitiousBound,
              actual: testPoint.closingRank,
              hit,
            };
          })
        );
        setBacktestData(rows.filter(Boolean));
      } catch (err) {
        console.error(err);
        setBacktestData([]);
      } finally {
        setBacktestLoading(false);
      }
    })();
  }, [showBacktest, backtestData]);

  async function handlePredict() {
    const r = parseInt(rank, 10);
    if (!r || r <= 0) return;

    setLoading(true);
    setFetchError(null);

    try {
      const programDef = PROGRAMS.find((p) => p.key === program);
      const rows = await fetchClosingRanks(category, programDef.label);

      
      let historyMap = {};
      if (category === "general" && program === "ballb") {
        const relevant = rows.filter((row) => MULTI_YEAR_COLLEGES.includes(row.collegeName));
        const histories = await Promise.all(relevant.map((row) => fetchHistory(row.collegeName, programDef.label)));
        relevant.forEach((row, i) => { historyMap[row.collegeName] = histories[i]; });
      }

      const tiers = { safe: [], moderate: [], ambitious: [] };
      rows.forEach((row) => {
        const closingRaw = row.closingRank;
        const closing = homeState ? Math.round(closingRaw * homeStateMultiplier) : closingRaw;
        const margins = category === "general"
          ? computeMarginsFromHistory(historyMap[row.collegeName], category)
          : { ...CATEGORY_MARGINS[category], source: "category-default" };

        pushToTier(
          { name: row.collegeName, city: row.city },
          closing,
          row.year,
          margins,
          r,
          tiers,
          programDef.label
        );
      });

      Object.values(tiers).forEach((list) => list.sort((a, b) => a.closing - b.closing));
      const total = tiers.safe.length + tiers.moderate.length + tiers.ambitious.length;
      setResults({ rank: r, category, program, homeState, tiers });

      logPrediction({
        rank: r,
        category: category.toUpperCase(),
        programId: null,
        homeStateApplied: homeState,
        resultsCount: total,
      });
    } catch (err) {
      console.error(err);
      const detail = err.response ? `Server responded with ${err.response.status}` : "Couldn't reach the backend";
      setFetchError(`${detail}. Make sure the Spring Boot API is running on ${API_BASE}.`);
    } finally {
      setLoading(false);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  const total = results ? results.tiers.safe.length + results.tiers.moderate.length + results.tiers.ambitious.length : 0;

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center px-4 py-14">
      {/* Hero */}
      <div className="w-full max-w-2xl text-center mb-6">
        <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-600 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-violet-100 mb-6">
          <Scale size={13} strokeWidth={2.5} />
          CLAT College Predictor · 2026
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Find Your{" "}
          <span className="text-violet-600 underline decoration-violet-300 decoration-4 underline-offset-4">
            CLAT College
          </span>{" "}
          Instantly
        </h1>

        <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-6">
          Enter your CLAT rank and category — instantly see which NLUs you can
          realistically get into, based on multi-year closing rank trends
          where available.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            ✓ Free
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
            ✓ No Login Required
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
            ✓ Live Backend Data
          </span>
        </div>
      </div>

      <div className="w-full max-w-md h-px bg-gray-100 mb-2"></div>

      {/* Intake card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Your CLAT Rank
        </label>
        <input
          type="number"
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          placeholder="e.g. 1450"
          className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 mb-1 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50"
        />
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Enter your CLAT All-India Rank from the final merit list.
        </p>

        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Your Category
        </label>
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                category === c.key
                  ? "bg-violet-50 text-violet-700 border-violet-300"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
          <GraduationCap size={14} /> Program
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PROGRAMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setProgram(p.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                program === p.key
                  ? "bg-violet-50 text-violet-700 border-violet-300"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {program !== "ballb" && (
          <p className="text-xs text-amber-600 mb-4 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Program-wise cutoffs are only shown for colleges the backend has
            verified data for. If nothing comes back after predicting, that
            program hasn't been added yet — see "Where does this data come from?"
          </p>
        )}

        <div className="border-t border-gray-100 mt-2 pt-4 mb-6">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <MapPin size={14} /> Apply home-state quota (estimated)
            </span>
            <input
              type="checkbox"
              checked={homeState}
              onChange={(e) => setHomeState(e.target.checked)}
              className="w-4 h-4 accent-violet-600"
            />
          </label>
          {homeState && (
            <div className="mt-3 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2.5">
              <p className="text-xs text-violet-700 leading-relaxed mb-2">
                Home-state seats close much looser than All-India ones — e.g.
                WBNUJS BA LLB General closed at rank 327 (All-India) vs 1093
                (WB domicile) in 2025, a ~3.3x gap. That ratio is specific to
                West Bengal and does <strong>not</strong> generalize cleanly
                to every state — treat this as a rough estimate.
              </p>
              <input
                type="range"
                min="1.2"
                max="4"
                step="0.1"
                value={homeStateMultiplier}
                onChange={(e) => setHomeStateMultiplier(parseFloat(e.target.value))}
                className="w-full accent-violet-600"
              />
              <p className="text-xs text-violet-600 font-semibold text-right">
                {homeStateMultiplier.toFixed(1)}x looser than All-India
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-200"
        >
          {loading ? "Fetching your matches..." : "Predict My CLAT Colleges"}
          {!loading && <ArrowRight size={18} strokeWidth={2.5} />}
        </button>

        {fetchError && (
          <p className="text-xs text-rose-600 text-center mt-3 leading-relaxed bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {fetchError}
          </p>
        )}

        <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
          Based on verified Consortium of NLUs closing-rank data · Free · No signup required
        </p>
      </div>

      {/* Results */}
      {results && (
        <div ref={resultsRef} className="w-full max-w-3xl mt-12 scroll-mt-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold text-gray-900">Your Predicted Range</h2>
            <p className="text-xs font-semibold text-violet-500 tracking-wide mt-1">
              RANK {results.rank} · {results.category.toUpperCase()} CATEGORY ·{" "}
              {(PROGRAMS.find((p) => p.key === results.program) || PROGRAMS[0]).label} ·{" "}
              {results.homeState ? "HOME-STATE (EST.)" : "ALL-INDIA"} · {total} MATCHES FOUND
            </p>
          </div>

          {total === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500 text-sm border border-gray-100">
              No NLUs matched within a realistic range for this rank, category
              and program based on available data.
            </div>
          ) : (
            ["safe", "moderate", "ambitious"].map((tierKey) => {
              const tier = TIER_STYLES[tierKey];
              const list = results.tiers[tierKey];
              if (list.length === 0) return null;

              return (
                <div key={tierKey} className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2.5 h-2.5 rounded-full ${tier.dot}`}></span>
                    <h3 className="text-lg font-bold text-gray-900">{tier.label}</h3>
                    <span className="text-xs text-gray-400">
                      {list.length} colleges · {tier.hint}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {list.map((nlu) => (
                      <div
                        key={nlu.name}
                        className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 relative overflow-hidden"
                      >
                        <span
                          className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tier.pill}`}
                        >
                          {tier.label}
                        </span>
                        <p className="font-bold text-gray-900 pr-16">{nlu.name}</p>
                        <p className="text-xs text-gray-400 mb-3">{nlu.city} · {nlu.programLabel}</p>
                        <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2.5">
                          <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                            {nlu.year} CLOSING RANK{results.homeState ? " (EST.)" : ""}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{nlu.closing}</span>
                        </div>
                        {nlu.marginInfo?.source === "trend-adjusted" && (
                          <p className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-2">
                            <TrendingUp size={11} /> Margin tuned to this college's own {nlu.marginInfo.yearsUsed.length}-year trend
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sources modal */}
      {showSources && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowSources(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Data Sources</h3>
              <button onClick={() => setShowSources(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Every closing rank shown here lives in the backend DB with its
              own source citation attached to that exact row. Where a figure
              couldn't be independently verified, it simply isn't in the
              database yet — you'll see "no verified data" in the app
              instead of a guessed number.
            </p>
            <ul className="space-y-2.5">
              {SOURCES.map((s, i) => (
                <li key={i} className="text-xs text-gray-600 border-b border-gray-100 pb-2.5">
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-violet-600 font-semibold hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Backtest modal */}
      {showBacktest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowBacktest(false)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Backtest: model vs. reality</h3>
              <button onClick={() => setShowBacktest(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              For every college with 2+ verified years of General-category
              data, this checks whether the model's margin — computed only
              from earlier years — would have correctly bracketed the most
              recent year's actual closing rank.
            </p>

            {backtestLoading && (
              <p className="text-sm text-gray-400 text-center py-6">Loading backtest data from the backend...</p>
            )}

            {!backtestLoading && backtestData && backtestData.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                Couldn't load backtest data — make sure the backend is running.
              </p>
            )}

            {!backtestLoading && backtestData && backtestData.length > 0 && (
              <div className="space-y-3">
                {backtestData.map((b) => (
                  <div key={b.name} className="border border-gray-100 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-bold text-sm text-gray-900">{b.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.hit ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                        {b.hit ? "Within range" : "Missed range"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Trained on {b.trainYrs.join(", ")} → predicted band {b.safeBound}–{b.ambitiousBound} for {b.testYear}. Actual {b.testYear} closing rank: <strong>{b.actual}</strong>.
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-gray-400 mt-5 leading-relaxed">
              Small sample size (most colleges here have only 2 verified
              years) — this is a directional check, not a statistically
              robust validation. It gets stronger as more years of official
              data are added to the backend.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}