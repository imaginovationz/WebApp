// src/components/Dashboard/Consolidated/CVSavingsROI.js
import React, { useState } from 'react';

const TABS = ["Harvested Hours", "Savings & ROI"];

export default function CVSavingsROI(){
  const [tab, setTab] = useState(TABS[0]);
  return (
    <div>
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`roi-tab ${tab===t?"active":""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {/* [PH3-PBI] Each tab now renders a distinct container div for Power BI embed */}

        {tab === "Harvested Hours" && (
          <div>
            <div className="muted" style={{ marginBottom: 8 }}>
              Savings and ROI — <b>Harvested Hours</b> (Power BI placeholder)
            </div>

            {/* [PH3-PBI] Unique container for Harvested Hours Power BI iframe */}
            <div
              id="pbi-harvested-hours"
              className="pbi-embed-container"
              style={{
                height: "72vh",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #26334a",
                background: "#0f162a",
              }}
            >
             
             <iframe title="HarvestedHours" width="1140" height="541.25" src="https://app.powerbi.com/reportEmbed?reportId=60849ec7-c767-4079-9482-d84a0cb921f5&autoAuth=true&ctid=222fcaf7-15d0-455f-97e1-8fda2eaad539&actionBarEnabled=true&reportCopilotInEmbed=true"></iframe>

                  
            
              <div
                style={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  color: "#e0f2fe",
                  opacity: 0.9,
                }}
              >
                Power BI iframe goes here (Harvested Hours)
              </div>
            </div>
          </div>
        )}

        {tab === "Savings & ROI" && (
          <div>
            <div className="muted" style={{ marginBottom: 8 }}>
              Savings and ROI — <b>Savings & ROI</b> (Power BI placeholder)
            </div>

            
            <div
              id="pbi-savings-roi"
              className="pbi-embed-container"
              style={{
                height: "72vh",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #26334a",
                background: "#0f162a",
              }}
            >
              {/* Example (to be implemented later):
                  <iframe
                    title="Savings & ROI Report"
                    src={YOUR_POWER_BI_EMBED_URL}
                    style={{ width: "100%", height: "100%", border: 0 }}
                    allowFullScreen
                  />
               */}
              <div
                style={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  color: "#e0f2fe",
                  opacity: 0.9,
                }}
              >
                Power BI iframe goes here (Savings & ROI)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
