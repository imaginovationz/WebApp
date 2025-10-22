// src/components/ROI/tabs/ProjectStatusTab.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import StatusUpdatesTab from "./StatusUpdatesTab"; 
import "../../../styles/roiTabs.css";

// ========= UI classes (UI-only changes: added w-full and uniform sizing) =========
const labelCls = "text-sm text-gray-700";
const inputCls = "w-full border rounded px-2 py-1 text-sm";   // <- ensure full width
const selectCls = "w-full border rounded px-2 py-1 text-sm";  // <- ensure full width
const areaCls = "w-full border rounded px-2 py-1 text-sm";    // <- ensure full width
const sectionWrap = "border rounded-lg p-3 mb-3 bg-white";
const sectionTitle =
  "tab-section tab-section-yellow !bg-yellow-50 !text-gray-800 !py-2 !px-3 !rounded mb-2";

// Kept: 2 & 3-column helpers; most sections unchanged except where requested
const grid2 = "grid grid-cols-1 md:grid-cols-2 gap-3";
const grid3 = "grid grid-cols-1 md:grid-cols-3 gap-3";

// Timestamp helper (unchanged logic; only used to stamp on save)
function nowSQLite() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function ProjectStatusTab() {
  const { intakeNumber } = useOutletContext();

  // CHANGE [SUBTABS]: Track which sub-tab is active
const [activeSubTab, setActiveSubTab] = useState("kickoff"); // "kickoff" | "status"

  // CHANGE [STATUS DIRTY + REF]: track edits made in StatusUpdatesTab grid & expose its bulk save
  const statusTabRef = useRef(null);
  const [statusDirty, setStatusDirty] = useState(false);

//   // options (unchanged)
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

const changeTypeOptions = ["Program","Project","OR","MOPS","CR","CCR","INC"]; // [1]
const normalizeToYYYYMMDD = (v) => {
  if (!v) return "";
  // handles "YYYY-MM-DD", "YYYY/MM/DD", "DD-MM-YYYY", ISO, and sqlite "YYYY-MM-DD HH:MM:SS"
  const t = typeof v === "string" ? v.trim() : v;
  const d = new Date(t.includes(" ") ? t.replace(" ", "T") : t);
  if (!isNaN(d)) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  // try DD-MM-YYYY or DD/MM/YYYY
  const m = t.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return t; // last resort: show as-is
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
      // CHANGE [NEW FIELDS]: Project Details additions mapped to projects.*
     programName: "",            // projects.Program
      releaseName: "",            // projects.release
      applicationsImpacted: [],   // projects.application (CSV)
      portfolio: "",              // projects.domain
      changeType: "",           // projects.change_type  [1]
    });
  
