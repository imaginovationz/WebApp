// src/components/ROI/tabs/ProjectStatusTab.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import StatusUpdatesTab from "./StatusUpdatesTab";
import "../../../styles/roiTabs.css";

/* ===================== UI-ONLY LOCAL STYLES (added) ===================== */
const localStyles = `
/* Vertical sub tabs */
.metric-vertabs { display:flex; gap:14px; }
.metric-vertabs .tablinks { display:flex; flex-direction:column; width: 220px; gap:8px; }
.metric-vertabs .tablinks button {
  background:#f7f7f7; border:1px solid #ddd; padding:10px 12px; text-align:left;
  cursor:pointer; color:#222; border-radius:8px;
}
.metric-vertabs .tablinks button:hover { background:#eee; }
.metric-vertabs .tablinks button.active {
  background:#ffffff; font-weight:700; color:#111; border-color:#cfd2d6;
  box-shadow: inset -3px 0 0 0 #facc15; /* visual indicator */
}
.metric-vertabs .tabcontent {
  flex:1; background:#fff; border:1px solid #ddd; padding:12px; border-radius:8px;
}

/* Collapsible sections */
.collapse {
  border:1px solid #e2e6ea; border-radius:8px; margin-bottom:12px; background:#fff;
}
.collapse-header {
  display:flex; align-items:center; justify-content:space-between; gap:8px; cursor:pointer; user-select:none;
  padding:10px 12px; background:#fafbfc; border-bottom:1px dashed #e5e7eb; font-weight:600;
}
.collapse-header .chev { transition: transform .15s ease; }
.collapse-header .chev.closed { transform: rotate(-90deg); }
.collapse-body { padding:12px; }

/* Sticky Save All bar under the main tabs */
.sticky-savebar {
  position: sticky; top: 0; z-index: 5;
  display:flex; justify-content:flex-end; align-items:center; gap: 12px;
  background:#fff; padding: 8px 0 12px 0; border-bottom:1px dashed #e5e7eb;
}

/* Zebra striped table for Status Panel */
.zebra-table { width:100%; border-collapse: separate; border-spacing:0; }
.zebra-table thead th { background:#f3f4f6; position:sticky; top:0; z-index:1; }
.zebra-table th, .zebra-table td { border:1px solid #e5e7eb; padding:8px 10px; vertical-align:top; }
.zebra-table tbody tr:nth-child(odd){ background:#fafafa; }
.zebra-table tbody tr:nth-child(even){ background:#ffffff; }

.bulk-qe-deliv-cell { width: 100%; }
.bulk-qe-deliv-cell > * { width: 100%; }

/* Give inner grids more breathing room when inside Bulk cell */
.bulk-qe-deliv-cell .qe-deliv-grid { grid-template-columns: repeat(5, minmax(0,1fr)); }
@media (max-width: 1280px) { .bulk-qe-deliv-cell .qe-deliv-grid { grid-template-columns: repeat(4, minmax(0,1fr)); } }
@media (max-width: 1024px) { .bulk-qe-deliv-cell .qe-deliv-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }

/* Ensure any month pickers inside the Bulk table have comfortable width */
.bulk-qe-deliv-cell input[type="month"] { min-width: 14rem; }


/* Inline QE deliverables: 4 per row */
.qe-deliv-grid {
  display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:8px 14px;
}

.qe-deliv-grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:8px 12px; }
@media (max-width: 1024px) { .qe-deliv-grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }
@media (max-width: 640px)  { .qe-deliv-grid { grid-template-columns:1fr; } }

/* Tile look */
.qe-deliv-item {
  display:flex; align-items:center; gap:8px;
  border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px;
  background:#fafafa;
}

/* Also style labels inside the bulk table if they use inline-flex */
.zebra-table label.inline-flex {
  display:flex; align-items:center; gap:8px;
  border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px;
  background:#fafafa;
}


@media (max-width: 1024px) { .qe-deliv-grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }
@media (max-width: 640px)  { .qe-deliv-grid { grid-template-columns:1fr; } }
.qe-deliv-item { display:inline-flex; align-items:center; gap:6px; font-size:0.9rem; color:#374151; }
`;

/* ======== dynamic sizing helpers (UI only) ======== */
const sizeFor = (v) => Math.min(60, Math.max(12, String(v ?? "").length + 2));
const dynSize = (v) => ({ width: `${sizeFor(v)}ch` });

/* ======== existing classes: keep names; adjust widths to be dynamic ======== */
const labelCls = "text-sm text-gray-700";
const inputCls = "border rounded px-2 py-1 text-sm bg-gray-50";   // no w-full
const selectCls = "border rounded px-2 py-1 text-sm bg-gray-50";  // no w-full
const areaCls   = "border rounded px-2 py-1 text-sm bg-gray-50";  // no w-full
const sectionWrap = "border rounded-lg p-3 mb-3 bg-white";
const sectionTitle =
  "tab-section tab-section-yellow !bg-yellow-50 !text-gray-800 !py-2 !px-3 !rounded mb-2";

/* keep original grid helpers */
const grid2 = "grid grid-cols-1 md:grid-cols-2 gap-3";
const grid3 = "grid grid-cols-1 md:grid-cols-3 gap-3";

/* small collapsible helper (UI only) */
function Collapsible({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="collapse">
      <div className="collapse-header" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className={`chev ${open ? "" : "closed"}`}>▾</span>
      </div>
      {open && <div className="collapse-body">{children}</div>}
    </div>
  );
}

