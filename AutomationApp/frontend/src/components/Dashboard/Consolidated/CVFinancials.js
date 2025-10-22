import React, { useState } from 'react';
export default function CVFinancials(){
  const [tab] = useState("Home");
  return (
    <div>
      <div className="tabs">
        <button className={`roi-tab ${tab==="Home"?"active":""}`}>Home</button>
      </div>
      <div className="tab-panel">
        <div className="muted">Financials — Home (to be populated)</div>
      </div>
    </div>
  );
}
