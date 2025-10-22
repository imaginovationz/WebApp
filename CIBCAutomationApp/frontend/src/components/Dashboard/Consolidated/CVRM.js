// src/components/Dashboard/Consolidated/CVRM.js
import React, { useState } from 'react';

export default function CVRM(){
  const [tab, setTab] = useState("Portfolio View");
  return (
    <div>
      <div className="tabs">
        <button className={`roi-tab ${tab==="Portfolio View"?"active":""}`} onClick={() => setTab("Portfolio View")}>
          Portfolio View
        </button>
      </div>
      <div className="tab-panel">
        <div className="muted">Regression Metrices — <b>{tab}</b> (Phase 2 will populate)</div>
      </div>
    </div>
  );
}


