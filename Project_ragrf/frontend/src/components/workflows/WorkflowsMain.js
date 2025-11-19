// frontend/src/components/workflows/Workflows.js
import React, { useMemo, useState } from "react";
import axios from "axios";

/* =========================================================
   NOTE (surgical updates only):
   - Use axios + absolute URLs (http://localhost:5000/...) like ProjectStatusTab.js
   - Keep existing UI/logic/comments intact
   - Endpoints used:
       1) GET http://localhost:5000/api/fetchPendingEstimates
       2) GET http://localhost:5000/api/fetchPendingLeadAssignment?release=<name or empty>
       3) GET http://localhost:5000/api/fetchreleases
       4) GET http://localhost:5000/api/resourcefetch
       5) GET http://localhost:5000/api/countLeadActiveAssignments?name=<name>&intake=<intake_number>
========================================================= */

// ---- constants ----
const VIEW_OPTIONS = [
  { value: "", label: "--Select a Value--" },
  { value: "pending-estimates", label: "Pending Estimates to be Submitted" },
  { value: "pending-lead", label: "Projects Pending Lead Assignment" },
  { value: "pending-roi", label: "Projects Pending ROI Update" },
  { value: "status-check", label: "Projects status Check and update" },
];


const projectStatusOptions = [
  "Confirmed - Not Started","Active - Discovery/pre kickoff","Active - Project Kick Off",
  "Active - BRD/SRD","Active - Solution / Design","Active - Construction","Active - DIT",
  "Active - SIT","Active - UAT","Project On Hold","Project Completed / Closed",
  "Project Cancelled","TBD (Status not known)",
];

const automationStatusOptions = [
  { label: "---ACTIVE---", disabled: true },
  { label: "Automation Intake/assessment" },
  { label: "Automation Work NOT Started" },
 { label: "SRD/BRD Phase" },
  { label: "Automation Test Planning" },
  { label: "Test Design - ConformIQ" },
  { label: "Scripting & Dry Run - Robot / Selenium / UFT / SOA / Scriptless" },
  { label: "Test Execution  - DIT" },
  { label: "Test Execution  - SIT" },
  { label: "Test Execution  - UAT" },
  { label: "Test Execution  - Support" },
  { label: "Test Support (Post execution)" },
  { label: "Automation Closure Activities" },
  { label: "KT Tasks" },
  { label: "Automated Test Design - QA Self" },
  { label: "Automated Test Execution - QA Self" },
  { label: "---DORMANT / CLOSED---", disabled: true },
  { label: "Pending Go ahead for Execution" },
  { label: "Auto. Work On Hold" },
  { label: "Auto. Work Cancelled" },
 { label: "Auto. Work Not Started" },
  { label: "Auto. Work Completed" },
 { label: "Test Design - Support" },
];

// [STATUS-CHECK: NEW] Timestamp composer (same format logic as ProjectStatusTab’s “nowSQLite”)
function nowSQLite() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const deliverableList = [
  ["Automation Test Plan (LTW)", "AutomationTestPlan"],
  ["QE Checklist Followed", "Checklist"],
  ["TC update in ALM / Confluence", "ALMupdate"],
  ["Git Update", "GITUpdate"],
  ["DSR", "DSR"],
 ["LE Sent to PM (Monthly)", "LESubmitted"],
  ["Master Regression Test Lab updated in ALM", "RegressionTestLab"],
  ["Master Dashboard Updated", "DashboardMetric"],
  ["Release Handover", "ReleaseHandover"],
  ["Project Closure Report", "ProjectClosure"],
 ["ROI Realized in (Month)", "ROIMonth"],
  ["QE Transformed", "QETransformed"],
  ["Shift-Left Followed", "ShiftLeft"],
];


// look up an email address by resource name
async function fetchEmailByName(name) {
  if (!name) throw new Error("Missing resource name");
 const res = await axios.get("http://localhost:5000/api/resourcefetch", { params: { name } });
  const email = res?.data?.email;
 if (!email) throw new Error("Email not found for " + name);
  return email;
}

