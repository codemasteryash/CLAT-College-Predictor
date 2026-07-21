import React, { useState, useRef } from "react";
import { ArrowRight, Scale } from "lucide-react";

const NLU_DATA = [
  { name: "NLSIU Bengaluru", city: "Bengaluru", general: 112, ews: 703, obc: 1541, sc: 3133, st: 3396 },
  { name: "NALSAR Hyderabad", city: "Hyderabad", general: 159, ews: 546, obc: 1219, sc: 3273, st: 3621 },
  { name: "WBNUJS Kolkata", city: "Kolkata", general: 327, ews: null, obc: null, sc: 4753, st: 6343 },
  { name: "NLIU Bhopal", city: "Bhopal", general: 480, ews: 1377, obc: 1757, sc: 5763, st: 8243 },
  { name: "NLU Jodhpur", city: "Jodhpur", general: 367, ews: 986, obc: 1776, sc: 5445, st: 5955 },
  { name: "GNLU Gandhinagar", city: "Gandhinagar", general: 444, ews: 1118, obc: 2303, sc: 5934, st: 8568 },
  { name: "HNLU Raipur", city: "Raipur", general: 807, ews: null, obc: 2408, sc: 7660, st: 10507 },
  { name: "RGNUL Patiala", city: "Patiala", general: 1279, ews: null, obc: 2067, sc: 8625, st: 12742 },
  { name: "RMLNLU Lucknow", city: "Lucknow", general: 780, ews: null, obc: null, sc: null, st: null },
  { name: "CNLU Patna", city: "Patna", general: 1398, ews: null, obc: null, sc: null, st: null },
  { name: "NUSRL Ranchi", city: "Ranchi", general: 1667, ews: 2551, obc: 3597, sc: 9902, st: 15023 },
  { name: "NLU Odisha", city: "Cuttack", general: 1013, ews: null, obc: null, sc: 7247, st: 12967 },
  { name: "NLUJAA Assam", city: "Guwahati", general: 2141, ews: null, obc: null, sc: null, st: null },
  { name: "DSNLU Visakhapatnam", city: "Visakhapatnam", general: 1682, ews: 2571, obc: 3813, sc: 9330, st: 15632 },
  { name: "TNNLU Tiruchirappalli", city: "Tiruchirappalli", general: 1763, ews: null, obc: 4082, sc: 10327, st: 15384 },
  { name: "MNLU Mumbai", city: "Mumbai", general: 1473, ews: null, obc: null, sc: null, st: null },
  { name: "MNLU Nagpur", city: "Nagpur", general: 1529, ews: null, obc: null, sc: null, st: null },
  { name: "MNLU Aurangabad", city: "Aurangabad", general: 1949, ews: null, obc: null, sc: null, st: null },
  { name: "HPNLU Shimla", city: "Shimla", general: 2555, ews: null, obc: null, sc: 11597, st: 18083 },
  { name: "MPDNLU Jabalpur", city: "Jabalpur", general: 2243, ews: 2922, obc: 4228, sc: 11065, st: 20674 },
  { name: "DBRANLU Sonepat", city: "Sonepat", general: 1930, ews: 2727, obc: 4210, sc: 12802, st: 19973 },
  { name: "NLUT Agartala", city: "Agartala", general: 2855, ews: null, obc: null, sc: null, st: null },
  { name: "RPNLU Prayagraj", city: "Prayagraj", general: 2469, ews: null, obc: null, sc: null, st: null },
  { name: "IIULER Goa", city: "Goa", general: 2784, ews: 3623, obc: 5597, sc: 14412, st: 21325 },
  { name: "GNLU Silvassa Campus", city: "Silvassa", general: 1461, ews: 2620, obc: null, sc: 8826, st: 15112 },
  { name: "NUALS Kochi", city: "Kochi", general: 1346, ews: null, obc: null, sc: null, st: null },
];

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

const TIER_STYLES = {
  safe: { label: "Safe", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200", hint: "Comfortably inside last year's closing rank" },
  moderate: { label: "Moderate", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700 border-amber-200", hint: "Right around where last year's counselling closed" },
  ambitious: { label: "Ambitious", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700 border-rose-200", hint: "A stretch — possible if later rounds move like last year" },
};

export default function CLATPredictor() {
  const [rank, setRank] = useState("");
  const [category, setCategory] = useState("general");
  const [results, setResults] = useState(null);
  const resultsRef = useRef(null);

  function handlePredict() {
    const r = parseInt(rank, 10);
    if (!r || r <= 0) return;

    const tiers = { safe: [], moderate: [], ambitious: [] };
    const margins = CATEGORY_MARGINS[category];

    NLU_DATA.forEach((nlu) => {
      const closing = nlu[category];
      if (closing === null || closing === undefined) return;

      if (r <= closing * margins.safe) tiers.safe.push({ ...nlu, closing });
      else if (r <= closing) tiers.moderate.push({ ...nlu, closing });
      else if (r <= closing * margins.ambitious) tiers.ambitious.push({ ...nlu, closing });
    });

    Object.values(tiers).forEach((list) => list.sort((a, b) => a.closing - b.closing));
    setResults({ rank: r, category, tiers });

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const total = results ? results.tiers.safe.length + results.tiers.moderate.length + results.tiers.ambitious.length : 0;

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center px-4 py-14">
      {/* Hero */}
      <div className="w-full max-w-2xl text-center mb-10">
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
          realistically get into, based on 2025 closing rank data.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            ✓ Free
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
            ✓ No Login Required
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
            ✓ 2025 CLAT Cutoff Data
          </span>
        </div>
      </div>

      <div className="w-full max-w-md h-px bg-gray-100 mb-10"></div>

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
        <div className="flex flex-wrap gap-2 mb-7">
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

        <button
          onClick={handlePredict}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-200"
        >
          Predict My CLAT Colleges
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>

        <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
          Based on CLAT 2025 All-India quota cutoff data · Free · No signup required
        </p>
      </div>

      {/* Results */}
      {results && (
        <div ref={resultsRef} className="w-full max-w-3xl mt-12 scroll-mt-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold text-gray-900">Your Predicted Range</h2>
            <p className="text-xs font-semibold text-violet-500 tracking-wide mt-1">
              RANK {results.rank} · {results.category.toUpperCase()} CATEGORY · {total} MATCHES FOUND
            </p>
          </div>

          {total === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500 text-sm border border-gray-100">
              No NLUs matched within a realistic range for this rank and category
              based on 2025 data.
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
                        <p className="text-xs text-gray-400 mb-3">{nlu.city}</p>
                        <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2.5">
                          <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                            2025 CLOSING RANK
                          </span>
                          <span className="text-sm font-bold text-gray-900">{nlu.closing}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}