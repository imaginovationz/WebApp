import React, { useState } from 'react';
export default function CVChangeTickets(){
  const [tab] = useState("Home");
  
      const handleGenerateEmail = () => {
};


  const handleGeneratePPT = () => {
};

return (
    <div>
      <div className="tabs">
        <button className={`roi-tab ${tab==="Home"?"active":""}`}>Home</button>
    
      </div>
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <iframe title="ALM DSR" width="1140" height="541.25" src="https://app.powerbi.com/reportEmbed?reportId=c5b11cf6-10ab-48a8-a1b6-41bf6469f8bc&autoAuth=true&ctid=222fcaf7-15d0-455f-97e1-8fda2eaad539&actionBarEnabled=true&reportCopilotInEmbed=true"></iframe>
          <div style={{ marginTop: '20px' }}>
      <button onClick={handleGenerateEmail} className="action-button">Generate Email</button>
      <button onClick={handleGeneratePPT} className="action-button" style={{ marginLeft: '10px' }}>Generate PPT</button>
    </div>


      </div>
    </div>
  );
}
