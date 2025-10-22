import React, { useState } from 'react';
import ReleaseMaster from '../ReleaseMaster'; // re-use existing page

export default function CVCBPTReleaseMgmt(){
  const [tab] = useState("Release Management Home");
  return (
    <div>
      <div className="tabs">
        <button className={`roi-tab ${tab==="Release Management Home"?"active":""}`}>
          Release Management Home
        </button>
      </div>
      <div className="tab-panel">
        <ReleaseMaster />
      </div>
    </div>
  );
}
