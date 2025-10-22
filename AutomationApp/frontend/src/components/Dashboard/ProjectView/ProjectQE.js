// src/components/Dashboard/ProjectView/ProjectQE.js
import React, { useEffect, useMemo, useRef, useState } from 'react';

import * as pbi from 'powerbi-client';

import "../../../styles/roiTabs.css";
import "../../../styles/RecordEntry.css";
import "../../../styles/Dashboard.css";
import ExcelEditor from '../../ExcelEditor';
import 'handsontable/dist/handsontable.full.min.css' 

const { service, factories, models } = pbi;

/* ------------------------------------------------------------------
   [PH1-D] Simple Modal for lightbox (minimal, no external deps)
   ------------------------------------------------------------------ */
function Modal({ open, title, onClose, children, size = "xl" }) {
  const dialogRef = useRef(null);
  useEffect(() => {
   if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
   // focus the dialog container
    const id = setTimeout(() => dialogRef.current?.focus(), 0);
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(id); };
  }, [open, onClose]);
 if (!open) return null;
  const maxW = size === 'md' ? 720 : size === 'lg' ? 880 : 1120;
  return (
   <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e)=>{ if(e.target === e.currentTarget) onClose?.(); }}
     style={{ position:'fixed', inset:0, background:'rgba(2,6,23,.66)',
               display:'grid', placeItems:'center', zIndex: 9999, backdropFilter:'blur(2px)' }}>
      <div
        ref={dialogRef}
       tabIndex={-1}
        style={{
          width:`min(${maxW}px, 95vw)`, maxHeight:'88vh', overflow:'hidden',
         background:'#0f162a', color:'#e5e7eb', borderRadius:16,
          border:'1px solid #1f2a44', boxShadow:'0 24px 80px rgba(0,0,0,.55)',
          display:'grid', gridTemplateRows:'auto 1fr auto'
        }}
     >
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #1f2a44',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                     background:'linear-gradient(180deg,#0b1224,#0f162a)' }}>
          <div style={{ fontWeight:900, letterSpacing:.3 }}>{title}</div>
          <button className="btn-compact" onClick={onClose} aria-label="Close">✕</button>
        </div>
       <div style={{ overflow:'auto', padding:16 }}>
          {children}
        </div>
       <div style={{ padding:12, borderTop:'1px solid #1f2a44', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button className="btn-compact" onClick={onClose}>Close</button>
        </div>
     </div>
    </div>
  );
}


   
   
function PlannedVsCurrentPlaceholder(){
 return (
    <div>
      <div className="muted" style={{ marginBottom:10 }}>
       Graph placeholder — will render the “Planned vs Current” visualization in Phase 2.
      </div>
      <div style={{ height: 420, border:'1px dashed #334155', borderRadius:12,
                    display:'grid', placeItems:'center', background:'#0b1224' }}>
       <span style={{ opacity:.9 }}>Chart Placeholder</span>
      </div>
    </div>
  );
}
function UpdatePlannedPlaceholder(){
 return (
    <div>
      <div className="muted" style={{ marginBottom:10 }}>
        Editable grid placeholder — will connect to <b>DSR Builder - CBPT_DEP v 0.9.6.10.xlsm</b> (sheet: <b>Daily Target</b>) in Phase 2.
     </div>
      <div style={{ height: 420, border:'1px dashed #334155', borderRadius:12,
                    display:'grid', placeItems:'center', background:'#0b1224' }}>
        <span>Grid Placeholder</span>
      </div>
   </div>
  );
}

function DefectDensityPlaceholder(){
  return (
    <div>
      <div className="muted" style={{ marginBottom:10 }}>
        Power BI placeholder — Defect Density report will be embedded here in Phase 2.
      </div>
      <div style={{ height: 420, border:'1px dashed #334155', borderRadius:12,
                    display:'grid', placeItems:'center', background:'#0b1224' }}>
       <span>Power BI Placeholder</span>
      </div>
    </div>
  );
}



/* ------------------------------------------------------------------
   POWER BI EMBED — existing implementation (unchanged)
   ------------------------------------------------------------------ */

