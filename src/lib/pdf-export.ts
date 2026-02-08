import type { jsPDF } from "jspdf";

// ── Types ──────────────────────────────────────────────────────────────

export interface PdfReportData {
  keyword: string;
  validation?: {
    category?: string;
    reason?: string;
    trendName?: string;
  };
  basicMetrics?: {
    interestOverTime?: { time: string; formattedTime: string; value: number }[];
    topRegions?: { name: string; value: number }[];
    relatedQueries?: {
      top?: { query: string; value: number }[];
      rising?: { query: string; value: number }[];
    };
    metrics?: {
      currentInterest: number;
      peakInterest: number;
      averageInterest: number;
      trendDirection: string;
      weekOverWeekChange: number;
      monthOverMonthChange: number;
      volatility: number;
      daysFromPeak: number;
      consistencyScore: number;
    };
    llmInterpretation?: string;
  };
  advancedInferences?: {
    phase?: string;
    velocity?: string;
    overallRiskScore?: number;
    collapseProbability?: number;
    timeToCollapse?: string;
    llmAnalysis?: string;
    trendTriade?: {
      communityFragmentation: { score: number; indicators: string[]; detail: string };
      semanticSaturation: { score: number; indicators: string[]; detail: string };
      commercialExhaustion: { score: number; indicators: string[]; detail: string };
    };
    deltaVelocity?: number | { value: number; label: string; detail: string };
    peakWidth?: number | { days: number; label: string; detail: string };
    decayHalfLife?: number | { days: number; label: string; detail: string };
    regionalSkew?: {
      concentration?: number;
      dominantRegion?: string;
      isGlobal?: boolean;
    };
  };
  verdict?: {
    pros?: { title: string; detail: string; impact: number }[];
    cons?: { title: string; detail: string; impact: number }[];
    verdict?: string;
    confidence?: number;
    summary?: string;
    timeHorizon?: string;
    riskLevel?: string;
    actionItems?: string[];
    opportunityWindow?: string;
  };
  metricsHistory?: {
    date: string;
    entropy?: number;
    modularity?: number;
    clustering?: number;
    volume?: number;
  }[];
  newsHeadlines?: string[];
  newsArticles?: { title: string; description: string; source: string; date: string }[];
  newsSentiment?: string;
  phase?: string;
  summary?: string;
  decayScore?: number;
  healthScore?: number;
}

export interface ChartImages {
  candlestick?: string; // base64 data URL
  triade?: string;
  metricsHistory?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────

const CYAN = [0, 188, 212] as const; // brand accent
const DARK = [30, 30, 40] as const;
const PAGE_W = 210; // A4 mm
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Check remaining space; add page if needed. Returns new Y. */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  y = ensureSpace(doc, y, 14);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CYAN);
  doc.text(title.toUpperCase(), MARGIN, y);
  y += 2;
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  return y + 6;
}

function drawKeyValue(doc: jsPDF, label: string, value: string, x: number, y: number): number {
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 130);
  doc.text(label, x, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 50);
  doc.text(value, x, y + 5);
  return y + 12;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth);
}

function numVal(v: number | { value?: number; days?: number } | undefined): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return v;
  return v.value ?? v.days;
}

// ── Main Export ─────────────────────────────────────────────────────────

