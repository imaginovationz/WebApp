// frontend/src/components/Metrices/AutomationExecutionTab.js
import React, { useEffect, useState } from "react";
import "../../styles/roiTabs.css";
import "../../styles/RecordEntry.css";

// = Scoped CSS and vertical tabs (same as Creation)
const styles = `
.metric-vertabs { display: flex; gap: 12px; }
.metric-vertabs .tablinks { display: flex; flex-direction: column; min-width: 220px; }
.metric-vertabs .tablinks button {
  background: #f7f7f7; border: 1px solid #ddd; padding: 10px 12px;
  text-align: left; cursor: pointer; color: #222;             /* visible text */
}
.metric-vertabs .tablinks button:hover { background: #eee; }  /* hover */
.metric-vertabs .tablinks button.active {
  background: #ffffff; border-right-color: #ffffff; font-weight: 700; color: #111;
}
.metric-vertabs .tabcontent {
  flex: 1; background: #fff; border: 1px solid #ddd; padding: 12px; border-radius: 4px;
}
.metric-table-wrap { overflow-x: auto; }
.metric-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.metric-table th, .metric-table td {
  border: 1px solid #cfd3d7; padding: 8px 10px; vertical-align: top; word-break: break-word; background: #fff;
}
.metric-table thead th { background: #f0f3f6; font-weight: 600; }
.metric-toolbar { display:flex; gap:12px; align-items: end; margin-bottom: 10px; }
.input { width:100%; }
.download-row { display:flex; gap:8px; flex-wrap: wrap; }

/* Collapsible */
.collapse-header {
  display:flex; align-items:center; gap:8px;
  cursor:pointer; user-select:none;
  padding:10px 12px; border:1px solid #e2e6ea; border-radius:6px;
  background:#fafbfc; font-weight:600; margin: 8px 0 12px 0;
}
.collapse-icon { transition: transform .15s ease; }
.collapse-icon.closed { transform: rotate(-90deg); }
.collapse-body { margin-bottom: 16px; }
`;



const FY_OPTIONS = [
  "All Years",
  "FY-2019",
  "FY-2020",
  "FY-2021",
  "FY-2022",
  "FY-2023",
  "FY-2024",
  "FY-2025",
  "FY-2026 (To-Date)",
];

const BREAKDOWN_OPTIONS = [
  "Breakdown by App Fmk & Portfolio",
  "Breakdown by Applications",
];