function PowerBIEmbed({ reportData, embedUrl, reportId, accessToken }) {
  const containerRef = useRef(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState('');


  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        const pbi = await import('powerbi-client');
        if (!gone) {
          window.__pbi__ = pbi;
          setSdkLoaded(true);
        }
      } catch (e) {
        if (!gone) {
          setSdkLoaded(false);
          setSdkError('powerbi-client not available; falling back to iframe.');
        }
      }
    })();
    return () => { gone = true; };
  }, []);

  useEffect(() => {
    const pbi = window.__pbi__;
    if (!sdkLoaded || !pbi || !accessToken || !reportId || !containerRef.current) return;

    const { service, factories, models } = pbi;
    const svc = new service.Service(
      factories.hpmFactory,
      factories.wpmpFactory,
      factories.routerFactory
    );

    svc.reset(containerRef.current);

    const config = {
      type: 'report',
      id: reportId,
      embedUrl: embedUrl,
      accessToken: accessToken,
      tokenType: models.TokenType.Embed,
      settings: {
        panes: { filters: { visible: false }, pageNavigation: { visible: false } },
        background: models.BackgroundType.Transparent,
      },
    };

    const report = svc.embed(containerRef.current, config);

    report.on('loaded', async () => {
      try {
        if (Array.isArray(reportData?.filters) && reportData.filters.length) {
          await report.updateFilters(models.FiltersOperations.Replace, reportData.filters);
        }
      } catch (e) {
        console.warn('Power BI filter update failed:', e);
      }
    });

    return () => {
      try { report.off('loaded'); } catch {}
      try { svc.reset(containerRef.current); } catch {}
    };
  }, [sdkLoaded, reportData, embedUrl, reportId, accessToken]);

  if (!sdkLoaded || !accessToken || !reportId) {
    return (
      <div>
        {!!sdkError && (
          <div style={{ color: '#6b7280', marginBottom: 6, fontSize: '.9rem' }}>
            {sdkError}
          </div>
        )}
        <iframe
          title="PowerBI Report"
          src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoAuth=true`}
          style={{ width: '100%', height: 560, border: 0, borderRadius: 12 }}
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 560, borderRadius: 12, overflow: 'hidden', background: '#fff' }}
    />
  );
}

/* ------------------------------------------------------------------
   PROJECT QE VIEW — unchanged logic + [PH1-D] new hyperlinks
   ------------------------------------------------------------------ */

const PBI_EMBED_URL =
  process.env.REACT_APP_PBI_EMBED_URL ||
  'https://app.powerbi.com/reportEmbed?reportId=YOUR_REPORT_ID&groupId=YOUR_WORKSPACE_ID';
const PBI_REPORT_ID = process.env.REACT_APP_PBI_REPORT_ID || 'YOUR_REPORT_ID';
const PBI_ACCESS_TOKEN = process.env.REACT_APP_PBI_ACCESS_TOKEN || '';

export default function ProjectQE({ project }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [reportData, setReportData] = useState(null);

  // [PH1-D] modal controls
  const [openPlannedVsCurrent, setOpenPlannedVsCurrent] = useState(false);
  const [openUpdatePlanned, setOpenUpdatePlanned] = useState(false);
  const [openDefectDensity, setOpenDefectDensity] = useState(false);

    useEffect(() => {
    if (!openUpdatePlanned) return;
    const t = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 60);
    return () => clearTimeout(t);
  }, [openUpdatePlanned]);

  
  const label = useMemo(() => {
    return project ? `${project.intake_number} — ${project.intake_name}` : '';
  }, [project]);

  useEffect(() => {
    let abort = false;
    setErr('');
    setReportData(null);

    if (!project?.intake_number || !project?.intake_name) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const url = `http://localhost:5000/api/projects/search?query=${encodeURIComponent(
          String(project.intake_number)
        )}&limit=20`;
        const res = await fetch(url);
        const list = await res.json();

        const found =
          Array.isArray(list) &&
          list.find(
            (p) =>
              String(p.intake_number) === String(project.intake_number) &&
              String(p.intake_name) === String(project.intake_name)
          );

        if (!found) throw new Error('Project not found in search results.');

        const manual_cost =
          found.manual_cost != null ? Number(found.manual_cost) : undefined;
        const automation_cost =
          found.automation_cost != null ? Number(found.automation_cost) : undefined;

        if (
          typeof manual_cost !== 'number' ||
          Number.isNaN(manual_cost) ||
          typeof automation_cost !== 'number' ||
          Number.isNaN(automation_cost)
        ) {
          throw new Error('manual_cost or automation_cost not available for this project.');
        }

        const fUrl = `http://localhost:5000/api/powerbi/filters?manual_cost=${encodeURIComponent(
          manual_cost
        )}&automation_cost=${encodeURIComponent(automation_cost)}`;
        const fres = await fetch(fUrl);
        const fjson = await fres.json();
        if (!fres.ok || !Array.isArray(fjson?.filters)) {
          throw new Error('Failed to build Power BI filters on the server.');
        }

        if (abort) return;

        setReportData({
          filters: fjson.filters,
          meta: { project: label, manual_cost, automation_cost },
        });
      } catch (e) {
        if (!abort) setErr(e.message || 'Failed to load report data.');
      } finally {
        if (!abort) setLoading(false);
      }
    };

    fetchData();
    return () => {
      abort = true;
    };
  }, [project, label]);

  if (!project) {
    return <div className="muted">Select a project to view QE dashboard.</div>;
  }

   return (
    <div className="qe-card"> {/* [PH2-LBX2] subtle card wrapper for a more polished look */}
      
      {(loading || err) && (
        <div className={`status-banner ${err ? 'error' : 'info'}`}>
         {loading ? (
            <>Loading Project QE view for <b>{label}</b>…</>
          ) : (
            <>Error loading Project QE data: <b>{err}</b></>
         )}
        </div>
      )}


      <div className="qe-links-row" style={{ display:'flex', gap:10, marginBottom: 12, flexWrap:'wrap' }}>
        <button className="link-chip" onClick={() => setOpenPlannedVsCurrent(true)}>Planned Vs Current</button>
                <button
          className="link-chip"
          onClick={openUpdatePlannedInNewTab}   // [PH2-NEWTAB-FINAL]
          title="Open editable Excel-like grid in a new tab"
        >
          
          
          Update Planned Count</button>



        <button className="link-chip" onClick={() => setOpenDefectDensity(true)}>Defect Density</button>
      </div>


      <div className="muted" style={{ marginBottom: 8 }}>
        Dynamic data for <b>{label}</b> — manual_cost: <b>{reportData?.meta?.manual_cost}</b>, automation_cost:{' '}
        <b>{reportData?.meta?.automation_cost}</b>
      </div>

      {/* Existing Power BI embed  */}
      {!loading && !err && (
        <PowerBIEmbed
          reportData={reportData}
          embedUrl={PBI_EMBED_URL}
         reportId={PBI_REPORT_ID}
          accessToken={PBI_ACCESS_TOKEN}
        />
      )}

      {/* [PH1-D] Lightboxes — content to be implemented in Phase 2 */}
      <Modal
        open={openPlannedVsCurrent}
        title="Planned Vs Current (Graph View)"
        onClose={() => setOpenPlannedVsCurrent(false)}
        size="lg" 
      >
        <PlannedVsCurrentPlaceholder /> 
      </Modal>

<Modal
  open={openUpdatePlanned}
  title="Update Planned Count (Excel Grid)"
  onClose={() => setOpenUpdatePlanned(false)}
  size="lg"
>
  {/* Give the grid a guaranteed visible area */}
<div
  className="excel-modal-body"
  style={{ display: 'flex', height: '70vh' }}
>
  <ExcelEditor
    initialXlsxUrl={"http://localhost:5000/api/files/DSR%20Builder%20-%20CBPT_DEP%20v%200.9.6.10.xlsm"}
    defaultSheet="Daily Target"
  />
</div>






  
</Modal>

      <Modal
        open={openDefectDensity}
        title="Defect Density (Power BI)"
        onClose={() => setOpenDefectDensity(false)}
      >
        <DefectDensityPlaceholder />
      </Modal>
    </div>
  );
}

/* ==================================================================
   [PH2-NEWTAB-FINAL] New-tab Excel grid (Handsontable + HyperFormula + SheetJS)
   - Loads original workbook from Flask:  GET /api/files/<filename>
   - Saves back to the same place:       POST /api/upload_xlsx
   - No downloads; user edits persist on the server.
   ================================================================== */
function openUpdatePlannedInNewTab() {
const xlsxUrl = `${window.location.origin}/files/${encodeURIComponent('DSR Builder - CBPT_DEP v 0.9.6.10.xlsm')}`;
 const sheetName = "Daily Target";

  let win = window.open("about:blank", "_blank"); 
  if (!win) {
    // Some popup blockers may still return null; try a user-friendly fallback.
    alert("Please allow pop-ups for this site, then click the button again.");
    return;
  }
  try { win.focus(); } catch (_) {}

  // Minimal, self-contained page with CDN assets; mirrors a dedicated editor tab.
 // Uses HOT + HyperFormula UMD + SheetJS to load & render, preserving merges and widths.
  const doc = win.document;        // [PH2-NEWTAB-FIX]
  doc.open();                      // [PH2-NEWTAB-FIX]
  
  doc.write(`<!doctype html>

    <html lang="en">