export async function generateTrendReport(
  data: PdfReportData,
  chartImages: ChartImages,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const metrics = data.basicMetrics?.metrics;
  const adv = data.advancedInferences;
  const verd = data.verdict;
  const category = data.validation?.category || "General";
  const phase = adv?.phase || data.phase || "Unknown";
  const verdictText = verd?.verdict || (data.healthScore && data.healthScore > 60 ? "BUY" : data.healthScore && data.healthScore > 40 ? "HOLD" : "WATCH");

  let y = 20;

  // ─── Page 1: Header + Key Metrics ─────────────────────────────────────

  // Brand header bar
  doc.setFillColor(...DARK);
  doc.rect(0, 0, PAGE_W, 38, "F");

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TREND PRISM", MARGIN, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 190);
  doc.text("Multi-Model AI Trend Analysis Report", MARGIN, 23);

  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, MARGIN, 30);

  // Keyword + verdict badge
  y = 48;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 50);
  doc.text(data.keyword, MARGIN, y);

  // Verdict badge
  const badgeColor: Record<string, [number, number, number]> = {
    BUY: [16, 185, 129],
    HOLD: [245, 158, 11],
    WATCH: [239, 68, 68],
  };
  const bc = badgeColor[verdictText.toUpperCase()] || badgeColor.HOLD;
  const badgeX = MARGIN + doc.getTextWidth(data.keyword) + 6;
  doc.setFillColor(...bc);
  doc.roundedRect(badgeX, y - 6, doc.getTextWidth(verdictText.toUpperCase()) + 10, 9, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(verdictText.toUpperCase(), badgeX + 5, y - 0.5);

  // Subline
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 110);
  const subParts = [`Category: ${category}`, `Phase: ${phase}`];
  if (verd?.riskLevel) subParts.push(`Risk: ${verd.riskLevel}`);
  if (verd?.confidence != null) subParts.push(`Confidence: ${verd.confidence}%`);
  doc.text(subParts.join("  •  "), MARGIN, y);

  // Key metrics grid
  if (metrics) {
    y += 10;
    y = drawSectionTitle(doc, "Key Metrics", y);

    const col1 = MARGIN;
    const col2 = MARGIN + 45;
    const col3 = MARGIN + 90;
    const col4 = MARGIN + 135;

    const row1 = y;
    drawKeyValue(doc, "Current Interest", String(metrics.currentInterest), col1, row1);
    drawKeyValue(doc, "Peak Interest", String(metrics.peakInterest), col2, row1);
    drawKeyValue(doc, "Average Interest", String(metrics.averageInterest.toFixed(1)), col3, row1);
    drawKeyValue(doc, "Trend Direction", metrics.trendDirection, col4, row1);

    const row2 = row1 + 14;
    drawKeyValue(doc, "Week-over-Week", `${metrics.weekOverWeekChange >= 0 ? "+" : ""}${metrics.weekOverWeekChange.toFixed(1)}%`, col1, row2);
    drawKeyValue(doc, "Month-over-Month", `${metrics.monthOverMonthChange >= 0 ? "+" : ""}${metrics.monthOverMonthChange.toFixed(1)}%`, col2, row2);
    drawKeyValue(doc, "Volatility", `${metrics.volatility.toFixed(1)}%`, col3, row2);
    drawKeyValue(doc, "Consistency", `${metrics.consistencyScore.toFixed(1)}%`, col4, row2);

    y = row2 + 16;
  }

  // Candlestick chart — drawn programmatically (HTML div bars can't be SVG-captured)
  const interestData = data.basicMetrics?.interestOverTime;
  if (interestData && interestData.length > 0) {
    y += 4;
    y = ensureSpace(doc, y, 75);
    y = drawSectionTitle(doc, "Interest Over Time", y);

    const chartPoints = interestData.slice(-30);
    const chartH = 50;
    const chartX = MARGIN + 10; // room for y-axis labels
    const chartW = CONTENT_W - 10;
    const maxVal = Math.max(...chartPoints.map(p => p.value), 1);
    const minVal = Math.min(...chartPoints.map(p => p.value), 0);
    const valRange = maxVal - minVal || 1;
    const barW = chartW / chartPoints.length - 0.5;

    // Y-axis labels
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140, 140, 150);
    doc.text(String(maxVal), MARGIN, y + 2);
    doc.text(String(Math.round((maxVal + minVal) / 2)), MARGIN, y + chartH / 2);
    doc.text(String(minVal), MARGIN, y + chartH);

    // Grid lines
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.15);
    for (let g = 0; g <= 2; g++) {
      const gy = y + (g / 2) * chartH;
      doc.line(chartX, gy, chartX + chartW, gy);
    }

    // Bars
    for (let i = 0; i < chartPoints.length; i++) {
      const p = chartPoints[i];
      const prev = chartPoints[i - 1]?.value ?? p.value;
      const barH = ((p.value - minVal) / valRange) * chartH;
      const bx = chartX + i * (barW + 0.5);
      const by = y + chartH - barH;

      if (p.value >= prev) {
        doc.setFillColor(0, 200, 220);
      } else {
        doc.setFillColor(240, 60, 100);
      }
      doc.rect(bx, by, barW, barH, "F");
    }

    // MA7 line
    doc.setDrawColor(0, 240, 255);
    doc.setLineWidth(0.6);
    for (let i = 1; i < chartPoints.length; i++) {
      const startSlice = chartPoints.slice(Math.max(0, i - 7), i);
      const prevSlice = chartPoints.slice(Math.max(0, i - 8), i - 1 < 0 ? 0 : i);
      if (prevSlice.length === 0) continue;
      const ma = startSlice.reduce((a, b) => a + b.value, 0) / startSlice.length;
      const prevMa = prevSlice.reduce((a, b) => a + b.value, 0) / prevSlice.length;
      const x1 = chartX + (i - 1) * (barW + 0.5) + barW / 2;
      const x2 = chartX + i * (barW + 0.5) + barW / 2;
      const y1 = y + chartH - ((prevMa - minVal) / valRange) * chartH;
      const y2 = y + chartH - ((ma - minVal) / valRange) * chartH;
      doc.line(x1, y1, x2, y2);
    }

    // X-axis: first and last date labels
    doc.setFontSize(6);
    doc.setTextColor(140, 140, 150);
    doc.text(chartPoints[0].formattedTime, chartX, y + chartH + 4);
    const lastLabel = chartPoints[chartPoints.length - 1].formattedTime;
    doc.text(lastLabel, chartX + chartW - doc.getTextWidth(lastLabel), y + chartH + 4);

    y += chartH + 8;
  }

  // About / AI Interpretation
  const summaryText = data.basicMetrics?.llmInterpretation || adv?.llmAnalysis || data.summary || verd?.summary;
  if (summaryText) {
    y = ensureSpace(doc, y, 30);
    y = drawSectionTitle(doc, "AI Analysis", y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 70);
    const lines = wrapText(doc, summaryText, CONTENT_W, 9);
    for (const line of lines) {
      y = ensureSpace(doc, y, 5);
      doc.text(line, MARGIN, y);
      y += 4.5;
    }
    y += 4;
  }

  // Deep analysis (if different from summary)
  const deepAnalysis = adv?.llmAnalysis && verd?.summary && adv.llmAnalysis !== verd.summary ? adv.llmAnalysis : null;
  if (deepAnalysis && deepAnalysis !== summaryText) {
    y = ensureSpace(doc, y, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CYAN);
    doc.text("Deep Analysis", MARGIN, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 70);
    const lines = wrapText(doc, deepAnalysis, CONTENT_W, 9);
    for (const line of lines) {
      y = ensureSpace(doc, y, 5);
      doc.text(line, MARGIN, y);
      y += 4.5;
    }
    y += 4;
  }

  // ─── Metrics History chart ────────────────────────────────────────────

  if (chartImages.metricsHistory) {
    y = ensureSpace(doc, y, 80);
    y = drawSectionTitle(doc, "Metrics History", y);
    doc.addImage(chartImages.metricsHistory, "PNG", MARGIN, y, CONTENT_W, 60);
    y += 65;
  }

  // ─── Triade ───────────────────────────────────────────────────────────

  if (adv?.trendTriade || chartImages.triade) {
    y = ensureSpace(doc, y, 70);
    y = drawSectionTitle(doc, "Trend Triade — Decay Signals", y);

    if (chartImages.triade) {
      // SVG viewBox is 300x280 — preserve aspect ratio, center it
      const triadeH = 80;
      const triadeW = triadeH * (300 / 280);
      const triadeX = MARGIN + (CONTENT_W - triadeW) / 2;
      doc.addImage(chartImages.triade, "PNG", triadeX, y, triadeW, triadeH);
      y += triadeH + 4;
    }

    if (adv?.trendTriade) {
      const dims = [
        { name: "Community Fragmentation", ...adv.trendTriade.communityFragmentation },
        { name: "Semantic Saturation", ...adv.trendTriade.semanticSaturation },
        { name: "Commercial Exhaustion", ...adv.trendTriade.commercialExhaustion },
      ];
      for (const dim of dims) {
        y = ensureSpace(doc, y, 18);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 50);
        doc.text(`${dim.name}: ${dim.score}/100`, MARGIN, y);
        y += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 90);
        const detailLines = wrapText(doc, dim.detail, CONTENT_W, 8);
        for (const line of detailLines) {
          y = ensureSpace(doc, y, 4);
          doc.text(line, MARGIN, y);
          y += 3.8;
        }
        y += 3;
      }
    }
  }

  // ─── Velocity Metrics ─────────────────────────────────────────────────

  const dv = numVal(adv?.deltaVelocity);
  const pw = numVal(adv?.peakWidth);
  const dhl = numVal(adv?.decayHalfLife);
  if (dv != null || pw != null || dhl != null) {
    y = ensureSpace(doc, y, 22);
    y = drawSectionTitle(doc, "Velocity Metrics", y);

    const velParts: string[] = [];
    if (dv != null) velParts.push(`Delta Velocity: ${dv.toFixed(1)}`);
    if (pw != null) velParts.push(`Peak Width: ${pw} days`);
    if (dhl != null) velParts.push(`Decay Half-Life: ${dhl} days`);
    if (adv?.collapseProbability != null) velParts.push(`Collapse Prob: ${adv.collapseProbability}%`);
    if (adv?.timeToCollapse) velParts.push(`Time to Collapse: ${adv.timeToCollapse}`);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 70);
    doc.text(velParts.join("  •  "), MARGIN, y);
    y += 8;
  }

  // ─── Pros & Cons ──────────────────────────────────────────────────────

  if ((verd?.pros && verd.pros.length > 0) || (verd?.cons && verd.cons.length > 0)) {
    y = ensureSpace(doc, y, 30);
    y = drawSectionTitle(doc, "Pros & Cons", y);

    if (verd?.pros && verd.pros.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.text("PROS", MARGIN, y);
      y += 5;
      for (const pro of verd.pros) {
        y = ensureSpace(doc, y, 10);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 50);
        doc.text(`+ ${pro.title}`, MARGIN + 2, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 90);
        const lines = wrapText(doc, pro.detail, CONTENT_W - 4, 8);
        for (const line of lines) {
          y = ensureSpace(doc, y, 4);
          doc.text(line, MARGIN + 4, y);
          y += 3.8;
        }
        y += 2;
      }
    }

    if (verd?.cons && verd.cons.length > 0) {
      y += 2;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(239, 68, 68);
      doc.text("CONS", MARGIN, y);
      y += 5;
      for (const con of verd.cons) {
        y = ensureSpace(doc, y, 10);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 50);
        doc.text(`- ${con.title}`, MARGIN + 2, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 90);
        const lines = wrapText(doc, con.detail, CONTENT_W - 4, 8);
        for (const line of lines) {
          y = ensureSpace(doc, y, 4);
          doc.text(line, MARGIN + 4, y);
          y += 3.8;
        }
        y += 2;
      }
    }
  }

  // ─── Action Items ─────────────────────────────────────────────────────

  if (verd?.actionItems && verd.actionItems.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = drawSectionTitle(doc, "Action Items", y);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 70);
    for (const item of verd.actionItems) {
      y = ensureSpace(doc, y, 5);
      const lines = wrapText(doc, `- ${item}`, CONTENT_W - 4, 9);
      for (const line of lines) {
        y = ensureSpace(doc, y, 4);
        doc.text(line, MARGIN + 2, y);
        y += 3.5;
      }
    }

    if (verd.timeHorizon) {
      y += 1;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 110);
      doc.text(`Time Horizon: ${verd.timeHorizon}`, MARGIN, y);
      y += 4;
    }
    if (verd.opportunityWindow) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 110);
      doc.text(`Opportunity Window: ${verd.opportunityWindow}`, MARGIN, y);
      y += 6;
    }
  }

  // ─── Sentiment ────────────────────────────────────────────────────────

  if (data.newsSentiment || metrics?.trendDirection) {
    y = ensureSpace(doc, y, 16);
    y = drawSectionTitle(doc, "Sentiment", y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 70);
    const sentParts: string[] = [];
    if (data.newsSentiment) sentParts.push(`News Sentiment: ${data.newsSentiment}`);
    if (metrics?.trendDirection) sentParts.push(`Trend Direction: ${metrics.trendDirection}`);
    if (metrics?.weekOverWeekChange != null)
      sentParts.push(`WoW Change: ${metrics.weekOverWeekChange >= 0 ? "+" : ""}${metrics.weekOverWeekChange.toFixed(1)}%`);
    doc.text(sentParts.join("  •  "), MARGIN, y);
    y += 8;
  }

  // ─── News Headlines ──────────────────────────────────────────────────

  if (data.newsHeadlines && data.newsHeadlines.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = drawSectionTitle(doc, "News Headlines", y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 70);
    for (const headline of data.newsHeadlines.slice(0, 10)) {
      y = ensureSpace(doc, y, 6);
      const lines = wrapText(doc, `• ${headline}`, CONTENT_W - 2, 9);
      for (const line of lines) {
        y = ensureSpace(doc, y, 5);
        doc.text(line, MARGIN + 2, y);
        y += 4.5;
      }
    }
    y += 4;
  }

  // ─── Related / Rising Queries ─────────────────────────────────────────

  const topQ = data.basicMetrics?.relatedQueries?.top;
  const risingQ = data.basicMetrics?.relatedQueries?.rising;
  if ((topQ && topQ.length > 0) || (risingQ && risingQ.length > 0)) {
    y = ensureSpace(doc, y, 20);
    y = drawSectionTitle(doc, "Related Queries", y);

    if (topQ && topQ.length > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 50);
      doc.text("Top Queries", MARGIN, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 70);
      for (const q of topQ.slice(0, 8)) {
        y = ensureSpace(doc, y, 5);
        doc.text(`${q.query} (${q.value})`, MARGIN + 2, y);
        y += 4.5;
      }
      y += 3;
    }

    if (risingQ && risingQ.length > 0) {
      y = ensureSpace(doc, y, 10);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 50);
      doc.text("Rising Queries", MARGIN, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 70);
      for (const q of risingQ.slice(0, 8)) {
        y = ensureSpace(doc, y, 5);
        doc.text(`${q.query} (${q.value})`, MARGIN + 2, y);
        y += 4.5;
      }
      y += 3;
    }
  }

  // ─── Footer ───────────────────────────────────────────────────────────

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 170);
    doc.text("TREND PRISM V2.0 • Multi-Model AI Pipeline • Groq + Gemini + Featherless", MARGIN, 290);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN - 20, 290);
  }

  // Save
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const safeKeyword = data.keyword.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40);
  doc.save(`TREND_PRISM_${safeKeyword}_${dateStr}.pdf`);
}
