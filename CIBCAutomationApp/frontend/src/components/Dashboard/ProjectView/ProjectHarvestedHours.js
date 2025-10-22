// src/components/Dashboard/ProjectView/ProjectHarvestedHours.js
import React, { useEffect, useMemo, useState } from "react";

/**
 * Harvested hours Details
 * - Fetches rows from /api/harvesthours (Flask) which proxies to SharePoint (Graph API)
 * - Uses placeholders for SharePoint connectivity (configured on the backend)
 *
 * Expected JSON from backend:
 * { items: [{ id, fields: { Title, Project, Hours, Date, Assignee, ... }, modified, created }, ...] }
 */

// for amit. do not update this section  - PASTE the resolved Microsoft Graph IDs here after running the Python utility below.
const PLACEHOLDER_SITE_ID = "<YOUR_SP_SITE_ID>";
const PLACEHOLDER_LIST_ID = "<YOUR_SP_LIST_ID>";

export default function ProjectHarvestedHours({ project }) {
  const projectKey = useMemo(() => {
    if (!project) return "";
    const n = String(project?.intake_number || "").trim();
    const nm = String(project?.intake_name || "").trim();
    return n && nm ? `${n} — ${nm}` : "";
  }, [project]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchRows = async () => {
    if (!projectKey) return;
    setLoading(true);
    setErr("");
    try {
      // You can omit siteId/listId here if you prefer backend defaults from env
      const params = new URLSearchParams({
        siteId: PLACEHOLDER_SITE_ID,
        listId: PLACEHOLDER_LIST_ID,
        project: projectKey,
      });
      const res = await fetch(`http://localhost:5000/api/harvesthours?${params.toString()}`);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setRows(Array.isArray(json?.items) ? json.items : []);
    } catch (e) {
      console.error("harvesthours fetch error:", e);
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRows([]);
    setErr("");
    if (projectKey) {
      fetchRows();
    }
  }, [projectKey]);

  const prettyDate = (d) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? String(d) : dt.toLocaleString();
    } catch {
      return String(d);
    }
  };

  return (
    <div className="tab-wrap">
      <div className="tab-section tab-section-yellow" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Harvested hours Details</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-compact btn-add"
            onClick={fetchRows}
            disabled={!projectKey || loading}
            title="Refresh from SharePoint"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        {!projectKey && (
          <div className="muted">
            Select a project above to view its harvested hours.
          </div>
        )}

        {projectKey && (
          <>
            {/* Connectivity hint (placeholders) */}
            <div className="muted" style={{ marginBottom: 8 }}>
              <small>
                Using SharePoint List via backend proxy. Configure <code>SP_BEARER_TOKEN</code>, <code>SP_SITE_ID</code>,
                and <code>SP_LIST_ID</code> in the backend environment (or pass <code>siteId</code>/<code>listId</code> as query).
              </small>
            </div>

            {err && (
              <div style={{ color: "#ef4444", marginBottom: 10 }}>
                <b>Error: </b>{err}
              </div>
            )}

            {/* Results table */}
            <div style={{
              border: "1px solid #26334a",
              borderRadius: 10,
              overflow: "hidden",
              background: "rgba(2,6,23,.35)"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#0f172a", color: "#e5e7eb" }}>
                  <tr>
                    <th style={th}>Title</th>
                    <th style={th}>Project</th>
                    <th style={th}>Hours</th>
                    <th style={th}>Date</th>
                    <th style={th}>Assignee</th>
                    <th style={th}>Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} style={{ padding: "14px 12px", color: "#94a3b8" }}>
                        No entries found.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => {
                    const f = r?.fields || {};
                    return (
                      <tr key={r.id} style={{ borderTop: "1px dashed #1f2a44" }}>
                        <td style={td}>{f.Title ?? ""}</td>
                        <td style={td}>{f.Project ?? ""}</td>
                        <td style={td}>{f.Hours ?? ""}</td>
                        <td style={td}>{prettyDate(f.Date)}</td>
                        <td style={td}>{f.Assignee ?? f.Author ?? ""}</td>
                        <td style={td}>{prettyDate(r.modified || f.Modified)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #1f2a44",
  fontWeight: 700,
  letterSpacing: ".2px",
};

const td = {
  padding: "10px 12px",
  color: "#e5e7eb",
};


