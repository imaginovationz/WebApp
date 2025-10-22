// src/components/Dashboard/Consolidated/CVSR.js
import React, { useState } from 'react';

const TABS = ["Overall","FY26","FY25","FY24","FY23","FY22","FY21"];

export default function CVSR(){
  const [tab, setTab] = useState(TABS[0]);

  return (
    <div>
      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`roi-tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="tab-panel">
        <div className="muted">Savings & ROI — <b>{tab}</b> (Phase 2 will populate)</div>
      </div>
    </div>
  );
}


