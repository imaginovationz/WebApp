import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import "../../../styles/roiTabs.css";

// === Rates can be modified from here  ===
const RATE_R1 = 27.85; // Average Offshore
const RATE_R2 = 66.63; // Avergae Onshore

const roundUp2 = (x) => Math.ceil((Number(x) || 0) * 100) / 100;
const currentMonthYYYYMM = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};


const round2 = (x) => Math.round((Number(x) || 0) * 100) / 100;


//  TDM sub-sections + row model




// Default row for automation sub-tabs (kept same fields; renamed dropdown labels in UI)
const mkAutoRow = () => ({
  Dropdown1: "",       // Application
  Dropdown2: currentMonthYYYYMM(), // ROI month
  Dropdown3: "",       // Savings Category
  N: 100,
  N1: 100,
  N2: 100,
  N3: 100,
  PD1: 0,
  C1: 0,
  PD2: 0,
  C2: 0,
  Savings: 0,
  Comment: "",
  TranInitiative: "",
  UtilityName: "",     //  dropdown value when Automation sub is "Utilities"
  SOAPackageStatus: "",
  FormsComplexity: "",

});

// compact cell widths kept
const sm = { width: 110, padding: "4px 6px" };
const smSel = { width: 160, padding: "4px 6px" };
const cell = { display: "flex", flexDirection: "column", gap: 2, minWidth: 160 };