const [initiatives, setInitiatives] = useState({
  GenAI_PS:false, DDGS_SOA3:false, E2E:false, CGI_EnvoyAPI:false, QEDevops:false,
  ExcaliburLetter:false, Fireflink:false, mmtgRegressionPhase2:false,
  mmtgTDM:false, CLASSTDM:false, Conformiq:false
});

    const [appsMenuOpen, setAppsMenuOpen] = useState(false);
    const [newAppValue, setNewAppValue] = useState("");
      const [releaseOptions, setReleaseOptions] = useState([]);          // /api/fetchreleases
      const [applicationOptions, setApplicationOptions] = useState([]);  // /api/fetch
    
  const [stakeholders, setStakeholders] = useState({
    qaManager: "",
    functionalQeLead: "", // text
    funcSme: "", // text
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
    qaCostWithoutAuto: "", // manual_cost
    qaCostWithAuto: "", // manual + automation
    automationCost: "", // helper
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

  // ---- NEW: OOS selection state for disabling logic + upload helpers ----
  const oosSelected = estimation.estimateStatusOrOOS === "Automation-OOS";
  const [oosRefFile, setOosRefFile] = useState(null);
  const [oosRefUploading, setOosRefUploading] = useState(false);
  const [oosRefUploadMsg, setOosRefUploadMsg] = useState("");

  // load once per intake
  const loadedRef = useRef(false);
  useEffect(() => {
    loadedRef.current = false;
  }, [intakeNumber]);

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
            const qaCostWithout = manual;          // UI var: qaCostWithoutAuto  -> DB: manual_cost
            const qaCostWith    = qeCost;          // UI var: qaCostWithAuto     -> DB: qe_cost
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
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
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

    return () => {
      mounted = false;
    };
  }, [intakeNumber]);
  

  useEffect(() => {
  if (!intakeNumber) return;
  (async () => {
    try {
      const r = await axios.get("http://localhost:5000/api/initiativeplannedusage", {
        params: { intake_number: intakeNumber }
      });
      const row = r.data || {};
      // map DB cols -> UI booleans ("YES" => true)
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
       if (!domain) {
        setApplicationOptions([]);
         return;
       }
       (async () => {
        try {
           const r = await axios.get("http://localhost:5000/api/fetchapplication", {
             params: { domain },
          });
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
      const qaCostWithout = Number(estimation.qaCostWithoutAuto || 0); // manual_cost
      const qeCost        = Number(estimation.qaCostWithAuto   || 0);  // qe_cost
      const autoCost      = Number(estimation.automationCost   || 0);  // automation_cost
      const next = qaCostWithout - (qeCost);                // PSEMinSavings formula
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
    const now = { details, stakeholders, dates, estimation, automationStatus, deliverables };
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

  const resetBanners = () => {
    setSaveErr("");
    setSaveOk("");
  };

  // --- OOS ref upload helpers (new) ---
  const onDropOOSRef = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) setOosRefFile(f);
  };
  const onPickOOSRef = (e) => {
    const f = e.target?.files?.[0];
    if (f) setOosRefFile(f);
  };

  const uploadOOSRef = async () => {
    if (!oosRefFile || !intakeNumber) return;
     if (!window.confirm("This action is irreversible. You will not be able to update projects details later")) {
    return; // cancel
  }

    setOosRefUploading(true);
    setOosRefUploadMsg("");
    try {
    const form = new FormData();
    form.append("intake_number", intakeNumber);
    form.append("file", oosRefFile);
    const resp = await axios.post("http://localhost:5000/api/oosref_upload", form,
      { headers: { "Content-Type": "multipart/form-data" } });
    setOosRefUploadMsg(resp.data?.message || "Uploaded.");
    setOosRefFile(null);
  }catch (e) {
      console.error(e);
      setOosRefUploadMsg("Upload failed.");
    } finally {
      setOosRefUploading(false);
    }
  };

  // save all (unchanged logic except timestamp write)
  const onSaveAll = async () => {
    resetBanners();
    //if (!dirty) return;
  
      // CHANGE [BULK SAVE SWITCH]: if on "Regular Status Updates Panel", call child's bulk save for all rows
      if (activeSubTab === "status" && statusTabRef.current?.bulkSaveAll) {
        setSaving(true);
        try {
          await statusTabRef.current.bulkSaveAll();  // <- saves all visible projects via /api/projectmasterupdate
          setSaveOk("Saved successfully.");
          setStatusDirty(false);
        } catch (e) {
          console.error("Bulk save (status tab) failed", e);
          setSaveErr("Save failed. See console for details.");
        } finally {
          setSaving(false);
        }
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
      
      pushIfChanged("projects", "change_type", details.changeType, snapshot.details.changeType);

        const normalizedDue = normalizeToYYYYMMDD(estimation.estimateDueDate || "");
    if (normalizedDue !== snapshot.estimation.estimateDueDate) {
      updates.push({ table:"projects", column:"AutoEstimateDueDate", value: normalizedDue }); // ==== [CHANGE #2b]
    }

     let commentsToSave = automationStatus.comments;
    if (automationStatus.comments !== snapshot.automationStatus.comments) {
      const stamp = nowSQLite();
      const newLine = `${stamp} : ${automationStatus.comments || ""}`.trim();
      const older = snapshot.automationStatus.comments || "";
      commentsToSave = older ? `${newLine}\n\n${older}` : newLine;
    }
    if (commentsToSave !== snapshot.automationStatus.comments) {
      updates.push({ table:"projects", column:"Comments", value: commentsToSave }); // ==== [CHANGE #4a]
    }

    // [6] make sure ROIMonth + intake_name go to automationdeliverables
    if (String(deliverables.roiRealizedIn ?? "") !== String(snapshot.deliverables.roiRealizedIn ?? "")) {
      updates.push({ table:"automationdeliverables", column:"ROIMonth", value: deliverables.roiRealizedIn }); // already present
    }
    if (meta.intakeName) {
      updates.push({ table:"automationdeliverables", column:"intake_name", value: meta.intakeName }); // ==== [CHANGE #6b]
    }

     const yn = (b)=> (b ? "YES" : "");
    const initCols = [
      ["GenAI_PS","GenAI_PS"],
      ["DDGS_SOA3","DDGS_SOA3"],
      ["E2E","E2E"],
      ["CGI_EnvoyAPI","CGI EnvoyAPI"],
      ["QEDevops","QEDevops"],
      ["ExcaliburLetter","ExcaliburLetter"],
      ["Fireflink","Fireflink"],
      ["mmtgRegressionPhase2","mmtgRegressionPhase2"],
      ["mmtgTDM","mmtgTDM"],
      ["CLASSTDM","CLASSTDM"],
      ["Conformiq","Conformiq"]
    ];
    initCols.forEach(([stateKey, dbCol])=>{
      const cur = yn(initiatives[stateKey]);
      // snapshot for initiatives isn't tracked — send idempotently (server upsert)
      updates.push({ table:"InitiativesPlannedUsage", column: dbCol, value: cur });
    });
    // also send intake identifiers the table needs
    updates.push({ table:"InitiativesPlannedUsage", column:"intake_number", value: String(intakeNumber) });
    if (meta.intakeName) updates.push({ table:"InitiativesPlannedUsage", column:"intake_name", value: meta.intakeName });

    // keep: ALWAYS update timestamp
    updates.push({ table:"projects", column:"timestamp", value: nowSQLite() });

    const resp2 = await axios.post("http://localhost:5000/api/projectmasterupdate", {
      intake_number: intakeNumber, updates
    });

      // details -> projects
      pushIfChanged("projects", "DeliveryModel", details.deliveryModel, snapshot.details.deliveryModel);
      pushIfChanged("projects", "TimeLineAvailable", details.timelinesAvailable, snapshot.details.timelinesAvailable);
      pushIfChanged("projects", "project_status", details.projectCurrentStatus, snapshot.details.projectCurrentStatus);

    
          pushIfChanged("projects", "Program", details.programName, snapshot.details.programName);
          pushIfChanged("projects", "release", details.releaseName, snapshot.details.releaseName);
          // store CSV string for applications
          pushIfChanged(
            "projects",
           "application",
            (details.applicationsImpacted || []).join(", "),
            (snapshot.details.applicationsImpacted || []).join(", ")
          );
         pushIfChanged("projects", "domain", details.portfolio, snapshot.details.portfolio);
    
    
      // stakeholders -> projects
      pushIfChanged("projects", "QAManager", stakeholders.qaManager, snapshot.stakeholders.qaManager);
      pushIfChanged("projects", "functional_qe_lead", stakeholders.functionalQeLead, snapshot.stakeholders.functionalQeLead);
      pushIfChanged("projects", "FuncSME", stakeholders.funcSme, snapshot.stakeholders.funcSme);
      pushIfChanged("projects", "automation_qe_lead", stakeholders.automationLeadOrQeLead, snapshot.stakeholders.automationLeadOrQeLead);
      pushIfChanged("projects", "OffshoreLead", stakeholders.offshoreLead, snapshot.stakeholders.offshoreLead);
      pushIfChanged("projects", "FTE_Architect", stakeholders.fteOrAutomationArchitect, snapshot.stakeholders.fteOrAutomationArchitect);
      pushIfChanged("projects", "ITPM", stakeholders.itPm, snapshot.stakeholders.itPm);

      // dates -> projects / projects_timeline
      pushIfChanged("projects", "AutoWorkStartDate", dates.autoStartDate, snapshot.dates.autoStartDate);
      pushIfChanged("projects", "AutoWorkEndDate", dates.autoEndDate, snapshot.dates.autoEndDate);
      pushIfChanged("projects_timeline", "ImplementationDate", dates.implementationDate, snapshot.dates.implementationDate);

      // estimation -> projects
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
      pushIfChanged("projects", "manual_cost", estimation.qaCostWithoutAuto, snapshot.estimation.qaCostWithoutAuto);
      pushIfChanged("projects", "qe_cost", estimation.qaCostWithAuto, snapshot.estimation.qaCostWithAuto);
    pushIfChanged("projects", "automation_cost", estimation.automationCost, snapshot.estimation.automationCost);
      pushIfChanged("projects", "PSEMinSavings", estimation.targetedMinSavings, snapshot.estimation.targetedMinSavings);

      // automation status -> projects
      pushIfChanged("projects", "AutomationStatus", automationStatus.currentStatus, snapshot.automationStatus.currentStatus);
      //pushIfChanged("projects", "Comments", automationStatus.comments, snapshot.automationStatus.comments);

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

      // ALWAYS update projects.timestamp
      const newTs = nowSQLite();
      updates.push({ table: "projects", column: "timestamp", value: newTs });

      // send to backend
      const resp = await axios.post("http://localhost:5000/api/projectmasterupdate", {
        intake_number: intakeNumber,
        updates,
      });

          if (resp.status === 200 && resp.data?.ok) {
            setSaveOk("Saved successfully.");
            // CHANGE [REFRESH LAST UPDATE FROM DB]:
            try {
             const fres = await axios.get(`http://localhost:5000/api/projects/${intakeNumber}`);
              const serverTs = fres?.data?.timestamp || newTs;
              setMeta({ lastUpdated: serverTs });
             setSnapshot({
                details,
                stakeholders,
                dates,
               estimation: {
     ...estimation,
    // CHANGE: persist in snapshot
    estimateApprovedBy: estimation.estimateApprovedBy
               },
                automationStatus: { ...automationStatus, comments: commentsToSave },
                deliverables,
                meta: { lastUpdated: serverTs },
              });
            } catch (_e) {
              // fallback to local timestamp if fetch fails
              setMeta({ lastUpdated: newTs });
             setSnapshot({
                details,
                stakeholders,
                dates,
                estimation,
                automationStatus,
                deliverables,
                meta: { lastUpdated: newTs },
              });
            }
          } else {
    
    
        setSaveErr(resp.data?.error || "Update failed.");
      }
    } catch (e) {
      console.error("Save failed", e);
      setSaveErr("Save failed. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  // --- Render (UI-only changes below) ---
  // For QE Deliverables 2-column split (visual only)
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
    ["DSR", "dsr"], // kept last to balance columns visually
  ];
  const mid = Math.ceil(deliverableList.length / 2);
  const colLeft = deliverableList.slice(0, mid);
  const colRight = deliverableList.slice(mid);

  return (
    <div className="tab-wrap">
  
       {/* CHANGE [SUBTABS]: Two sub-tabs for Master intake */}
       <div className="flex gap-2 mb-3">
         <button
           type="button"
           className={`px-3 py-1 rounded ${activeSubTab === "kickoff" ? "bg-yellow-300" : "bg-gray-200"}`}
           onClick={() => setActiveSubTab("kickoff")}
         >
           Project Kick off
         </button>

         <button
           type="button"
          className={`px-3 py-1 rounded ${activeSubTab === "status" ? "bg-yellow-300" : "bg-gray-200"}`}
           onClick={() => setActiveSubTab("status")}
         >
           Regular Status Updates Panel
         </button>
       </div>
  
      {/* top strip */}
    
    
    
    
    
    
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Last update:</span>{" "}
          <span>{meta.lastUpdated || "-"}</span>
        </div>
        
    <div className="flex items-center gap-3">
          {saveOk && <span className="text-green-700 text-sm">{saveOk}</span>}
          {saveErr && <span className="text-red-700 text-sm">{saveErr}</span>}
          <button
            className="btn-red"
            onClick={onSaveAll}
      
            //disabled={!dirty || saving}
            
      //title={!dirty ? "No changes to save" : "Save updates"}
                // CHANGE [ENABLE SAVE ALL IN STATUS TAB]: enable if either master is dirty OR status grid changed
                disabled={(!(dirty || statusDirty)) || saving}
                title={!(dirty || statusDirty) ? "No changes to save" : "Save updates"}
      
      
          >
            {saving ? "Saving..." : "<Save All>"}
          </button>
        </div>
      </div>
    
         {/* CHANGE [SUBTABS]: Render the original full page under "Project Kick off" */}
         {activeSubTab === "kickoff" ? (
           <>
    

      {/* 1) Project Details (unchanged layout; now inputs are full-width for alignment) */}
      <div className={sectionWrap}>
        <div className={sectionTitle}>Project Details</div>
        {/* Disable entire section when OOS is selected */}
        <fieldset disabled={oosSelected}>
          <div className={grid3}>
            <div className="flex flex-col">
              <span className={labelCls}>Delivery model</span>
              <select
                className={selectCls}
                value={details.deliveryModel}
                onChange={(e) =>
                  setDetails((s) => ({ ...s, deliveryModel: e.target.value }))
                }
              >
                <option value="">-- Select --</option>
                {deliveryModelOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Project Timelines Available ?</span>
              <select
                className={selectCls}
                value={details.timelinesAvailable}
                onChange={(e) =>
                  setDetails((s) => ({ ...s, timelinesAvailable: e.target.value }))
                }
              >
                <option value="">-- Select --</option>
                {timelineOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Project Current Status</span>
              <select
                className={selectCls}
                value={details.projectCurrentStatus}
                onChange={(e) =>
                  setDetails((s) => ({ ...s, projectCurrentStatus: e.target.value }))
                }
              >
                <option value="">-- Select --</option>
                {projectStatusOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
  <span className={labelCls}>Change Type</span>
  <select
    className={selectCls}
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
                      value={details.programName}
                      onChange={(e) =>
                        setDetails((s) => ({ ...s, programName: e.target.value }))
                      }
                      placeholder="Program or initiative"
                    />
                 </div>
           
          
                        <div className="flex flex-col">
                          <span className={labelCls}>Release Name</span>
                          {/* CHANGE: dropdown populated from /api/fetchreleases */}
                         <select
                            className={selectCls}
                            value={details.releaseName}
                            onChange={(e) =>
                             setDetails((s) => ({ ...s, releaseName: e.target.value }))
                            }
                          >
                            <option value="">-- Select --</option>
                           {releaseOptions.map((rel) => (
                              <option key={rel} value={rel}>{rel}</option>
                            ))}
                          </select>
                        </div>
            
            
                 <div className="flex flex-col">
                    <span className={labelCls}>Portfolio</span>
                    <input
                     className={inputCls}
                      value={details.portfolio}
                              onChange={(e) => setDetails((s) => ({ ...s, portfolio: e.target.value }))}
                                            
                      placeholder="Domain / Portfolio"
                    />
                  </div>
            
            
                </div>
      
                {/* CHANGE [NEW FIELDS ROW 2]: Applications Impacted (multi-select checkbox dropdown) */}
                <div className={grid3}>
                  <div className="flex flex-col md:col-span-3">
                    <span className={labelCls}>Applications Impacted</span>
                    <div className="relative">
                      {/* summary input (read-only) shows CSV; click to open menu */}
                      <input
                       className={inputCls}
                        readOnly
                        value={(details.applicationsImpacted || []).join(", ")}
                        placeholder="Select one or more applications"
                        onClick={() => setAppsMenuOpen((v) => !v)}
                      />
                      {appsMenuOpen && (
                        <div className="absolute z-10 mt-1 w-full border rounded bg-white p-2 max-h-56 overflow-auto shadow">
              
                        
                        
                
                 {applicationOptions.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 text-sm py-1">
                              <input
                                type="checkbox"
                                    checked={(details.applicationsImpacted || []).includes(opt)}
                                
                  onChange={(e) => {
                                  const on = e.target.checked;
                                  setDetails((s) => {
                                    const cur = new Set(s.applicationsImpacted || []);
                                    if (on) cur.add(opt);
                                   else cur.delete(opt);
                                    return { ...s, applicationsImpacted: Array.from(cur) };
                                  });
                                }}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                          
                 {/* keep the small adder (optional) */}
                
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              className={inputCls}
                              placeholder="Add application…"
                              value={newAppValue}
                              onChange={(e) => setNewAppValue(e.target.value)}
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
                            <button
                              type="button"
                              className="btn-red"
                             onClick={() => setAppsMenuOpen(false)}
                            >
                              Done
                            </button>
                         </div>
                        </div>
                     )}
                    </div>
                  </div>
               </div>
      
      
      
        </fieldset>
      </div>

      {/* 2) Project Stakeholders (unchanged layout; inputs are uniform width) */}
      <div className={sectionWrap}>
        <div className={sectionTitle}>Project Stakeholders</div>
        {/* Disable entire section when OOS is selected */}
        <fieldset disabled={oosSelected}>
          <div className={grid3}>
            <div className="flex flex-col">
              <span className={labelCls}>QA Manager</span>
              <input
                className={inputCls}
                value={stakeholders.qaManager}
                onChange={(e) =>
                  setStakeholders((s) => ({ ...s, qaManager: e.target.value }))
                }
                placeholder="Name"
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Functional_qe_lead</span>
              <input
                className={inputCls}
                value={stakeholders.functionalQeLead}
                onChange={(e) =>
                  setStakeholders((s) => ({ ...s, functionalQeLead: e.target.value }))
                }
                placeholder="Name"
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Func. SME</span>
              <input
                className={inputCls}
                value={stakeholders.funcSme}
                onChange={(e) =>
                  setStakeholders((s) => ({ ...s, funcSme: e.target.value }))
                }
                placeholder="Name"
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Automation Lead (old) / QE lead (new)</span>
              <select
                className={selectCls}
                value={stakeholders.automationLeadOrQeLead}
                onChange={(e) =>
                  setStakeholders((s) => ({
                    ...s,
                    automationLeadOrQeLead: e.target.value,
                  }))
                }
              >
                <option value="">-- Select --</option>
                {resources.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Offshore Lead Resource</span>
              <select
                className={selectCls}
                value={stakeholders.offshoreLead}
                onChange={(e) =>
                  setStakeholders((s) => ({ ...s, offshoreLead: e.target.value }))
                }
              >
                <option value="">-- Select --</option>
                {resources.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>FTE (old) / Automation Architect (new)</span>
              <select
                className={selectCls}
                value={stakeholders.fteOrAutomationArchitect}
                onChange={(e) =>
                  setStakeholders((s) => ({
                    ...s,
                    fteOrAutomationArchitect: e.target.value,
                  }))
                }
              >
                <option value="">-- Select --</option>
                {resources.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>IT PM</span>
              <input
                className={inputCls}
                value={stakeholders.itPm}
                onChange={(e) =>
                  setStakeholders((s) => ({ ...s, itPm: e.target.value }))
                }
                placeholder="Name"
              />
            </div>
          </div>
        </fieldset>
      </div>

      {/* 3) Project Dates (unchanged; now full-width controls) */}
      <div className={sectionWrap}>
        <div className={sectionTitle}>Project Dates</div>
        {/* Disable entire section when OOS is selected */}
        <fieldset disabled={oosSelected}>
          <div className={grid3}>
            <div className="flex flex-col">
              <span className={labelCls}>Auto. Work Start Date</span>
              <input
                className={inputCls}
                type="date"
                value={dates.autoStartDate}
                onChange={(e) =>
                  setDates((s) => ({ ...s, autoStartDate: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Auto. Work End Date</span>
              <input
                className={inputCls}
                type="date"
                value={dates.autoEndDate}
                onChange={(e) =>
                  setDates((s) => ({ ...s, autoEndDate: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Implementation Date</span>
              <input
                className={inputCls}
                type="date"
                value={dates.implementationDate}
                onChange={(e) =>
                  setDates((s) => ({ ...s, implementationDate: e.target.value }))
                }
              />
            </div>
          </div>
        </fieldset>
      </div>

      {/* 4) Automation Estimation (UI-only: switched to 2 columns; textarea spans both) */}
      <div className={sectionWrap}>
        <div className={sectionTitle}>Automation Estimation</div>

        {/* Keep the OOS selector always enabled */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col">
            <span className={labelCls}>Estimate Status / OOS</span>
            <select
              className={selectCls}
              value={estimation.estimateStatusOrOOS}
              onChange={(e) =>
                setEstimation((s) => ({
                  ...s,
                  estimateStatusOrOOS: e.target.value,
                }))
              }
            >
              <option value="">-- Select --</option>
              {estimateStatusOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* All other estimation fields are disabled when OOS */}
        <fieldset disabled={oosSelected}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <span className={labelCls}>Estimate Due Date</span>
              <input
                className={inputCls}
                type="date"
                value={estimation.estimateDueDate}
                onChange={(e) =>
                  setEstimation((s) => ({ ...s, estimateDueDate: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Estimate Submitted On</span>
              <input
                className={inputCls}
                type="date"
                value={estimation.estimateSubmittedOn}
                onChange={(e) =>
                  setEstimation((s) => ({
                    ...s,
                    estimateSubmittedOn: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Assigned to / Estimate Done by</span>
              <input
                className={inputCls}
                value={estimation.assignedToOrDoneBy}
                onChange={(e) =>
                  setEstimation((s) => ({
                    ...s,
                    assignedToOrDoneBy: e.target.value,
                  }))
                }
                placeholder="Name"
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Estimate Reviewed By</span>
              <input
                className={inputCls}
                value={estimation.estimateReviewedBy}
                onChange={(e) =>
                  setEstimation((s) => ({
                    ...s,
                    estimateReviewedBy: e.target.value,
                  }))
                }
                placeholder="Name"
              />
            </div>

<div className="col">
  <label>Estimate Approved by</label>
  <input
    type="text"
    value={estimation.estimateApprovedBy}
    onChange={(e) => setEstimation(s => ({ ...s, estimateApprovedBy: e.target.value }))}
  />
</div>

            <div className="flex flex-col">
              <span className={labelCls}>Func. Automation</span>
              <select
                className={selectCls}
                value={estimation.funcAutomation}
                onChange={(e) =>
                  setEstimation((s) => ({
                    ...s,
                    funcAutomation: e.target.value,
                  }))
                }
              >
                <option value="">-- Select --</option>
                {funcAutomationOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col md:col-span-2">
              <span className={labelCls}>Reason if OOS / No new Func. Automation</span>
              <textarea
                className={areaCls}
                rows={3}
                value={estimation.reasonIfOOSorNoNew}
                onChange={(e) =>
                  setEstimation((s) => ({
                    ...s,
                    reasonIfOOSorNoNew: e.target.value,
                  }))
                }
                placeholder="Enter reason"
                // Enabled when OOS is selected; otherwise follow original rule
                disabled={!oosSelected && estimation.funcAutomation !== "no"}
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Total Manual QA Cost (Without Automation)</span>
              <input
                className={inputCls}
                type="number"
                value={estimation.qaCostWithoutAuto}
                
                      onChange={(e) =>
                        setEstimation((s) => ({ ...s, qaCostWithoutAuto: e.target.value }))
                      }
        
                placeholder="0"
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Automation Cost</span>
              <input
                className={inputCls}
                type="number"
                
        value={estimation.automationCost}
                
                      onChange={(e) =>
                        setEstimation((s) => ({ ...s, automationCost: e.target.value }))
                      }
        
        
                placeholder="0"
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Total QE Cost (Manual + Automation)</span>
              <input
                className={inputCls}
                type="number"
                value={estimation.qaCostWithAuto}
                      onChange={(e) =>
                        setEstimation((s) => ({ ...s, qaCostWithAuto: e.target.value }))
                      }
                placeholder="0"
              />
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Targeted Min. Savings</span>
              <input
                className={inputCls}
                type="number"
                value={estimation.targetedMinSavings}
                onChange={() => {}}
                disabled
              />
            </div>
          </div>
        </fieldset>

        {/* Reason + Upload side-by-side when OOS is selected */}
        {oosSelected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {/* Reason field stays enabled (rendered above too, but we provide upload beside here) */}
            <div className="flex flex-col">
              <span className={labelCls}>Reason if OOS / No new Func. Automation</span>
              <textarea
                className={areaCls}
                rows={3}
                value={estimation.reasonIfOOSorNoNew}
                onChange={(e) =>
                  setEstimation((s) => ({
                    ...s,
                    reasonIfOOSorNoNew: e.target.value,
                  }))
                }
                placeholder="Enter reason"
              />
            </div>
            {/* NEW: Drag or Upload email Ref */}
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
      </div>

      {/* 5) Automation Status (unchanged) */}
      <div className={sectionWrap}>
        <div className={sectionTitle}>Automation Status</div>
        {/* Disable entire section when OOS is selected */}
        <fieldset disabled={oosSelected}>
          <div className={grid3}>
            <div className="flex flex-col">
              <span className={labelCls}>Current Automation Status</span>
              <select
                className={selectCls}
                value={automationStatus.currentStatus}
                onChange={(e) =>
                  setAutomationStatus((s) => ({
                    ...s,
                    currentStatus: e.target.value,
                  }))
                }
              >
                <option value="">-- Select --</option>
                {automationStatusOptions.map((o) => (
                  <option key={o.label} value={o.label} disabled={!!o.disabled}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Last update (beside Comments) */}
            <div className="flex flex-col">
              <span className={labelCls}>Last update</span>
              <input className={inputCls} value={meta.lastUpdated} disabled />
            </div>

            <div className="flex flex-col md:col-span-2">
              <span className={labelCls}>Comments</span>
              <textarea
                className={areaCls}
                rows={3}
                value={automationStatus.comments}
                onChange={(e) =>
                  setAutomationStatus((s) => ({ ...s, comments: e.target.value }))
                }
                placeholder="Notes, risks, blockers..."
              />
            </div>
          </div>
        </fieldset>
      </div>

      {/* 6) QE Deliverables (UI-only: two explicit columns for clarity) */}
      <div className={sectionWrap}>
        <div className={sectionTitle}>QE Deliverables</div>
        
        {/* Disable entire section when OOS is selected */}
        <fieldset disabled={oosSelected}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-2">
              {colLeft.map(([label, key]) => (
                <label key={key} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!deliverables[key]}
                    onChange={(e) =>
                      setDeliverables((s) => ({ ...s, [key]: e.target.checked }))
                    }
                  />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            {/* Right column */}
            <div className="space-y-2">
              {colRight.map(([label, key]) => (
                <label key={key} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!deliverables[key]}
                    onChange={(e) =>
                      setDeliverables((s) => ({ ...s, [key]: e.target.checked }))
                    }
                  />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ROI Month stays full-width below the two columns */}
          <div className="mt-3">
            <div className="flex flex-col max-w-md">
              <span className={labelCls}>ROI Realized in which month</span>
              <input
                className={inputCls}
                type="month"
                value={deliverables.roiRealizedIn}
                onChange={(e) =>
                  setDeliverables((s) => ({ ...s, roiRealizedIn: e.target.value }))
                }
              />
            </div>
          </div>
        </fieldset>
      </div>

      {/* 7) Initiatives Planned Usage (unchanged placeholders; uniform widths) */}
      <div className={sectionWrap}>
  <div className={sectionTitle}>Initiatives Planned Usage</div>
  <fieldset disabled={oosSelected}>
  <div className={grid3}>
    {[
      ["GenAI PS","GenAI_PS"],
      ["DDGS SOA3","DDGS_SOA3"],
      ["E2E","E2E"],
      ["NewEnvoyAPI [Adapter]","CGI_EnvoyAPI"],
      ["QE DevOps","QEDevops"],
      ["Excalibur (phase 1)","ExcaliburLetter"],
      ["Accessibility (Fireflink)","Fireflink"],
      ["mMTG Phase 2","mmtgRegressionPhase2"],
      ["mmtg TDM","mmtgTDM"],
      ["Class TDM","CLASSTDM"],
      ["ConformIQ","Conformiq"]
    ].map(([label, key]) => (
      <label key={key} className="flex items-center gap-2">
        <input type="checkbox"
          checked={!!initiatives[key]}
          onChange={(e)=>setInitiatives(s=>({...s, [key]: e.target.checked}))}/>
        <span>{label}</span>
        
      </label>
    ))}
  </div>
  </fieldset>
</div>
    
    
           </>
         ) : (
           // CHANGE [SUBTABS]: Sub tab 2 renders the new Status Updates component (inherits logic)
           <StatusUpdatesTab
       
       ref={statusTabRef}                         
       onGridDirty={() => setStatusDirty(true)}   
       
             intakeNumber={intakeNumber}
             oosSelected={oosSelected}
            labelCls={labelCls}
             inputCls={inputCls}
             selectCls={selectCls}
             areaCls={areaCls}
             sectionWrap={sectionWrap}
             sectionTitle={sectionTitle}
             projectStatusOptions={projectStatusOptions}
            automationStatusOptions={automationStatusOptions}
             // pass state + setters so child uses identical DB mapping
             details={details} setDetails={setDetails}
             automationStatus={automationStatus} setAutomationStatus={setAutomationStatus}
             deliverables={deliverables} setDeliverables={setDeliverables}
             meta={meta}
             snapshot={snapshot}
          />
         )}
        </div>
      );
    }

