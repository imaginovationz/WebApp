// src/components/Metrices/AutomationMetricMain/TestCaseCountTab.js

// CHANGE: add useEffect/useOutletContext for Application list; keep prior imports
import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom"; // CHANGE: for projectDetails.application CSV
import "../../../styles/roiTabs.css"; // keep using your existing ROI tab styles

//const API_BASE = ""; // same-origin
const API_BASE = "http://localhost:5000";
const GET = async (url) => (await fetch(url)).json();
const POST = async (url, body) =>
  (await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();

// CHANGE: automation sub-buttons (mirrors your ProjectSavingsTab)
const AUTO_SUB_TABS = [
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

// CHANGE: three logical sections; Execution will be expanded into 5 phases in UI
const AUTO_SECTIONS = [
  "New Automation",
  "Existing TCs Updated",
  "Execution (SIT + UAT)",
];

// CHANGE: execution phases required by spec
const EXEC_PHASES = ["DIT", "SIT", "UAT", "Rollback", "Roll Forward"];

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function TestCaseCountTab() {
  const [activeTab, setActiveTab] = useState("Manual"); // "Manual" | "Automation"

  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const typingRef = React.useRef(false);

  // =========================
  // MANUAL TAB STATE 
  // =========================
  const [manualDesigned, setManualDesigned] = useState({ func: "", regression: "" });
  const [manualExecuted, setManualExecuted] = useState({ func: "", regression: "" });

  const designedTotal = useMemo(
    () => num(manualDesigned.func) + num(manualDesigned.regression),
    [manualDesigned]
  );
  const executedTotal = useMemo(
    () => num(manualExecuted.func) +  num(manualExecuted.regression),
    [manualExecuted]
  );

  // =========================
  // AUTOMATION TAB STATE
  // =========================
  const [activeAuto, setActiveAuto] = useState(AUTO_SUB_TABS[0]);

  // per-section model now includes an editable 'total' for validation
  const mkCounts = () => ({ func: "", regression: "", total: 0 });

  // execution section is a bundle of 5 phases, each with func/regression/total
  const mkExecBundle = () =>
    Object.fromEntries(EXEC_PHASES.map((p) => [p, mkCounts()]));

  // per-sub-tab bundle
  const mkAutoBundle = () =>
    Object.fromEntries(
      AUTO_SECTIONS.map((s) =>
        s === "Execution (SIT + UAT)" ? [s, mkExecBundle()] : [s, mkCounts()]
      )
    );

  const [autoBySub, setAutoBySub] = useState(
    Object.fromEntries(AUTO_SUB_TABS.map((k) => [k, mkAutoBundle()]))
  );


    // =========================
  // NEW: fetch helpers to read back EXACT values entered
  // =========================
  // (A) Manual tab – fetch the exact designed/executed func/reg we saved
  const loadManual = async () => {
    if (!projectLabel) return;
    try {
     const params = new URLSearchParams({ mode: "fetch_manual", project: projectLabel });
      const data = await GET(`${API_BASE}/api/masterdashboardfetchupdate?${params.toString()}`);
      if (data && data.designed) setManualDesigned({
        func: String(data.designed.func ?? ""), regression: String(data.designed.reg ?? "")
     });
      if (data && data.executed) setManualExecuted({
        func: String(data.executed.func ?? ""), regression: String(data.executed.reg ?? "")
      });
   } catch (e) {
      console.error("loadManual failed", e);
    }
  };
  // (B) Automation – fetch totals (existing) AND exact func/reg splits (new)
  const fetchDesignSplit = async ({ which, frmk, application }) => {
    const params = new URLSearchParams({
      mode: "fetch_split",
      scope: "design",
      which,
      project: projectLabel,
      Domain: portfolio,
      AutomationFrmk: frmk,
      application: application || "",
    });
    const res = await GET(`${API_BASE}/api/masterdashboardfetchupdate?${params.toString()}`);
   return { func: Number(res?.func || 0), reg: Number(res?.reg || 0) };
  };
  const fetchExecSplit = async ({ phase, frmk, application }) => {
    const params = new URLSearchParams({
      mode: "fetch_split",
      scope: "execution",
      phase,
      project: projectLabel,
      Domain: portfolio,
      AutomationFrmk: frmk,
      application: application || "",
    });
    const res = await GET(`${API_BASE}/api/masterdashboardfetchupdate?${params.toString()}`);
    return { func: Number(res?.func || 0), reg: Number(res?.reg || 0) };
  };



  // update helpers for normal sections and exec phases
  const updateAuto = (subKey, section, field, value) => {
    if (section === "Execution (SIT + UAT)") return; // use updateExec for phases
    setAutoBySub(prev => ({
      ...prev,
      [subKey]: {
        ...prev[subKey],
        [section]: { ...prev[subKey][section], [field]: value },
      },
    }));
  };

  const updateExec = (subKey, phase, field, value) => {
    setAutoBySub(prev => ({
      ...prev,
      [subKey]: {
        ...prev[subKey],
        ["Execution (SIT + UAT)"]: {
          ...prev[subKey]["Execution (SIT + UAT)"],
          [phase]: {
            ...prev[subKey]["Execution (SIT + UAT)"][phase],
            [field]: value,
          },
        },
      },
    }));
  };

  const sectionSum = (obj) => num(obj.func) + num(obj.regression); // ensure numeric compare
  const sectionMismatch = (obj) => sectionSum(obj) !== num(obj.total);

  // =========================
  //  Application dropdown (same logic as ProjectSavingsTab)
  // =========================
  const ctx = useOutletContext() || {};
  const projectDetails = ctx.projectDetails;
  const projectLabel = ctx.projectLabel || "";
  const portfolio     = ctx.portfolio || "";
  const applicationOptions = ctx.appOptions || [];
  const defaultApp    = ctx.defaultApp || "";

  //  global Application selection for Automation band
  const [selectedApplication, setSelectedApplication] = useState("");

  useEffect(() => {
    if (!selectedApplication && (defaultApp || applicationOptions.length > 0)) {
      setSelectedApplication(defaultApp || applicationOptions[0]);
    }
  }, [defaultApp, applicationOptions, selectedApplication]);

  const [apiAppOptions, setApiAppOptions] = useState([]);

  useEffect(() => {
    // prefer already-selected value; else defaultApp; else first available from either source
    const first =
      selectedApplication ||
      (defaultApp || "") ||
      (applicationOptions[0] || apiAppOptions[0] || "");
    if (!first) return; // still nothing to use

    if (!selectedApplication) {
      setSelectedApplication(first);
      // let React commit the new state, then run the loader
      setTimeout(() => loadAutomationTotals(activeAuto), 0);
    } else {
      // already have a selection; ensure totals are loaded
      loadAutomationTotals(activeAuto);
    }
    // keep dependencies minimal & safe; this only “prefetches”, it doesn't alter any other logic
  }, [defaultApp, applicationOptions, apiAppOptions, projectLabel, portfolio, activeAuto, selectedApplication]);

  // FIX: fetch application options if CSV is empty, using current portfolio/domain
  useEffect(() => {
    const needsFetch = applicationOptions.length === 0;
    const dom = projectDetails?.domain || projectDetails?.Portfolio || "";
    if (!needsFetch || !dom) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/fetchapplication?domain=${encodeURIComponent(dom)}`);
        const data = await res.json();
        // expect array of strings; sanitize just like CSV branch
        const list = Array.from(new Set((Array.isArray(data) ? data : []).map(String).map(s => s.trim()).filter(Boolean)));
        setApiAppOptions(list);
        // pick a default immediately if none selected yet
        if (!selectedApplication && list.length > 0) setSelectedApplication(list[0]);
      } catch (e) {
        console.error("Failed to fetch application options", e);
      }
    })();
  }, [applicationOptions.length, projectDetails?.domain, projectDetails?.Portfolio, selectedApplication]);

  useEffect(() => {
    if (selectedApplication) return;
    const eff = apiAppOptions.length > 0 ? apiAppOptions : applicationOptions;
    if (eff.length > 0) setSelectedApplication(eff[0]);
  }, [applicationOptions, apiAppOptions, selectedApplication]);

  useEffect(() => {
    if (activeTab !== "Automation") return;
    if (typingRef.current) return;
    loadAutomationTotals(activeAuto);
  }, [activeTab, activeAuto, selectedApplication, projectLabel, portfolio]);

  useEffect(() => {
    if (!selectedApplication || !projectLabel || !portfolio) return;
    if (typingRef.current) return; 
    requestAnimationFrame(() => loadAutomationTotals(activeAuto));
  }, [selectedApplication, projectLabel, portfolio, activeAuto]);

  const execGrandTotal = (subKey) => {
    const exec = autoBySub[subKey]["Execution (SIT + UAT)"];
    return EXEC_PHASES.reduce((acc, p) => acc + num(exec[p].total), 0);
  };

  const fetchDesignTotal = async ({ section, frmk, application }) => {
    // section: 'design_new' or 'design_existing'
    const params = new URLSearchParams({
      mode: "fetch",
      scope: "design",
      which: section, // 'design_new' | 'design_existing'
      project: projectLabel,
      Domain: portfolio,
      AutomationFrmk: frmk,
      application: application || "",
    });
    const data = await GET(`${API_BASE}/api/masterdashboardfetchupdate?${params.toString()}`);
    // returns: { total: number }
    return Number.isFinite(data?.total) ? data.total : 0;
  };

  const fetchExecTotal = async ({ phase, frmk, application }) => {
    // phase: one of "DIT" | "SIT" | "UAT" | "Rollback" | "Roll Forward"
    const params = new URLSearchParams({
      mode: "fetch",
      scope: "execution",
      phase,                 // map handled server-side to SavingsCategory
      project: projectLabel,
      Domain: portfolio,
      AutomationFrmk: frmk,
      application: application || "",
    });
    const data = await GET(`${API_BASE}/api/masterdashboardfetchupdate?${params.toString()}`);
    return Number.isFinite(data?.total) ? data.total : 0;
  };

  const loadAutomationTotals = async (subKey) => {
    if (!projectLabel || !portfolio || !selectedApplication) return;

    // 1) New Automation
    const naTotal = await fetchDesignTotal({
      section: "design_new",
      frmk: subKey,
      application: selectedApplication,
    });

        const naSplit = await fetchDesignSplit({
      which: "design_new", frmk: subKey, application: selectedApplication,
    });

    // 2) Existing TCs Updated
    const exTotal = await fetchDesignTotal({
      section: "design_existing",
      frmk: subKey,
      application: selectedApplication,
    });

        const exSplit = await fetchDesignSplit({
      which: "design_existing", frmk: subKey, application: selectedApplication,
    });

    // 3) Execution 5 phases
    const execTotals = {};
    const execSplits = {};
    for (const ph of EXEC_PHASES) {
      execTotals[ph] = await fetchExecTotal({
        phase: ph,
        frmk: subKey,
        application: selectedApplication,
      });
            execSplits[ph] = await fetchExecSplit({
        phase: ph, frmk: subKey, application: selectedApplication,
      });

    }

    // set into state (only 'total' fields)
    setAutoBySub((prev) => {
      const copy = { ...prev };
      const bundle = { ...copy[subKey] };

      //bundle["New Automation"] = { ...bundle["New Automation"], total: naTotal };
      //bundle["Existing TCs Updated"] = { ...bundle["Existing TCs Updated"], total: exTotal };

            bundle["New Automation"] = {
        ...bundle["New Automation"],
        total: naTotal,
       func: String(naSplit.func || ""),
        regression: String(naSplit.reg || ""),
      };
     bundle["Existing TCs Updated"] = {
        ...bundle["Existing TCs Updated"],
        total: exTotal,
        func: String(exSplit.func || ""),
        regression: String(exSplit.reg || ""),
      };

      const exec = { ...bundle["Execution (SIT + UAT)"] };
      for (const ph of EXEC_PHASES) {
        
                exec[ph] = {
          ...exec[ph],
          total: execTotals[ph] || 0,
          func: String(execSplits[ph]?.func || ""),
         regression: String(execSplits[ph]?.reg || ""),
        };

      }
      bundle["Execution (SIT + UAT)"] = exec;

      copy[subKey] = bundle;
      return copy;
    });
  };

    // NEW: load Manual values immediately and when the user lands/switches back
  useEffect(() => {
    loadManual();
  }, []); // on mount
  useEffect(() => {
    if (activeTab === "Manual") loadManual();
  }, [activeTab, projectLabel]);


    // [MANUAL: NEW] Save "Manual → Designed/Executed" using existing endpoint
  const onSaveManual = async () => {
    if (!projectLabel) return;
    try {
      setSaveBusy(true);
     setSaveMsg("Saving manual counts...");
      const payload = {
        mode: "update_manual",
      project: projectLabel,    // "<intake_number>-<intake_name>"
        updates: {
         // a.1 + a.2 -> projecttccount_Design row for 'New Test case Created'
          design_new_manual: {
            func: num(manualDesigned.func),
            reg:  num(manualDesigned.regression),
          },
          // a.3 + a.4 -> projecttccount_Execution row (first match)
          executed_manual: {
            func: num(manualExecuted.func),
            reg:  num(manualExecuted.regression),
         },
        },
      };
      await POST(`${API_BASE}/api/masterdashboardfetchupdate`, payload);
      setSaveMsg("Manual counts saved");
    } catch (e) {
      console.error("Manual save failed", e);
      setSaveMsg("Failed to save manual counts");
    } finally {
      setSaveBusy(false);
      setTimeout(() => setSaveMsg(""), 5000);
    }
  };

  const onSaveAll = async () => {
    if (!projectLabel || !portfolio || !selectedApplication) return;

    const subKey = activeAuto;
    const NA = autoBySub[subKey]["New Automation"];
    const EX = autoBySub[subKey]["Existing TCs Updated"];

    // CHANGE[VALIDATE-1]: perform validation only now (no validation while typing)
    setShowValidation(false);  // reset previous state

    const mismatches = [];
    // design sections
    if (sectionSum(NA) !== num(NA.total)) mismatches.push("New Automation");
    if (sectionSum(EX) !== num(EX.total)) mismatches.push("Existing TCs Updated");
    // execution phases
    const exec = autoBySub[subKey]["Execution (SIT + UAT)"] || {};
    for (const ph of EXEC_PHASES) {
      const P = exec[ph] || {};
      if (sectionSum(P) !== num(P.total)) mismatches.push(`Execution → ${ph}`);
    }
    if (mismatches.length > 0) {
      setShowValidation(true);
      setSaveMsg(`Please correct totals: ${mismatches.join(", ")}`);
      setTimeout(() => setSaveMsg(""), 60000);
      return; // do NOT hit the API when validation fails
    }

    setSaveBusy(true);
    setSaveMsg("Saving data...");

    //PAYLOAD CONSTRUCTION
    const execBundle = autoBySub[subKey]["Execution (SIT + UAT)"] || {};
    const exec_updates = ["DIT","SIT","UAT","Rollback","Roll Forward"].map((phase) => ({
      phase,
      func: num((execBundle[phase]||{}).func),
      reg:  num((execBundle[phase]||{}).regression),
    }));

    const payload = {
      mode: "update",
      project: projectLabel,
      Domain: portfolio,
      AutomationFrmk: subKey,
      application: selectedApplication,
      updates: [
        { which: "design_new",      func: num(NA.func), reg: num(NA.regression) },
        { which: "design_existing", func: num(EX.func), reg: num(EX.regression) },
      ],
      exec_updates, // NEW
    };

    const res = await POST(`${API_BASE}/api/masterdashboardfetchupdate`, payload);
    // (optional) You can surface a toast based on res.ok/res.updated
    // After save, reload totals (in case server recomputes anything)
    await loadAutomationTotals(subKey);

    setShowValidation(false); 
    setSaveMsg("Data saved successfully");
    setSaveBusy(false);
    setTimeout(() => setSaveMsg(""), 5000);
  };

  // =========================
  // RENDERERS
  // =========================
  const label = (text, tone = "green") => (
    <label className={`tab-label tab-label-${tone}`} style={{ marginBottom: 4 }}>
      {text}
    </label>
  );

  // [FOCUS-FIX SIMPLE INPUT] One input per field, controlled as string
  function InlineNumberInput({
    name,
    value,
    onChange,
    disabled = false,
    invalid = false,
    style,
  }) {
    return (
      <input
        name={name}
        className={`tab-input${disabled ? " tab-input-orange" : ""}`}
        style={{
          width: 120,
          padding: "4px 6px",
          ...(invalid ? { borderColor: "#b91c1c" } : {}),
          ...style,
        }}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        spellCheck={false}
        value={value ?? ""}               // keep as string while typing
        onChange={(e) => {
          if (disabled) return;
          const next = (e.target.value || "").replace(/[^\d]/g, ""); // allow only digits
          onChange(next);
        }}
        onFocus={() => { if (!disabled) typingRef.current = true; }}
        onBlur={() => { typingRef.current = false; }}
        disabled={disabled}
      />
    );
  }

    const [dsrRef, setDsrRef] = useState("");

  const ManualSection = ({ title, state, setState }) => (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "flex-end",
        flexWrap: "wrap",
        padding: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <div style={{ minWidth: 200 }}>{label(title, "yellow")}</div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {label("Functional")}

        <InlineNumberInput
          className="tab-input"
          //name={`${title}.functional`}
          value={state.func}
          onChange={(v) => setState(prev => ({ ...prev, func: v }))}
        />
         

      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {label("Regression")}
        <InlineNumberInput
          name={`${title}.regression`}
          value={state.regression}
          onChange={(v) => setState(prev => ({ ...prev, regression: v }))}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {label("Total", "orange")}
        <InlineNumberInput
          name={`${title}.total`}
          value={String(num(state.func) + num(state.regression))}
          onChange={() => {}}
          disabled
        />
      </div>
    </div>
  );

  const AutomationSimpleRow = ({ subKey, sectionName }) => {
    const S = autoBySub[subKey][sectionName];
    const mismatch = showValidation && sectionMismatch(S);

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr repeat(3, max-content)",
          gap: 16,
          alignItems: "end",
          padding: 10,
          borderBottom: "1px dashed #e5e7eb",
        }}
      >
        <div>{label(sectionName, "yellow")}</div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {label("Functional")}
          <InlineNumberInput
            name={`${subKey}.${sectionName}.functional`}
            value={S.func}
            onChange={(v) => updateAuto(subKey, sectionName, "func", v)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {label("Regression")}
          <InlineNumberInput
            name={`${subKey}.${sectionName}.regression`}
            value={S.regression}
            onChange={(v) => updateAuto(subKey, sectionName, "regression", v)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {label("Total")}
          <InlineNumberInput
            name={`${subKey}.${sectionName}.total`}
            value={String(num(S.total))}
            onChange={() => {}}
            disabled
            invalid={mismatch}
          />
          <div
            style={{
              color: "#b91c1c",
              fontSize: 12,
              marginTop: 4,
              minHeight: 16,
              visibility: mismatch ? "visible" : "hidden",
            }}
          >
            Func + Regression must equal Total (stored)
          </div>
        </div>
      </div>
    );
  };

  const AutomationExecBlock = ({ subKey }) => {
    const exec = autoBySub[subKey]["Execution (SIT + UAT)"];
    return (
      <div style={{ padding: 6 }}>
        {EXEC_PHASES.map((phase) => {
          const P = exec[phase];
          const mismatch = showValidation && sectionMismatch(P);

          return (
            <div
              key={phase}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr repeat(3, max-content)",
                gap: 16,
                alignItems: "end",
                padding: "8px 10px",
                borderBottom: "1px dashed #e5e7eb",
              }}
            >
              <div>{label(phase, "yellow")}</div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {label("Functional")}
                <InlineNumberInput
                  name={`${subKey}.Execution.${phase}.functional`}
                  value={P.func}
                  onChange={(v) => updateExec(subKey, phase, "func", v)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {label("Regression")}
                <InlineNumberInput
                  name={`${subKey}.Execution.${phase}.regression`}
                  value={P.regression}
                  onChange={(v) => updateExec(subKey, phase, "regression", v)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {label("Total")}
                {/* CHANGE: UNEDITABLE stored total per phase */}
                <InlineNumberInput
                  name={`${subKey}.Execution.${phase}.total`}
                  value={String(num(P.total))}
                  onChange={() => {}}
                  disabled
                  invalid={mismatch}
                />
                <div
                  style={{
                    color: "#b91c1c",
                    fontSize: 12,
                    marginTop: 4,
                    minHeight: 16,
                    visibility: mismatch ? "visible" : "hidden",
                  }}
                >
                  Func + Regression must equal Total (stored)
                </div>
              </div>
            </div>
          );
        })}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 16,
            padding: "10px 6px 6px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", minWidth: 160 }}>
            {label("Grand Total", "orange")}
            <InlineNumberInput
              name={`${subKey}.Execution.grand_total`}
              value={String(execGrandTotal(subKey))}
              onChange={() => {}}
              disabled
            />
          </div>
        </div>
      </div>
    );
  };

  // =========================
  // PAGE
  // =========================
  return (
    <div className="tab-wrap">
      {/* Primary tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          className="btn-red"
          style={{ opacity: activeTab === "Manual" ? 1 : 0.65 }}
          onClick={() => setActiveTab("Manual")}
        >
          Manual
        </button>
        <button
          className="btn-red"
          style={{ opacity: activeTab === "Automation" ? 1 : 0.65 }}
          onClick={() => setActiveTab("Automation")}
        >
          Automation
        </button>
      </div>

      {activeTab === "Manual" ? (
        <>
                    <div className="tab-section tab-section-yellow" style={{display:"flex",alignItems:"center"}}>
            <div style={{flex:1}}>Test Designed</div>
            <button onClick={onSaveManual} disabled={saveBusy} title={saveMsg || "Save Manual"}>
              {saveBusy ? "Saving..." : "Save Manual"}
            </button>
            {saveMsg && !saveBusy && <span style={{marginLeft:8,fontSize:12,opacity:.85}}>{saveMsg}</span>}
          </div>


          <ManualSection title="Test Designed" state={manualDesigned} setState={setManualDesigned} />

          <div style={{ height: 10 }} />

          <div className="tab-section tab-section-yellow">Test Executed</div>
          <ManualSection title="Test Executed" state={manualExecuted} setState={setManualExecuted} />
        </>
      ) : (
        <>
          <div className="tab-section tab-section-yellow" style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1 }}>Automation</div>

            {/* CHANGE: Application dropdown on the far right (same logic as ProjectSavingsTab) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label className="tab-label tab-label-green" style={{ margin: 0 }}>
                Select an Application
              </label>
              <select
                className="select-red"
                style={{ width: 200, padding: "4px 6px" }}
                value={selectedApplication}
                onChange={(e) => setSelectedApplication(e.target.value)}
              >
                <option value="">{`<Select an Application>`}</option>
                {(apiAppOptions.length > 0 ? apiAppOptions : applicationOptions).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              <button onClick={onSaveAll} disabled={saveBusy} title={saveMsg || "Save All"}>
                {saveBusy ? "Saving..." : "Save All"}
              </button>
              {saveMsg && !saveBusy && (
                <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.85 }}>{saveMsg}</span>
              )}
            </div>
          </div>

          {/* sub-tab buttons (reuse style from Savings tab) */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0 12px" }}>
            {AUTO_SUB_TABS.map((k) => (
              <button
                key={k}
                className="btn-red"
                onClick={() => setActiveAuto(k)}
                style={{ opacity: activeAuto === k ? 1 : 0.65 }}
              >
                {k}
              </button>
            ))}
          </div>

          {/* sections for the active automation sub-tab */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {/* CHANGE: New Automation */}
            <AutomationSimpleRow subKey={activeAuto} sectionName="New Automation" />
            {/* CHANGE: Existing TCs Updated */}
            <AutomationSimpleRow subKey={activeAuto} sectionName="Existing TCs Updated" />
            {/* CHANGE: Execution (SIT + UAT) expanded into 5 phases  Grand Total */}
            <div style={{ borderTop: "1px solid #e5e7eb" }}>
              <div style={{ padding: "10px 10px 0" }}>{label("Execution (SIT + UAT)", "yellow")}</div>
              <AutomationExecBlock subKey={activeAuto} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
