// src/components/ROI/tabs/StatusUpdatesTab.js
import axios from "axios";
//import React, { useEffect, useMemo, useState } from "react";
import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import "../../../styles/roiTabs.css";


function nowSQLite() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default forwardRef(function StatusUpdatesTab({
	
//export default function StatusUpdatesTab({
  intakeNumber,
  oosSelected,
  labelCls,
  inputCls,
  selectCls,
  areaCls,
  sectionWrap,
  sectionTitle,
  projectStatusOptions,
  automationStatusOptions,
  details, setDetails,
  automationStatus, setAutomationStatus,
  deliverables, setDeliverables,
  meta,
 // snapshot
//}) {
	  snapshot,
	  onGridDirty   // CHANGE [DIRTY HOOK]: optional callback from parent to enable <Save All>
	}, ref) {
		
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const [leadName, setLeadName] = useState("");
  const [gridRows, setGridRows] = useState([]); // [{intake_number, intake_name, project_status, AutomationStatus, Comments, timestamp, deliverables:{...}}]
  
  const [gridRowsOrig, setGridRowsOrig] = useState([]);
  const [gridDirty, setGridDirty] = useState(false);
 
    // CHANGE [EXPOSE bulkSaveAll]: parent invokes this when user clicks <Save All> in main tab (Status subtab)
    useImperativeHandle(ref, () => ({
      bulkSaveAll: async () => {
        
		
		
		      // CHANGE [SAVE ONLY CHANGED ROWS + REFRESH TIMESTAMP FROM DB]:
		      // Build and POST /api/projectmasterupdate only for rows that actually changed.
		      const rows = Array.isArray(gridRows) ? gridRows : [];
		      const orig = Array.isArray(gridRowsOrig) ? gridRowsOrig : [];
		      for (const row of rows) {
		        const prev = orig.find(o => o.intake_number === row.intake_number);
		        if (!rowChanged(row, prev)) continue; // skip untouched rows
		
		        const updates = [];
		        // ---- projects table ----
		        const ts = nowSQLite(); // we still stamp server timestamp per existing logic
		        updates.push({ table: "projects", column: "project_status",   value: row.project_status || "" });
		        //updates.push({ table: "projects", column: "AutomationStatus", value: row.AutomationStatus || "" });
		        //updates.push({ table: "projects", column: "Comments",         value: row.Comments || "" });
		        
                            updates.push({ table: "projects", column: "AutomationStatus", value: row.AutomationStatus || "" });
                // ==== [CHANGE #1] Preserve comments history (prepend timestamp + keep prior) ====
                let commentsToSave = row.Comments || "";
                if ((row.Comments || "") !== ((prev && prev.Comments) || "")) {
                  const stamp = nowSQLite();
                  const newLine = `${stamp} : ${row.Comments || ""}`.trim();
                  const older = (prev && prev.Comments) || "";
                  commentsToSave = older ? `${newLine}\n\n${older}` : newLine;
                }
                updates.push({ table: "projects", column: "Comments", value: commentsToSave });


updates.push({ table: "projects", column: "timestamp",        value: ts });
		        // ---- automationdeliverables table ----
		        const d = row.deliverables || {};
		        [
		          "AutomationTestPlan","Checklist","ALMupdate","GITUpdate","DSR",
		          "LESubmitted","RegressionTestLab","DashboardMetric","ReleaseHandover",
		          "ProjectClosure","QETransformed","ShiftLeft"
		        ].forEach((col) => {
		          if (col in d) updates.push({ table: "automationdeliverables", column: col, value: d[col] || "" });
		       });
		        if ("ROIMonth" in d) {
		          updates.push({ table: "automationdeliverables", column: "ROIMonth", value: d["ROIMonth"] || "" });
		        }
		        await axios.post("http://localhost:5000/api/projectmasterupdate", {
		          intake_number: row.intake_number,
		         updates,
		        });
		
		        // After saving, fetch the actual timestamp from DB and update ONLY this row
		        try {
		          const fres = await axios.get(`http://localhost:5000/api/projects/${row.intake_number}`);
		         const serverTs = fres?.data?.timestamp || ts;
		          setGridRows((rs) =>
		            rs.map((r) =>
		                                   r.intake_number === row.intake_number
                        ? { ...r, timestamp: serverTs, Comments: commentsToSave }
                        : r

		            )
		          );
		          // keep originals in sync so subsequent saves only send on future diffs
		         setGridRowsOrig((ros) =>
		            ros.map((r) =>
                      r.intake_number === row.intake_number
                       ? { ...row, timestamp: serverTs, Comments: commentsToSave }
                        : r
		            )
		          );
		        } catch (_e) {
		          // silently ignore fetch errors; we already updated DB
		        }
		      }
		
		
		
		
		
        // mark local clean; parent will clear its banner/dirty in onSaveAll
        setGridDirty(false);
      }
    }));
   
  // Deliverables layout consistent with master
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
  const mid = Math.ceil(deliverableList.length / 2);
  const colLeft = deliverableList.slice(0, mid);
  const colRight = deliverableList.slice(mid);

  // Map API deliverable keys <-> parent-state keys (used for syncing the current row)
  // CHANGE [ENABLE SAVE ALL]: mapping to propagate grid edits to parent deliverables for the *current* project
  const apiToParentDeliverableKey = {
    AutomationTestPlan: "testPlanLTW",
    Checklist: "qaChecklistFollowed",
    ALMupdate: "tcUpdateInALMConfluence",
    GITUpdate: "gitUpdate",
    DSR: "dsr",
    LESubmitted: "leSentToPMMonthly",
    RegressionTestLab: "masterRegUpdatedALM",
    DashboardMetric: "masterDashboardUpdated",
    ReleaseHandover: "releaseHandover",
    ProjectClosure: "projectClosureReport",
    QETransformed: "qeTransformed",
    ShiftLeft: "shiftLeftFollowed",
  };

  // Fetch lead and status rows for grid
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!intakeNumber) return;
        // 1) get current project's Automation Lead
        const res = await axios.get(`http://localhost:5000/api/projects/${intakeNumber}`);
        const lead = res?.data?.automation_qe_lead || "";
        if (!alive) return;
        setLeadName(lead);
        if (!lead) { setGridRows([]); return; }
        // 2) fetch all status rows for this automation lead
        const res2 = await axios.get(`http://localhost:5000/api/fetchprojectsstatus`, {
          params: { automation_lead: lead }
        });
        if (!alive) return;
        //setGridRows(Array.isArray(res2?.data?.projects) ? res2.data.projects : []);
		
		        const rows = Array.isArray(res2?.data?.projects) ? res2.data.projects : [];
		        setGridRows(rows);
		        setGridRowsOrig(JSON.parse(JSON.stringify(rows))); // CHANGE [TRACK ORIGINAL]
		
      } catch (e) {
        console.error("Regular Status Updates: fetch failed", e);
      }
    })();
    return () => { alive = false; };
  }, [intakeNumber]);

  
  
    // CHANGE [DIFF HELPERS]: detect if a row has changes versus its original snapshot
    const rowChanged = (row, orig) => {
      if (!orig) return true;
      if ((row.project_status || "") !== (orig.project_status || "")) return true;
      if ((row.AutomationStatus || "") !== (orig.AutomationStatus || "")) return true;
      if ((row.Comments || "") !== (orig.Comments || "")) return true;
      const d1 = row.deliverables || {};
      const d0 = orig.deliverables || {};
      const keys = [
        "AutomationTestPlan","Checklist","ALMupdate","GITUpdate","DSR",
       "LESubmitted","RegressionTestLab","DashboardMetric","ReleaseHandover",
        "ProjectClosure","QETransformed","ShiftLeft","ROIMonth"
      ];
      for (const k of keys) {
        if ((d1[k] || "") !== (d0[k] || "")) return true;
      }
      return false;
    };
  
  const dirty = useMemo(() => {
    if (!snapshot) return false;
    const now = {
      currentStatus: automationStatus.currentStatus,
      comments: automationStatus.comments,
      roiRealizedIn: deliverables.roiRealizedIn,
      projectCurrentStatus: details.projectCurrentStatus,
      // include booleans for all deliverables
      ...Object.fromEntries(deliverableList.map(([_, k]) => [k, !!deliverables[k]])),
    };
	
    const snap = {
      currentStatus: snapshot.automationStatus?.currentStatus,
      comments: snapshot.automationStatus?.comments,
      roiRealizedIn: snapshot.deliverables?.roiRealizedIn,
      projectCurrentStatus: snapshot.details?.projectCurrentStatus,
      ...Object.fromEntries(deliverableList.map(([_, k]) => [k, !!snapshot.deliverables?.[k]])),
    };
    return JSON.stringify(now) !== JSON.stringify(snap);
  }, [automationStatus, deliverables, details, snapshot]);

  
  const onSavePartial = async () => {
    setSaveErr(""); setSaveOk("");
    if (!dirty) return;
    setSaving(true);
    try {
      const updates = [];
      const pushIfChanged = (table, column, newVal, oldVal) => {
        if (String(newVal ?? "") !== String(oldVal ?? "")) {
          updates.push({ table, column, value: newVal });
        }
      };

      // c) Project Current Status (Project Details) -> projects.project_status
      pushIfChanged("projects", "project_status", details.projectCurrentStatus, snapshot?.details?.projectCurrentStatus);

      // a) Automation Status -> projects.AutomationStatus, projects.Comments
      pushIfChanged("projects", "AutomationStatus", automationStatus.currentStatus, snapshot?.automationStatus?.currentStatus);
      pushIfChanged("projects", "Comments", automationStatus.comments, snapshot?.automationStatus?.comments);

      // b) QE Deliverables -> automationdeliverables.*
      const yesNo = (b) => (b ? "YES" : "");
      const sameYN = (bNow, bOld) => String(yesNo(bNow)) === String(yesNo(bOld));
      const snapDel = snapshot?.deliverables || {};
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

      // always stamp timestamp like master tab
      const newTs = nowSQLite();
      updates.push({ table: "projects", column: "timestamp", value: newTs });

      const resp = await axios.post("http://localhost:5000/api/projectmasterupdate", {
        intake_number: intakeNumber,
        updates,
      });

      if (resp.status === 200 && resp.data?.ok) {
        setSaveOk("Saved successfully.");
      } else {
        setSaveErr(resp.data?.error || "Update failed.");
      }
    } catch (e) {
      console.error("Partial save failed", e);
      setSaveErr("Save failed. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Regular Status Updates Panel */}
      <div className={sectionWrap}>
        <div className={sectionTitle}>Regular Status Updates Panel</div>
        <div className="text-xs text-gray-600 mb-2">
          Automation Lead: <span className="font-medium">{leadName || "-"}</span>
        </div>
        {/* Excel-style grid: 4 columns */}
        <div className="overflow-auto">
          <table className="min-w-full table-fixed border border-gray-300">
            <thead>
              <tr className="bg-gray-50 text-sm">
                <th className="border-b border-gray-300 p-2 w-1/4 text-left">Project Current Status</th>
                <th className="border-b border-gray-300 p-2 w-1/4 text-left">Current Automation Status</th>
                <th className="border-b border-gray-300 p-2 w-1/4 text-left">Comments</th>
                <th className="border-b border-gray-300 p-2 w-1/4 text-left">QE Deliverables</th>
              </tr>
            </thead>
            <tbody>
              {gridRows.map((row) => (
                <tr key={row.intake_number} className="align-top">
                  {/* Col 1: Project Current Status dropdown */}
                <td className="border-t border-gray-200 p-2">
                  {/* ==== [CHANGE #1] Show BOTH intake_name and intake_number ==== */}
                  <div className="text-xs mb-1 text-gray-500">
                    <span className="font-medium">{row.intake_name || "-"}</span>
                    <span className="ml-2 text-[11px] text-gray-500">({row.intake_number || "-"})</span>
                  </div>
					
					 <select
                      className={selectCls}
                      value={row.project_status || ""}
                      onChange={(e) =>
                        setGridRows((rs) =>
                          rs.map((r) =>
                            r.intake_number === row.intake_number
                              ? (() => {
                                  const updated = { ...r, project_status: e.target.value };
								  setGridDirty(true); onGridDirty && onGridDirty();
                                  // CHANGE [ENABLE SAVE ALL]: also sync parent state for the *current* project
                                  if (row.intake_number === intakeNumber) {
                                    setDetails((s) => ({ ...s, projectCurrentStatus: e.target.value }));
                                  }
                                  return updated;
                                })()
                              : r
                          )
                        )
                      }
                    >
					
					
					
                      <option value="">-- Select --</option>
                      {projectStatusOptions.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </td>

                  {/* Col 2: Current Automation Status dropdown */}
                  <td className="border-t border-gray-200 p-2">
                   
				  
				   <select
                      className={selectCls}
                      value={row.AutomationStatus || ""}
                      onChange={(e) =>
                        setGridRows((rs) =>
                          rs.map((r) =>
                            r.intake_number === row.intake_number
                              ? (() => {
                                  const updated = { ...r, AutomationStatus: e.target.value };
								  setGridDirty(true); onGridDirty && onGridDirty();
                                  // CHANGE [ENABLE SAVE ALL]: also sync parent state for the *current* project
                                  if (row.intake_number === intakeNumber) {
                                    setAutomationStatus((s) => ({ ...s, currentStatus: e.target.value }));
                                  }
                                  return updated;
                                })()
                              : r
                          )
                        )
                      }
                    >
                      <option value="">-- Select --</option>
                      {automationStatusOptions.map((o) => (
                        <option key={o.label} value={o.label} disabled={!!o.disabled}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Last update: {row.timestamp || "-"}
                    </div>
                  </td>

                  {/* Col 3: Comments */}
                  <td className="border-t border-gray-200 p-2">
                    <textarea
                      className={areaCls}
                      rows={3}
                      value={row.Comments || ""}
                      onChange={(e) =>
                        setGridRows((rs) =>
                          rs.map((r) =>
                            r.intake_number === row.intake_number
                              ? (() => {
                                  const updated = { ...r, Comments: e.target.value };
								  setGridDirty(true); onGridDirty && onGridDirty();
								  
                                  // CHANGE [ENABLE SAVE ALL]: also sync parent state for the *current* project
                                  if (row.intake_number === intakeNumber) {
                                    setAutomationStatus((s) => ({ ...s, comments: e.target.value }));
                                  }
                                  return updated;
                                })()
                              : r
                          )
                        )
                      }
                    />
                  </td>

                  {/* Col 4: QE Deliverables */}
                                  <td className="border-t border-gray-200 p-2">
                  
                                    <div className="flex flex-col text-xs gap-1 pr-2">
                      {[
                        ["Automation Test Plan", "AutomationTestPlan"],
                        ["QA Checklist", "Checklist"],
                        ["ALM Update", "ALMupdate"],
                        ["GIT Update", "GITUpdate"],
                        ["DSR", "DSR"],
                        ["LE Submitted", "LESubmitted"],
                        ["Regression Lab", "RegressionTestLab"],
                        ["Dashboard Metric", "DashboardMetric"],
                        ["Release Handover", "ReleaseHandover"],
                        ["Project Closure", "ProjectClosure"],
                        ["QE Transformed", "QETransformed"],
                        ["Shift Left", "ShiftLeft"],
                      ].map(([label, key]) => (
                        <label key={key} className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={!!row?.deliverables?.[key]}
                            onChange={(e) =>
                              setGridRows((rs) =>
                                rs.map((r) =>
                                  r.intake_number === row.intake_number
                                    ? (() => {
                                        const updated = {
                                          ...r,
                                          deliverables: {
                                            ...(r.deliverables || {}),
                                            [key]: e.target.checked ? "YES" : ""
                                          }
                                        };
										setGridDirty(true); onGridDirty && onGridDirty();
                                        // CHANGE [ENABLE SAVE ALL]: also sync parent *deliverables* for the current project
                                        if (row.intake_number === intakeNumber) {
                                          const parentKey = apiToParentDeliverableKey[key];
                                          if (parentKey) {
                                            setDeliverables((s) => ({ ...s, [parentKey]: e.target.checked }));
                                          }
                                        }
                                        return updated;
                                      })()
                                    : r
                                )
                              )
                            }
                          />
                          <span>{label}</span>
                        </label>
                         
         


                                          ))}
                    {/* ==== [CHANGE #3] Show ROI Month checkbox (read-only) ==== */}
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        disabled
                        checked={!!row?.deliverables?.ROIMonth}
                        onChange={() => {}}
                      />
                      <span>ROI Month</span>
                   </label>
                  </div>
                  {/* keep ROI Month value line (unchanged logic) */}
                  <div className="text-[11px] text-gray-600 mt-2">
                    ROI Month: {row?.deliverables?.ROIMonth || "-"}
                  </div>
                  </td>
                </tr>
              ))}
              {!gridRows.length && (
                <tr>
                  <td colSpan={4} className="border-t border-gray-200 p-3 text-sm text-gray-500">
                    No projects found for this Automation Lead.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}
)