<head>
 <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Update Planned Count — ${sheetName}</title>
 <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable@14.3.0/dist/handsontable.full.min.css">
 <style>
    :root { --bg:#0b1224; --panel:#0f162a; --muted:#e5e7eb; --border:#1f2a44; }
   html,body{height:100%;margin:0;background:var(--bg);color:var(--muted);font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;}
    .topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;
      padding:10px 14px;border-bottom:1px solid var(--border);
     background:linear-gradient(180deg,#0b1224,#0f162a);position:sticky;top:0;z-index:3}
    .title{font-weight:900;letter-spacing:.2px}
    .btn{border-radius:10px;padding:8px 12px;font-weight:700;color:#0b1020;background:linear-gradient(180deg,#bae6fd,#7dd3fc);
        border:1px solid #38bdf8;box-shadow:0 4px 12px rgba(56,189,248,.35),0 1px 0 rgba(255,255,255,.15) inset;cursor:pointer}
    .wrap{height:calc(100% - 54px);display:grid;grid-template-rows:auto 1fr}
    .status{padding:8px 12px;border-bottom:1px solid var(--border);background:rgba(125,211,252,.09)}
    .host{height:100%;overflow:auto;border:1px solid var(--border);border-radius:12px;margin:12px;background:var(--panel)}
    .handsontable{max-width:100%;box-sizing:border-box}
 </style>
</head>
<body>
  <div class="topbar">
   <div class="title">Update Planned Count — <span style="opacity:.85">${sheetName}</span></div>
    <div style="display:flex;gap:8px">
      <button class="btn" id="saveBtn" title="Download updated sheet as XLSX">Save to XLSX</button>
     <button class="btn" id="closeBtn" title="Close this tab">Close</button>
    </div>
  </div>
  <div class="wrap">
   <div id="status" class="status">Loading workbook…</div>
    <div id="host" class="host"></div>
  </div>

 <!-- UMD bundles -->
  <script src="https://cdn.jsdelivr.net/npm/hyperformula@2.6.0/dist/hyperformula.full.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/handsontable@14.3.0/dist/handsontable.full.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <script>
 (function(){
    const host = document.getElementById('host');
    const status = document.getElementById('status');
    const saveBtn = document.getElementById('saveBtn');
    const closeBtn = document.getElementById('closeBtn');
    closeBtn.onclick = () => window.close();

   const toPxFromWch = (wch) => Math.max(60, Math.min(500, Math.floor(wch * 7 + 12)));
    const toPxFromWpx = (wpx) => Math.max(60, Math.min(500, Math.floor(wpx)));
    const hpt2px = (hpt) => Math.max(18, Math.min(200, Math.round(hpt * 96 / 72)));

    fetch(${JSON.stringify(xlsxUrl)}, { cache:'no-cache' })
      .then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); })
      .then(buf => {
       const wb = XLSX.read(buf, { type: 'array', cellFormula: true, cellStyles: true, cellNF: true });
        const ws = wb.Sheets[${JSON.stringify(sheetName)}] || wb.Sheets[wb.SheetNames[0]];
        if(!ws) throw new Error('Sheet not found: ' + ${JSON.stringify(sheetName)});
        const ref = ws['!ref'] || 'A1';
        const range = XLSX.utils.decode_range(ref);
        const nrows = range.e.r - range.s.r + 1;
       const ncols = range.e.c - range.s.c + 1;

        const data = Array.from({length:nrows}, (_, r) =>
          Array.from({length:ncols}, (_, c) => {
            const addr = XLSX.utils.encode_cell({ r: range.s.r + r, c: range.s.c + c });
            const cell = ws[addr];
            if(!cell) return null;
            if(cell.f != null) return '=' + cell.f;
            return cell.v ?? null;
          })
        );
        const merges = Array.isArray(ws['!merges'])
          ? ws['!merges'].map(m => ({
              row:  (m.s.r - range.s.r),
              col:  (m.s.c - range.s.c),
              rowspan: (m.e.r - m.s.r + 1),
              colspan: (m.e.c - m.s.c + 1),
            }))
          : [];

       const excelCols = ws['!cols'] || [];
        const colWidths = Array.from({ length: ncols }, (_, c) => {
          const meta = excelCols[range.s.c + c];
         if (!meta) return undefined;
          if (typeof meta.wpx === 'number') return toPxFromWpx(meta.wpx);
          if (typeof meta.wch === 'number') return toPxFromWch(meta.wch);
         return undefined;
        });

       const excelRows = ws['!rows'] || [];
        const rowHeights = Array.from({ length: nrows }, (_, r) => {
          const meta = excelRows[range.s.r + r];
          if (!meta) return undefined;
         if (typeof meta.hpx === 'number') return Math.max(18, Math.min(200, Math.floor(meta.hpx)));
          if (typeof meta.hpt === 'number') return hpt2px(meta.hpt);
          return undefined;
        });
        // column headers A, B, C...
        const colHeaders = [];
        for (let c = 0; c < ncols; c++) {
          let n = c, s = '';
         do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
          colHeaders.push(s);
        }

        const engine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
        const hot = new Handsontable(host, {
         data,
          rowHeaders: true,
          colHeaders,
         colWidths,
          rowHeights,
          mergeCells: merges,
         height: '100%',
          stretchH: 'none',
          wordWrap: true,
          autoWrapRow: true,
          manualColumnResize: true,
          manualRowResize: true,
         contextMenu: true,
          formulas: { engine },
          licenseKey: 'non-commercial-and-evaluation',
       });

        status.textContent = 'Loaded. Edit cells and click “Save to XLSX”.';

       saveBtn.onclick = () => {
          const grid = hot.getData();
          const out = XLSX.utils.aoa_to_sheet([]);
         for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
              const v = grid[r][c];
             if (v == null || v === '') continue;
              const addr = XLSX.utils.encode_cell({ r, c });
              if (typeof v === 'string' && v.startsWith('=')) {
                out[addr] = { t:'n', f: v.slice(1) };
             } else if (typeof v === 'number') {
                out[addr] = { t:'n', v };
              } else if (v instanceof Date) {
               out[addr] = { t:'d', v };
              } else {
                out[addr] = { t:'s', v: String(v) };
              }
           }
          }
          out['!ref'] = XLSX.utils.encode_range({ s:{r:0,c:0}, e:{ r:grid.length-1, c:(grid[0]?.length||1)-1 } });
         out['!merges'] = merges.map(m => ({
            s:{ r:m.row, c:m.col },
            e:{ r:m.row + m.rowspan - 1, c:m.col + m.colspan - 1 }
          }));
         const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, out, ${JSON.stringify(sheetName)});
          XLSX.writeFile(wb, 'PlannedCount-'+Date.now()+'.xlsx', { bookType:'xlsx' });
       };
      })
      .catch(err => {
        status.textContent = 'Failed to load: ' + err.message;
     });
  })();
  </script>
</body>
</html>`);
  
  doc.close();   
}
