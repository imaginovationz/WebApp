import React, { useState } from "react"; // CHANGE
import "../../styles/roiTabs.css";
import "../../styles/RecordEntry.css";
import { NavLink, Outlet } from "react-router-dom";


export default function CountDashboardTab() {
  
   const [refreshOk, setRefreshOk] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [embedUrl, setEmbedUrl] = useState(""); // PowerBI publish/embedding URL (from backend)
  const [embedFilters, setEmbedFilters] = useState(null); // optional JSON filters (from backend)

  const onRefreshDB = async () => {
    try {
      setRefreshing(true);
      setRefreshOk(false);
      const r = await fetch("http://localhost:5000/api/run_automation_sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query_key: "refresh_master_inventory" }),
      });
      const data = await r.json();
      if (r.ok && data?.ok) {
        setRefreshOk(true);  // Button 2 becomes enabled
        alert("Master inventory refreshed.");
      } else {
        alert(data?.error || "Refresh failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Refresh failed. Check server logs.");
    } finally {
      setRefreshing(false);
    }
  };

  // CHANGE: Button 2 handler — request embed details (URL + filters), then render report
  const onGenerateReport = async () => {
    try {
      setGenerating(true);
      // OPTIONAL: if you later want to filter by domain/app/frmwk, pass them here as query params
      const r = await fetch("http://localhost:5000/api/powerbi/masterinv_embed");
      const data = await r.json();
      if (!r.ok) {
        alert(data?.error || "Failed to prepare Power BI embed.");
        return;
      }
      setEmbedUrl(data?.embed_url || "");
      setEmbedFilters(data?.filters || null);
    } catch (e) {
      console.error(e);
      alert("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };


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
    <div className="container">
      <h2>Automation Metrices</h2>

      {/* CHANGE: New action row with 2 buttons */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "8px 0 16px" }}>
        <button type="button" onClick={onRefreshDB} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh Database"}
        </button>
        <button
          type="button"
          onClick={onGenerateReport}
          disabled={!refreshOk || generating}
          title={!refreshOk ? "Run Refresh Database first" : ""}
        >
          {generating ? "Generating..." : "Generate PowerBI Report"}
        </button>
      </div>

      {/* CHANGE: Report renders below Button 2 on this same page */}
      {embedUrl ? (
        <div style={{ marginBottom: 16 }}>
          {/* If you use the JS embedding SDK later, you can apply embedFilters there.
              For now we show a simple iframe. */}
          <iframe
            title="Automation Inventory (Power BI)"
            src={embedUrl}
            style={{ width: "100%", height: "720px", border: "0" }}
          />
        </div>
      ) : null}

        <button className="btn" onClick={handleDownload}>Download</button>

      <Outlet />
    </div>
  );
}



