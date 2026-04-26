# Flux Strategic Analysis Report — Design Spec

## Overview

**Purpose**: Generate a self-contained HTML report that compiles all strategic analysis findings about the Flux project management platform, suitable for PDF export via Puppeteer.

**Aesthetic**: Dark Executive Dashboard — deep charcoal backgrounds with Flux purple (#7E3BE9) accents, evoking a premium analytics/board-level strategy document.

**Output**: Single `flux-strategic-report.html` file that opens in browser and exports to PDF.

---

## Design System

### Typography
- **Display/Headings**: `DM Serif Display` (Google Fonts) — elegant editorial authority
- **Body**: `IBM Plex Sans` — clean technical readability
- **Data/Mono**: `JetBrains Mono` — metrics, code, scores

### Color Palette (CSS Variables)
```
--bg-base: #0F0F12
--bg-surface: #1A1A20
--bg-elevated: #222230
--border: #2A2A35
--accent: #7E3BE9 (Flux purple)
--accent-glow: rgba(126, 59, 233, 0.3)
--success: #10B981
--warning: #F59E0B
--danger: #EF4444
--text-primary: #F9FAFB
--text-secondary: #9CA3AF
--text-muted: #6B7280
```

### Visual Style
- Cards with subtle border, no heavy shadows
- Purple gradient accents on key callouts
- Subtle grid/noise texture on backgrounds
- Colored left-border accents on callout boxes
- Score badges with circular progress indicators

---

## Page Structure

### 1. Cover Section
- Flux logo (SVG text or icon)
- "Strategic Analysis Report" title
- Date: April 2026
- Overall Viability Score: Large circular gauge (6.5/10)
- 4 Key Metric Cards: MRR Target, Churn Target, Competitive Position, Path to $1M
- Purple gradient hero divider

### 2. Executive Summary
- 6 Dimension Score Cards in a 3×2 grid
  - Product: 8/10, Competition: 5/10, Revenue: 5/10
  - Growth: 4/10, Risk: 3/10, Team: 3/10
- Verdict section with YES/NO badges
- Path to $1M ARR summary paragraph

### 3. Competitive Analysis
- **Expandable Section** (collapsed by default, click to expand)
- Full competitor table: Notion, Asana, ClickUp, Linear, Plane, Height
  - Columns: Competitor, Pricing, Strengths, Weaknesses, Flux Win On, Flux Risk
- Battlecard grid: 6 rows × 2 columns (Win On / Lose On)
- Pricing comparison horizontal bar chart
- Market timing assessment text block

### 4. Growth Engineering
- **Expandable Section**
- Onboarding improvement priority table (5 rows)
- 3 Growth Loops with K-factor badges and flow diagrams
- Retention mechanisms table (5 rows)
- Timeline: 0-30 / 30-90 / 90-180 day actions

### 5. Revenue Model
- **Expandable Section**
- Pricing comparison table: Plan × Current × Recommended
- New revenue streams table with MRR projections
- Trial email sequence timeline
- Unit economics benchmarks bar chart
- LTV:CAC ratio visualization

### 6. Risk Analysis
- **Expandable Section** (expanded by default — critical content)
- Risk matrix heatmap (scatter chart, severity × likelihood)
- Top 10 Risk Register table
- Dependency risk matrix table
- Compliance status checklist
- Fix Now vs Monitor split layout

### 7. Strategic Recommendations
- Priority matrix (2×2: Impact × Effort)
- Immediate / Short-term / Medium-term / Long-term phases
- Top 3 Actions callout boxes with purple gradient

### 8. Path to $1M ARR
- Progress/step chart visualization
- Stage breakdown table

### 9. Footer
- Generated date
- Confidential watermark

---

## Charts (Chart.js via CDN)

1. **Viability Radial** — Doughnut chart, 6.5/10 score
2. **Pricing Bar** — Horizontal bar, Flux vs competitors pricing
3. **Risk Matrix** — Scatter plot with color-coded quadrants
4. **Unit Economics** — Grouped bar (benchmarks vs targets)
5. **Path to $1M** — Stepped area or milestone markers

---

## Expandable Sections

```javascript
// All expandable sections start collapsed except Risk Analysis
// Click header to toggle content visibility
// Purple chevron rotates on expand
```

---

## Print Optimization

```css
@media print {
  .expandable-content { display: block !important; }
  .sidebar { display: none; }
  .section-header { page-break-before: always; }
  body { background: white; color: black; }
}
```

---

## Tech Stack

- Single HTML file, no build step
- Chart.js 4.x via CDN
- Google Fonts via CDN
- Vanilla JS for expandables and print
- Puppeteer for PDF generation (separate script)

---

## PDF Generation

Run via Node script:
```javascript
const puppeteer = require('puppeteer');
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('file:///.../flux-strategic-report.html');
await page.pdf({ path: 'flux-strategic-report.pdf', format: 'A4', printBackground: true });
await browser.close();
```

---

## Content: Condensed Headers + Full Detail in Expandables

- Every major section has a **visible header** with the key takeaway
- Clicking "Read More" / expand icon reveals the full analysis
- This keeps the document scannable while preserving all detail for deep reading
