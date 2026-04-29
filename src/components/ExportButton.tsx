"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { PdfReportData, ChartImages } from "@/lib/pdf-export";

interface ExportButtonProps {
  data: PdfReportData;
  userRole?: string;
}

/** Serialize an SVG element to a PNG data-URL via offscreen canvas */
function svgToDataUrl(svg: SVGSVGElement, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const svgClone = svg.cloneNode(true) as SVGSVGElement;

    // Inline computed styles so the serialized SVG looks the same
    const origEls = svg.querySelectorAll("*");
    const cloneEls = svgClone.querySelectorAll("*");
    origEls.forEach((origEl, i) => {
      const cs = window.getComputedStyle(origEl);
      const cloneEl = cloneEls[i] as SVGElement | HTMLElement;
      // Copy key visual properties
      for (const prop of ["fill", "stroke", "stroke-width", "opacity", "font-size", "font-family", "font-weight"]) {
        const val = cs.getPropertyValue(prop);
        if (val) cloneEl.style.setProperty(prop, val);
      }
    });

    const bbox = svg.getBoundingClientRect();
    svgClone.setAttribute("width", String(bbox.width));
    svgClone.setAttribute("height", String(bbox.height));
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgClone);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = bbox.width * scale;
      canvas.height = bbox.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#1e1e28";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, bbox.width, bbox.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG rasterization failed"));
    };
    img.src = url;
  });
}

async function captureChart(elementId: string): Promise<string | undefined> {
  const el = document.getElementById(elementId);
  if (!el) return undefined;

  // Find the first SVG inside the container
  const svg = el.querySelector("svg");
  if (!svg) return undefined;

  try {
    return await svgToDataUrl(svg);
  } catch {
    console.warn(`Could not capture chart ${elementId}`);
    return undefined;
  }
}

export default function ExportButton({ data }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Capture SVG chart images (candlestick is drawn programmatically from data)
      const [triade, metricsHistory] = await Promise.all([
        captureChart("trend-chart-triade"),
        captureChart("trend-chart-metrics-history"),
      ]);

      const chartImages: ChartImages = { triade, metricsHistory };

      const { generateTrendReport } = await import("@/lib/pdf-export");
      await generateTrendReport(data, chartImages);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue text-sm transition-colors border border-neon-blue/30 disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Generating…
        </>
      ) : (
        <>
          <Download className="w-4 h-4" /> Export
        </>
      )}
    </button>
  );
}