/* Timestamp helper (unchanged) */
function nowSQLite() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function ProjectStatusTab() {
  const { intakeNumber } = useOutletContext();

  /* keep sub-tab state; render vertically */
  const [activeSubTab, setActiveSubTab] = useState("kickoff"); // "kickoff" | "status"

  /* Status tab dirty + ref (unchanged logic) */
  const statusTabRef = useRef(null);
  const [statusDirty, setStatusDirty] = useState(false);

  // options (unchanged)
  const deliveryModelOptions = ["FP", "T&M"];
  const timelineOptions = ["Yes", "No"];
  
  const projectStatusOptions = [
    "Confirmed - Not Started",
    "Active - Discovery/pre kickoff",
    "Active - Project Kick Off",
    "Active - BRD/SRD",
    "Active - Solution / Design",
    "Active - Construction",
    "Active - DIT",
    "Active - SIT",
    "Active - UAT",
    "Project On Hold",
    "Project Completed / Closed",
    "Project Cancelled",
    "TBD (Status not known)",
  ];
  const changeTypeOptions = ["Program","Project","OR","MOPS","CR","CCR","INC"];

  const normalizeToYYYYMMDD = (v) => {
    if (!v) return "";
    const t = typeof v === "string" ? v.trim() : v;
    const d = new Date(t.includes(" ") ? t.replace(" ", "T") : t);
    if (!isNaN(d)) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${d.getDate().toString().padStart(2,"0")}`;
    }
    const m = t.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return t;
  };

  const estimateStatusOptions = ["Assigned For Estimation","Sent", "Automation-OOS"];
  const funcAutomationOptions = ["yes", "no"];
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

  // state (unchanged)
  const [resources, setResources] = useState([]);

  const [details, setDetails] = useState({
    deliveryModel: "",
    timelinesAvailable: "",
    projectCurrentStatus: "",
    programName: "",
    releaseName: "",
    applicationsImpacted: [],
    portfolio: "",
    changeType: "",
  });

  const [initiatives, setInitiatives] = useState({
    GenAI_PS:false, DDGS_SOA3:false, E2E:false, CGI_EnvoyAPI:false, QEDevops:false,
    ExcaliburLetter:false, Fireflink:false, mmtgRegressionPhase2:false,
    mmtgTDM:false, CLASSTDM:false, Conformiq:false
  });

  const [appsMenuOpen, setAppsMenuOpen] = useState(false);
  const [newAppValue, setNewAppValue] = useState("");
  const [releaseOptions, setReleaseOptions] = useState([]);
  const [applicationOptions, setApplicationOptions] = useState([]);

  const [stakeholders, setStakeholders] = useState({
    qaManager: "",
    functionalQeLead: "",
    funcSme: "",
    automationLeadOrQeLead: "",
    offshoreLead: "",
    fteOrAutomationArchitect: "",
    itPm: "",
  });

  const [dates, setDates] = useState({
    autoStartDate: "",
    autoEndDate: "",
    implementationDate: "",
  });

  const [estimation, setEstimation] = useState({
    estimateDueDate: "",
    estimateSubmittedOn: "",
    estimateStatusOrOOS: "",
    assignedToOrDoneBy: "",
    estimateReviewedBy: "",
    estimateApprovedBy: "",
    funcAutomation: "",
    reasonIfOOSorNoNew: "",
    qaCostWithoutAuto: "",
    qaCostWithAuto: "",
    automationCost: "",
    targetedMinSavings: "",
  });

  const [automationStatus, setAutomationStatus] = useState({
    currentStatus: "",
    comments: "",
  });

  const [deliverables, setDeliverables] = useState({
    testPlanLTW: false,
    qaChecklistFollowed: false,
    tcUpdateInALMConfluence: false,
    gitUpdate: false,
    dsr: false,
    leSentToPMMonthly: false,
    masterRegUpdatedALM: false,
    masterDashboardUpdated: false,
    releaseHandover: false,
    projectClosureReport: false,
    roiRealizedIn: "",
    qeTransformed: false,
    shiftLeftFollowed: false,
  });

  // NEW: display Last update
  const [meta, setMeta] = useState({ lastUpdated: "", intakeName: "" });

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [saveOk, setSaveOk] = useState("");
  const [snapshot, setSnapshot] = useState(null);

  // OOS selection
  const oosSelected = estimation.estimateStatusOrOOS === "Automation-OOS";
  const [oosRefFile, setOosRefFile] = useState(null);
  const [oosRefUploading, setOosRefUploading] = useState(false);
  const [oosRefUploadMsg, setOosRefUploadMsg] = useState("");

  // load once per intake (unchanged)
  const loadedRef = useRef(false);
  useEffect(() => { loadedRef.current = false; }, [intakeNumber]);

  useEffect(() => {
    if (!intakeNumber || loadedRef.current) return;
    let mounted = true;
    (async () => {
      try {
        const [resProj, resRes, resDel] = await Promise.all([
          axios.get(`http://localhost:5000/api/projects/${intakeNumber}`),
          axios.get("http://localhost:5000/api/resourcefetch"),
          axios.get(`http://localhost:5000/api/automationdeliverables/${intakeNumber}`),
        ]);
        if (!mounted) return;

        const p = resProj.data || {};
        const names = Array.isArray(resRes.data?.resources)
          ? resRes.data.resources
          : Array.isArray(resRes.data)
          ? resRes.data
          : [];
        setResources(names);

        setDetails({
          deliveryModel: p.DeliveryModel || "",
          timelinesAvailable: p.TimeLineAvailable || "",
          projectCurrentStatus: p.project_status || "",
          programName: p.Program || "",
          releaseName: p.release || "",
          applicationsImpacted: (p.application || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          portfolio: p.domain || "",
          changeType: p.change_type || ""
        });

        setStakeholders({
          qaManager: p.QAManager || "",
          functionalQeLead: p.functional_qe_lead || "",
          funcSme: p.FuncSME || "",
          automationLeadOrQeLead: p.automation_qe_lead || "",
          offshoreLead: p.OffshoreLead || "",
          fteOrAutomationArchitect: p.FTE_Architect || "",
          itPm: p.ITPM || "",
        });

        setDates({
          autoStartDate: p.AutoWorkStartDate || "",
          autoEndDate: p.AutoWorkEndDate || "",
          implementationDate: p.ImplementationDate || "",
        });

        const manual = p.manual_cost ?? "";
        const autoCost = p.automation_cost ?? "";
        const qeCost  = p.qe_cost ?? "";
        const qaCostWithout = manual;
        const qaCostWith    = qeCost;
        const minSavings =
          (qaCostWithout !== "" || qaCostWith !== "" || autoCost !== "")
            ? Number(qaCostWithout || 0) - (Number(qaCostWith || 0))
            : (p.PSEMinSavings || "");

        setEstimation({
          estimateDueDate: p.AutoEstimateDueDate || "",
          estimateSubmittedOn: p.AutoEstimateSubmittedOn || "",
          estimateStatusOrOOS: p.AutoEstimateStatus || "",
          assignedToOrDoneBy: p.EstimateAssignedTo || "",
          estimateReviewedBy: p.EstimateReviewedBy || "",
          funcAutomation: p.FuncAutomationScope || "",
          reasonIfOOSorNoNew: p.AutoOOSReason || "",
          estimateApprovedBy: p.EstimateApprovedBy || "",
          qaCostWithoutAuto: qaCostWithout,
          qaCostWithAuto: qaCostWith,
          automationCost: autoCost,
          targetedMinSavings: minSavings,
        });

        setAutomationStatus({
          currentStatus: p.AutomationStatus || "",
          comments: p.Comments || "",
        });

        setMeta({ lastUpdated: p.timestamp || "", intakeName: p.intake_name || "" });

        const d = resDel?.data || {};
        setDeliverables({
          testPlanLTW: !!d.AutomationTestPlan,
          qaChecklistFollowed: !!d.Checklist,
          tcUpdateInALMConfluence: !!d.ALMupdate,
          gitUpdate: !!d.GITUpdate,
          dsr: !!d.DSR,
          leSentToPMMonthly: !!d.LESubmitted,
          masterRegUpdatedALM: !!d.RegressionTestLab,
          masterDashboardUpdated: !!d.DashboardMetric,
          releaseHandover: !!d.ReleaseHandover,
          projectClosureReport: !!d.ProjectClosure,
          roiRealizedIn: d.ROIMonth || "",
          qeTransformed: !!d.QETransformed,
          shiftLeftFollowed: !!d.ShiftLeft,
        });

        setSnapshot({
          details: {
            deliveryModel: p.DeliveryModel || "",
            timelinesAvailable: p.TimeLineAvailable || "",
            projectCurrentStatus: p.project_status || "",
            programName: p.Program || "",
            releaseName: p.release || "",
            applicationsImpacted: (p.application || "")
              .split(",").map((s)=>s.trim()).filter(Boolean),
            portfolio: p.domain || "",
          },
          stakeholders: {
            qaManager: p.QAManager || "",
            functionalQeLead: p.functional_qe_lead || "",
            funcSme: p.FuncSME || "",
            automationLeadOrQeLead: p.automation_qe_lead || "",
            offshoreLead: p.OffshoreLead || "",
            fteOrAutomationArchitect: p.FTE_Architect || "",
            itPm: p.ITPM || "",
          },
          dates: {
            autoStartDate: p.AutoWorkStartDate || "",
            autoEndDate: p.AutoWorkEndDate || "",
            implementationDate: p.ImplementationDate || "",
          },
          estimation: {
            estimateDueDate: p.AutoEstimateDueDate || "",
            estimateSubmittedOn: p.AutoEstimateSubmittedOn || "",
            estimateStatusOrOOS: p.AutoEstimateStatus || "",
            assignedToOrDoneBy: p.EstimateAssignedTo || "",
            estimateReviewedBy: p.EstimateReviewedBy || "",
            funcAutomation: p.FuncAutomationScope || "",
            reasonIfOOSorNoNew: p.AutoOOSReason || "",
            qaCostWithoutAuto: qaCostWithout,
            qaCostWithAuto: qaCostWith,
            automationCost: autoCost,
            targetedMinSavings: minSavings,
          },
          automationStatus: {
            currentStatus: p.AutomationStatus || "",
            comments: p.Comments || "",
          },
          deliverables: {
            testPlanLTW: !!d.AutomationTestPlan,
            qaChecklistFollowed: !!d.Checklist,
            tcUpdateInALMConfluence: !!d.ALMupdate,
            gitUpdate: !!d.GITUpdate,
            dsr: !!d.DSR,
            leSentToPMMonthly: !!d.LESubmitted,
            masterRegUpdatedALM: !!d.RegressionTestLab,
            masterDashboardUpdated: !!d.DashboardMetric,
            releaseHandover: !!d.ReleaseHandover,
            projectClosureReport: !!d.ProjectClosure,
            roiRealizedIn: d.ROIMonth || "",
            qeTransformed: !!d.QETransformed,
            shiftLeftFollowed: !!d.ShiftLeft,
          },
          meta: { lastUpdated: p.timestamp || "" },
        });

        loadedRef.current = true;
      } catch (e) {
        console.error("Failed to load project status data", e);
      }
    })();
    return () => { mounted = false; };
  }, [intakeNumber]);

  useEffect(() => {
    if (!intakeNumber) return;
    (async () => {
      try {
        const r = await axios.get("http://localhost:5000/api/initiativeplannedusage", {
          params: { intake_number: intakeNumber }
        });
        const row = r.data || {};
        setInitiatives({
          GenAI_PS: (row.GenAI_PS === "YES"),
          DDGS_SOA3: (row.DDGS_SOA3 === "YES"),
          E2E: (row.E2E === "YES"),
          CGI_EnvoyAPI: (row["CGI EnvoyAPI"] === "YES"),
          QEDevops: (row.QEDevops === "YES"),
          ExcaliburLetter: (row.ExcaliburLetter === "YES"),
          Fireflink: (row.Fireflink === "YES"),
          mmtgRegressionPhase2: (row.mmtgRegressionPhase2 === "YES"),
          mmtgTDM: (row.mmtgTDM === "YES"),
          CLASSTDM: (row.CLASSTDM === "YES"),
          Conformiq: (row.Conformiq === "YES")
        });
      } catch {}
    })();
  }, [intakeNumber]);

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get("http://localhost:5000/api/fetchreleases");
        const list = Array.isArray(r.data?.releases) ? r.data.releases : [];
        setReleaseOptions(list);
      } catch (e) {
        console.error("Failed to fetch releases", e);
        setReleaseOptions([]);
      }
    })();
  }, []);

  useEffect(() => {
    const domain = (details?.portfolio || "").trim();
    if (!domain) { setApplicationOptions([]); return; }
    (async () => {
      try {
        const r = await axios.get("http://localhost:5000/api/fetchapplication", { params: { domain } });
        const list = Array.isArray(r.data?.applications) ? r.data.applications : [];
        setApplicationOptions(list);
      } catch (e) {
        console.error("Failed to fetch applications", e);
        setApplicationOptions([]);
      }
    })();
  }, [details?.portfolio]);

  // sync derived savings (unchanged)
  useEffect(() => {
    const qaCostWithout = Number(estimation.qaCostWithoutAuto || 0);
    const qeCost        = Number(estimation.qaCostWithAuto   || 0);
    const autoCost      = Number(estimation.automationCost   || 0);
    const next = qaCostWithout - (qeCost);
    if (String(next) !== String(estimation.targetedMinSavings)) {
      setEstimation((s) => ({ ...s, targetedMinSavings: next }));
    }
  }, [
    estimation.qaCostWithoutAuto,
    estimation.qaCostWithAuto,
    estimation.automationCost,
    estimation.targetedMinSavings
  ]);

  // dirty flag (unchanged)
  const dirty = useMemo(() => {
    if (!snapshot) return false;
    const now = { details, stakeholders, dates, estimation, automationStatus, deliverables,initiatives  };
    const snap = {
      details: snapshot.details,
      stakeholders: snapshot.stakeholders,
      dates: snapshot.dates,
      estimation: snapshot.estimation,
      automationStatus: snapshot.automationStatus,
      deliverables: snapshot.deliverables,
    };
    return JSON.stringify(now) !== JSON.stringify(snap);
  }, [details, stakeholders, dates, estimation, automationStatus, deliverables, snapshot]);

  const resetBanners = () => { setSaveErr(""); setSaveOk(""); };

  // OOS upload (unchanged)
  const onDropOOSRef = (e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) setOosRefFile(f); };
  const onPickOOSRef = (e) => { const f = e.target?.files?.[0]; if (f) setOosRefFile(f); };
  const uploadOOSRef = async () => {
    if (!oosRefFile || !intakeNumber) return;
    if (!window.confirm("This action is irreversible. You will not be able to update projects details later")) return;
    setOosRefUploading(true); setOosRefUploadMsg("");
    try {
      const form = new FormData();
      form.append("intake_number", intakeNumber);
      form.append("file", oosRefFile);
      const resp = await axios.post("http://localhost:5000/api/oosref_upload", form,
        { headers: { "Content-Type": "multipart/form-data" } });
      setOosRefUploadMsg(resp.data?.message || "Uploaded.");
      setOosRefFile(null);
    } catch (e) {
      console.error(e);
      setOosRefUploadMsg("Upload failed.");
    } finally { setOosRefUploading(false); }
  };

  // save all (unchanged logic)
  const onSaveAll = async () => {
    resetBanners();

    // status tab bulk save passthrough (unchanged)
    if (activeSubTab === "status" && statusTabRef.current?.bulkSaveAll) {
      setSaving(true);
      try {
        await statusTabRef.current.bulkSaveAll();
        setSaveOk("Saved successfully.");
        setStatusDirty(false);
      } catch (e) {
        console.error("Bulk save (status tab) failed", e);
        setSaveErr("Save failed. See console for details.");
      } finally { setSaving(false); }
      return;
    }
    if (!dirty) return;

    setSaving(true);
    try {
      const updates = [];
      const pushIfChanged = (table, column, newVal, oldVal) => {
        if (String(newVal ?? "") !== String(oldVal ?? "")) {
          updates.push({ table, column, value: newVal });
        }
      };

      // sample extra field mapping retained
      pushIfChanged("projects", "change_type", details.changeType, snapshot.details.changeType);

      const normalizedDue = normalizeToYYYYMMDD(estimation.estimateDueDate || "");
      if (normalizedDue !== snapshot.estimation.estimateDueDate) {
        updates.push({ table:"projects", column:"AutoEstimateDueDate", value: normalizedDue });
      }

      let commentsToSave = automationStatus.comments;
      if (automationStatus.comments !== snapshot.automationStatus.comments) {
        const stamp = nowSQLite();
        const newLine = `${stamp} : ${automationStatus.comments || ""}`.trim();
        const older = snapshot.automationStatus.comments || "";
        commentsToSave = older ? `${newLine}\n\n${older}` : newLine;
      }
      if (commentsToSave !== snapshot.automationStatus.comments) {
        updates.push({ table:"projects", column:"Comments", value: commentsToSave });
      }

      if (String(deliverables.roiRealizedIn ?? "") !== String(snapshot.deliverables.roiRealizedIn ?? "")) {
        updates.push({ table:"automationdeliverables", column:"ROIMonth", value: deliverables.roiRealizedIn });
      }
      if (meta.intakeName) {
        updates.push({ table:"automationdeliverables", column:"intake_name", value: meta.intakeName });
      }

      const yn = (b)=> (b ? "YES" : "");
      [
        ["GenAI_PS","GenAI_PS"],["DDGS_SOA3","DDGS_SOA3"],["E2E","E2E"],["CGI_EnvoyAPI","CGI EnvoyAPI"],
        ["QEDevops","QEDevops"],["ExcaliburLetter","ExcaliburLetter"],["Fireflink","Fireflink"],
        ["mmtgRegressionPhase2","mmtgRegressionPhase2"],["mmtgTDM","mmtgTDM"],["CLASSTDM","CLASSTDM"],["Conformiq","Conformiq"]
      ].forEach(([stateKey, dbCol])=>{
        updates.push({ table:"InitiativesPlannedUsage", column: dbCol, value: yn(initiatives[stateKey]) });
      });
      updates.push({ table:"InitiativesPlannedUsage", column:"intake_number", value: String(intakeNumber) });
      if (meta.intakeName) updates.push({ table:"InitiativesPlannedUsage", column:"intake_name", value: meta.intakeName });

      // base timestamp
      updates.push({ table:"projects", column:"timestamp", value: nowSQLite() });

      const resp2 = await axios.post("http://localhost:5000/api/projectmasterupdate", {
        intake_number: intakeNumber, updates
      });

      // details
      pushIfChanged("projects", "DeliveryModel", details.deliveryModel, snapshot.details.deliveryModel);
      pushIfChanged("projects", "TimeLineAvailable", details.timelinesAvailable, snapshot.details.timelinesAvailable);
      pushIfChanged("projects", "project_status", details.projectCurrentStatus, snapshot.details.projectCurrentStatus);
      pushIfChanged("projects", "Program", details.programName, snapshot.details.programName);
      pushIfChanged("projects", "release", details.releaseName, snapshot.details.releaseName);
      pushIfChanged("projects", "application",
        (details.applicationsImpacted || []).join(", "),
        (snapshot.details.applicationsImpacted || []).join(", ")
      );
      pushIfChanged("projects", "domain", details.portfolio, snapshot.details.portfolio);

      // stakeholders
      pushIfChanged("projects", "QAManager", stakeholders.qaManager, snapshot.stakeholders.qaManager);
      pushIfChanged("projects", "functional_qe_lead", stakeholders.functionalQeLead, snapshot.stakeholders.functionalQeLead);
      pushIfChanged("projects", "FuncSME", stakeholders.funcSme, snapshot.stakeholders.funcSme);
      pushIfChanged("projects", "automation_qe_lead", stakeholders.automationLeadOrQeLead, snapshot.stakeholders.automationLeadOrQeLead);
      pushIfChanged("projects", "OffshoreLead", stakeholders.offshoreLead, snapshot.stakeholders.offshoreLead);
      pushIfChanged("projects", "FTE_Architect", stakeholders.fteOrAutomationArchitect, snapshot.stakeholders.fteOrAutomationArchitect);
      pushIfChanged("projects", "ITPM", stakeholders.itPm, snapshot.stakeholders.itPm);

      // dates
      pushIfChanged("projects", "AutoWorkStartDate", dates.autoStartDate, snapshot.dates.autoStartDate);
      pushIfChanged("projects", "AutoWorkEndDate", dates.autoEndDate, snapshot.dates.autoEndDate);
      pushIfChanged("projects_timeline", "ImplementationDate", dates.implementationDate, snapshot.dates.implementationDate);

      // estimation
      pushIfChanged("projects", "AutoEstimateDueDate", estimation.estimateDueDate, snapshot.estimation.estimateDueDate);
      pushIfChanged("projects", "AutoEstimateSubmittedOn", estimation.estimateSubmittedOn, snapshot.estimation.estimateSubmittedOn);
      pushIfChanged("projects", "AutoEstimateStatus", estimation.estimateStatusOrOOS, snapshot.estimation.estimateStatusOrOOS);
      pushIfChanged("projects", "EstimateAssignedTo", estimation.assignedToOrDoneBy, snapshot.estimation.assignedToOrDoneBy);
      pushIfChanged("projects", "EstimateReviewedBy", estimation.estimateReviewedBy, snapshot.estimation.estimateReviewedBy);
      pushIfChanged("projects", "FuncAutomationScope", estimation.funcAutomation, snapshot.estimation.funcAutomation);
      pushIfChanged("projects", "EstimateApprovedBy", estimation.estimateApprovedBy, snapshot.estimation.estimateApprovedBy);
      if (estimation.funcAutomation === "no") {
        pushIfChanged("projects", "AutoOOSReason", estimation.reasonIfOOSorNoNew, snapshot.estimation.reasonIfOOSorNoNew);
      }
      if (estimation.estimateStatusOrOOS === "Automation-OOS") {
        pushIfChanged("projects", "AutomationOOSReason", estimation.reasonIfOOSorNoNew, snapshot.estimation.reasonIfOOSorNoNew);
}

      pushIfChanged("projects", "manual_cost", estimation.qaCostWithoutAuto, snapshot.estimation.qaCostWithoutAuto);
      pushIfChanged("projects", "qe_cost", estimation.qaCostWithAuto, snapshot.estimation.qaCostWithAuto);
      pushIfChanged("projects", "automation_cost", estimation.automationCost, snapshot.estimation.automationCost);
      pushIfChanged("projects", "PSEMinSavings", estimation.targetedMinSavings, snapshot.estimation.targetedMinSavings);

      // automation status
      pushIfChanged("projects", "AutomationStatus", automationStatus.currentStatus, snapshot.automationStatus.currentStatus);

      // deliverables -> automationdeliverables
      const snapDel = snapshot.deliverables;
      const yesNo = (b) => (b ? "YES" : "");
      const sameYN = (bNow, bOld) => String(yesNo(bNow)) === String(yesNo(bOld));
      const doYN = (key, col) => {
        if (!sameYN(deliverables[key], snapDel[key])) {
          updates.push({ table: "automationdeliverables", column: col, value: yesNo(deliverables[key]) });
        }
      };
      doYN("testPlanLTW", "AutomationTestPlan");
      doYN("qaChecklistFollowed", "Checklist");
      doYN("tcUpdateInALMConfluence", "ALMupdate");
      doYN("gitUpdate", "GITUpdate");
      doYN("leSentToPMMonthly", "LESubmitted");
      doYN("masterRegUpdatedALM", "RegressionTestLab");
      doYN("masterDashboardUpdated", "DashboardMetric");
      doYN("releaseHandover", "ReleaseHandover");
      doYN("projectClosureReport", "ProjectClosure");
      doYN("qeTransformed", "QETransformed");
      doYN("shiftLeftFollowed", "ShiftLeft");
      doYN("dsr", "DSR");

      // ROI month
      const snapRoi = snapDel.roiRealizedIn;
      if (String(deliverables.roiRealizedIn ?? "") !== String(snapRoi ?? "")) {
        updates.push({ table: "automationdeliverables", column: "ROIMonth", value: deliverables.roiRealizedIn });
      }

      const newTs = nowSQLite();
      updates.push({ table: "projects", column: "timestamp", value: newTs });

      const resp = await axios.post("http://localhost:5000/api/projectmasterupdate", {
        intake_number: intakeNumber, updates,
      });

      if (resp.status === 200 && resp.data?.ok) {
        setSaveOk("Saved successfully.");
        try {
          const fres = await axios.get(`http://localhost:5000/api/projects/${intakeNumber}`);
          const serverTs = fres?.data?.timestamp || newTs;
          setMeta({ lastUpdated: serverTs });
          setSnapshot({
            details,
            stakeholders,
            dates,
            estimation: { ...estimation, estimateApprovedBy: estimation.estimateApprovedBy },
            automationStatus: { ...automationStatus, comments: commentsToSave },
            deliverables,
            meta: { lastUpdated: serverTs },
          });
        } catch (_e) {
          setMeta({ lastUpdated: newTs });
          setSnapshot({
            details, stakeholders, dates, estimation, automationStatus, deliverables, meta: { lastUpdated: newTs },
          });
        }
      } else {
        setSaveErr(resp.data?.error || "Update failed.");
      }
    } catch (e) {
      console.error("Save failed", e);
      setSaveErr("Save failed. See console for details.");
    } finally { setSaving(false); }
  };

  // Deliverables list (unchanged keys)
  const deliverableList = [
    ["Automation Test Plan", "testPlanLTW"],
    ["QA Checklist followed", "qaChecklistFollowed"],
    ["Test Case update in ALM", "tcUpdateInALMConfluence"],
    ["GIT Update", "gitUpdate"],
    ["LE Sent to PM (Monthly Once)", "leSentToPMMonthly"],
    ["Master Regression Updated in ALM Library", "masterRegUpdatedALM"],
    ["Master Dashboard Updated", "masterDashboardUpdated"],
    ["Release Handover", "releaseHandover"],
    ["Project Closure Report", "projectClosureReport"],
    ["QE Transformed", "qeTransformed"],
    ["Shift Left followed", "shiftLeftFollowed"],
    ["DSR", "dsr"],
  ];

  /* ===================== RENDER ===================== */
  return (
    <div className="tab-wrap">
      <style>{localStyles}</style>

      {/* Vertical sub-tabs */}
      <div className="metric-vertabs">
        <div className="tablinks">
          <button
            type="button"
            className={activeSubTab === "kickoff" ? "active" : ""}
            onClick={() => setActiveSubTab("kickoff")}
          >
            Project kick off/Update (single)
          </button>
          <button
            type="button"
            className={activeSubTab === "status" ? "active" : ""}
            onClick={() => setActiveSubTab("status")}
          >
            Projects update For Lead (Bulk)
          </button>
        </div>

        {/* Right pane */}
        <div className="tabcontent">
          {/* Sticky Save bar just under the main tabs (extreme right) */}
          <div className="sticky-savebar">
            <div className="mr-auto text-sm text-gray-600">
              <span className="font-medium">Last update:</span>{" "}
              <span>{meta.lastUpdated || "-"}</span>
            </div>
            {saveOk && <span className="text-green-700 text-sm">{saveOk}</span>}
            {saveErr && <span className="text-red-700 text-sm">{saveErr}</span>}
            <button
              className="btn-red"
              onClick={onSaveAll}
              disabled={(!(dirty || statusDirty)) || saving}
              title={!(dirty || statusDirty) ? "No changes to save" : "Save updates"}
            >
              {saving ? "Saving..." : "<Save All>"}
            </button>
          </div>

          {/* === KICKOFF SUBTAB (with collapsibles; default collapsed) === */}
          {activeSubTab === "kickoff" ? (
            <>

              <Collapsible title="Project Details" defaultOpen={false}>
                {/* Disable entire section when OOS is selected */}
                <fieldset disabled={oosSelected}>
                  <div className={grid3}>
                    <div className="flex flex-col">
                      <span className={labelCls}>Delivery model</span>
                      <select
                        className={selectCls}
                        style={dynSize(details.deliveryModel)}
                        value={details.deliveryModel}
                        onChange={(e)=> setDetails(s=>({...s, deliveryModel:e.target.value}))}
                      >
                        <option value="">-- Select --</option>
                        {deliveryModelOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Project Timelines Available ?</span>
                      <select
                        className={selectCls}
                        style={dynSize(details.timelinesAvailable)}
                        value={details.timelinesAvailable}
                        onChange={(e)=> setDetails(s=>({...s, timelinesAvailable:e.target.value}))}
                      >
                        <option value="">-- Select --</option>
                        {timelineOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Project Current Status</span>
                      <select
                        className={selectCls}
                        style={dynSize(details.projectCurrentStatus)}
                        value={details.projectCurrentStatus}
                        onChange={(e)=> setDetails(s=>({...s, projectCurrentStatus:e.target.value}))}
                      >
                        <option value="">-- Select --</option>
                        {projectStatusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Change Type</span>
                      <select
                        className={selectCls}
                        style={dynSize(details.changeType)}
                        value={details.changeType}
                        onChange={(e)=>setDetails(s=>({...s, changeType: e.target.value}))}
                      >
                        <option value="">-- Select --</option>
                        {changeTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className={grid3}>
                    <div className="flex flex-col">
                      <span className={labelCls}>Program / Initiative Name</span>
                      <input
                        className={inputCls}
                        style={dynSize(details.programName)}
                        value={details.programName}
                        onChange={(e)=> setDetails(s=>({...s, programName:e.target.value}))}
                        placeholder="Program or initiative"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Release Name</span>
                      <select
                        className={selectCls}
                        style={dynSize(details.releaseName)}
                        value={details.releaseName}
                        onChange={(e)=> setDetails(s=>({...s, releaseName:e.target.value}))}
                      >
                        <option value="">-- Select --</option>
                        {releaseOptions.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Portfolio</span>
                      <input
                        className={inputCls}
                        style={dynSize(details.portfolio)}
                        value={details.portfolio}
                        onChange={(e)=> setDetails(s=>({...s, portfolio:e.target.value}))}
                        placeholder="Domain / Portfolio"
                      />
                    </div>
                  </div>

                  <div className={grid3}>
                    <div className="flex flex-col md:col-span-3">
                      <span className={labelCls}>Applications Impacted</span>
                      <div className="relative">
                        <input
                          className={inputCls}
                          style={dynSize((details.applicationsImpacted||[]).join(", "))}
                          readOnly
                          value={(details.applicationsImpacted || []).join(", ")}
                          placeholder="Select one or more applications"
                          onClick={() => setAppsMenuOpen(v=>!v)}
                        />
                        {appsMenuOpen && (
                          <div className="absolute z-10 mt-1 w-full border rounded bg-white p-2 max-h-56 overflow-auto shadow">
                            {applicationOptions.map(opt => (
                              <label key={opt} className="flex items-center gap-2 text-sm py-1">
                                <input
                                  type="checkbox"
                                  checked={(details.applicationsImpacted || []).includes(opt)}
                                  onChange={(e) => {
                                    const on = e.target.checked;
                                    setDetails(s => {
                                      const cur = new Set(s.applicationsImpacted || []);
                                      if (on) cur.add(opt); else cur.delete(opt);
                                      return { ...s, applicationsImpacted: Array.from(cur) };
                                    });
                                  }}
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                className={inputCls}
                                style={dynSize(newAppValue)}
                                placeholder="Add application…"
                                value={newAppValue}
                                onChange={(e)=> setNewAppValue(e.target.value)}
                              />
                              <button
                                type="button"
                                className="btn-red"
                                onClick={() => {
                                  const v = (newAppValue || "").trim();
                                  if (!v) return;
                                  setDetails((s) => {
                                    const cur = new Set(s.applicationsImpacted || []);
                                    cur.add(v);
                                    return { ...s, applicationsImpacted: Array.from(cur) };
                                  });
                                  setNewAppValue("");
                                }}
                              >
                                Add
                              </button>
                              <button type="button" className="btn-red" onClick={() => setAppsMenuOpen(false)}>Done</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </fieldset>
              </Collapsible>

              <Collapsible title="Project Stakeholders" defaultOpen={false}>
                <fieldset disabled={oosSelected}>
                  <div className={grid3}>
                    <div className="flex flex-col">
                      <span className={labelCls}>QA Manager</span>
                      <input
                        className={inputCls}
                        style={dynSize(stakeholders.qaManager)}
                        value={stakeholders.qaManager}
                        onChange={(e)=> setStakeholders(s=>({...s, qaManager:e.target.value}))}
                        placeholder="Name"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Functional_qe_lead</span>
                      <input
                        className={inputCls}
                        style={dynSize(stakeholders.functionalQeLead)}
                        value={stakeholders.functionalQeLead}
                        onChange={(e)=> setStakeholders(s=>({...s, functionalQeLead:e.target.value}))}
                        placeholder="Name"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Func. SME</span>
                      <input
                        className={inputCls}
                        style={dynSize(stakeholders.funcSme)}
                        value={stakeholders.funcSme}
                        onChange={(e)=> setStakeholders(s=>({...s, funcSme:e.target.value}))}
                        placeholder="Name"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Automation Lead (old) / QE lead (new)</span>
                      <select
                        className={selectCls}
                        style={dynSize(stakeholders.automationLeadOrQeLead)}
                        value={stakeholders.automationLeadOrQeLead}
                        onChange={(e)=> setStakeholders(s=>({...s, automationLeadOrQeLead:e.target.value}))}
                      >
                        <option value="">-- Select --</option>
                        {resources.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Offshore Lead Resource</span>
                      <select
                        className={selectCls}
                        style={dynSize(stakeholders.offshoreLead)}
                        value={stakeholders.offshoreLead}
                        onChange={(e)=> setStakeholders(s=>({...s, offshoreLead:e.target.value}))}
                      >
                        <option value="">-- Select --</option>
                        {resources.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>FTE (old) / Automation Architect (new)</span>
                      <select
                        className={selectCls}
                        style={dynSize(stakeholders.fteOrAutomationArchitect)}
                        value={stakeholders.fteOrAutomationArchitect}
                        onChange={(e)=> setStakeholders(s=>({...s, fteOrAutomationArchitect:e.target.value}))}
                      >
                        <option value="">-- Select --</option>
                        {resources.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>IT PM</span>
                      <input
                        className={inputCls}
                        style={dynSize(stakeholders.itPm)}
                        value={stakeholders.itPm}
                        onChange={(e)=> setStakeholders(s=>({...s, itPm:e.target.value}))}
                        placeholder="Name"
                      />
                    </div>
                  </div>
                </fieldset>
              </Collapsible>

              <Collapsible title="Project Dates" defaultOpen={false}>
                <fieldset disabled={oosSelected}>
                  <div className={grid3}>
                    <div className="flex flex-col">
                      <span className={labelCls}>Auto. Work Start Date</span>
                      <input
                        className={inputCls}
                        style={{ ...dynSize(dates.autoStartDate), width: '14rem', minWidth: '14rem' }}
                        type="date"
                        value={dates.autoStartDate}
                        onChange={(e)=> setDates(s=>({...s, autoStartDate:e.target.value}))}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Auto. Work End Date</span>
                      <input
                        className={inputCls}
                        
                        style={{ ...dynSize(dates.autoEndDate), width: '14rem', minWidth: '14rem' }}
                        type="date"
                        value={dates.autoEndDate}
                        onChange={(e)=> setDates(s=>({...s, autoEndDate:e.target.value}))}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Implementation Date</span>
                      <input
                        className={inputCls}
                        
                        style={{ ...dynSize(dates.implementationDate), width: '14rem', minWidth: '14rem' }}
                        type="date"
                        value={dates.implementationDate}
                        onChange={(e)=> setDates(s=>({...s, implementationDate:e.target.value}))}
                      />
                    </div>
                  </div>
                </fieldset>
              </Collapsible>

              <Collapsible title="Automation Estimation" defaultOpen={false}>
                {/* Keep OOS selector enabled */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="flex flex-col">
                    <span className={labelCls}>Estimate Status / OOS</span>
                    <select
                      className={selectCls}
                      style={dynSize(estimation.estimateStatusOrOOS)}
                      value={estimation.estimateStatusOrOOS}
                      onChange={(e)=> setEstimation(s=>({...s, estimateStatusOrOOS:e.target.value}))}
                    >
                      <option value="">-- Select --</option>
                      {estimateStatusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* Others disabled when OOS */}
                <fieldset disabled={oosSelected}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <span className={labelCls}>Estimate Due Date</span>
                      <input
                        className={inputCls}
                        style={dynSize(estimation.estimateDueDate)}
                        type="date"
                        value={estimation.estimateDueDate}
                        onChange={(e)=> setEstimation(s=>({...s, estimateDueDate:e.target.value}))}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Estimate Submitted On</span>
                      <input
                        className={inputCls}
                        style={dynSize(estimation.estimateSubmittedOn)}
                        type="date"
                        value={estimation.estimateSubmittedOn}
                        onChange={(e)=> setEstimation(s=>({...s, estimateSubmittedOn:e.target.value}))}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Assigned to / Estimate Done by</span>
                      <input
                        className={inputCls}
                        style={dynSize(estimation.assignedToOrDoneBy)}
                        value={estimation.assignedToOrDoneBy}
                        onChange={(e)=> setEstimation(s=>({...s, assignedToOrDoneBy:e.target.value}))}
                        placeholder="Name"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Estimate Reviewed By</span>
                      <input
                        className={inputCls}
                        style={dynSize(estimation.estimateReviewedBy)}
                        value={estimation.estimateReviewedBy}
                        onChange={(e)=> setEstimation(s=>({...s, estimateReviewedBy:e.target.value}))}
                        placeholder="Name"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Estimate Approved by</span>
                      <input
                        className={inputCls}
                        style={dynSize(estimation.estimateApprovedBy)}
                        value={estimation.estimateApprovedBy}
                        onChange={(e)=> setEstimation(s=>({...s, estimateApprovedBy:e.target.value}))}
                        placeholder="Name"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Func. Automation</span>
                      <select
                        className={selectCls}
                        style={dynSize(estimation.funcAutomation)}
                        value={estimation.funcAutomation}
                        onChange={(e)=> setEstimation(s=>({...s, funcAutomation:e.target.value}))}
                      >
                        <option value="">-- Select --</option>
                        {funcAutomationOptions.map(o=> <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col md:col-span-2">
                      <span className={labelCls}>Reason if No Func. Automation / No New Automation</span>
                      <textarea
                        className={areaCls}
                        style={{ ...dynSize(estimation.reasonIfOOSorNoNew), maxWidth: "100%" }}
                        rows={3}
                        value={estimation.reasonIfOOSorNoNew}
                        onChange={(e)=> setEstimation(s=>({...s, reasonIfOOSorNoNew:e.target.value}))}
                        placeholder="Enter reason"
                        disabled={!oosSelected && estimation.funcAutomation !== "no"}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Total Manual QA Cost (Without Automation)</span>
                      <input
                        className={inputCls}
                        style={dynSize(estimation.qaCostWithoutAuto)}
                        type="number"
                        value={estimation.qaCostWithoutAuto}
                        onChange={(e)=> setEstimation(s=>({...s, qaCostWithoutAuto:e.target.value}))}
                        placeholder="0"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Automation Cost</span>
                      <input
                        className={inputCls}
                        style={dynSize(estimation.automationCost)}
                        type="number"
                        value={estimation.automationCost}
                        onChange={(e)=> setEstimation(s=>({...s, automationCost:e.target.value}))}
                        placeholder="0"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Total QE Cost (Manual + Automation)</span>
                      <input
                        className={inputCls}
                        style={dynSize(estimation.qaCostWithAuto)}
                        type="number"
                        value={estimation.qaCostWithAuto}
                        onChange={(e)=> setEstimation(s=>({...s, qaCostWithAuto:e.target.value}))}
                        placeholder="0"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Targeted Min. Savings</span>
                      <input
                        className={inputCls}
                        style={dynSize(estimation.targetedMinSavings)}
                        type="number"
                        value={estimation.targetedMinSavings}
                        onChange={() => {}}
                        disabled
                      />
                    </div>
                  </div>
                </fieldset>

                {oosSelected && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="flex flex-col">
                      <span className={labelCls}>Reason if Automation is Completely OOS</span>
                      <textarea
                        className={areaCls}
                        style={{ ...dynSize(estimation.reasonIfOOSorNoNew), maxWidth: "100%" }}
                        rows={3}
                        value={estimation.reasonIfOOSorNoNew}
                        onChange={(e)=> setEstimation(s=>({...s, reasonIfOOSorNoNew:e.target.value}))}
                        placeholder="Enter reason"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className={labelCls}>Drag or Upload email Ref</span>
                      <div
                        className="border border-dashed rounded px-3 py-2 text-sm"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDropOOSRef}
                      >
                        <div>{oosRefFile ? `Selected: ${oosRefFile.name}` : "Drag & drop file here"}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <input type="file" onChange={onPickOOSRef} />
                          <button
                            className="btn-red"
                            onClick={uploadOOSRef}
                            disabled={!oosRefFile || oosRefUploading}
                          >
                            {oosRefUploading ? "Uploading..." : "Upload"}
                          </button>
                        </div>
                        {oosRefUploadMsg && <div className="mt-1 text-xs">{oosRefUploadMsg}</div>}
                      </div>
                    </div>
                  </div>
                )}
              </Collapsible>

              <Collapsible title="Automation Status" defaultOpen={false}>
                <fieldset disabled={oosSelected}>
                  <div className={grid3}>
                    <div className="flex flex-col">
                      <span className={labelCls}>Current Automation Status</span>
                      <select
                        className={selectCls}
                        style={dynSize(automationStatus.currentStatus)}
                        value={automationStatus.currentStatus}
                        onChange={(e)=> setAutomationStatus(s=>({...s, currentStatus:e.target.value}))}
                      >
                        <option value="">-- Select --</option>
                        {automationStatusOptions.map(o =>
                          <option key={o.label} value={o.label} disabled={!!o.disabled}>{o.label}</option>
                        )}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <span className={labelCls}>Last update</span>
                      <input className={inputCls} style={dynSize(meta.lastUpdated)} value={meta.lastUpdated} disabled />
                    </div>

                    <div className="flex flex-col md:col-span-2">
                      <span className={labelCls}>Comments</span>
                      <textarea
                        className={areaCls}
                        style={{ ...dynSize(automationStatus.comments), maxWidth: "100%" }}
                        rows={3}
                        value={automationStatus.comments}
                        onChange={(e)=> setAutomationStatus(s=>({...s, comments:e.target.value}))}
                        placeholder="Notes, risks, blockers..."
                      />
                    </div>
                  </div>
                </fieldset>
              </Collapsible>

              <Collapsible title="QE Deliverables" defaultOpen={false}>
                
                <fieldset disabled={oosSelected}>
                  {/* 🔧 CHANGED: inline, bordered tiles */}
                  <div className="qe-deliv-grid">
                    {deliverableList.map(([label, key]) => (
                      <label key={key} className="qe-deliv-item text-sm">
                        <input
                          type="checkbox"
                          checked={!!deliverables[key]}
                          onChange={(e)=> setDeliverables(s=>({ ...s, [key]: e.target.checked }))}
                        />
                        <span className="text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>

                  {/* ROI Month stays as a calendar-style month picker (same as before) */}
                  <div className="mt-3">
                    <div className="flex flex-col" style={{ maxWidth: "24rem" }}>
                      <span className={labelCls}>ROI Realized in which month</span>
                      <input
                        className={inputCls}
                        style={{ ...dynSize(deliverables.roiRealizedIn), width: '14rem', minWidth: '14rem' }}
                        type="month"
                        value={deliverables.roiRealizedIn}
                        onChange={(e)=> setDeliverables(s=>({ ...s, roiRealizedIn: e.target.value }))}
                      />
                    </div>
                  </div>
                </fieldset>



              </Collapsible>

              <Collapsible title="Initiatives Planned Usage" defaultOpen={false}>
                <fieldset disabled={oosSelected}>
                  <div className={grid3}>
                    {[
                      ["GenAI PS","GenAI_PS"],["DDGS SOA3","DDGS_SOA3"],["E2E","E2E"],
                      ["NewEnvoyAPI [Adapter]","CGI_EnvoyAPI"],["QE DevOps","QEDevops"],
                      ["Excalibur (phase 1)","ExcaliburLetter"],["Accessibility (Fireflink)","Fireflink"],
                      ["mMTG Phase 2","mmtgRegressionPhase2"],["mmtg TDM","mmtgTDM"],
                      ["Class TDM","CLASSTDM"],["ConformIQ","Conformiq"]
                    ].map(([label, key]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!initiatives[key]}
                          onChange={(e)=> setInitiatives(s=>({ ...s, [key]: e.target.checked }))}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </Collapsible>

            </>
          ) : (
            /* === STATUS SUBTAB: Zebra table + inline QE deliverables in last column === */


            <table className="zebra-table">
              <thead>
                <tr>
                </tr>
              </thead>
              <tbody>
                <tr>
                  
                  <td className="bulk-qe-deliv-cell">
                    <StatusUpdatesTab
                      ref={statusTabRef}
                      onGridDirty={() => setStatusDirty(true)}
                      intakeNumber={intakeNumber}

                      /* 🔧 CHANGED: let the child compute per-row OOS; don’t force-disable everything */
                      /* (remove oosSelected override so ROI Month is enabled except for rows that are Automation-OOS) */

                      /* 🔧 CHANGED: hint for child to use a month picker for ROI (non-breaking if unused) */
                      roiInputType="month"

                      labelCls={labelCls}
                      inputCls={inputCls}
                      selectCls={selectCls}
                      areaCls={areaCls}
                      sectionWrap={sectionWrap}
                      sectionTitle={sectionTitle}
                      projectStatusOptions={projectStatusOptions}
                      automationStatusOptions={automationStatusOptions}
                      details={details} setDetails={setDetails}
                      automationStatus={automationStatus} setAutomationStatus={setAutomationStatus}
                      deliverables={deliverables} setDeliverables={setDeliverables}
                      meta={meta}
                      snapshot={snapshot}
                    />

                  </td>

              



                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
