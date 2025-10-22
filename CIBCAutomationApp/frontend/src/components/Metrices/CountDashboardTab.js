import React from "react";
import "../../styles/roiTabs.css";
import "../../styles/RecordEntry.css";

export default function CountDashboardTab() {
  const handleDownload = async () => {
    try {
      const resp = await fetch("http://localhost:5000/api/automationmetricsdownload?tab=count_dashboard");
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Count_Dashboard.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Download failed. Backend endpoint not implemented yet.");
    }
  };

  return (
    <div className="tab-wrap">
      <div className="tab-section tab-section-yellow">Count Dashboard</div>
      <div className="text-gray-600" style={{ marginBottom: 12 }}>
        {/* PowerBI embed placeholder */}
        PowerBI report will render here (iframe / powerbi-client).
      </div>
      <button className="btn" onClick={handleDownload}>Download</button>
    </div>
  );
}


