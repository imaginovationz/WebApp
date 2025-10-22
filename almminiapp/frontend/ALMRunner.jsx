    /*
    This page renders three dropdowns (Domain, ALM Project, Project Value), 
    a Go button, and the Power BI area. 
    On Go, it calls our new almapp.py endpoints.
    */

// src/pages/ALMRunner.jsx
import React, { useMemo, useState } from "react";
import PowerBIEmbed from "../components/PBReactUI"; // your sample component

const DOMAINS = ["MLIDT", "RBSS"]; // extend as needed
const PROJECTS = {
  MLIDT: ["MLIDT_AUTOMATION", "MLIDT_QA"],
  RBSS:  ["RBSS_CORE", "RBSS_QA"]
};
const PROJECT_VALUES = ["Phase-1", "Phase-2", "Phase-3"]; // example “Project Value” list

const API_BASE = "http://localhost:3002"; // alm_port from config.json

export default function ALMRunner() {
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [project, setProject] = useState(PROJECTS[DOMAINS[0]][0]);
  const [projectValue, setProjectValue] = useState(PROJECT_VALUES[0]);
  const [releaseName, setReleaseName] = useState(""); // if you want a specific release
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const projectList = useMemo(() => PROJECTS[domain] || [], [domain]);

  const onGo = async () => {
    setBusy(true); setError(""); setRows([]);
    try {
      // Step 2: connect (will resolve DB and verify session)
      const connectResp = await fetch(
        `${API_BASE}/api/alm/connect?domain=${encodeURIComponent(domain)}&project=${encodeURIComponent(project)}`
      );
      if (!connectResp.ok) throw new Error(await connectResp.text());
      const connectJson = await connectResp.json();
      if (!connectJson.ok) throw new Error(connectJson.message || "Connect failed");

      // Step 3: run the DQL template
      const url = new URL(`${API_BASE}/api/alm/run_dql`);
      url.searchParams.set("domain", domain);
      url.searchParams.set("project", project);
      url.searchParams.set("dql_name", "ALM_connection.sql");
      if (releaseName) url.searchParams.set("release_name", releaseName);

      const dqlResp = await fetch(url.toString());
      if (!dqlResp.ok) throw new Error(await dqlResp.text());
      const data = await dqlResp.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  // Prepare a tiny “reportData” object to optionally drive Power BI filters
  const reportData = useMemo(() => {
    // Example: build simple aggregates you might use as filters
    const statuses = rows.reduce((acc, r) => {
      const s = r["Status"] || r["TC_STATUS"];
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    return [{ domain, project, projectValue, releaseName, statuses }];
  }, [rows, domain, project, projectValue, releaseName]);

  return (
    <div style={{ padding: 16 }}>
      <h2>ALM Mini App</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
        <div>
          <label>Domain</label>
          <select value={domain} onChange={e => { setDomain(e.target.value); setProject(PROJECTS[e.target.value][0]); }}>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label>ALM Project</label>
          <select value={project} onChange={e => setProject(e.target.value)}>
            {projectList.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label>Project Value</label>
          <select value={projectValue} onChange={e => setProjectValue(e.target.value)}>
            {PROJECT_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div>
          {/* Optional: free text release name filter */}
          <label>Release (optional)</label>
          <input placeholder="e.g. 24.10" value={releaseName} onChange={e => setReleaseName(e.target.value)} />
        </div>

        <div>
          <button onClick={onGo} disabled={busy}>{busy ? "Working..." : "Go"}</button>
        </div>
      </div>

      {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

      <div style={{ marginTop: 16 }}>
        <PowerBIEmbed reportData={reportData} />
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Preview of fetched rows ({rows.length})</h4>
        <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid #ddd", padding: 8 }}>
          <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(rows, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
