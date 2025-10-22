import React from "react";

import "../../styles/roiTabs.css";
import "../../styles/RecordEntry.css";

// = import hooks for tab detection ====
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";

export default function AutomationMetric_projects() {
  // This tab will render a monthly grid once we finalize columns from the sheet.
  // For now, create the container and leave hooks to plug in data/APIs.
  
      // = show button only on Projects tab ====
    const location = useLocation();
    const onProjectsTab = /\/AutomationMetricProjects$/i.test(location.pathname);
    const [refreshMsg, setRefreshMsg] = useState("");
    const [refreshBusy, setRefreshBusy] = useState(false);
    const refreshProjectTCCount = async () => {
        try {
            setRefreshBusy(true);
            setRefreshMsg("Refreshing…");
            const res = await fetch("http://localhost:5000/api/projecttccount/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}) // no payload needed
           });
            const j = await res.json();
            if (j?.ok) {
                setRefreshMsg(`Refreshed: updated=${j.updated || 0}, inserted=${j.inserted || 0}`);
           } else {
                setRefreshMsg(j?.error ? `Failed: ${j.error}` : "Failed");
            }
       } catch (e) {
            setRefreshMsg("Failed");
            console.error(e);
        } finally {
            setRefreshBusy(false);
       }
    };

  return (
    <div className="tab-wrap">
      <div className="tab-section tab-section-yellow">Monthly Breakup</div>
      <div className="grid-2">
        {/* TODO: Build monthly rows/columns exactly as per Tab5 in Excel */}
            {/* ==== Button only when user is on the Projects sub-tab ==== */}
            {onProjectsTab && (
                <div style={{ margin: "8px 0 4px 0" }}>
                    <button
                       disabled={refreshBusy}
                        className="roi-tab"
                        onClick={refreshProjectTCCount}
                       title="Rebuild 'projecttccount' from TDM/Design/Execution tables"
                    >
                        {refreshBusy ? "Refreshing…" : "Refresh Data in Database"}
                   </button>
                    {!!refreshMsg && (
                        <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.8 }}>{refreshMsg}</span>
                    )}
               </div>
            )}
      </div>
    </div>
  );



}


