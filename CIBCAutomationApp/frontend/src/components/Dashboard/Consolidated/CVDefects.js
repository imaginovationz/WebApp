import React, { useState } from 'react';
export default function CVDefects(){
  const [tab] = useState("Home");
  
      const handleGenerateEmail = () => {
};


  const handleGenerateExcel = () => {
};


  return (
    <div>
      <div className="tabs">
        <button className={`roi-tab ${tab==="Home"?"active":""}`}>Home</button>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <iframe title="ALM DSR" width="1140" height="541.25" src="https://app.powerbi.com/reportEmbed?reportId=bf5f353b-5370-40e8-a985-a92984425761&autoAuth=true&ctid=222fcaf7-15d0-455f-97e1-8fda2eaad539&actionBarEnabled=true&reportCopilotInEmbed=true"></iframe>
          <div style={{ marginTop: '20px' }}>
      <button onClick={handleGenerateEmail} className="action-button">Generate Email</button>
      <button onClick={handleGenerateExcel} className="action-button" style={{ marginLeft: '10px' }}>Generate Excel</button>
    </div>

        
        </div>
    </div>
  );
}