const fmtMonth = (v) => {
  if (v == null) return "";
  if (v instanceof Date && !isNaN(v)) {
    const m = v.toLocaleString("en-US", { month: "short" }).replace(".", "");
    return `${m}-${String(v.getFullYear()).slice(-2)}`;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (m) {
    const y = +m[1], mo = Math.max(1, Math.min(12, +m[2])) - 1;
    const d = m[3] ? +m[3] : 1;
    const dt = new Date(y, mo, d);
    const mon = dt.toLocaleString("en-US", { month: "short" }).replace(".", "");
    return `${mon}-${String(y).slice(-2)}`;
  }
  return s;
};

function BorderedTable({ headers, rows, sectionKey }) {
      
  if (!headers?.length && !rows?.length) return null;
    const monthColIdx = headers?.findIndex(h => String(h||"").toLowerCase().includes("month"));

  return (
    <div className="metric-table-wrap">
      <table className="metric-table">
        <thead>
          <tr>
            {(headers || []).map((h, i) => (
              <th key={i}>{h || ""}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((r, ri) => (
            <tr key={ri}>
              {(headers || []).map((colName, ci) => {
                const cellKey = `${sectionKey}|r${ri}|c${ci}|${(colName || "").trim()}`;
                return (
                  <td key={ci} data-cell-key={cellKey}>
                    {r?.[ci] ?? ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AutomationExecutionTab() {
  // = New: vertical tab state
  const [vtab, setVtab] = useState("raw");

  const [s1Open, setS1Open] = useState(false);
  const [s2Open, setS2Open] = useState(false);
  const [s3Open, setS3Open] = useState(false);

  const [consData, setConsData] = useState({ headers: [], rows: [] });
  const [consBusy, setConsBusy] = useState(false);
  const [consErr, setConsErr] = useState("");

  const [fy, setFy] = useState("All Years");
  const [breakdown, setBreakdown] = useState(BREAKDOWN_OPTIONS[0]);
  const [monData, setMonData] = useState({ headers: [], rows: [] });
  const [monBusy, setMonBusy] = useState(false);
  const [monErr, setMonErr] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setConsBusy(true);
        setConsErr("");
        const res = await fetch(
          "http://localhost:5000/api/automationmetricsdatafetch?tab=execution&view=consolidated"
        );
        const j = await res.json();
        setConsData({ headers: j?.headers || [], rows: j?.rows || [] });
      } catch (e) {
        setConsErr("Failed to load Consolidated View");
        console.error(e);
      } finally {
        setConsBusy(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setMonBusy(true);
        setMonErr("");
        const qs = new URLSearchParams({
          tab: "execution",
          view: "monthly",
          fy: fy || "",
          breakdown: breakdown || "",
        }).toString();
        const res = await fetch(
          "http://localhost:5000/api/automationmetricsdatafetch?" + qs
        );
        const j = await res.json();
        setMonData({ headers: j?.headers || [], rows: j?.rows || [] });
      } catch (e) {
        setMonErr("Failed to load Monthly Breakdown");
        console.error(e);
      } finally {
        setMonBusy(false);
      }
    };
    run();
  }, [fy, breakdown]);




  // = Download handler (backend to implement)
  const handleDownload = async () => {
    try {
      const qs = new URLSearchParams({ tab: "execution" }).toString();
      const resp = await fetch("http://localhost:5000/api/automationmetricsdownload?" + qs);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Automation_Execution_Report.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("download error", e);
      alert("Download failed. Backend endpoint not implemented yet.");
    }
  };

  return (
    <div className="tab-wrap">
      {/* = Inject scoped styles */}
      <style>{styles}</style>

      <div className="metric-vertabs">
        <div className="tablinks">
          <button
            className={vtab === "raw" ? "active" : ""}
            onClick={() => setVtab("raw")}
          >
            Raw Data
          </button>
          <button
            className={vtab === "powerbi" ? "active" : ""}
            onClick={() => setVtab("powerbi")}
          >
            Report (PowerBI)
          </button>
          <button
            className={vtab === "download" ? "active" : ""}
            onClick={() => setVtab("download")}
          >
            Download Reports
          </button>
        </div>

        <div className="tabcontent">
          {vtab === "raw" && (
            <>

              {/* = Collapsible header for Section 1 */}
              <div className="collapse-header" onClick={() => setS1Open(v => !v)}>
                <span className={`collapse-icon ${s1Open ? "" : "closed"}`}>▾</span>
                <span>Section 1: Consolidated View</span>
              </div>
              {s1Open && (
                <div className="collapse-body">
                  {consBusy ? (
                    <div className="text-gray-600" style={{ marginBottom: 12 }}>Loading…</div>
                  ) : consErr ? (
                    <div className="text-red-600" style={{ marginBottom: 12 }}>{consErr}</div>
                  ) : (
                    <BorderedTable headers={consData.headers} rows={consData.rows} sectionKey="execution.section1" />
                  )}
                </div>
              )}



              {/* Section 2 */}
              {/* Section 2 */}
             <div className="collapse-header" onClick={() => setS2Open(v => !v)} style={{ marginTop: 8 }}>
                <span className={`collapse-icon ${s2Open ? "" : "closed"}`}>▾</span>
                <span>Section 2: Monthly Breakdown</span>
              </div>
              {s2Open && (
                <div className="collapse-body">
                  {monBusy ? <div className="text-gray-600">Loading…</div> :
                   monErr ? <div className="text-red-600">{monErr}</div> :
                   <BorderedTable headers={monData.headers} rows={monData.rows} sectionKey={`execution.section2`} />}
                </div>
              )}


       <div className="collapse-header" onClick={() => setS3Open(v => !v)} style={{ marginTop: 8 }}>
                <span className={`collapse-icon ${s3Open ? "" : "closed"}`}>▾</span>
                <span>Section 3: Fmk / App / Portfolio Level Views</span>
              </div>
              {s3Open && (
                <div className="collapse-body">
                  <div className="metric-toolbar">
                    <div style={{ flex: 1 }}>
                      <label className="small-label">Select a year</label>
                      <select className="input" value={fy} onChange={(e) => setFy(e.target.value)}>
                        {FY_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="small-label">Select a Breakdown View</label>
                      <select className="input" value={breakdown} onChange={(e) => setBreakdown(e.target.value)}>
                        {BREAKDOWN_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
                      </select>
                    </div>
                  </div>
                  {/* (intentionally no table here) */}
                </div>
              )}
            </>
          )}

          {vtab === "powerbi" && (
            <>
              <div className="tab-section tab-section-yellow">PowerBI Report</div>
              <div className="text-gray-600">
                Placeholder for embedded PowerBI report.
              </div>
            </>
          )}

          {vtab === "download" && (
            <>
              <div className="tab-section tab-section-yellow">Download Reports</div>
              <div className="download-row">
                <button className="btn" onClick={handleDownload}>Download Excel</button>
              </div>
              <div className="text-gray-600" style={{ marginTop: 12 }}>
                The workbook will contain:
                <ul style={{ marginLeft: 18 }}>
                  <li>Sheet 1: Section 1 - Consolidated View</li>
                  <li>Multiple sheets for Section 2 - Monthly Breakdown (one per Breakdown View)</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


