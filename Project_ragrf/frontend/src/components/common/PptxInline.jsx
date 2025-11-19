// src/components/common/PptxInline.jsx
// [PH1-PPTXJS]
import { useEffect, useRef } from "react";

export default function PptxInline({ url, slideMode = true }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const $ = window.$;
    const el = containerRef.current;
    if (!$ || !el || !url) return;

    // Clear old render (if any) before re-initializing
    el.innerHTML = "";

    // Initialize PPTXjs
    try {
      $(el).pptxToHtml({
        pptxFileUrl: url,
        slideMode,          // true = player UI; false = flat HTML
        mediaProcess: true, // attempt to render media
      });
    } catch (e) {
      console.error("PPTXjs render error:", e);
      el.innerHTML = `<div style="color:#e11; padding:8px">Unable to render PPTX</div>`;
    }

    return () => {
      // best-effort cleanup
      try { el.innerHTML = ""; } catch (_) {}
    };
  }, [url, slideMode]);

  return <div id="pptx-view" ref={containerRef} style={{ minHeight: 480 }} />;
}
