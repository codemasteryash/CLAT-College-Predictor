<div align="center">

# ⚖️ CLAT College Predictor

### Find out which National Law University you can realistically get into — instantly.

A lightweight, client-side React tool that predicts your CLAT college range using real 2025 closing rank data, tiered into **Safe**, **Moderate**, and **Ambitious** picks.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![No Backend](https://img.shields.io/badge/Backend-None%20needed-2F8F5B)]()
[![License](https://img.shields.io/badge/License-MIT-black)]()

</div>

---

## 🎯 What it does

Enter your **CLAT All-India Rank** and **category** — the tool instantly sorts every major NLU into three tiers based on how your rank compares to that college's actual 2025 closing rank:

| Tier | Meaning |
|---|---|
| 🟢 **Safe** | Comfortably inside last year's closing rank |
| 🟡 **Moderate** | Right around where last year's counselling closed |
| 🔴 **Ambitious** | A stretch — possible if later rounds move like last year |

No login, no backend, no data collection — everything runs entirely in your browser.

---

## ✨ Features

- 🏛️ **27 NLUs covered** — from NLSIU Bengaluru to the newer state law universities
- 🎯 **Category-aware predictions** — General, EWS, OBC, SC, ST, each with its own tier logic
- 📊 **Real 2025 closing rank data** — sourced from official CLAT consortium counselling results
- ⚖️ **Volatility-adjusted tiers** — General category uses tighter bands (historically stable), while reserved categories use wider bands to reflect their documented year-to-year swings
- ⚡ **Instant results** — no page reload, no API calls, no waiting
- 🎨 **Clean, modern UI** — built with Tailwind, fully responsive

---

## 🖥️ Tech Stack

- **React 18** — component logic & state
- **Vite** — dev server & build tooling
- **Tailwind CSS v4** — styling
- **lucide-react** — icons

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/clat-predictor.git
cd clat-predictor

# Install dependencies
npm install

# Run locally
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`) in your browser.

---

## 🧠 How the prediction logic works

Each NLU has a recorded 2025 closing rank per category. Your rank is compared against it using category-specific margins:

```
General:  0.85× – 1.15×  (tight — general ranks barely move year to year)
EWS:      0.70× – 1.30×
OBC:      0.65× – 1.40×
SC:       0.55× – 1.55×
ST:       0.55× – 1.60×  (wide — reserved categories swing far more year to year)
```

If your rank falls below the *safe* threshold, comfortably better than the closing rank, it's marked **Safe**. Right around the closing rank is **Moderate**. Slightly beyond it, within the *ambitious* threshold, is **Ambitious**. Anything further out isn't shown — the tool would rather leave a college out than give false hope.

---

## ⚠️ Limitations (be upfront about these)

This is a **student-built estimation tool**, not an official predictor. A few honest caveats:

- Based on a **single year (2025)** of closing rank data — not a multi-year trend model
- Only reflects the **All-India quota** — home-state quota seats aren't modeled, so your real odds at some NLUs may be better
- Only covers the **BA LLB (Hons)** program — BBA LLB / BSc LLB / BCom LLB variants have different cutoffs
- A few NLUs are missing category-wise data for OBC/SC/ST/EWS where official source data was inconsistent — those colleges simply won't appear for that category rather than showing a guessed number

---

## 📌 Roadmap

- [ ] Multi-year historical data (2022–2025) for trend-based predictions
- [ ] Home-state quota modeling
- [ ] Program-level granularity (BA LLB vs BBA LLB vs BSc LLB)
- [ ] Backtesting against a held-out year to validate accuracy

---

## 📄 License

MIT — free to use, modify, and build on.

---

<div align="center">
<sub>Built as part of a college predictor tool pitch for CLAT aspirants.</sub>
</div>