//  send email via existing backend API
async function sendIntakeEmail({ to, subject, html }) {
  const res = await axios.post("http://localhost:5000/api/send_intake_email", { to, subject, html });
  if (!res?.data?.ok) throw new Error(res?.data?.error || "Email send failed");
  return true;
}


// use a function *declaration* so it’s hoisted (or keep as const but placed above)
 function renderDeliverablesCell(dObj = {}, row, onToggle, onEdit) {
   const total = deliverableList.length;
  const checked = deliverableList.reduce((n, [, k]) => n + (dObj?.[k] ? 1 : 0), 0);
   const open = !!row.__openDeliv; // injected below
   return (
    <div>
       <button
        className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
         onClick={onToggle}
         type="button"
      >
         {open ? "Hide" : "Show"} deliverables ({checked}/{total})
      </button>
       {open && (
         <div className="qe-deliv-grid mt-2">
           {deliverableList.map(([label, key]) => (
             <label key={key} className="qe-deliv-item">
               <input
                 type="checkbox"
                 checked={!!(dObj?.[key])}
                 onChange={(e) => onEdit(key, e.target.checked)}
               />
               <span>{label}</span>
             </label>
           ))}
         </div>
       )}
     </div>
   );
 }











// ---- reusable zebra table ----
function ZebraTable({ columns, rows, rowKey = "id", actionsRenderer }) {
  return (
    <div className="overflow-x-auto">
      {/* [CHANGE-1]: add 'zebra-grid' class + stronger borders + border-collapse for clear gridlines */}
      <table className="zebra-grid min-w-full border border-gray-300 border-collapse rounded-lg">
        {/* [CHANGE-2]: header stays light but now each cell has a visible border */}
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-sm font-semibold px-3 py-2 border border-gray-300"
                style={{ whiteSpace: "nowrap" }}
              >
                {col.label}
              </th>
            ))}
            {actionsRenderer ? (
              <th className="text-left text-sm font-semibold px-3 py-2 border border-gray-300">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="odd:bg-white even:bg-gray-50">
              {/* [CHANGE-3]: ensure empty-state row also shows cell border */}
              <td
                className="px-3 py-3 text-sm text-gray-600 border border-gray-300"
                colSpan={columns.length + (actionsRenderer ? 1 : 0)}
              >
                No records to display.
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              // zebra stripes kept (white / gray-50)
              <tr
                key={row[rowKey] ?? idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    // [CHANGE-4]: add full cell borders for clear column separation
                    className="px-3 py-2 text-sm text-gray-800 border border-gray-300"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actionsRenderer ? (
                  <td className="px-3 py-2 text-sm border border-gray-300">
                    {actionsRenderer(row)}
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---- page component (TOP-LEVEL export) ----
export default function Workflows() {
  const [view, setView] = useState("");
  const [leadSelections, setLeadSelections] = useState({});

  /* ----------------------------
     NEW: data/state for fetching
  -----------------------------*/
  // Option 1: Pending Estimates rows (fetched)
  const [pendingEstimatesData, setPendingEstimatesData] = useState([]);

  // Option 2: Pending Lead Assignment rows (fetched)
  const [pendingLeadAssignData, setPendingLeadAssignData] = useState([]);

  // Releases for Option 2 (column dropdown)
  const [releaseOptions, setReleaseOptions] = useState([{ value: "", label: "-- Pick Release --" }]);

  // Resource names (CIBC/FTE/TCS) for Option 2 (column dropdown)
  const [resourceOptions, setResourceOptions] = useState([{ value: "", label: "-- Pick a Lead --" }]);

  // Per-row chosen release for Option 2 (used to refetch filtered data)
  const [rowReleaseChoice, setRowReleaseChoice] = useState({}); // rowId -> releaseName

  // Per-row active project counts for the chosen resource
  const [activeCounts, setActiveCounts] = useState({}); // rowId -> { name, count }

  const [statusReleases, setStatusReleases] = useState([{ value: "", label: "-- Select a Release --" }]);
  const [statusRelease, setStatusRelease] = useState("");
  const [statusRows, setStatusRows] = useState([]); // table rows
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusDelivOpen, setStatusDelivOpen] = useState({}); // id -> bool
  const [statusFetched, setStatusFetched] = useState(false);

  const columnsStatusCheck = useMemo(() => [
  
     {
    key: "projectName",
    label: "Project Name",
    render: (_v, row) => (
      <span>{`${row.id ?? ""}${row.id ? " - " : ""}${row.projectName ?? ""}`}</span>
    ),
  },

    {
    key: "projectCurrentStatus",
    label: "Project Current Status",
   // [STATUS-CHECK: NEW] dropdown like ProjectStatusTab.js
    render: (v, row) => (
      <select
        className="border rounded px-2 py-1 text-sm bg-gray-50"
        value={row.projectCurrentStatus || ""}
        onChange={(e) => {
          const next = e.target.value;
          setStatusRows(rs => rs.map(r => r.id === row.id ? { ...r, projectCurrentStatus: next } : r));
        }}
      >
        <option value="">-- Select --</option>
        {projectStatusOptions.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ),
  },
  {
    key: "currentAutomationStatus",
    label: "Current Automation Status",
    // [STATUS-CHECK: NEW] dropdown like ProjectStatusTab.js
    render: (v, row) => (
      <select
        className="border rounded px-2 py-1 text-sm bg-gray-50"
        value={row.currentAutomationStatus || ""}
        onChange={(e) => {
          const next = e.target.value;
          setStatusRows(rs => rs.map(r => r.id === row.id ? { ...r, currentAutomationStatus: next } : r));
        }}
      >
        <option value="">-- Select --</option>
        {automationStatusOptions.map(o =>
          <option key={o.label} value={o.label} disabled={!!o.disabled}>{o.label}</option>
        )}
      </select>
    ),
  },
  {
    key: "comments",
    label: "Comments",
    // [STATUS-CHECK: NEW] textbox that shows history (existing value prepopulated)
    render: (v, row) => (
      <textarea
        className="border rounded px-2 py-1 text-sm bg-gray-50"
        rows={4}
        value={row.comments || ""}
        onChange={(e) => {
          const next = e.target.value;
          setStatusRows(rs => rs.map(r => r.id === row.id ? { ...r, comments: next } : r));
        }}
        placeholder="Type latest comment here; existing history remains in this box"
      />
    ),
  },
 {
    key: "deliverables",
    label: "QE Deliverables",
    render: (v, row) =>
      renderDeliverablesCell(
        v,
        row,
        () => {
          setStatusDelivOpen((s) => ({ ...s, [row.id]: !s[row.id] }));
          setStatusRows((rows) =>
            rows.map((r) =>
              r.id === row.id ? { ...r, __openDeliv: !row.__openDeliv } : r
            )
          );
        },
        (key, val) => {
          setStatusRows((rows) =>
            rows.map((r) =>
              r.id === row.id
                ? { ...r, deliverables: { ...(r.deliverables || {}), [key]: val } }
                : r
            )
          );
        }
      ),
  },
], [setStatusDelivOpen, setStatusRows]);

  // ROI mock preserved (unchanged)
  const pendingRoiUpdateData = useMemo(
    () => [
      {
        id: "ROI-3001",
        project: "Credit Card Servicing Portal",
        domain: "Cards",
        automationLead: "ruhi.patel@cibc.com",
        qeLead: "michael.chen@cibc.com",
        roiDueDate: "2025-10-31",
      },
      {
        id: "ROI-3002",
        project: "Mortgage Pre-Approval Revamp",
        domain: "Lending",
        automationLead: "alex.taylor@cibc.com",
        qeLead: "sam.lee@cibc.com",
        roiDueDate: "2025-11-02",
      },
    ],
    []
  );

  /* ----------------------------
     NEW: axios-based loaders (match ProjectStatusTab pattern)
  -----------------------------*/


  // [STATUS-CHECK: NEW] Exclude these AutomationStatus values (client-side filter)
  const STATUS_EXCLUDE = new Set([
    "Auto. Work On Hold",
    "Auto. Work Cancelled",
   "Auto. Work Not Started",
    "Auto. Work Completed",
    "Automation Intake/assessment",
    "Automation Work NOT Started",
 ]);


  // [STATUS-CHECK: NEW] Fetch the rows for a given release:
  //   1) GET /api/projects/search?release=<release>
  //   2) for each: GET /api/projects/<intake>, GET /api/automationdeliverables/<intake>
  //   3) filter by AutomationStatus NOT IN STATUS_EXCLUDE
  //   4) map to table rows


 // [STATUS-CHECK: REPLACE] Use /api/projectmasterupdate (row-level)
 const updateOneStatusRow = async (row) => {
   try {
     // prepend new comment to history (same behavior you set earlier)
     let commentsToSave = row.comments || "";
     if (String(row.comments || "") !== String(row.originalComments || "")) {
       const stamp = nowSQLite();
       const newLine = `${stamp} : ${row.comments || ""}`.trim();
       commentsToSave = row.originalComments ? `${newLine}\n\n${row.originalComments}` : newLine;
     }

     // build updates for projects + automationdeliverables
     const updates = [
       { table: "projects", column: "intake_name", value: row.projectName || "" }, // help match correct row
       { table: "projects", column: "project_status", value: row.projectCurrentStatus || "" },
       { table: "projects", column: "AutomationStatus", value: row.currentAutomationStatus || "" },
       { table: "projects", column: "Comments", value: commentsToSave },
    ];
     // append deliverables (checkboxes)
     const d = row.deliverables || {};
    Object.keys(d).forEach((k) => {
       updates.push({ table: "automationdeliverables", column: k, value: !!d[k] });
     });

     await axios.post("http://localhost:5000/api/projectmasterupdate", {
       intake_number: row.id,
       updates,
     });
     alert(`Updated project ${row.id} successfully`);
   } catch (e) {
     console.error("updateOneStatusRow failed", e);
     alert("Failed to update this project. Please try again.");
   }
 };





 // [STATUS-CHECK: REPLACE] Use /api/projectmasterupdate (bulk: one call per row)
 const updateAllStatusRows = async () => {
   if (!statusRows.length) {
     alert("Nothing to update.");
     return;
   }
   try {
     await Promise.all(
       statusRows.map(async (row) => {
         let commentsToSave = row.comments || "";
         if (String(row.comments || "") !== String(row.originalComments || "")) {
           const stamp = nowSQLite();
           const newLine = `${stamp} : ${row.comments || ""}`.trim();
           commentsToSave = row.originalComments ? `${newLine}\n\n${row.originalComments}` : newLine;
         }
         const updates = [
           { table: "projects", column: "intake_name", value: row.projectName || "" },
           { table: "projects", column: "project_status", value: row.projectCurrentStatus || "" },
           { table: "projects", column: "AutomationStatus", value: row.currentAutomationStatus || "" },
           { table: "projects", column: "Comments", value: commentsToSave },
         ];
         const d = row.deliverables || {};
         Object.keys(d).forEach((k) => {
           updates.push({ table: "automationdeliverables", column: k, value: !!d[k] });
         });
         return axios.post("http://localhost:5000/api/projectmasterupdate", {
           intake_number: row.id,
           updates,
         });
       })
     );
     alert("All changes saved successfully");
   } catch (e) {
     console.error("updateAllStatusRows failed", e);
     alert("Failed to save changes. Please try again.");
   }
 };






  const actionsStatusCheck = (row) => (
   <button
     className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:opacity-90"
     onClick={() => updateOneStatusRow(row)}
     type="button"
   >
     Update
  </button>
 );


  const loadStatusRows = async (releaseName) => {
    if (!releaseName) { setStatusRows([]); return; }
    setStatusBusy(true);
    try {
      // 1) list all projects for this release (existing endpoint with release filter)
      const listResp = await axios.get("http://localhost:5000/api/projects/search", {
        params: { release: releaseName, limit: 500 },
      });
      const list = Array.isArray(listResp?.data) ? listResp.data : [];

      // 2) hydrate
      const hydrated = await Promise.all(
        list.map(async ({ intake_number, intake_name }) => {
          try {
            const [proj, deliv] = await Promise.all([
              axios.get(`http://localhost:5000/api/projects/${intake_number}`),
              axios.get(`http://localhost:5000/api/automationdeliverables/${intake_number}`),
            ]);
            const p = proj?.data || {};
            const d = deliv?.data || {};
            return {
              id: intake_number,
              projectName: intake_name || p.intake_name || "",
              projectCurrentStatus: p.project_status || "",
              currentAutomationStatus: p.AutomationStatus || "",
              comments: p.Comments || "",
              deliverables: d || {},
            };
          } catch (e) {
            console.warn("hydrate failed for", intake_number, e);
            return null;
          }
        })
      );

      // 3) filter out excluded statuses
      const filtered = hydrated
        .filter(Boolean)
        .filter(r => !STATUS_EXCLUDE.has((r.currentAutomationStatus || "").trim()));

      // 4) ready for grid
      setStatusRows(filtered.map(r => ({ ...r, originalComments: r.comments || "" })));
    } finally {
      setStatusBusy(false);
    }
  };


  // Pending Estimates (Option 1)
  const loadPendingEstimates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/fetchPendingEstimates");
      const data = res?.data || [];
      const mapped = (Array.isArray(data) ? data : []).map((r) => ({
        id: `${r.intake_number ?? ""}` || `${r.intake_number ?? ""}-${r.intake_name ?? ""}`,
        project: `${r.intake_number ?? ""} - ${r.intake_name ?? ""}`,
        pendingWithLead: r.automation_qe_lead ?? "",
        estimateDueDate: r.AutoEstimateDueDate ?? "",
      }));
      setPendingEstimatesData(mapped);
    } catch (e) {
      console.error("loadPendingEstimates failed", e);
      setPendingEstimatesData([]);
    }
  };

  // Releases list for Option 2, Col 3  (flexible parsing; base URL)
  const loadReleases = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/fetchreleases");
      const data = res?.data || {};
      const raw =
        (data && Array.isArray(data.releases) && data.releases) ||
        (Array.isArray(data) && data) ||
        [];
      const opts = raw.map((r) => {
        const name =
          typeof r === "string"
            ? r
            : (r && (r.release_name || r.name || r.value)) || "";
        return { value: name, label: name };
      });
      setReleaseOptions([{ value: "", label: "-- Pick Release --" }, ...opts]);
      setStatusReleases([{ value: "", label: "-- Select a Release --" }, ...opts]);
    } catch (e) {
      console.error("loadReleases failed", e);
      setReleaseOptions([{ value: "", label: "-- Pick Release --" }]);
      setStatusReleases([{ value: "", label: "-- Select a Release --" }]);
    }
  };

  // Resource names for Option 2, Col 5  (uses /api/resourcefetch)
  const loadResources = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/resourcefetch");
      const data = res?.data || {};
      const raw =
        (data && Array.isArray(data.resources) && data.resources) ||
        (Array.isArray(data) && data) ||
        [];
      const opts = raw.map((r) => {
        const name = typeof r === "string" ? r : r?.name ?? "";
        return { value: name, label: name };
      });
      setResourceOptions([{ value: "", label: "-- Pick a Lead --" }, ...opts]);
    } catch (e) {
      console.error("loadResources failed", e);
      setResourceOptions([{ value: "", label: "-- Pick a Lead --" }]);
    }
  };

  // Pending Lead Assignment (Option 2)
  const loadPendingLeadAssignment = async (releaseName = "") => {
    try {
      const url = releaseName && releaseName.trim()
        ? "http://localhost:5000/api/fetchPendingLeadAssignment"
        : "http://localhost:5000/api/fetchPendingLeadAssignment";

      const res = await axios.get(url, {
        params: releaseName && releaseName.trim() ? { release: releaseName.trim() } : {},
      });
      const data = res?.data || [];
      const mapped = (Array.isArray(data) ? data : []).map((r) => ({
        id: `${r.intake_number ?? ""}`,
        project: `${r.intake_number ?? ""} - ${r.intake_name ?? ""}`,
        domain: r.domain ?? "",
        release: r.release ?? "",
        sitStartDate: r.sit1_date ?? "",
      }));
      setPendingLeadAssignData(mapped);
    } catch (e) {
      console.error("loadPendingLeadAssignment failed", e);
      setPendingLeadAssignData([]);
    }
  };

  // Count active assignments for selected name & intake (Option 2, Col 5 onchange)
  const loadActiveCount = async (rowId, name, intakeNumber) => {
    if (!name) {
      setActiveCounts((s) => ({ ...s, [rowId]: undefined }));
      return;
    }
    try {
      const res = await axios.get("http://localhost:5000/api/countLeadActiveAssignments", {
        params: { name, intake: intakeNumber || "" },
      });
      const data = res?.data;
      const count = typeof data === "number" ? data : data?.count ?? 0;
      setActiveCounts((s) => ({ ...s, [rowId]: { name, count } }));
    } catch (e) {
      console.error("loadActiveCount failed", e);
      setActiveCounts((s) => ({ ...s, [rowId]: { name, count: 0 } }));
    }
  };

  /* ----------------------------
     Handlers (placeholders preserved)
  -----------------------------*/
 const handleSendEstimateReminder = async (row) => {
  try {
   const leadName = String(row?.pendingWithLead || "").trim();
    if (!leadName) {
     alert("No 'Estimate Pending with Lead' name on this row.");
      return;
   }
    // lookup recipient email
   const to = await fetchEmailByName(leadName);
    // subject/body per spec
   const projectLabel = String(row?.project || "").trim();           // e.g. "12345 - My Project"
    const due = String(row?.estimateDueDate || "").trim();            // e.g. "2025-10-31"
   const subject = `Estimate for ${projectLabel} is due on ${due}, Please submit`;
    const html = `
     <p>Hi ${leadName},</p>
      <p>This is a friendly reminder that the automation estimate for <b>${projectLabel}</b> is due on <b>${due}</b>.</p>
     <p>Please submit the estimate at your earliest convenience.</p>
      <p>Thanks.</p>
   `;
   await sendIntakeEmail({ to, subject, html });
    alert("Reminder email sent.");
  } catch (e) {
   console.error("handleSendEstimateReminder failed", e);
   alert("Failed to send reminder email.");
  }
};

