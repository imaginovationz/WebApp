// src/components/Dashboard/ReleaseView/ReleaseQEHome.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
// [PH1-HOT] Excel-like grid & formulas
import { HotTable } from '@handsontable/react';
//import { HyperFormula } from 'hyperformula';


import * as XLSX from 'xlsx';
// NOTE: you already added the CSS import per your message:
import 'handsontable/dist/handsontable.full.min.css';

const HF = typeof window !== 'undefined' ? window.HyperFormula : null;

export default function ReleaseQEHome({ release }) {
  // [PH1-HOT] State and refs
  const [aoa, setAoa] = useState([]);                 // 2D array for grid (values + "=FORMULAS")
  const [cols, setCols] = useState(0);
  const [mergeCells, setMergeCells] = useState([]);    //  Excel merges -> HOT merges
  const [colWidths, setColWidths] = useState([]);      //  Excel col widths -> HOT colWidths
  const [rowHeights, setRowHeights] = useState([]);


  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const hotRef = useRef(null);
  const wbRef = useRef(null);                         // original workbook (to preserve other sheets on save)
  const engineRef = useRef(null);                     // HyperFormula engine instance

  // [PH1-HOT] Local-first file + sheet to load
  const sheetName = 'Daily Dashboard';
  const localPath = useMemo(() =>
    `${window.location.origin}/files/${encodeURIComponent('TQI CBPT Releases DSR as of Oct 08.xlsm')}`,
  []);

  // [PH1-HOT] Optional SharePoint fallback for inline viewing if local load fails
  const spBase =
    process.env.REACT_APP_SP_DSR_URL || ''; // leave blank if you don’t want SP fallback
  const spEmbed = useMemo(() => {
    if (!spBase) return '';
    const sep = spBase.includes('?') ? '&' : '?';
    // Try edit; switch to action=embedview if tenant disallows edit
    return `${spBase}${sep}action=edit&web=1&wdAllowInteractivity=True&ActiveCell=Daily%20Dashboard!A1`;
  }, [spBase]);

  // [PH1-HOT] Load workbook from local /files, extract sheet as AoA with formulas
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await fetch(localPath, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`Local file not reachable (${res.status})`);
        const buf = await res.arrayBuffer();

        const wb = XLSX.read(buf, {
          type: 'array',
          cellFormula: true,     // keep formulas
          cellNF: true,
          cellStyles: true,
        });
        wbRef.current = wb;

        const ws = wb.Sheets[sheetName] || wb.Sheets[wb.SheetNames[0]];
        if (!ws) throw new Error(`Sheet "${sheetName}" not found`);

        const ref = ws['!ref'] || 'A1';
        const range = XLSX.utils.decode_range(ref);
        const nrows = range.e.r - range.s.r + 1;
        const ncols = range.e.c - range.s.c + 1;

        const data = Array.from({ length: nrows }, (_, r) =>
          Array.from({ length: ncols }, (_, c) => {
            const addr = XLSX.utils.encode_cell({ r: range.s.r + r, c: range.s.c + c });
            const cell = ws[addr];
            if (!cell) return null;
            if (cell.f != null) return '=' + cell.f; // preserve Excel formulas
            return cell.v ?? null;
          })
        );

                // [PH1-HOT-FIX] Map Excel merges to Handsontable's mergeCells config
        const merges = Array.isArray(ws['!merges'])
          ? ws['!merges'].map(m => ({
              row:  (m.s.r - range.s.r),
              col:  (m.s.c - range.s.c),
              rowspan: (m.e.r - m.s.r + 1),
             colspan: (m.e.c - m.s.c + 1),
            }))
          : [];
        // [PH1-HOT-FIX] Column widths (Excel -> pixels). Prefer wpx, else convert wch.
        const excelCols = ws['!cols'] || [];
        const toPxFromWch = (wch) => Math.max(60, Math.min(500, Math.floor(wch * 7 + 12))); // heuristic
       const toPxFromWpx = (wpx) => Math.max(60, Math.min(500, Math.floor(wpx)));
        const colW = Array.from({ length: ncols }, (_, c) => {
          const meta = excelCols[range.s.c + c];
          if (!meta) return undefined;
          if (typeof meta.wpx === 'number') return toPxFromWpx(meta.wpx);
          if (typeof meta.wch === 'number') return toPxFromWch(meta.wch);
          return undefined;
       });

        // [PH1-HOT-FIX] Row heights (best-effort if present)
        const excelRows = ws['!rows'] || [];
        const hpt2px = (hpt) => Math.max(18, Math.min(200, Math.round(hpt * 96 / 72)));
       const rowH = Array.from({ length: nrows }, (_, r) => {
          const meta = excelRows[range.s.r + r];
          if (!meta) return undefined;
          if (typeof meta.hpx === 'number') return Math.max(18, Math.min(200, Math.floor(meta.hpx)));
         if (typeof meta.hpt === 'number') return hpt2px(meta.hpt);
          return undefined;
        });



        if (cancelled) return;
        setAoa(data);
        setCols(ncols);
                setMergeCells(merges);
        setColWidths(colW);
        setRowHeights(rowH);

      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load workbook.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [localPath]);

  // [PH1-HOT] Set up / reset HyperFormula engine when data changes
  useEffect(() => {
    if (engineRef.current) {
      try { engineRef.current.destroy(); } catch {}
      engineRef.current = null;
    }
    if (aoa && aoa.length) {
      engineRef.current = HF?.buildEmpty({
        licenseKey: 'gpl-v3', // HyperFormula requires a license key; GPLv3 is fine here
      });
    }
    return () => {
      if (engineRef.current) {
        try { engineRef.current.destroy(); } catch {}
        engineRef.current = null;
      }
    };
  }, [aoa]);

  // [PH1-HOT] Column A,B,C... headers
  const colHeaders = useMemo(() => {
    const labels = [];
    for (let c = 0; c < cols; c++) {
      let n = c, s = '';
      do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
      labels.push(s);
    }
    return labels;
  }, [cols]);

  // [PH1-HOT] Save current grid back to an .xlsx file (download)
  const saveAsXlsx = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const data = hot.getData(); // formula cells come as strings beginning with '='
    const ws = XLSX.utils.aoa_to_sheet([]); // start blank and fill to preserve formulas explicitly

    for (let r = 0; r < data.length; r++) {
      for (let c = 0; c < data[r].length; c++) {
        const v = data[r][c];
        if (v == null || v === '') continue;
        const addr = XLSX.utils.encode_cell({ r, c });

        if (typeof v === 'string' && v.startsWith('=')) {
          ws[addr] = { t: 'n', f: v.slice(1) };     // write as a formula (without '=')
        } else if (typeof v === 'number') {
          ws[addr] = { t: 'n', v };
        } else if (v instanceof Date) {
          ws[addr] = { t: 'd', v };
        } else {
          ws[addr] = { t: 's', v: String(v) };
        }
      }
    }
    ws['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: data.length - 1, c: (data[0]?.length || 1) - 1 }
    });

    // Update original workbook if we loaded one; otherwise create new
    const wb = wbRef.current ? { ...wbRef.current } : XLSX.utils.book_new();
    if (wbRef.current) {
      wb.Sheets[sheetName] = ws; // replace only Daily Dashboard
    } else {
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    // NOTE: writing .xlsm may strip macros; use .xlsx for safety in the browser
    XLSX.writeFile(wb, `TQI CBPT Releases DSR - Edited (${sheetName}).xlsx`, { bookType: 'xlsx' });
  };

  // [PH1-HOT] UI
  return (
    <div>
      <div className="muted" style={{ marginBottom: 8 }}>
        Release QE Home for <b>{release || '—'}</b>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <button className="go-btn" onClick={saveAsXlsx} disabled={loading || !aoa.length}>
          Save to XLSX
        </button>
        <button className="btn-compact" onClick={() => window.location.reload()} disabled={loading}>
          Reload
        </button>
        {loading && <span className="muted">Loading “{sheetName}”…</span>}
        {!!err && <span style={{ color: '#b91c1c' }}>Error: {err}</span>}
      </div>


      {/* Grid or fallback */}
      {(!err && aoa.length) ? (
        <div className="hot-host"> {/* [PH1-HOT-FIX] containment & scrolling */}
          <HotTable
            ref={hotRef}
            data={aoa}
            rowHeaders={true}
           colHeaders={colHeaders}
            colWidths={colWidths}           // [PH1-HOT-FIX]
            rowHeights={rowHeights}         // [PH1-HOT-FIX]
            mergeCells={mergeCells}         // [PH1-HOT-FIX]
            height="100%"                   // [PH1-HOT-FIX] fill wrapper
            stretchH="none"                 // [PH1-HOT-FIX] preserve widths; allow horizontal scroll
           wordWrap={true}                 // [PH1-HOT-FIX]
            autoWrapRow={true}              // [PH1-HOT-FIX]
            viewportRowRenderingOffset={50} // [PH1-HOT-FIX] smoother scroll
            viewportColumnRenderingOffset={20}
            formulas={engineRef.current ? { engine: engineRef.current } : undefined}
            contextMenu={true}
            manualColumnResize={true}
          manualRowResize={true}
            licenseKey="non-commercial-and-evaluation" // Handsontable CE key
          />
        </div>
      ) : (

        
        // Fallback to SharePoint inline if local load failed and SP URL provided
        (err && spEmbed) ? (
          <div style={{ height: '78vh', borderRadius: 12, overflow: 'hidden', background: '#0f162a' }}>
            <iframe
              title="TQI CBPT Releases DSR — Daily Dashboard (SharePoint)"
              src={spEmbed}
              style={{ width: '100%', height: '100%', border: 0 }}
              allow="clipboard-read; clipboard-write; fullscreen"
              allowFullScreen
            />
          </div>
        ) : (
          !loading && <div className="muted">No data to display.</div>
        )
      )}
    </div>
  );
}
