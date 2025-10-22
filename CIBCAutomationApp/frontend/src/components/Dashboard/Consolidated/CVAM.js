import React, { useState } from 'react';

const TABS = ["Portfolio View", "Monthly View", "Lending", "Deposit", "ECMT", "Payments"];

export default function CVAM(){
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
        <div className="muted">Automation Metrices — <b>{tab}</b> (Phase 2 will populate)</div>
      </div>
    </div>
  );
}