const handleAssignLead = async (row) => {
  try {
    // 2.1) get selected lead from the per-row dropdown state
    const pickedLeadName = String(leadSelections[row.id] || "").trim();
    if (!pickedLeadName) {
      alert("Please pick a lead from the dropdown first.");
     return;
    }

   // Parse the composite project label to ensure we pass both keys exactly as specified
    const projLabel = String(row?.project || "").trim(); // "12345 - My Project" (fallback)
   const parsedIntake = (row?.id ?? projLabel.split(" - ")[0] ?? "").toString().trim();
    const parsedName   = (row?.projectName ?? projLabel.split(" - ").slice(1).join(" - ") ?? "").toString().trim();
    if (!parsedIntake || !parsedName) {
      alert("Missing project identifiers (intake_number / intake_name).");
     return;
    }

   // 2.1) Update `projects.automation_qe_lead` for this project (WHERE intake_number AND intake_name)
    await axios.post("http://localhost:5000/api/projectmasterupdate", {
      intake_number: parsedIntake,
     updates: [
        { table: "projects", column: "intake_name", value: parsedName },             // ensure composite match
        { table: "projects", column: "automation_qe_lead", value: pickedLeadName },  // the assignment
      ],
   });

    // 2.2) Email the assigned lead
   const to = await fetchEmailByName(pickedLeadName);
    const subject = `You are assigned Lead for project ${projLabel}`;
    const html = `
      <p>Hi ${pickedLeadName},</p>
     <p>You have been assigned as the <b>Automation QE Lead</b> for <b>${projLabel}</b>.</p>
      <p>(Project details and next steps to follow.)</p>
    `;
    await sendIntakeEmail({ to, subject, html });
    alert("Lead assigned and email sent.");
  } catch (e) {
    console.error("handleAssignLead failed", e);
    alert("Failed to assign lead and/or send email.");
  }
};

  const handleSendRoiReminder = (row) => {
    alert(`ROI reminder queued for: ${row.project}`);
  };

  /* ----------------------------
     Columns (labels kept as-is)
  -----------------------------*/
  const columnsPendingEstimates = [
    { key: "project", label: "Project" }, // "<intake_number> - <intake_name>"
    { key: "pendingWithLead", label: "Estimate Pending with Lead." }, // automation_qe_lead
    { key: "estimateDueDate", label: "Estimate Due Date" }, // AutoEstimateDueDate
  ];

  const columnsPendingLeadAssign = [
    { key: "project", label: "Project" }, // "<intake_number> - <intake_name>"
    { key: "domain", label: "Domain" }, // projects.domain
    {
      key: "release",
      label: "Release",
      render: (_v, row) => (
        <select
          className="border rounded px-2 py-1 text-sm"
          value={rowReleaseChoice[row.id] ?? ""}
          onChange={async (e) => {
            const next = e.target.value;
            setRowReleaseChoice((s) => ({ ...s, [row.id]: next }));
            await loadPendingLeadAssignment(next);
          }}
        >
          {releaseOptions.map((opt) => (
            <option key={`${opt.value}-${opt.label}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
    { key: "sitStartDate", label: "SIT Start date" }, // projects_timeline.sit1date
    {
      key: "pickLead",
      label: "Pick a Lead",
      render: (_v, row) => {
        // Extract intake_number back from "<intake> - <name>"
        const intakeNum = (row.project || "").split(" - ")[0] || "";
        const selectedName = leadSelections[row.id] || "";

        return (
          <div className="flex flex-col gap-1">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={selectedName}
              onChange={async (e) => {
                const name = e.target.value;
                setLeadSelections((s) => ({ ...s, [row.id]: name }));
                await loadActiveCount(row.id, name, intakeNum);
              }}
            >
              {resourceOptions.map((opt) => (
                <option key={`${opt.value}-${opt.label}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {activeCounts[row.id]?.name ? (
              <div className="text-xs text-gray-600">
                {activeCounts[row.id].name} is already actively assigned to{" "}
                <strong>{activeCounts[row.id].count}</strong> projects.
              </div>
            ) : null}
          </div>
        );
      },
    },
  ];

  const columnsPendingRoi = [
    { key: "project", label: "Project" },
    { key: "domain", label: "Domain" },
    { key: "automationLead", label: "Automation Lead" },
    { key: "qeLead", label: "QE Lead" },
    { key: "roiDueDate", label: "ROI Due Date" },
  ];

  /* ----------------------------
     Action cells (unchanged)
  -----------------------------*/
  const actionsPendingEstimates = (row) => (
    <button
      className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:opacity-90"
      onClick={() => handleSendEstimateReminder(row)}
    >
      Send Email reminder
    </button>
  );

  const actionsPendingLeadAssign = (row) => (
    <button
      className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:opacity-90"
      onClick={() => handleAssignLead(row)}
    >
      Assign and Send Email
    </button>
  );

  const actionsPendingRoi = (row) => (
    <button
      className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:opacity-90"
      onClick={() => handleSendRoiReminder(row)}
    >
      Send Email reminder
    </button>
  );

  /* ----------------------------
     View selection + Go trigger
  -----------------------------*/
  // On dropdown change, ONLY set the view (do NOT fetch here)
  const handleViewChange = (nextView) => {
    setView(nextView);
  };

  // Fetch only when Go is clicked, based on selected view
  const handleGoClick = async () => {
    if (view === "pending-estimates") {
      await loadPendingEstimates();

    } else if (view === "pending-lead") {
      // Preload dropdowns + grid after Go (parallel for snappy UX)
      await Promise.all([loadReleases(), loadResources()]);
      await loadPendingLeadAssignment("");

    } else if (view === "pending-roi") {
      // Nothing to fetch (mock data retained)
    
    


    }
    
    else if (view === "status-check") {
    if (!statusRelease) {
      alert("Please select a Release first.");
      return;
    }
    await loadStatusRows(statusRelease);
    setStatusFetched(true);
  }
    
    
    else {
      alert("Please select an option first.");
    }
  };

  const renderView = () => {
    if (view === "pending-estimates") {
      return (
        <ZebraTable
          columns={columnsPendingEstimates}
          rows={pendingEstimatesData}
          actionsRenderer={actionsPendingEstimates}
        />
      );
    }
    if (view === "pending-lead") {
      return (
        <ZebraTable
          columns={columnsPendingLeadAssign}
          rows={pendingLeadAssignData}
          actionsRenderer={actionsPendingLeadAssign}
        />
      );
    }
    if (view === "pending-roi") {
      return (
        <ZebraTable
          columns={columnsPendingRoi}
          rows={pendingRoiUpdateData}
          actionsRenderer={actionsPendingRoi}
        />
      );
    }

 if (view === "status-check") {
   return (
    <div className="mt-4 space-y-3">
       {/* [STATUS-CHECK: NEW] Bulk update button above the grid */}
       
       
      {statusFetched && statusRows.length > 0 && (
        <div className="flex justify-end">
          <button
            className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:opacity-90"
            onClick={updateAllStatusRows}
            type="button"
          >
            Update All
          </button>
        </div>
      )}



             <div className="mt-2 status-check-scope">
        {/* local, minimal CSS (scoped by .status-check-scope) */}
        <style>{`
          .status-check-scope table tbody tr:nth-child(odd)  { background: #ad9b9bff; }
         .status-check-scope table tbody tr:nth-child(even) { background: #f8fafc; } /* slate-50-like */
        `}</style>



         <ZebraTable
          columns={columnsStatusCheck}
           rows={statusRows}
           rowKey="id"
           actionsRenderer={actionsStatusCheck}  
         />
       </div>
     </div>
   );
 }







    return (
      <div className="text-sm text-gray-600">
        Please select an option from the dropdown to continue.
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium" htmlFor="showMe">
          Show Me
        </label>

        <select
          id="showMe"
          className="border rounded px-2 py-2 text-sm"
          value={view}
          onChange={(e) => handleViewChange(e.target.value)}
        >
          {VIEW_OPTIONS.map((opt) => (
            <option key={opt.value || "blank"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

  {/* [STATUS-CHECK: NEW] Release dropdown appears only for “Project status check and update” AND sits BEFORE the existing Go button */}
  {view === "status-check" && (
    <div className="inline-flex items-center gap-2 ml-3">
      <label className="text-sm text-gray-700">Select a Release:</label>
      <select
        className="border rounded px-2 py-1 text-sm"
        value={statusRelease}
        onChange={(e) => setStatusRelease(e.target.value)}
       onFocus={() => { if (statusReleases.length <= 1) loadReleases(); }}
        style={{ minWidth: 200 }}
      >
        {statusReleases.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
       ))}
      </select>
    </div>
  )}

        {/* Go button to trigger fetch */}
        <button
          id="goBtn"
          type="button"
          className="text-sm px-3 py-2 rounded bg-indigo-600 text-white hover:opacity-90"
          onClick={handleGoClick}
        >
          Go
        </button>
      </div>

      <div>{renderView()}</div>

      {/* [CHANGE-5]: keep a small fallback to guarantee zebra stripes even without Tailwind */}
      <style>{`
        table.zebra-grid tr:nth-child(even) { background: #bdcad7ff; }
        table.zebra-grid tr:nth-child(odd) { background: #ffffff; }
        table.zebra-grid th, table.zebra-grid td { border: 1px solid #d1d5db; }
        th, td { vertical-align: middle; }
      `}</style>
    </div>
  );
}
