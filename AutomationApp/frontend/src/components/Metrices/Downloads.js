import React, { useMemo, useState } from "react";
import "../../styles/roiTabs.css";
import "../../styles/RecordEntry.css";

// lightweight month names once; keep UX simple and dependency-free
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const yearRange = (from, to) => {
  const out = [];
 for (let y = from; y <= to; y++) out.push(y);
  return out;
};

export default function Downloads() {
  //  UI states for button → tree dropdown → Go enabled state
  const [showPicker, setShowPicker] = useState(false);
  const [expandedYears, setExpandedYears] = useState({});
  const [selected, setSelected] = useState({}); // { 2025: Set(["January", ...]), 2024: Set([...]) }

  const thisYear = new Date().getFullYear();
  const YEARS = useMemo(() => yearRange(thisYear - 4, thisYear + 1), [thisYear]); // 6-year window

  const toggleYearExpand = (y) => setExpandedYears((e) => ({ ...e, [y]: !e[y] }));
  const isAnyMonthSelected = useMemo(
    () => Object.values(selected).some((s) => s && s.size > 0),
    [selected]
  );

  //  select/deselect entire year
  const toggleYear = (y, checked) => {
    setSelected((prev) => {
      const copy = { ...prev };
      copy[y] = checked ? new Set(MONTHS) : new Set();
      return copy;
    });
  };
  // CHANGE: toggle individual month
  const toggleMonth = (y, m, checked) => {
    setSelected((prev) => {
      const cur = new Set(prev[y] || []);
      if (checked) cur.add(m);
      else cur.delete(m);
      return { ...prev, [y]: cur };
    });
  };

  
  

  
  const handleGo = async () => {
    const selections = Object.entries(selected)
     .filter(([_, set]) => set && set.size > 0)
      .map(([year, set]) => ({ year: Number(year), months: Array.from(set.values()) }));
    if (!selections.length) return;
    try {


      const res = await fetch("http://localhost:5000/api/projectroidownload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
        },
        body: JSON.stringify({ selections }),
      });
      
            if (!res.ok) {
        // Try to parse error JSON if any
        let msg = "Download failed";
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ProjectROI_dump.xlsx";                 /* CHANGE */
     document.body.appendChild(a);
      a.click();
      a.remove();

    } catch (e) {
      alert(e.message || "Failed to download");
    }
 };

  return (
    <div className="tab-wrap">
      <div className="tab-section tab-section-yellow">Monthly Breakup</div>
     <div className="grid-2">
        
        {/* Action bar */}
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <button className="btn" onClick={() => setShowPicker(true)}>
           Download Consolidated Project ROI sheet
          </button>

          {showPicker && (
            <>
              {/* Tree dropdown (Years → Months as checkboxes) */}
              <div
               style={{
                  border:"1px solid #e5e7eb", borderRadius:8, padding:8,
                  maxHeight:260, overflow:"auto", minWidth:260, background:"#fff"
                }}
              >
                <div style={{ fontWeight:700, marginBottom:6 }}>Select months/years</div>
                {YEARS.map((y) => {
                  const yearChecked = (selected[y]?.size || 0) === MONTHS.length;
                  return (
                    <div key={y} style={{ marginBottom:4 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <input
                          type="checkbox"
                          checked={yearChecked}
                          onChange={(e) => toggleYear(y, e.target.checked)}
                        />
                       <span
                          style={{ cursor:"pointer", color:"#1f2937", fontWeight:600 }}
                          onClick={() => toggleYearExpand(y)}
                          title="Expand/Collapse months"
                        >
                          {expandedYears[y] ? "▾" : "▸"} {y}
                        </span>
                      </div>
                      {expandedYears[y] && (
                        <div style={{ paddingLeft:22, marginTop:4 }}>
                          {MONTHS.map((m) => {
                            const checked = selected[y]?.has(m) || false;
                            return (
                              <label key={m} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2, cursor:"pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => toggleMonth(y, m, e.target.checked)}
                               />
                                <span>{m} {y}</span>
                              </label>
                            );
                          })}
                       </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Go button (enabled only when any month selected) */}
              <button className="btn" disabled={!isAnyMonthSelected} onClick={handleGo}>
                Go
              </button>
           </>
          )}
        </div>
      </div>
    </div>
  );
}
