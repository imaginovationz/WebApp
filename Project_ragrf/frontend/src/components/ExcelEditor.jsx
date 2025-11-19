import React, { useEffect, useMemo, useRef, useState } from "react";
import { HotTable } from "@handsontable/react";
import { HyperFormula } from "hyperformula";
import * as XLSX from "xlsx";

function sheetToAOA(ws) {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
}
function aoaToSheet(aoa) {
  return XLSX.utils.aoa_to_sheet(aoa);
}

export default function ExcelEditor({
  /** e.g. "/api/files/DSR_Builder%20-%20CBPT_DEP_v_0.9.6.10.xlsx" */
  initialXlsxUrl = null,
  defaultSheet = null,
  showDownload = false,   // optional
}) {
  const hotRef = useRef(null);
  const hf = useMemo(() => HyperFormula.buildEmpty({ licenseKey: "agpl-v3" }), []);

  const [sheetNames, setSheetNames] = useState([]);
  const [sheets, setSheets] = useState({}); // { [name]: { aoa, merges } }
  const [activeSheet, setActiveSheet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStamp, setSaveStamp] = useState("");

  const current = activeSheet ? sheets[activeSheet] : { aoa: [[""]], merges: [] };

  // derive filename for save
  const originalFilename = useMemo(() => {
    if (!initialXlsxUrl) return "workbook.xlsx";
    const parts = initialXlsxUrl.split("/");
    try { return decodeURIComponent(parts[parts.length - 1] || "workbook.xlsx"); }
    catch { return parts[parts.length - 1] || "workbook.xlsx"; }
  }, [initialXlsxUrl]);

   // 2) Extension helper
 const originalExt = useMemo(() => {
   const m = originalFilename.match(/\.(xlsx|xlsm)$/i);
   return m ? m[1].toLowerCase() : "xlsx";
 }, [originalFilename]);

  // ---- Loader (shared by mount and post-save reload) -----------------------
  const loadWorkbook = async (opts = { cacheBust: false, preserveActive: false }) => {
    if (!initialXlsxUrl) return;

    const url = opts.cacheBust
      ? `${initialXlsxUrl}${initialXlsxUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
      : initialXlsxUrl;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Load failed: ${res.status}`);
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });

    const names = wb.SheetNames || [];
    const map = {};
    for (const name of names) {
      const ws = wb.Sheets[name];
      const aoa = sheetToAOA(ws);
      const merges = (ws["!merges"] || []).map(m => ({
        row: m.s.r,
        col: m.s.c,
        rowspan: (m.e.r - m.s.r + 1),
        colspan: (m.e.c - m.s.c + 1),
      }));
      map[name] = { aoa: aoa.length ? aoa : [[""]], merges };
    }

    setSheetNames(names);
    setSheets(map);

    if (opts.preserveActive && activeSheet && names.includes(activeSheet)) {
      // keep the sheet user was on
      setActiveSheet(activeSheet);
    } else {
      // choose default or first
      const initial =
        (defaultSheet && names.includes(defaultSheet)) ? defaultSheet :
        names[0] || null;
      setActiveSheet(initial);
    }
  };

  // Initial load
  useEffect(() => {
    loadWorkbook({ cacheBust: false, preserveActive: false })
      .catch(err => console.error("Failed to load workbook:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialXlsxUrl, defaultSheet]);

  // ---- Build workbook from current UI state --------------------------------
  const buildWorkbookFromState = () => {
    const wb = XLSX.utils.book_new();
    for (const name of sheetNames) {
      const isActive = (name === activeSheet);
      const hot = hotRef.current?.hotInstance;
      const aoa = isActive && hot ? hot.getData() : (sheets[name]?.aoa || [[""]]);
      const ws = aoaToSheet(aoa);

      const mergesArr = sheets[name]?.merges || [];
      if (mergesArr.length) {
        ws["!merges"] = mergesArr.map(m => ({
          s: { r: m.row, c: m.col },
          e: { r: m.row + m.rowspan - 1, c: m.col + m.colspan - 1 },
        }));
      }
      XLSX.utils.book_append_sheet(wb, ws, name || "Sheet");
    }
    return wb;
  };

  // ---- Save (silent) + auto reload from server -----------------------------
  const handleSaveToServer = async () => {
    try {
      setSaving(true);
      const wb = buildWorkbookFromState();
      const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const form = new FormData();
      // keep exact filename (server now preserves spaces/hyphens)
      const outName = originalFilename.replace(/\.xlsm$/i, ".xlsx");
      form.append("file", blob, originalFilename);

      const res = await fetch("/api/upload_xlsx", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      // Optional: update cached data for active sheet immediately
      const hot = hotRef.current?.hotInstance;
      if (hot && activeSheet) {
        const updated = hot.getData();
        setSheets(prev => ({ ...prev, [activeSheet]: { ...prev[activeSheet], aoa: updated } }));
      }

      // Now reload from server (cache-busted), preserving current tab
      await loadWorkbook({ cacheBust: true, preserveActive: true });

      const stamp = new Date().toLocaleTimeString();
      setSaveStamp(`Saved & reloaded ${stamp}`);
    } catch (e) {
      console.error(e);
      setSaveStamp("Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStamp(""), 2500);
    }
  };

  const handleDownload = () => {
    const wb = buildWorkbookFromState();
    const outName = originalFilename.replace(/\.xlsm$/i, ".xlsx");
//    XLSX.writeFile(wb, `Edited_${outName}`);
 XLSX.writeFile(wb, `Edited_${originalFilename}`, {
   bookType: originalExt === "xlsm" ? "xlsm" : "xlsx"
 });
;

  };

  return (
    <div style={{ width: "100%", maxWidth: "100vw", height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderBottom: "1px solid #ddd", alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={handleSaveToServer} disabled={saving} style={{ padding: "6px 12px", borderRadius: 6, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving…" : "Save"}
        </button>
        {showDownload && (
          <button onClick={handleDownload} style={{ padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}>
            Download .xlsx
          </button>
        )}
        <div style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>{saveStamp}</div>

        {/* Sheet tabs */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", overflowX: "auto" }}>
          {sheetNames.map(name => (
            <button
              key={name}
              onClick={() => setActiveSheet(name)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid " + (activeSheet === name ? "#444" : "#ccc"),
                background: activeSheet === name ? "#f2f2f2" : "#fff",
                whiteSpace: "nowrap",
                cursor: "pointer"
              }}
              title={name}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid area with scrollbars */}
      <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <HotTable
          ref={hotRef}
          data={current.aoa}
          rowHeaders
          colHeaders
          width="100%"
          height="100%"
          stretchH="none"         // horizontal scrollbar when needed
          autoColumnSize={false}
          colWidths={120}
          contextMenu
          manualColumnResize
          manualRowResize
          filters
          dropdownMenu
          formulas={{ engine: hf }}
          mergeCells={current.merges?.length ? current.merges : undefined}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
    </div>
  );
}




