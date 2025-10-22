// src/components/Dashboard/Consolidated/CVTI.js
import React, { useState } from 'react';

const TABS = ["Monthly Progress","All","Funded","Non-Funded"];

export default function CVTI(){
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
        <div className="muted">Transformation Initiatives — <b>{tab}</b> (Phase 2 will populate)</div>
      </div>
    </div>
  );
}