export default function ProjectSavingsTab() {


  // ======= Get project context for Applications list & display the csv values in dropdown=======
  const { projectDetails, intakeNumber } = useOutletContext() || {};
  const applicationOptions = React.useMemo(() => {
    const csv = projectDetails?.application || "";
    // split comma-separated, trim, unique
    const parts = csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set(parts));
  }, [projectDetails]);

  // ======= TDM Savings (now also includes the 3 dropdowns) =======
  const [tdm, setTdm] = useState({
    Dropdown1: "", // Application
    Dropdown2: currentMonthYYYYMM(), // ROI month
    Dropdown3: "", // Savings Category
    N: 0,
    N1: 0,
    N2: 0,
    N3: 0,
    PD1: 0,
    C1: 0,
    PD2: 0,
    C2: 0,
    Savings: 0,
  });



  //  TDM sub-sections + row model (moved INSIDE component)
  const TDM_SUBS = [
    "Standalone Robot",
    "Robot (With Selenium / Playwright Library)",
    "SOA API",
    "UFT Scriptless",
    "UFT Scripted",
    "Other Utilities",
  ];
  const mkTdmRow = () => ({
    Dropdown1: "",
    Dropdown2: currentMonthYYYYMM(),
    Dropdown3: "",
    N: 0, N1: 0, N2: 0, N3: 0,
    PD1: 0, C1: 0, PD2: 0, C2: 0, Savings: 0,
    Comment: "",
    OtherUtility: "", //dropdown value when TDM sub is "Other-Utility"
  });
  const [tdmActive, setTdmActive] = useState(TDM_SUBS[0]);


  //Show no rows by default in both sections, user will add rows themselves.
  const [tdmRowsBySub, setTdmRowsBySub] = useState(
    Object.fromEntries(TDM_SUBS.map((k) => [k, []]))
  );

  const [roiMonthFilter, setRoiMonthFilter] = useState(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${mm}`; // YYYY-MM default to current month
  });

  // [small helper to normalize YYYY-MM out of various DB month columns]
  const normalizeMonth = (v) => {
    if (!v) return "";
    const s = String(v).trim();
    // accept 'YYYY-MM', 'YYYY-M', 'YYYY/MM', 'YYYY/MM/DD', 'YYYY-MM-DD', 'YYYYMM'
    const m = s.match(/^(\d{4})[-/]?(\d{1,2})/);
    if (m) {
      const mm = String(m[2]).padStart(2, "0");
      return `${m[1]}-${mm}`;
    }
    return s.slice(0, 7);
  };




  // Exact match for other known TDM sub-tabs

  const mapFrmkToTdmSub = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return { subKey: null, otherUtilityVal: "" };

    // Normalize spacing/case
    const t = s.replace(/\s+/g, " ");

    // Other Utilities (and legacy "Other-Utility")
    if (/^Other (?:Utilities|Utility)/i.test(t)) {
      // forms supported:
      // "Other Utilities"
      // "Other Utilities - <UtilityName>"
      // "Other-Utility - <UtilityName>"
      const parts = t.split(/\s*-\s*/);
      return { subKey: "Other Utilities", otherUtilityVal: parts[1] || "" };
    }

    // Canonical matches for your 5 other TDM buttons
    const aliases = [
      { key: "Standalone Robot", re: /^Standalone Robot$/i },
      { key: "Robot (With Selenium / Playwright Library)", re: /^Robot \(With Selenium\s*\/\s*Playwright Library\)$/i },
      { key: "SOA API", re: /^SOA(?: API)?$/i }, // allow "SOA" or "SOA API"
      { key: "UFT Scriptless", re: /^UFT Scriptless$/i },
      { key: "UFT Scripted", re: /^UFT Scripted$/i },
    ];
    const hit = aliases.find((a) => a.re.test(t));
    return hit ? { subKey: hit.key, otherUtilityVal: "" } : { subKey: null, otherUtilityVal: "" };
  };


  // Exact match for other known Automation sub-tabs
  const mapFrmkToAutoSub = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return { subKey: null, utilityVal: "" };

    const t = s.replace(/\s+/g, " ");

    // Other Utilities (and legacy "Other-Utility")
    if (/^Other (?:Utilities|Utility)/i.test(t)) {
      const parts = t.split(/\s*-\s*/);
      return { subKey: "Other Utilities", utilityVal: parts[1] || "" };
    }

    // Canonical matches for your Automation buttons
    const aliases = [
      { key: "Conformiq-Robot", re: /^Conformiq-?Robot$/i },
      { key: "Standalone Robot", re: /^Standalone Robot$/i },
      { key: "Standalone Selenium (With Python/Java/C# etc)", re: /^Standalone Selenium \(With Python\/Java\/C# etc\)$/i },
      { key: "Robot (With Selenium / Playwright Library)", re: /^Robot \(With Selenium\s*\/\s*Playwright Library\)$/i },
      { key: "SOA API", re: /^SOA(?: API)?$/i }, // allow "SOA" or "SOA API"
      { key: "UFT Scriptless", re: /^UFT Scriptless$/i },
      { key: "UFT Scripted", re: /^UFT Scripted$/i },
      { key: "Java Only", re: /^Java Only$/i },
      { key: "Python Only", re: /^Python Only$/i },
    ];
    const hit = aliases.find((a) => a.re.test(t));
    return hit ? { subKey: hit.key, utilityVal: "" } : { subKey: null, utilityVal: "" };
  };


  const firstDefined = (obj, keys) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };


  useEffect(() => {
    if (!intakeNumber) return;

    const load = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/projectroi/${intakeNumber}`);
        if (!res.ok) return;

        let all;
        try {
          const j = await res.json();
          all = Array.isArray(j) ? j : (Array.isArray(j?.rows) ? j.rows : []);
        } catch {
          all = [];
        }

        const bySub = Object.fromEntries(TDM_SUBS.map((k) => [k, []]));

        const eligible = all.filter((r) => {
          const cat = (r?.SavingsCategory ?? r?.["Savings Category"] ?? "").trim();
          const { subKey } = mapFrmkToTdmSub(r?.AutomationFrmk ?? r?.AutomationFramework ?? "");
          return TDM_SAVINGS_CATEGORIES.includes(cat) && !!subKey && TDM_SUBS.includes(subKey);
        });

        //  Take rows for the currently selected month
        const forMonth = eligible.filter(
          (r) => normalizeMonth(r?.ROI_month || r?.ROIReportingMonth) === roiMonthFilter
        );



        // If there are no rows for the selected month, snap to the latest month that HAS data
        //if (forMonth.length === 0 && eligible.length > 0) {
        //  const months = Array.from(
        //    new Set(
        //      eligible
        //        .map((r) => normalizeMonth(r?.ROI_month || r?.ROIReportingMonth))
        //       .filter(Boolean)
        // )
        //).sort(); // 'YYYY-MM' sorts correctly lexicographically
        //const latest = months[months.length - 1];
        //if (latest && latest !== roiMonthFilter) {
        // setRoiMonthFilter(latest);
        //return; // let the effect re-run with the new month
        // }
        // }

        //  keep your original variable name so the rest of the code is untouched
        const monthRows = forMonth;



        monthRows.forEach((db) => {
          const savingsCat =
            db?.SavingsCategory ?? db?.["Savings Category"] ?? "";

          // keep only TDM categories
          if (!TDM_SAVINGS_CATEGORIES.includes(savingsCat)) return;

          // framework/tab
          const { subKey: frmk, otherUtilityVal } = mapFrmkToTdmSub(
            db?.AutomationFrmk ?? db?.AutomationFramework ?? ""
          );
          if (!frmk || !TDM_SUBS.includes(frmk)) return;

          const N1 = Number(db?.N1_AvgManualPD ?? db?.N1 ?? 0);
          const N2 = Number(db?.N2_AvgAutomationPD ?? db?.N2 ?? 0);
          const N3 = Number(db?.N3_Numberofcycles ?? db?.N3 ?? 0);
          const PD1 = Number(db?.PD1_TotalManualPDsNByN1 ?? db?.PD1 ?? 0);
          const PD2 = Number(db?.PD2_TotalAutomatedPDsNByN2 ?? db?.PD2 ?? 0);
          const C1 = Number(db?.C1_TotalManualCost_D ?? db?.C1 ?? 0);
          const C2 = Number(db?.C2_TotalAutomationCost_D ?? db?.C2 ?? 0);
          const Savings = Number(db?.ROI ?? db?.Amount ?? 0);
          const SavingsPD = Number(db?.SavingsPD ?? (PD1 - PD2));

          let N = Number(db?.N ?? 0);
          if (!N && N1) N = Math.round(PD1 * N1);
          else if (!N && N2) N = Math.round(PD2 * N2);

          const row = mkTdmRow();
          row.Dropdown1 = db?.Application || "";
          row.Dropdown2 = normalizeMonth(db?.ROI_month || db?.ROIReportingMonth);
          row.Dropdown3 = savingsCat;
          row.N = Number.isFinite(N) ? N : 0;
          row.N1 = N1;
          row.N2 = N2;
          row.N3 = N3;
          row.PD1 = PD1;
          row.C1 = C1;
          row.PD2 = PD2;
          row.C2 = C2;
          row.Savings = Savings;
          row.SavingsPD = SavingsPD;
          row.Comment = db?.Comment || "";
          row.OtherUtility = otherUtilityVal;

          bySub[frmk].push(row);
        });

        //  If no DB rows for the selected month, do NOT clear the UI.
        // Keep existing rows so the user can add data for that month.
        setTdmRowsBySub((prev) => {
          const next = {};
          for (const sub of TDM_SUBS) {
            const loaded = bySub[sub] || [];
            if (loaded.length > 0) {
              next[sub] = recomputeTdm(loaded);


            } else {
              // FIX: Show no rows when there is no data for the selected month
              next[sub] = [];
            }



          }
          return next;
        });


      } catch (e) {
        console.error("prefill TDM error", e);
      }
    };

    load();
  }, [intakeNumber, roiMonthFilter]); // unchanged deps


  //Formula to recompute TDM row values when any of N, N1, N2, N3 changes
  //for Savings cAteogry

  const TDM_SAVINGS_CATEGORIES = [
    "mmtg Deal creation",
    "CLASS deal creation",
    "Savvy Deal creation",
    "Other Deal/Test data creation utility",
  ];



  const recomputeTdm = (rows) =>
    rows.map((r) => {
      const PD1 = r.N1 ? roundUp2(r.N / r.N1) : 0;
      const C1 = round2(PD1 * 8 * (RATE_R1 + 0.15 * RATE_R2));
      const PD2 = r.N2 ? roundUp2(r.N / r.N2) : 0;
      const C2 = round2(PD2 * 8 * (RATE_R1 + 0.15 * RATE_R2));
      const S = round2((C1 - C2) * (Number(r.N3) || 0));
      const SavingsPD = round2(PD1 - PD2);
      return { ...r, PD1, C1, PD2, C2, Savings: S, SavingsPD }
    });


  const updateTdmRow = (subKey, idx, key, value) => {
    setTdmRowsBySub((prev) => {
      const copy = { ...prev };
      const rows = [...copy[subKey]];
      rows[idx] = { ...rows[idx], [key]: value };
      copy[subKey] = recomputeTdm(rows);
      return copy;
    });

    // [CHANGE] if ROI month changed on a row, reload saved rows for that month
    if (key === "Dropdown2" && value && value !== roiMonthFilter) {
      setRoiMonthFilter(value);
    }
  };


  const addTdmRowAfter = (subKey, idx) => {
    setTdmRowsBySub((prev) => {
      const copy = { ...prev };
      const rows = [...copy[subKey]];
      const _r = mkTdmRow();              // FIX: set month to the global selection
      _r.Dropdown2 = roiMonthFilter;
      rows.splice(idx + 1, 0, _r);

      copy[subKey] = recomputeTdm(rows);
      return copy;
    });
  };
  const deleteTdmRowAt = (subKey, idx) => {
    setTdmRowsBySub((prev) => {
      const copy = { ...prev };
      const rows = [...copy[subKey]];
      rows.splice(idx, 1);
      //if (!rows.length) rows.push(mkTdmRow()); //commenting this code so that even the first row can be deleted, if you want to keep atleast one row, uncomment this
      copy[subKey] = recomputeTdm(rows);
      return copy;
    });
  };



  // Auto-derived TDM numbers (unchanged logic)
  useEffect(() => {
    const PD1 = tdm.N1 ? roundUp2(tdm.N / tdm.N1) : 0;
    const C1 = PD1 * 8 * (RATE_R1 + 0.15 * RATE_R2);
    const PD2 = tdm.N2 ? roundUp2(tdm.N / tdm.N2) : 0;
    const C2 = PD2 * 8 * (RATE_R1 + 0.15 * RATE_R2);
    const S = (C1 - C2) * (Number(tdm.N3) || 0);
    setTdm((p) => ({ ...p, PD1, C1, PD2, C2, Savings: S }));
  }, [tdm.N, tdm.N1, tdm.N2, tdm.N3]);

  // ======= 7 automation sub-tabs (unchanged categories) =======
  const SUB_TABS = [
    "Conformiq-Robot",
    "Standalone Robot",
    "Standalone Selenium (With Python/Java/C# etc)",
    "Robot (With Selenium / Playwright Library)",
    "SOA API",
    "UFT Scriptless",
    "UFT Scripted",
    "Java Only",
    "Python Only",
    "Other Utilities",
  ];

  const AUTO_SAVINGS_CATEGORIES = [
    "New Test case Created",
    "Existing Test case Updated/Reused",
    "Test Case Execution - DIT",
    "Test Case Execution - SIT",
    "Test Case Execution - UAT",
    "Test Case Execution - RollBack",
    "Test Case Execution - RollForward",
    "Test Case Execution - Adhoc/utility",
  ];


  const [activeSub, setActiveSub] = useState(SUB_TABS[0]);

  //  start with **no rows** for every Automation sub-tab
  const [rowsBySub, setRowsBySub] = useState(() =>
    Object.fromEntries(SUB_TABS.map((k) => [k, []]))
  );

  //  initiatives list for 'Trans. Initiative' dropdown
  const [initiativeOptions, setInitiativeOptions] = useState([]);
  useEffect(() => {
    fetch("http://localhost:5000/api/initiatives")
      .then((r) => r.json())
      .then((j) =>
        setInitiativeOptions((j?.initiatives || []).map((i) => i.InitiativeName).filter(Boolean))
      )
      .catch(() => setInitiativeOptions([]));
  }, []);


  const [dsrRef, setDsrRef] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [saving, setSaving] = useState(false); //loader flag
  const [saveAttempted, setSaveAttempted] = useState(false);

  // CHANGE: ALM helper fields + lightbox controls
  const [almDesignCount, setAlmDesignCount] = useState("");
  const [almUpdateCount, setAlmUpdateCount] = useState("");
  const [almExecCount, setAlmExecCount] = useState("");
  const [almLightbox, setAlmLightbox] = useState({ open: false, type: "" });
  const openAlmBox = (type) => setAlmLightbox({ open: true, type });
  const closeAlmBox = () => setAlmLightbox({ open: false, type: "" });


  //  Utilities options
  const [utilOptionsTDM, setUtilOptionsTDM] = useState([]);
  const [utilOptionsNonTDM, setUtilOptionsNonTDM] = useState([]);
  useEffect(() => {
    // TDM-only utilities
    fetch("http://localhost:5000/api/automatedutilities?category=TDM")
      .then((r) => r.json())
      .then((j) => setUtilOptionsTDM(Array.isArray(j.utilities) ? j.utilities : []))
      .catch(() => setUtilOptionsTDM([]));
    // Non-TDM utilities
    fetch("http://localhost:5000/api/automatedutilities?category=NON_TDM")
      .then((r) => r.json())
      .then((j) => setUtilOptionsNonTDM(Array.isArray(j.utilities) ? j.utilities : []))
      .catch(() => setUtilOptionsNonTDM([]));
  }, []);


  // recompute per row (unchanged math)
  const recomputeAuto = (rows, coeff = 0.25) =>
    rows.map((r) => {
      const PD1 = r.N1 ? roundUp2(r.N / r.N1) : 0;
      const C1 = PD1 * 8 * (RATE_R1 + coeff * RATE_R2);
      const PD2 = r.N2 ? Number(r.N) / Number(r.N2) : 0;
      const C2 = PD2 * 8 * (RATE_R1 + coeff * RATE_R2);
      const Savings = (C1 - C2) * (Number(r.N3) || 0);
      const SavingsPD = round2(PD1 - PD2);
      return { ...r, PD1, C1, PD2, C2, Savings, SavingsPD };


    });


  useEffect(() => {
    if (!intakeNumber) return;

    const loadAuto = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/projectroi/${intakeNumber}`);
        if (!res.ok) return;

        let all;
        try {
          const j = await res.json();
          all = Array.isArray(j) ? j : (Array.isArray(j?.rows) ? j.rows : []);
        } catch {
          all = [];
        }

        const bySub = Object.fromEntries(SUB_TABS.map((k) => [k, []]));

        // keep only rows that map to an Automation button and are in Automation categories
        const eligible = all.filter((r) => {
          const rawCat = (r?.SavingsCategory ?? r?.["Savings Category"] ?? "").trim();
          const { subKey } = mapFrmkToAutoSub(r?.AutomationFrmk ?? r?.AutomationFramework ?? "");
          if (!subKey || !SUB_TABS.includes(subKey)) return false;

          // If SOA, strip trailing "(...)" so we match the base category list
          let baseCat = rawCat;
          if (subKey === "SOA API") {
            const m = rawCat.match(/^(.*?)[ ]*\((.+)\)\s*$/);
            if (m && m[1]) baseCat = m[1].trim();
          }
          return AUTO_SAVINGS_CATEGORIES.includes(baseCat);
        });

        // rows for the currently selected month
        const monthRows = eligible.filter(
          (r) => normalizeMonth(r?.ROI_month || r?.ROIReportingMonth) === roiMonthFilter
        );

        // group rows into sub-tabs
        monthRows.forEach((db) => {
          const rawCat =
            (db?.SavingsCategory ?? db?.["Savings Category"] ?? "").trim();

          const { subKey: frmk, utilityVal } = mapFrmkToAutoSub(
            db?.AutomationFrmk ?? db?.AutomationFramework ?? ""
          );
          if (!frmk || !SUB_TABS.includes(frmk)) return;

          const N1 = Number(db?.N1_AvgManualPD ?? db?.N1 ?? 0);
          const N2 = Number(db?.N2_AvgAutomationPD ?? db?.N2 ?? 0);
          const N3 = Number(db?.N3_Numberofcycles ?? db?.N3 ?? 0);
          const PD1 = Number(db?.PD1_TotalManualPDsNByN1 ?? db?.PD1 ?? 0);
          const PD2 = Number(db?.PD2_TotalAutomatedPDsNByN2 ?? db?.PD2 ?? 0);
          const C1 = Number(db?.C1_TotalManualCost_D ?? db?.C1 ?? 0);
          const C2 = Number(db?.C2_TotalAutomationCost_D ?? db?.C2 ?? 0);
          const Savings = Number(db?.ROI ?? db?.Amount ?? 0);
          const SavingsPD = Number(db?.SavingsPD ?? (PD1 - PD2));

          // base N backfill like TDM
          let N = Number(db?.N ?? 0);
          if (!N && N1) N = Math.round(PD1 * N1);
          else if (!N && N2) N = Math.round(PD2 * N2);

          const row = mkAutoRow();
          row.Dropdown1 = db?.Application || "";
          row.Dropdown2 = normalizeMonth(db?.ROI_month || db?.ROIReportingMonth);

          if (frmk === "SOA API") {
            const m = rawCat.match(/^(.*?)[ ]*\((.+)\)\s*$/);
            if (m && m[1]) {
              row.Dropdown3 = m[1].trim();        // base category for the dropdown
              row.SOAPackageStatus = m[2] || "";  // status for the SOA dropdown
            } else {
              row.Dropdown3 = rawCat;             // fallback if not concatenated
            }
          } else {
            row.Dropdown3 = rawCat;
          }



          row.N = Number.isFinite(N) ? N : 0;
          row.N1 = N1;
          row.N2 = N2;
          row.N3 = N3;
          row.PD1 = PD1;
          row.C1 = C1;
          row.PD2 = PD2;
          row.C2 = C2;
          row.Savings = Savings;
          row.SavingsPD = SavingsPD;
          row.Comment = db?.Comment || "";
          row.TranInitiative = db?.TranInitiative || "";
          if (frmk === "Other Utilities") row.UtilityName = utilityVal;

          if (frmk === "SOA API") {
            // Forms Complexity (TEXT)
            if (db?.FormsComplexity !== undefined && db?.FormsComplexity !== null) {
              row.FormsComplexity = String(db.FormsComplexity);
            }

            // Total Unique Forms (INTEGER) — from TotalUniqueFormsDesigned
            if (db?.TotalUniqueFormsDesigned !== undefined && db?.TotalUniqueFormsDesigned !== null) {
              row.TotalUniqueForms = Number(db.TotalUniqueFormsDesigned) || 0;
            }
          }

          bySub[frmk].push(row);
        });

        // If no DB rows for the selected month:
        // - Do NOT clear the section.
        // - For any button with zero loaded rows but some existing rows, keep same count but reset to blank for fresh entry (month preset).
        setRowsBySub((prev) => {
          const next = {};
          for (const sub of SUB_TABS) {
            const loaded = bySub[sub] || [];
            if (loaded.length > 0) {
              next[sub] = recomputeAuto(loaded);


            } else {
              // FIX: Show no rows when there is no data for the selected month
              next[sub] = [];
            }




          }
          return next;
        });

      } catch (e) {
        console.error("prefill Automation error", e);
      }
    };

    loadAuto();
  }, [intakeNumber, roiMonthFilter]); // same deps as TDM prefill




  const updateRow = (subKey, idx, key, value) => {
    setRowsBySub((prev) => {
      const copy = { ...prev };
      const rows = [...(copy[subKey] || [])];
      rows[idx] = { ...rows[idx], [key]: value };
      copy[subKey] = recomputeAuto(rows);
      return copy;
    });

    // NEW: if a row’s ROI month changes, switch the page filter so the prefill reloads that month’s saved rows
    if (key === "Dropdown2" && value && value !== roiMonthFilter) {
      setRoiMonthFilter(value);
    }
  };

  // add a row next to a specific row
  const addRowAfter = (subKey, idx) => {
    setRowsBySub((prev) => {
      const copy = { ...prev };
      const rows = [...copy[subKey]];
      const _r = mkAutoRow();             // FIX: set month to the global selection
      _r.Dropdown2 = roiMonthFilter;
      rows.splice(idx + 1, 0, _r);

      copy[subKey] = recomputeAuto(rows);
      return copy;
    });
  };

  // delete a specific row (keep at least 1)
  const deleteRowAt = (subKey, idx) => {
    setRowsBySub((prev) => {
      const copy = { ...prev };
      const rows = [...copy[subKey]];
      rows.splice(idx, 1);
      //if (rows.length === 0) rows.push(mkAutoRow()); 	  //commenting this code so that even the first row can be deleted, if you want to keep atleast one row, uncomment this

      copy[subKey] = recomputeAuto(rows);
      return copy;
    });
  };


  // top-level add/delete helpers (work even when there are 0 rows)
  const addAutoRowTop = (subKey) =>
    addRowAfter(subKey, (rowsBySub[subKey]?.length ?? 0) - 1);
  const deleteAutoRowTop = (subKey) => {
    const n = rowsBySub[subKey]?.length ?? 0;
    if (n > 0) deleteRowAt(subKey, n - 1);
  };
  const addTdmRowTop = (subKey) =>
    addTdmRowAfter(subKey, (tdmRowsBySub[subKey]?.length ?? 0) - 1);
  const deleteTdmRowTop = (subKey) => {
    const n = tdmRowsBySub[subKey]?.length ?? 0;
    if (n > 0) deleteTdmRowAt(subKey, n - 1);
  };


  const autoSavingsTotal = useMemo(() => {
    let total = 0;
    Object.values(rowsBySub).forEach((rows) =>
      rows.forEach((r) => (total += Number(r.Savings) || 0))
    );
    return total;
  }, [rowsBySub]);

  // ==== total PDs for Automation rows ====
  const autoSavingsPDTotal = useMemo(() => {
    let total = 0;
    Object.values(rowsBySub).forEach((rows) =>
      rows.forEach((r) => (total += Number(r.SavingsPD) || 0))
    );
    return total;
  }, [rowsBySub]);

  // ==== [CHANGE] New: totals for TDM rows (dollars + PDs) ====
  const tdmTotals = useMemo(() => {
    let dollars = 0, pds = 0;
    Object.values(tdmRowsBySub).forEach((rows) =>
      rows.forEach((r) => {
        dollars += Number(r.Savings) || 0;
        pds += Number(r.SavingsPD) || 0;
      })
    );
    return { dollars, pds };
  }, [tdmRowsBySub]);

  // === DROPDOWNS ===
  const DROPDOWN_OPTIONS_1 = applicationOptions; // <Application> from projects.application
  const DROPDOWN_OPTIONS_2 = null; // ROI month is a calendar (type="month")


  //for Savings cAteogry
  const DROPDOWN_OPTIONS_3 = [
    "New Test case Created",
    "Existing Test case Updated/Reused", // This is to drive the reusability report
    "Test Case Execution - DIT",
    "Test Case Execution - SIT",
    "Test Case Execution - UAT",
    "Test Case Execution - RollBack",
    "Test Case Execution - RollForward",
    "Test Case Execution - Adhoc/utility"
  ];




  const totalRowsAuto = useMemo(
    () => Object.values(rowsBySub).reduce((a, rows) => a + rows.length, 0),
    [rowsBySub]
  );
  const totalRowsTdm = useMemo(
    () => Object.values(tdmRowsBySub).reduce((a, rows) => a + rows.length, 0),
    [tdmRowsBySub]
  );
  const canDownload = (totalRowsAuto + totalRowsTdm) > 0;



  const DownloadProjectROISheet = async () => {
    try {
      //if (!canDownload) {
      //  alert("Please add at least one row in TDM Savings or Automation Savings — Breakdown.");
      //  return;
      //}

      // Collect a best-effort ROI month to use in the suggested filename (first non-empty)
      const roiMonths = new Set();
      Object.values(rowsBySub).forEach(rows => rows.forEach(r => r?.Dropdown2 && roiMonths.add(r.Dropdown2)));
      Object.values(tdmRowsBySub).forEach(rows => rows.forEach(r => r?.Dropdown2 && roiMonths.add(r.Dropdown2)));
      //const roiMonthForName = [...roiMonths][0] || "";
      const roiMonthForName = Array.from(roiMonths)[0] || roiMonthFilter || "";

      // Prepare payload for the backend (surgical: only data needed by the server)
      const payload = {
        intake_number: intakeNumber,
        intake_name: projectDetails?.intake_name || "",
        release: projectDetails?.release || projectDetails?.Release || "",
        applications_impacted: projectDetails?.application || "",
        automation_lead: projectDetails?.automation_qe_lead || "",
        functional_lead: projectDetails?.functional_qe_lead || projectDetails?.Functional_qe_lead || "",
        domain: projectDetails?.domain || "",

        roi_month: roiMonthFilter || currentMonthYYYYMM(),
        // Full row maps by sub-button, as the backend aggregates across sections
        auto_rows_by_sub: rowsBySub,
        tdm_rows_by_sub: tdmRowsBySub,

        // Already-computed totals on UI for the Summary sheet
        totals: {
          tdm_dollars: tdmTotals?.dollars ?? 0,
          tdm_pds: tdmTotals?.pds ?? 0,
          auto_dollars: autoSavingsTotal ?? 0,
          auto_pds: autoSavingsPDTotal ?? 0,
        }
      };

      const res = await fetch("http://localhost:5000/api/projectroisheetdownload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to generate ROI Excel.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      // Suggest a user-friendly filename if server doesn't override via Content-Disposition
      const shortName = (projectDetails?.intake_name || "").slice(0, 30); //shorten the name of project by 30 charatcters only
      const fname = `ROI_${intakeNumber}-${shortName} - ${roiMonthForName}_v1.0.xlsx`;
      a.download = fname;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Could not download the ROI sheet. Please try again.");
    }
  };

  const onSave = async () => {
    setSaveNotice("");
    setSaveAttempted(true) //  enable inline validation for all mandatory fields
    try {
      setSaving(true);
      const fy = new Date().getFullYear(); // ROI_FY
      const toQuarter = (yyyymm) => {
        const m = Number((yyyymm || "0000-00").split("-")[1] || 0);
        if ([11, 12, 1].includes(m)) return "Q1";
        if ([2, 3, 4].includes(m)) return "Q2";
        if ([5, 6, 7].includes(m)) return "Q3";
        return "Q4";
      };

      //  allow save if there's at least one row in either section;
      // only show "Nothing to save..." when both sections have zero rows
      const totalRowsAuto = Object.values(rowsBySub).reduce((a, rows) => a + rows.length, 0);
      const totalRowsTdm = Object.values(tdmRowsBySub).reduce((a, rows) => a + rows.length, 0);
      const hasAnyRows = (totalRowsAuto + totalRowsTdm) > 0;
      if (!hasAnyRows) {
        setSaveNotice("Nothing to save. Please add Rows first.");
        return;
      }

      // Savings Category is mandatory on BOTH sections.
      // If any added row has empty Savings Category, block save (inline errors will show).
      //  Global form validation — All fields (except Comment & FormsComplexity) are mandatory.

      const reqStr = (v) => String(v ?? "").trim().length > 0;
      const reqNum = (v) => Number(v) > 0; // treat 0 as not-entered for counts
      let hasErrors = false;

      // Automation section rows
      Object.entries(rowsBySub).forEach(([sub, rows]) => {
        rows.forEach((r) => {
          if (!reqStr(r.Dropdown1)) hasErrors = true;           // Application
          if (!reqStr(r.Dropdown2)) hasErrors = true;           // ROI Month
          if (!reqStr(r.Dropdown3)) hasErrors = true;           // Savings Category
          if (sub === "Other Utilities" && !reqStr(r.UtilityName)) hasErrors = true; // Utilities dropdown
          //if (sub !== "Other Utilities" && !reqStr(r.TranInitiative)) hasErrors = true; // Trans. Initiative
          if (!reqNum(r.N)) hasErrors = true;
          if (!reqNum(r.N1)) hasErrors = true;
          if (!reqNum(r.N2)) hasErrors = true;
          if (!reqNum(r.N3)) hasErrors = true;
        });
      });
      // TDM section rows
      Object.entries(tdmRowsBySub).forEach(([sub, rows]) => {
        rows.forEach((r) => {
          if (!reqStr(r.Dropdown1)) hasErrors = true;           // Application
          if (!reqStr(r.Dropdown2)) hasErrors = true;           // ROI Month
          if (!reqStr(r.Dropdown3)) hasErrors = true;           // Savings Category
          if (sub === "Other Utilities" && !reqStr(r.OtherUtility)) hasErrors = true; // Other-Utility dropdown
          if (!reqNum(r.N)) hasErrors = true;
          if (!reqNum(r.N1)) hasErrors = true;
          if (!reqNum(r.N2)) hasErrors = true;
          if (!reqNum(r.N3)) hasErrors = true;
        });
      });

      if (hasErrors) {
        setSaveNotice("Please fill all mandatory fields on the page.");
        return;
      }


      const allEntries = [];
      Object.entries(tdmRowsBySub).forEach(([frmk, rows]) => {
        rows.forEach((r) => {
          if (!r.Dropdown1 || !r.Dropdown2 || !r.Dropdown3) return; // minimal required
          allEntries.push({
            intake_number: intakeNumber,
            // Names align to backend dynamic insert (see app.py change)
            ROI_FY: fy,
            ROI_month: r.Dropdown2,                    // YYYY-MM
            ROI_QR: toQuarter(r.Dropdown2),
            Domain: projectDetails?.domain || "",
            Application: r.Dropdown1,
            ROI: Number(r.Savings || 0),               // already rounded to 2dp
            intake_name: projectDetails?.intake_name || "",
            //	            AutomationFrmk: frmk,
            AutomationFrmk: (frmk === "Other Utilities" && r.OtherUtility)
              ? `${frmk} - ${r.OtherUtility}`
              : frmk,

            SavingsCategory: r.Dropdown3,
            FPItem: projectDetails?.DeliveryModel || "", // Delivery model from project
            ROISheetLocation: "",                        // placeholder
            QELead: projectDetails?.automation_qe_lead || "",
            Comment: r.Comment || "",
            N1_AvgManualPD: r.N1,
            PD1_TotalManualPDsNByN1: r.PD1,
            C1_TotalManualCost_D: r.C1,
            N2_AvgAutomationPD: r.N2,
            PD2_TotalAutomatedPDsNByN2: r.PD2,
            C2_TotalAutomationCost_D: r.C2,
            N3_Numberofcycles: r.N3,
            SavingsPD: r.SavingsPD,

          });
        });
      });


      // also push Automation Savings — Breakdown rows to projectroi
      Object.entries(rowsBySub).forEach(([frmk, rows]) => {
        rows.forEach((r) => {
          if (!r.Dropdown1 || !r.Dropdown2 || !r.Dropdown3) return;

          const scBase = r.Dropdown3;
          const scSOA = (frmk === "SOA API" && r.SOAPackageStatus)
            ? `${scBase} (${r.SOAPackageStatus})`
            : scBase;


          allEntries.push({
            intake_number: intakeNumber,
            ROI_FY: fy,
            ROI_month: r.Dropdown2,
            ROI_QR: toQuarter(r.Dropdown2),
            Domain: projectDetails?.domain || "",
            Application: r.Dropdown1,
            ROI: Number(r.Savings || 0),
            intake_name: projectDetails?.intake_name || "",
            AutomationFrmk: (frmk === "Other Utilities" && r.UtilityName)
              ? `${frmk} - ${r.UtilityName}`
              : frmk,
            SavingsCategory: scSOA,

            //SavingsCategory: r.Dropdown3,
            FPItem: projectDetails?.DeliveryModel || "",
            ROISheetLocation: "",
            QELead: projectDetails?.automation_qe_lead || "",
            Comment: r.Comment || "",
            TranInitiative: r.TranInitiative || "",    // NEW: map Trans. Initiative
            N1_AvgManualPD: r.N1,
            PD1_TotalManualPDsNByN1: r.PD1,
            C1_TotalManualCost_D: r.C1,
            N2_AvgAutomationPD: r.N2,
            PD2_TotalAutomatedPDsNByN2: r.PD2,
            C2_TotalAutomationCost_D: r.C2,
            N3_Numberofcycles: r.N3,
            SavingsPD: r.SavingsPD,
          });
        });
      });


      await fetch("http://localhost:5000/api/projectroiupdate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: allEntries }),
      });




      // also prepare rows for projecttccount_TDM
      const projectDisplay = `${intakeNumber}-${projectDetails?.intake_name || ""}`;
      const tcountEntries = [];
      Object.entries(tdmRowsBySub).forEach(([frmk, rows]) => {
        rows.forEach((r) => {
          if (!r.Dropdown1) return; // require Application at minimum
          tcountEntries.push({
            project: projectDisplay,                      // projecttccount_TDM.project
            Domain: projectDetails?.domain || "",        // projecttccount_TDM.Domain
            AutomationFrmk: frmk,                        // projecttccount_TDM.AutomationFrmk
            application: r.Dropdown1,                    // projecttccount_TDM.application
            AutoTDMCountExec: Number(r.N || 0),          // projecttccount_TDM.AutoTDMCountExec
            DSRRef: dsrRef || "",                        // projecttccount_TDM.DSRRef
            Comment: r.Comment || "",
            SavingsCategory: r.Dropdown3 || ""
            // LastUpdate is set server-side to current timestamp
          });
        });
      });


      // CHANGE: Build Design/Execution entries from Automation rows (rowsBySub)
      const DESIGN_NEW = "New Test case Created";
      const DESIGN_UPDATED = "Existing Test case Updated/Reused";
      const EXEC_MAP = {
        "Test Case Execution - DIT": "DIT",
        "Test Case Execution - SIT": "SIT",
        "Test Case Execution - UAT": "UAT",
        "Test Case Execution - RollBack": "RollBack",
        "Test Case Execution - RollForward": "RollForward",
        "Test Case Execution - Adhoc/utility": "Adhoc/utility",
      };

      const designEntries = [];
      const executionEntries = [];
      Object.entries(rowsBySub).forEach(([frmk, rows]) => {
        rows.forEach((r) => {
          const cat = r.Dropdown3;
          if (!r.Dropdown1 || !cat) return; // need Application & Category

          const scSOA = (frmk === "SOA API" && r.SOAPackageStatus) ? `${cat} (${r.SOAPackageStatus})` : cat;
          // (SOA-specific counts): when sub-tab = "SOA", use N2 (Automated) and N1 (Manual),
          // and also pass TotalUniqueForms* where required.
          const isSOA = frmk === "SOA API";
          const autoCnt = isSOA ? Number(r.N2 || 0) : Number(r.N || 0);
          const manCnt = isSOA ? Number(r.N1 || 0) : undefined;
          const uniqueForms = isSOA ? Number(r.TotalUniqueForms || 0) : undefined;

          if (cat === DESIGN_NEW || cat === DESIGN_UPDATED) {
            // Case A/B → projecttccount_Design
            const base = {
              project: projectDisplay,
              Domain: projectDetails?.domain || "",
              AutomationFrmk: frmk,
              application: r.Dropdown1,
              DSRRef: dsrRef || "",
              ...(frmk === "SOA API" && r.FormsComplexity ? { FormsComplexity: r.FormsComplexity } : {}),
            };
            if (cat === DESIGN_NEW) {
              designEntries.push({
                ...base,
                // Table Column: TotalNewAutoTCCreated = Automated Exec Count (SOA → N2; else N)
                TotalNewAutoTCCreated: autoCnt,
                // Table Column: TotalUniqueFormsDesigned (SOA only)
                ...(isSOA ? { TotalUniqueFormsDesigned: uniqueForms } : {}),
                // Table Column: TotalManualTCCreated (SOA only) = Manual Exec Count (N1)
                ...(isSOA ? { TotalManualTCCreated: manCnt } : {}),
                SavingsCategory: scSOA
                //SavingsCategory: cat
              });
            } else {
              designEntries.push({
                ...base,
                // Table Column: TotalExistingAutoTCUpdated = Automated Exec Count (SOA → N2; else N)
                TotalExistingAutoTCUpdated: autoCnt,
                // Table Column: TotalUniqueFormsDesigned (SOA only)
                ...(isSOA ? { TotalUniqueFormsDesigned: uniqueForms } : {}),
                SavingsCategory: scSOA,
                //SavingsCategory: cat
              });
            }
          } else if (EXEC_MAP[cat]) {
            // Case C → projecttccount_Execution
            executionEntries.push({
              project: projectDisplay,
              Domain: projectDetails?.domain || "",
              AutomationFrmk: frmk,
              application: r.Dropdown1,
              DSRRef: dsrRef || "",
              ...(isSOA && r.FormsComplexity ? { FormsComplexity: r.FormsComplexity } : {}),
              // Table Column: TotalNewAutoTCExecuted = Automated Exec Count (SOA → N2; else N)
              TotalNewAutoTCExecuted: autoCnt,
              Execycle: EXEC_MAP[cat],
              // Table Column: TotalUniqueFormsExecuted (SOA only)
              ...(isSOA ? { TotalUniqueFormsExecuted: uniqueForms } : {}),
              // Table Column: TotalManualTCExecuted (SOA only) = Manual Exec Count (N1)
              ...(isSOA ? { TotalManualTCExecuted: manCnt } : {}),
              SavingsCategory: scSOA,
              //SavingsCategory: cat
            });
          }




        });
      });

      // Post all three sets together in one call; endpoint is backward-compatible
      if (tcountEntries.length || designEntries.length || executionEntries.length) {
        await fetch("http://localhost:5000/api/projecttcountupdate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: tcountEntries,                // TDM rows 
            design_entries: designEntries,         // 
            execution_entries: executionEntries,   // 
          }),
        });
      }
      //alert("TDM rows saved.");
      // CHANGE: show inline confirmation under Save button
      setSaveNotice("All changes saved successfully");


    } catch (e) {
      console.error("Save TDM failed", e);
      alert("Failed to save TDM rows.");
      setSaveNotice("");
    } finally {
      setSaving(false);           // FIX: stop loader
    }
  };



  const renderAutoRow = (subKey, r, i) => {
    //  tooltip text for N field depending on the Savings Category
    const nTooltip =
      r.Dropdown3 === "New Test case Created"
        ? "Enter Total new automated tcs created for the project for both func and regression executions"
        : r.Dropdown3 === "Existing Test case Updated/Reused"
          ? "Enter Total existing automated tcs updated for the project for both func and regression executions"
          : r.Dropdown3 && r.Dropdown3.startsWith("Test Case Execution")
            ? "Enter Total Automated tcs executed for the cycle selected for both func and regression executions"
            : undefined;
    return (



      <div
        key={`${subKey}-${i}`}
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 8,
          borderBottom: "1px dashed #e5e7eb",
          paddingBottom: 8,
        }}
      >
        {/*  row-local controls on the right */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn-compact btn-add" onClick={() => addRowAfter(subKey, i)}>
            &lt;Add Row&gt;
          </button>
          <button className="btn-compact btn-del" onClick={() => deleteRowAt(subKey, i)}>
            &lt;Delete Row&gt;
          </button>
        </div>

        {/* Dropdown1 => Application */}
        <div style={cell}>
          <label className="tab-label tab-label-green">Application</label>
          <select
            className="select-red"
            style={smSel}
            value={r.Dropdown1}
            onChange={(e) => updateRow(subKey, i, "Dropdown1", e.target.value)}
          >
            <option value="">{`<Application>`}</option>
            {DROPDOWN_OPTIONS_1.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {saveAttempted && !r.Dropdown1 && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>
              Application - Field is mandatory</div>

          )}

        </div>


        {/* Dropdown3 => Savings Category */}

        <div style={cell}>
          <label className="tab-label tab-label-green" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Savings Category
            {/* CHANGE: show small info icon when tooltip text is available */}
            {nTooltip && <span className="info-icon" title={nTooltip}>i</span>}
          </label>
          <select
            className="select-red"
            style={smSel}
            value={r.Dropdown3}
            onChange={(e) => updateRow(subKey, i, "Dropdown3", e.target.value)}
            title={nTooltip}
          >
            <option value="">{`<Savings Category>`}</option>
            {DROPDOWN_OPTIONS_3.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {/* inline validation message */}
          {saveAttempted && !r.Dropdown3 && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>
              Savings Category is mandatory. Please enter..
            </div>
          )}


        </div>


        {/*  'Utilities' dropdown visible only for Automation sub = Utilities */}
        {subKey === "Other Utilities" && (
          <div style={cell}>
            <label className="tab-label tab-label-green">Other Utilities</label>
            <select
              className="select-red"
              style={smSel}
              value={r.UtilityName}
              onChange={(e) => updateRow(subKey, i, "UtilityName", e.target.value)}
            >
              <option value="">{`<Select Utility>`}</option>
              {utilOptionsNonTDM.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            {/* : required only for Utilities sub-tab */}
            {saveAttempted && !r.UtilityName && (
              <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>
                Other Utilities - Field is mandatory
              </div>
            )}

          </div>
        )}


        {/* rans. Initiative . Hide Trans. Initiative when the Utilities button is active*/}

        {subKey !== "Other Utilities" && (
          <div style={cell}>
            <label className="tab-label tab-label-green">Trans. Initiative</label>
            <select
              className="select-red"
              style={smSel}
              value={r.TranInitiative}
              onChange={(e) => updateRow(subKey, i, "TranInitiative", e.target.value)}
            >
              <option value="">{`<Trans. Initiative>`}</option>
              {initiativeOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>


          </div>
        )}


        {/* labeled inputs per Excel (unchanged math/labels) */}
        <div style={cell}>
          <label className="tab-label tab-label-green">N (Total Automated Test Case Count)</label>
          <input
            className="tab-input"
            style={sm}
            type="number"
            value={r.N}


            onChange={(e) => updateRow(subKey, i, "N", Number(e.target.value))}
            title={nTooltip}

          />
          {saveAttempted && !(Number(r.N) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>N - Field is mandatory</div>
          )}

        </div>


        <div style={cell}>
          <label
            className="tab-label tab-label-green"
            title={`Ensure this count is vetted by Functional QA Lead'`}
          >
            {subKey === "SOA API"
              ? "Manual Test Case Execution Count PD (Without SOA)"
              : "N1 (Avg Manual/PD)"}  {/* CHANGE: SOA label */}
          </label>


          <input
            className="tab-input"
            style={sm}
            type="number"
            value={r.N1}
            onChange={(e) => updateRow(subKey, i, "N1", Number(e.target.value))}
          />
          {saveAttempted && !(Number(r.N1) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>N1 - Field is mandatory</div>
          )}

        </div>
        <div style={cell}>
          <label className="tab-label tab-label-orange">
            {subKey === "SOA API"
              ? "Total PDs of Manual effort - Without SOA Package"
              : "PD1 [Total Manual PDs=N/N1]"}  {/*  SOA label */}
          </label>

          <input className="tab-input tab-input-orange" style={sm} value={r.PD1} disabled />
        </div>
        <div style={cell}>
          <label className="tab-label tab-label-orange">C1 [Total Manual Cost $]</label>
          <input className="tab-input tab-input-orange" style={sm} value={r.C1} disabled />
        </div>
        <div style={cell}>
          <label className="tab-label tab-label-green">
            {subKey === "SOA API"
              ? "Automated Test Case Execution Count PD (WITH SOA)"
              : "N2 (Avg Automation/PD)"}  {/* CHANGE: SOA label */}
          </label>
          <input
            className="tab-input"
            style={sm}
            type="number"
            value={r.N2}
            onChange={(e) => updateRow(subKey, i, "N2", Number(e.target.value))}
          />
          {saveAttempted && !(Number(r.N2) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>N2 - Field is mandatory</div>
          )}
        </div>
        <div style={cell}>
          <label className="tab-label tab-label-orange">
            {subKey === "SOA API"
              ? "Total PDs of Automation effort - WITH SOA Package"
              : "PD2 [Total Automated PDs=N/N2]"}  {/* CHANGE: SOA label */}
          </label>
          <input className="tab-input tab-input-orange" style={sm} value={r.PD2} disabled />
        </div>
        <div style={cell}>
          <label className="tab-label tab-label-orange">C2 [Total Automation Cost $]</label>
          <input className="tab-input tab-input-orange" style={sm} value={r.C2} disabled />
        </div>
        <div style={cell}>
          <label className="tab-label tab-label-green">N3 (Cycles)</label>
          <input
            className="tab-input"
            style={sm}
            type="number"
            value={r.N3}
            onChange={(e) => updateRow(subKey, i, "N3", Number(e.target.value))}
          />
          {saveAttempted && !(Number(r.N3) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>N3 - Field is mandatory</div>
          )}
        </div>

        {/* SOA-only additional fields */}
        {subKey === "SOA API" &&


          (
            <>
              <div style={cell}>
                <label className="tab-label tab-label-green" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Forms Complexity
                  <span
                    title={`• 'Simple Form Means'\n• 'Simple Form Means'\n• 'Simple Form Means'\n• 'Simple Form Means'\n\nClick to Know more`}
                    style={{
                      display: "inline-flex",
                      width: 16, height: 16, borderRadius: 9999,
                      alignItems: "center", justifyContent: "center",
                      fontSize: 11, cursor: "help", background: "#e5e7eb", color: "#111827"
                    }}
                  >
                    i
                  </span>
                </label>
                <select
                  className="select-red"
                  style={smSel}
                  value={r.FormsComplexity || ""}
                  onChange={(e) => updateRow(subKey, i, "FormsComplexity", e.target.value)}
                >
                  <option value="">{`<Select>`}</option>
                  <option value="Simple">Simple</option>
                  <option value="Medium">Medium</option>
                  <option value="Complex">Complex</option>
                  <option value="Very Complex">Very Complex</option>
                </select>
              </div>


              <div style={cell}>
                <label className="tab-label tab-label-green">Total Unique Forms</label>
                <input
                  className="tab-input"
                  style={sm}
                  type="number"
                  value={r.TotalUniqueForms || ""}
                  onChange={(e) => updateRow(subKey, i, "TotalUniqueForms", e.target.value)}
                />
              </div>

              <div style={cell}>
                <label className="tab-label tab-label-green">SOA Package Status</label>
                <select
                  className="select-red"
                  style={smSel}
                  value={r.SOAPackageStatus || ""}
                  onChange={(e) => updateRow(subKey, i, "SOAPackageStatus", e.target.value)}
                >
                  <option value="">{`<SOA Package Status>`}</option>
                  <option value="New SOA Package">New SOA Package</option>
                  <option value="Existing SOA Package update">Existing SOA Package update</option>
                </select>
              </div>

            </>


          )


        }


        <div style={cell}>
          <label className="tab-label tab-label-orange">$ Savings [= (C1 - C2) * N3]</label>
          <input className="tab-input tab-input-orange" style={sm} value={r.Savings} disabled />
        </div>

        <div style={cell}>
          <label className="tab-label tab-label-orange">Savings (in PDs)</label>
          <input className="tab-input tab-input-orange" style={sm} value={r.SavingsPD} disabled />
        </div>

        {/*  Comment for Automation row */}
        <div style={{ ...cell, minWidth: 260 }}>
          <label className="tab-label tab-label-green">Comment</label>
          <input
            className="tab-input"
            value={r.Comment}
            onChange={(e) => updateRow(subKey, i, "Comment", e.target.value)}
          />
        </div>


      </div>
    );
  };

  return (
    <div className="tab-wrap">

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 12 }}>
          <label className="tab-label tab-label-green" style={{ margin: 0 }}>ROI month</label>
          <input
            type="month"
            className="tab-input"
            style={{ width: 160, padding: "4px 6px" }}
            value={roiMonthFilter /* default already current month */}
            onChange={(e) => setRoiMonthFilter(e.target.value)}
          />
        </div>


        <button className="btn-red" onClick={onSave} disabled={saving}>
          1. Save all
        </button>

        <div style={{ width: 16 }} />

        <button
          onClick={DownloadProjectROISheet}
          //disabled={!canDownload}                        
          //style={ !canDownload ? { opacity: 0.6, cursor: 'not-allowed' } : {} } 
          className="btn btn-secondary"
        >
          2. Download Project ROI Sheet
        </button>





      </div>

      {/* inline confirmation once all DB updates finish */}
      <div style={{ margin: "4px 0 10px", minHeight: 20, display: "flex", alignItems: "center" }}>
        {saving && (
          <span className="inline-flex items-center text-sm text-gray-700" role="status" aria-live="polite">
            <span
              className="inline-block mr-2 h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"
              style={{ display: "inline-block", animation: "spin 1s linear infinite" }}
              aria-hidden="true"
            />
            Saving…
          </span>
        )}
        {!saving && !!saveNotice && (
          <span className="inline-flex items-center text-green-700 text-sm">
            <span className="mr-1" aria-hidden="true">✓</span>
            {saveNotice}
          </span>
        )}
      </div>

      {/* ======= TDM Savings (with 3 dropdowns added) ======= */}

      {/*  TDM top-level Add/Delete when there are zero rows */}


      <div className="tab-section tab-section-yellow">
        TDM Savings{" "}
        <span style={{ fontWeight: 400 }}>
          [you are reporting {Math.round(tdmTotals.dollars)}$ Saved, that amounts to ~ {Math.round(tdmTotals.pds)} PDs Saved]
        </span>
      </div>


      {/* CHANGE: TDM framework buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0 12px" }}>
        {TDM_SUBS.map((k) => (
          <button
            key={k}
            className="btn-red"
            onClick={() => setTdmActive(k)}
            style={{ opacity: tdmActive === k ? 1 : 0.65 }}
          >
            {k}
          </button>
        ))}
      </div>


      {/*  Add/Delete UNDER the TDM buttons; recolor + compact */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button className="btn-compact btn-add" onClick={() => addTdmRowTop(tdmActive)}>&lt;Add Row&gt;</button>
        <button
          className="btn-compact btn-del"
          onClick={() => deleteTdmRowTop(tdmActive)}
          disabled={!tdmRowsBySub[tdmActive]?.length}
        >
          &lt;Delete Row&gt;
        </button>
      </div>


      {/* TDM now supports multiple rows with Add/Delete */}
      {(tdmRowsBySub[tdmActive] || []).map((r, i) => (
        <div
          key={`TDM-${tdmActive}-${i}`}
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-start",
            marginBottom: 10,
            borderBottom: "1px dashed #e5e7eb",
            paddingBottom: 8,
          }}
        >
          {/* row-local controls */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn-compact btn-add" onClick={() => addTdmRowAfter(tdmActive, i)}>
              &lt;Add Row&gt;
            </button>
            <button className="btn-compact btn-del" onClick={() => deleteTdmRowAt(tdmActive, i)}>
              &lt;Delete Row&gt;
            </button>
          </div>

          {/* Application */}
          <div style={cell}>
            <label className="tab-label tab-label-green">Application</label>
            <select
              className="select-red"
              style={smSel}
              value={r.Dropdown1}
              onChange={(e) => updateTdmRow(tdmActive, i, "Dropdown1", e.target.value)}
            >
              <option value="">{`<Application>`}</option>
              {applicationOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {/* required */}
            {saveAttempted && !r.Dropdown1 && (
              <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>
                Application - Field is mandatory
              </div>
            )}

          </div>


          {/* Savings Category (restricted list) */}

          <div style={cell}>
            <label className="tab-label tab-label-green">Savings Category</label>
            <select
              className="select-red"
              style={smSel}
              value={r.Dropdown3}
              onChange={(e) => updateTdmRow(tdmActive, i, "Dropdown3", e.target.value)}
            >
              <option value="">{`<Savings Category>`}</option>
              {TDM_SAVINGS_CATEGORIES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>

            {/*  inline validation message */}
            {saveAttempted && !r.Dropdown3 && (
              <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>
                Savings Category is mandatory. Please enter..
              </div>
            )}


          </div>

          {/* 'Other-Utility' dropdown visible only for TDM sub = Other-Utility */}
          {tdmActive === "Other Utilities" && (
            <div style={cell}>
              <label className="tab-label tab-label-green">Other Utilities</label>
              <select
                className="select-red"
                style={smSel}
                value={r.OtherUtility}
                onChange={(e) => updateTdmRow(tdmActive, i, "OtherUtility", e.target.value)}
              >
                <option value="">{`<Select Utility>`}</option>
                {utilOptionsTDM.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {saveAttempted && tdmActive === "Other Utilities" && !r.OtherUtility && (
                <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>
                  Utility - Field is mandatory if selected
                </div>
              )}
            </div>
          )}


          {/* N / N1 / PD1 / C1 */}
          <div style={cell}>
            <label className="tab-label tab-label-green">N (Total deal count)</label>
            <input className="tab-input" style={sm} type="number"
              value={r.N} onChange={(e) => updateTdmRow(tdmActive, i, "N", Number(e.target.value))} />
          </div>
          {saveAttempted && !(Number(r.N) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>N - is mandatory</div>
          )}

          <div style={cell}>
            <label className="tab-label tab-label-green">N1 (Avg Manual/PD)</label>
            <input className="tab-input" style={sm} type="number"
              value={r.N1} onChange={(e) => updateTdmRow(tdmActive, i, "N1", Number(e.target.value))} />
          </div>
          {saveAttempted && !(Number(r.N1) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>N1 - is mandatory</div>
          )}
          <div style={cell}>
            <label className="tab-label tab-label-orange">PD1 [Total Manual PDs=N/N1]</label>
            <input className="tab-input tab-input-orange" style={sm} value={r.PD1} disabled />
          </div>
          {saveAttempted && !(Number(r.PD1) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>PD1 - is mandatory</div>
          )}

          <div style={cell}>
            <label className="tab-label tab-label-orange">C1 [Total Manual Cost $]</label>
            <input className="tab-input tab-input-orange" style={sm} value={(Number(r.C1 ?? 0)).toFixed(2)} disabled />
          </div>
          {saveAttempted && !(Number(r.C1) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>C1 - is mandatory</div>
          )}
          {/* N2 / PD2 / C2 */}
          <div style={cell}>
            <label className="tab-label tab-label-green">N2 (Avg Automation/PD)</label>
            <input className="tab-input" style={sm} type="number"
              value={r.N2} onChange={(e) => updateTdmRow(tdmActive, i, "N2", Number(e.target.value))} />
          </div>
          {saveAttempted && !(Number(r.N2) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>N2 - is mandatory</div>
          )}

          <div style={cell}>
            <label className="tab-label tab-label-orange">PD2 [Total Automated PDs=N/N2]</label>
            <input className="tab-input tab-input-orange" style={sm} value={r.PD2} disabled />
          </div>
          {saveAttempted && !(Number(r.PD2) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>Pd2 - is mandatory</div>
          )}


          <div style={cell}>
            <label className="tab-label tab-label-orange">C2 [Total Automation Cost $]</label>
            <input className="tab-input tab-input-orange" style={sm} value={(Number(r.C2 ?? 0)).toFixed(2)} disabled />
          </div>
          {saveAttempted && !(Number(r.C2) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>C2 - is mandatory</div>
          )}

          {/* N3 / Savings */}
          <div style={cell}>
            <label className="tab-label tab-label-green">N3 (Number of cycles)</label>
            <input className="tab-input" style={sm} type="number"
              value={r.N3} onChange={(e) => updateTdmRow(tdmActive, i, "N3", Number(e.target.value))} />
          </div>
          {saveAttempted && !(Number(r.N3) > 0) && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 2 }}>N3 - is mandatory</div>
          )}

          <div style={cell}>
            <label className="tab-label tab-label-orange">$ Savings [= (C1 - C2) * N3]</label>
            <input className="tab-input tab-input-orange" style={sm} value={(Number(r.Savings ?? 0)).toFixed(2)} disabled />
          </div>

          {/* new read-only Savings (in PDs) */}
          <div style={cell}>
            <label className="tab-label tab-label-orange">Savings (in PDs)</label>
            <input className="tab-input tab-input-orange" style={sm} value={r.SavingsPD} disabled />
          </div>

          {/* : Comment field to persist to DB */}
          <div style={{ ...cell, minWidth: 260 }}>
            <label className="tab-label tab-label-green">Comment</label>
            <input
              className="tab-input"
              value={r.Comment}
              onChange={(e) => updateTdmRow(tdmActive, i, "Comment", e.target.value)}
            />
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <div style={cell}>
          <label className="tab-label tab-label-orange">Automation Savings Total</label>
          <input className="tab-input tab-input-orange" style={sm} value={autoSavingsTotal} disabled />
        </div>
      </div>

      {/* ======= 7 sub-tabs selector (unchanged) ======= */}

      <div className="tab-section tab-section-yellow">
        Automation Savings — Breakdown{" "}
        <span style={{ fontWeight: 400 }}>
          [you are reporting {Math.round(autoSavingsTotal)}$ Saved, that amounts to ~ {Math.round(autoSavingsPDTotal)} PDs Saved]
        </span>
      </div>

      {/*  Compact 4-column row: DSR + three ALM fields with buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 12,
          alignItems: "end",
          margin: "8px 0 12px",
        }}
      >
        {/* Col 1: DSR Ref */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label className="tab-label tab-label-green" htmlFor="dsrRef">
            DSR Ref (Enter DSR Latest email subject)
          </label>
          <input
            id="dsrRef"
            className="tab-input"
            value={dsrRef}
            onChange={(e) => setDsrRef(e.target.value)}
            placeholder="Paste latest DSR email subject here"
          />
        </div>
        {/* Col 2: Fetch Total Design count from ALM */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label className="tab-label tab-label-green" htmlFor="almDesignCount">
            Total Design Count (ALM)
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              id="almDesignCount"
              className="tab-input"
              value={almDesignCount}
              onChange={(e) => setAlmDesignCount(e.target.value)}
              placeholder="Enter or fetch from ALM"
            />
            <button
              type="button"
              className="btn-compact btn-add"
              onClick={() => openAlmBox("design")}
              title="Fetch Total Design count from ALM"
            >
              Fetch
            </button>
          </div>
        </div>
        {/* Col 3: Fetch Total Update count from ALM */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label className="tab-label tab-label-green" htmlFor="almUpdateCount">
            Total Update Count (ALM)
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              id="almUpdateCount"
              className="tab-input"
              value={almUpdateCount}
              onChange={(e) => setAlmUpdateCount(e.target.value)}
              placeholder="Enter or fetch from ALM"
            />
            <button
              type="button"
              className="btn-compact btn-add"
              onClick={() => openAlmBox("update")}
              title="Fetch Total Update count from ALM"
            >
              Fetch
            </button>
          </div>
        </div>
        {/* Col 4: Fetch Execution count from ALM */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label className="tab-label tab-label-green" htmlFor="almExecCount">
            Execution Count (ALM)
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              id="almExecCount"
              className="tab-input"
              value={almExecCount}
              onChange={(e) => setAlmExecCount(e.target.value)}
              placeholder="Enter or fetch from ALM"
            />
            <button
              type="button"
              className="btn-compact btn-add"
              onClick={() => openAlmBox("execution")}
              title="Fetch Execution count from ALM"
            >
              Fetch
            </button>
          </div>
        </div>
      </div>




      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {SUB_TABS.map((k) => (
          <button
            key={k}
            className="btn-red"
            onClick={() => setActiveSub(k)}
            style={{ opacity: activeSub === k ? 1 : 0.65 }}
          >
            {k}
          </button>
        ))}
      </div>

      {/* rows for active sub-tab (each row has Add/Delete controls on the right) */}

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button className="btn-compact btn-add" onClick={() => addAutoRowTop(activeSub)}>&lt;Add Row&gt;</button>

        <button
          className="btn-compact btn-del"
          onClick={() => deleteAutoRowTop(activeSub)}
          disabled={!rowsBySub[activeSub]?.length}
        >
          &lt;Delete Row&gt;
        </button>
      </div>

      {/* rows for active sub-tab (each row has Add/Delete controls on the right) */}


      <div>{rowsBySub[activeSub].map((r, i) => renderAutoRow(activeSub, r, i))}</div>

      {/* CHANGE: Minimal lightbox to host ALM interactions (to be wired to ALMFetch.py endpoints later) */}
      {almLightbox.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={closeAlmBox}
        >
          <div
            style={{
              background: "#fff",
              minWidth: 420,
              maxWidth: 640,
              padding: 16,
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="tab-label tab-label-green" style={{ fontSize: "1rem" }}>
                {almLightbox.type === "design" && "Fetch Total Design count from ALM"}
                {almLightbox.type === "update" && "Fetch Total Update count from ALM"}
                {almLightbox.type === "execution" && "Fetch Execution count from ALM"}
              </div>
              <button className="btn-compact btn-del" onClick={closeAlmBox}>Close</button>
            </div>
            <div style={{ marginTop: 12, fontSize: ".9rem" }}>


              {/* Placeholder: for  backend endpoint implemented via ALMFetch.py */}
              {/* e.g., fetch(`http://localhost:5000/api/almfetch?type=${almLightbox.type}&project=${encodeURIComponent(intakeNumber)}`) */}


              This dialog is a placeholder for ALM integration. Implement server logic in <b>ALMFetch.py</b>
              and call it from here to populate the corresponding field automatically.
            </div>
          </div>
        </div>
      )}



    </div>);
};

