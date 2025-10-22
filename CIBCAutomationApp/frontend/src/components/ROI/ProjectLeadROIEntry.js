// src/components/ROI/ProjectLeadROIEntry.js
import "../../styles/RecordEntry.css";
import "../../styles/roiTabs.css";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  useParams,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

export default function ProjectLeadROIEntry() {
  const { intakeNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Keep existing row state (other logic relies on it)
  const [rows, setRows] = useState([
    {
      Release: "",
      ROIMonth: "",
      ProjectName: "",
      AutomationLead: "",
      SavingsCategory: "",
      AutomationFmk: "",
      TotalTCsCount: "",
      ManualTCsPD: "",
      AutomatedTCCreatedPD: "",
      NumberofCycles: "",
      TotalManualPD: 0,
      TotalManualCost: 0,
      TotalAutomatedPD: 0,
      TotalAutomationCost: 0,
      Savings: 0,
    },
  ]);

  // Fetched from /api/projects/<intake_number>
  const [projectDetails, setProjectDetails] = useState(null);

  const handleChange = (index, field, value) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Fetch project details (program, release, application, automation_qe_lead, domain, change_type, intake_name)
  useEffect(() => {
    if (!intakeNumber) return;
    axios
      .get(`http://localhost:5000/api/projects/${intakeNumber}`)
      .then((res) => {
        setProjectDetails(res.data);

        // Keep existing behavior that sets some header defaults in rows[0]
        const currentMonth = new Date().toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        setRows((prev) =>
          prev.map((row) => ({
            ...row,
            ProjectName: res.data?.intake_name || "",
            AutomationLead: res.data?.automation_qe_lead || "",
            Release: res.data?.release || row.Release,
            ROIMonth: currentMonth || row.ROIMonth,
          }))
        );
      })
      .catch((err) => {
        console.error("Error fetching project details", err);
      });
  }, [intakeNumber]);

  // Default to SummaryTab when on the parent path
  useEffect(() => {
    const base = `/ROI/ProjectLeadROIEntry/${intakeNumber}`;
    const isOnBase = location.pathname === base || location.pathname === `${base}/`;
    if (intakeNumber && isOnBase) {
      navigate("SummaryTab", { replace: true });
    }
  }, [location.pathname, intakeNumber, navigate]);

  // If someone types .../SavingsTabs exactly, push to ProjectSavingsTab child
  useEffect(() => {
    if (location.pathname.endsWith("/SavingsTabs")) {
      navigate("SavingsTabs/ProjectSavingsTab", { replace: true });
    }
  }, [location.pathname, navigate]);

  // Used for Save (kept same)
  const mainSegment = useMemo(() => {
    const parts = location.pathname.split("/");
    const idx = parts.indexOf(intakeNumber);
    return idx !== -1 ? (parts[idx + 1] || "SummaryTab") : "SummaryTab";
  }, [location.pathname, intakeNumber]);

  const onSave = () => {
    console.log(`Save clicked for main tab: ${mainSegment}`);
  };

  // Compact control classes
  const inputCls = "flex-1 border rounded-md px-2 py-1 bg-gray-100";
  const rowCls = "flex items-center gap-2";
  const labelCls = "w-56 text-gray-600"; // wider labels to align neatly

  const detailsInputCls = "border rounded-md px-2 py-1 bg-gray-100"; // no flex-1
  const inputSize = (v) => Math.min(60, Math.max(20, String(v || "").length + 2)); // wrap to content

  // Derive top-of-page header values (read-only)
  const projectNumberAndName =
    `${intakeNumber || ""}-${projectDetails?.intake_name || rows[0]?.ProjectName || ""}`;
  const programInitiative = projectDetails?.program || "";
  const releaseName = projectDetails?.release || rows[0]?.Release || "";
  const applicationsImpacted = projectDetails?.application || "";
  const automationLeadName = projectDetails?.automation_qe_lead || rows[0]?.AutomationLead || "";
  const portfolio = projectDetails?.domain || "";
  const changeType = projectDetails?.change_type || "";

  // =========================
  // FIX: Provide child tabs with ready-to-use context
  // - projectLabel (e.g., "437987-Name")
  // - portfolio (Domain)
  // - appOptions: from projectDetails.application CSV, else fallback to backend /api/fetchapplication
  // - defaultApp: first option (child will auto-select and trigger its loader)
  // =========================
  const projectLabel = useMemo(() => {
    const num = intakeNumber || "";
    const name = projectDetails?.intake_name || "";
    return [num, name].filter(Boolean).join("-");
  }, [intakeNumber, projectDetails?.intake_name]); // FIX

  const [appOptions, setAppOptions] = useState([]); // FIX

  useEffect(() => { // FIX
    const csv = (projectDetails?.application || "").trim();
    const csvList = Array.from(
      new Set(csv.split(",").map((s) => s.trim()).filter(Boolean))
    );
    if (csvList.length > 0) {
      setAppOptions(csvList);
      return;
    }
    if (!portfolio) return; // need Domain to fetch by portfolio

    fetch(`http://localhost:5000/api/fetchapplication?domain=${encodeURIComponent(portfolio)}`)
      .then((r) => r.json())
      .then((j) => {
        // If API returns {applications:[...]}, use it; otherwise if it's an array, use it directly
        const arr = Array.isArray(j?.applications) ? j.applications : (Array.isArray(j) ? j : []);
        const list = Array.from(new Set(arr.map(String).map((s) => s.trim()).filter(Boolean)));
        setAppOptions(list);
      })
      .catch(() => setAppOptions([]));
  }, [projectDetails?.application, portfolio]);

  const defaultApp = appOptions[0] || ""; // FIX

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">
        Project Lead ROI Entry — Intake #{intakeNumber}
      </h2>

      {/* ======= TOP: PROJECT HEADER (always visible, read-only) ======= */}
      <div className="space-y-3 mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Project Details</h3>

                {/* 2-column layout with same-row label+input pairs; left vs right field sets */}
        <div className="grid grid-cols-2 gap-6">
         {/* LEFT COLUMN */}
          <div className="space-y-3">
            <div className={rowCls}>
              <label className={labelCls}>Project Number and Name:</label>
              <input
                type="text"
                value={projectNumberAndName}
               disabled
                className={detailsInputCls}
                size={inputSize(projectNumberAndName)}  /* CHANGE: wrap to content */
              />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>Program / Initiative Name:</label>
              <input
                type="text"
                value={programInitiative}
                disabled
                className={detailsInputCls}
                size={inputSize(programInitiative)}     /* CHANGE: wrap to content */
              />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>Release Name:</label>
              <input
                type="text"
                value={releaseName}
                disabled
                className={detailsInputCls}
                size={inputSize(releaseName)}           /* CHANGE: wrap to content */
              />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>Applications Impacted:</label>
              <input
                type="text"
                value={applicationsImpacted}
                disabled
                className={detailsInputCls}
                size={inputSize(applicationsImpacted)}  /* CHANGE: wrap to content */
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-3">
            <div className={rowCls}>
              <label className={labelCls}>Automation Lead Name:</label>
              <input
                type="text"
                value={automationLeadName}
                disabled
                className={detailsInputCls}
                size={inputSize(automationLeadName)}    /* CHANGE: wrap to content */
              />
            </div>
            <div className={rowCls}>
              <label className={labelCls}>Portfolio:</label>
              <input
                type="text"
                value={portfolio}
                disabled
                className={detailsInputCls}
                size={inputSize(portfolio)}             /* CHANGE: wrap to content */
              />
            </div>
            
            
            
            
            <div className={rowCls}>
              <label className={labelCls}>Change Type:</label>
              <input
                type="text"
                value={changeType}
                disabled
                className={detailsInputCls}
                size={inputSize(changeType)}            /* CHANGE: wrap to content */
              />
            </div>



          </div>
        </div>
      </div>

      {/* ======= BELOW HEADER: MAIN TABS ======= */}
      {/* CHANGE: keep roiTabs.css highlighting; add 'active' class via NavLink callback */}
      <div className="roi-tabs">
        <NavLink className={({isActive}) => `roi-tab ${isActive ? 'active' : ''}`} to={`SummaryTab`}>Summary</NavLink>
        <NavLink className={({isActive}) => `roi-tab ${isActive ? 'active' : ''}`} to={`ProjectStatusTab`}>Project Status (Master intake)</NavLink>
        <NavLink className={({isActive}) => `roi-tab ${isActive ? 'active' : ''}`} to={`TestCaseCountTab`}>Test Case count (Master Dashboard)</NavLink>
        {/* Go directly to Savings parent + default child */}
        <NavLink className={({isActive}) => `roi-tab ${isActive ? 'active' : ''}`} to={`SavingsTabs/ProjectSavingsTab`}>Savings & ROI</NavLink>
      </div>

      {/* MAIN TAB CONTENT */}
      <div className="roi-tab-panel">
        {/* Keep passing projectDetails so ProjectSavingsTab can read projectDetails.application */}
        {/* FIX: also pass projectLabel/portfolio and usable application options for TestCaseCountTab */}
        <Outlet
          context={{
            intakeNumber,
            projectDetails,
            rows,
            setRows,
            // FIX: values below enable TestCaseCountTab to fire /api/masterdashboardfetchupdate on mount
            projectLabel,   // "<intakeNumber>-<intake_name>"
            portfolio,      // Domain
            appOptions,     // Applications list (CSV or fallback from API)
            defaultApp: appOptions[0] || "", // first option as default
          }}
        />
      </div>
    </div>
  );
}


