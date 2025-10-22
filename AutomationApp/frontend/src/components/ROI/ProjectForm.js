// src/components/.../ProjectForm.js

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
// (kept as-is per your note)
import "../../styles/RecordEntry.css";
import "../../styles/roiTabs.css";


function nowSQLite() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// CHANGE: helper to generate YYYY-MM-DD for intake_entry_date
function todayISODate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === `"`) {
        if (text[i + 1] === `"`) {
          field += `"`; // escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === `"`) {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(field);
        field = "";
      } else if (ch === "\n") {
        cur.push(field);
        field = "";
        if (cur.length > 1 || (cur.length === 1 && cur[0] !== "")) rows.push(cur);
        cur = [];
      } else if (ch === "\r") {
        // ignore \r
      } else {
        field += ch;
      }
    }
  }
  if (field.length || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

const normalizeHeader = (s) =>
  (s || "").toString().trim().replace(/\*/g, "").replace(/:/g, "").toLowerCase();

const EXPECTED_HEADERS = [
  "intake number",
  "intake name",
  "qa assignee",
  "manager",
  "pat assignee",
  "status/eta",
];

const CSV_TO_DB = {
  "intake number": { table: "projects", column: "intake_number" },
  "intake name":   { table: "projects", column: "intake_name"   },
  "qa assignee":   { table: "projects", column: "FuncSME"       },
  "manager":       { table: "projects", column: "QAManager"     },
  "pat assignee":  { table: "projects", column: "PATAssignee"   },
  "status/eta":    { table: "projects", column: "AutoEstimateDueDate" },
};

const ProjectForm = () => {
  const [form, setForm] = useState({
    intake_number: "",
    intake_name: "",
    qa_assignee: "",
    manager: "",
    automation_qe_lead: "",
    pat_assignee: "",
    status_eta: "",
  });

  const [csvFile, setCsvFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  // CHANGE: add per-row notes state so existing “exists” message logic renders
  const [rowNotes, setRowNotes] = useState({}); // { [rowIndex]: string }
  const [estMissing, setEstMissing] = useState({}); // { [rowIndex]: true }
  
  const [resources, setResources] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/resourcefetch");
        const list =
          Array.isArray(res.data?.resources) ? res.data.resources :
          Array.isArray(res.data) ? res.data : [];
        setResources(list);
      } catch (e) {
        console.error("Failed to fetch resources", e);
      }
    })();
  }, []);

  const onChangeField = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // CHANGE [AUTO-PARSE ON FILE SELECT]: immediately parse after a file is chosen
  const parseAndSetFromFile = async (file) => {
    setMessage("");
    if (!file) {
      setRows([]);
      return;
    }
    const text = await file.text();
    const raw = parseCSV(text);
    if (!raw.length) {
      setRows([]);
      setMessage("CSV appears empty.");
      return;
    }

    const header = raw[0].map(normalizeHeader);
    const body = raw.slice(1);

    const idx = {};
    EXPECTED_HEADERS.forEach((key) => {
      const i = header.findIndex((h) => h === key);
      idx[key] = i >= 0 ? i : -1;
    });

    const missing = Object.entries(idx)
      .filter(([_, i]) => i === -1)
      .map(([k]) => k);
    if (missing.length) {
      setMessage(`Missing expected columns in CSV: ${missing.join(", ")}`);
      // still proceed with available columns
    }

    const parsed = body
      .map((arr) => {
        const get = (key) => {
          const i = idx[key];
          return i >= 0 ? (arr[i] || "").trim() : "";
        };
        const record = {
          intake_number: get("intake number"),
          intake_name: get("intake name"),
          qa_assignee: get("qa assignee"),
          manager: get("manager"),
          pat_assignee: get("pat assignee"),
          status_eta: get("status/eta"),
          estimate_assigned_to: "",
        };
        const nonEmpty = Object.values(record).some((v) => String(v).length);
        return nonEmpty ? record : null;
      })
      .filter(Boolean);

    setRows(parsed);
    setMessage(parsed.length ? "CSV Parsed below" : "No valid data rows found in CSV.");
  };

  // [AUTO-PARSE ON FILE SELECT]: call parse as soon as a file is picked
  const onPickCSV = (e) => {
    const f = e.target?.files?.[0] || null;
    setCsvFile(f);
    if (f) {
      // auto-parse and show in grid immediately
      parseAndSetFromFile(f);
    } else {
      setRows([]);
      setMessage("");
    }
  };

  // (kept for compatibility; still calls the same helper)
  const onParseCSV = async () => {
    if (!csvFile) return;
    await parseAndSetFromFile(csvFile);
  };

  const onUpload = async () => {
    if (!rows.length) {
      setMessage("Nothing to upload. Please select a CSV first.");
      return;
    }
	
	  // CHANGE: if any row is missing "Estimate Assigned to", block upload and mark them
	  const missing = {};
	  rows.forEach((r, i) => {
	    if (!((r.estimate_assigned_to || "").trim())) missing[i] = true;
	  });
	  if (Object.keys(missing).length) {
	    setEstMissing(missing);
	    setMessage("Please select 'Estimate Assigned to' for all rows.");
	    return;
	  }
	
	

    setUploading(true);
    setMessage("");

	
	
    try {
		      const emailGroups = {};
			  for (let i = 0; i < rows.length; i++) {
		        const row = rows[i];
		        const intakeNum = (row.intake_number || "").trim();
		        const intakeName = (row.intake_name || "").trim();
		        if (!intakeNum) continue;
		
		        //  if project already exists, skip insert and show per-row message
		       try {
		          const exists = await axios.get(`http://localhost:5000/api/projects/${encodeURIComponent(intakeNum)}`);
		          if (exists && exists.status === 200) {
		            setRowNotes((m) => ({ ...m, [i]: "Project Already Exists, Update via Project Status Tab" }));
		            continue; // do not insert/update this one
		          }
		        } catch (err) {
		          // 404 = not found -> proceed; any other error continues to insert attempt
		          if (err?.response?.status !== 404) {
		            // network/other errors: proceed to try insert, but no note
		          }
		        }

		
		
        const updates = [];
        Object.entries(CSV_TO_DB).forEach(([key, cfg]) => {
          const v =
            key === "intake number" ? intakeNum :
            key === "intake name"   ? intakeName :
            key === "qa assignee"   ? row.qa_assignee :
            key === "manager"       ? row.manager :
            key === "pat assignee"  ? row.pat_assignee :
            key === "status/eta"    ? row.status_eta : "";
          updates.push({ table: cfg.table, column: cfg.column, value: v });
		  
        });
		
		        //  persist "Estimate Assigned to" -> projects.EstimateAssignedTo
		        updates.push({
		          table: "projects",
		          column: "EstimateAssignedTo",
		          value: (row.estimate_assigned_to || "").trim()
		        });
		        //  persist current date to projects.intake_entry_date
		        updates.push({
		          table: "projects",
		          column: "intake_entry_date",
		          value: todayISODate()
		        });
		
        updates.push({ table: "projects", column: "AutoEstimateStatus", value: "Assigned For Estimation" });
        //default values for domain/application as before, so that project call dont break.

        updates.push({ table: "projects", column: "domain", value: "Lending" });
        updates.push({ table: "projects", column: "application", value: "LCMS" });
        updates.push({ table: "projects", column: "timestamp", value: nowSQLite() });

        await axios.post("http://localhost:5000/api/projectmasterupdate", {
          intake_number: intakeNum,
          updates,
        });
		
		
		
		
		        // after DB insert, send email notification to the selected lead
				        try {
				          const leadName = (row.estimate_assigned_to || "").trim();
				          if (leadName) {
				            const r = await axios.get(`http://localhost:5000/api/resourcefetch`, { params: { name: leadName } });
				            const toEmail = r?.data?.email || "";
				            if (toEmail) {
				             if (!emailGroups[toEmail]) emailGroups[toEmail] = { leadName, rows: [] };
				              emailGroups[toEmail].rows.push({
				                intakeNum,
				                intakeName,
				                qa: row.qa_assignee || "",
				               manager: row.manager || "",
				                pat: row.pat_assignee || "",
				                status: row.status_eta || "",
				              });
				           }
				          }
				        } catch (e) {
				          console.warn("Email grouping failed for", row.estimate_assigned_to, e);
				        }
				      }
				
					  
					
				      // send one combined email per recipient with all their assigned rows
				      try {
				        const entries = Object.entries(emailGroups);
				        for (const [toEmail, group] of entries) {
				          const subject = `New Estimates is assigned to you : ${group.leadName}`;
				          const rowsHtml = group.rows.map(r => `
				           <tr>
				              <td>${r.intakeNum}</td>
				              <td>${r.intakeName}</td>
				              <td>${r.qa}</td>
				             <td>${r.manager}</td>
				              <td>${r.pat}</td>
				             <td>${r.status}</td>
				              <td>${group.leadName}</td>
				            </tr>`).join("");
				          const html = `
				            <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px">
				              <p>Hi ${group.leadName},</p>
				              <p>New estimate(s) have been assigned to you. Details below:</p>
				             <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
				                <thead>
				                  <tr>
				                    <th>Intake Number</th>
				                   <th>Intake Name</th>
				                    <th>QA Assignee</th>
				                    <th>Manager</th>
				                    <th>PAT Assignee</th>
				                    <th>Due Date</th>
				                   <th>Estimate Assigned to</th>
				                  </tr>
				                </thead>
				               <tbody>${rowsHtml}</tbody>
				              </table>
				              <p style="margin-top:10px;">Thanks.</p>
				            </div>`;
				          await axios.post("http://localhost:5000/api/send_intake_email", {
				            to: toEmail,
				            subject,
				           html
				          });
				        }
				      } catch (e) {
				        console.warn("Bulk email send failed", e);
		
      }
      setMessage(`Uploaded ${rows.length} intake(s) successfully.`);
    } catch (e) {
      console.error("Bulk upload failed", e);
      setMessage("Upload failed. Check console/network logs.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-page">
      <h2>Intake Entry</h2>

      <div className="section">
        <div className="form-row form-type-row" style={{ justifyContent: "space-between" }}>
          <button type="button" onClick={() => document.getElementById("csvPicker").click()}>
            Bulk Upload & Parse Intakes [CSV Format]
          </button>

          <a
              href="/files/IntakeUpload.csv"
              download
              style={{ fontSize: 12, textDecoration: "underline", cursor: "pointer" }}
            >
              Download CSV Template
            </a>
            
          <input
            id="csvPicker"
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={onPickCSV}  /* CHANGE: triggers immediate parse */
          />
          <div style={{ display: "flex", gap: 8 }}>
            {/* kept for compatibility; auto-parse already happens on file select */}

            {/* stays enabled on file select, as before */}
            
			            <button
			              type="button"
			              onClick={onUpload}
			              // CHANGE [REQUIRED]: block upload until all rows have Estimate Assigned to
			              disabled={
			                !rows.length ||
			                uploading ||
			                rows.some(r => !((r.estimate_assigned_to || "").trim()))
			              }
			              title={
			                rows.some(r => !((r.estimate_assigned_to || "").trim()))
			                  ? "Select 'Estimate Assigned to' for all rows"
			                  : ""
			              }
			            >
              
			
			
			{uploading ? "Assigning & Sending..." : "Assign and Send email notification"}
            </button>
			
			
          </div>
        </div>

        {message && (
          <div className="error-message" style={{ color: message.includes("failed") ? "#c00" : "#064" }}>
            {message}
          </div>
        )}

        <div className="section" style={{ overflowX: "auto" }}>
          <table className="min-w-full table-fixed" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>*Intake Number:</th>
                <th style={{ textAlign: "left", padding: 8 }}>*Intake Name:</th>
                <th style={{ textAlign: "left", padding: 8 }}>QA Assignee</th>
                <th style={{ textAlign: "left", padding: 8 }}>Manager</th>
                <th style={{ textAlign: "left", padding: 8 }}>PAT Assignee</th>
                <th style={{ textAlign: "left", padding: 8 }}>Due Date</th>
                <th style={{ textAlign: "left", padding: 8 }}>Estimate Assigned to (*)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r, i) => (
                  <React.Fragment key={`${r.intake_number}-${i}`}>
				  <tr >
                    <td style={{ padding: 8 }}>
                      <input
                        type="text"
                        value={r.intake_number}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((x, ix) => (ix === i ? { ...x, intake_number: e.target.value } : x))
                          )
                        }
                      />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input
                        type="text"
                        value={r.intake_name}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((x, ix) => (ix === i ? { ...x, intake_name: e.target.value } : x))
                          )
                        }
                      />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input
                        type="text"
                        value={r.qa_assignee}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((x, ix) => (ix === i ? { ...x, qa_assignee: e.target.value } : x))
                          )
                        }
                      />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input
                        type="text"
                        value={r.manager}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((x, ix) => (ix === i ? { ...x, manager: e.target.value } : x))
                          )
                        }
                      />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input
                        type="text"
                        value={r.pat_assignee}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((x, ix) => (ix === i ? { ...x, pat_assignee: e.target.value } : x))
                          )
                        }
                      />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input
                        type="text"
                        value={r.status_eta}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((x, ix) => (ix === i ? { ...x, status_eta: e.target.value } : x))
                          )
                        }
                      />
                    </td>
                    <td style={{ padding: 8 }}>
                      <select
                        value={r.estimate_assigned_to || ""}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((x, ix) => (ix === i ? 
								{ ...x, estimate_assigned_to: e.target.value } : x
							))
                          )
						  
						  
						  
						  
                        }
						
                      >
                        <option value="">-- Select --</option>
                        {resources.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
				  
				                    {/* CHANGE: show per-row "exists" note directly below that intake */}
				                    {rowNotes[i] && (
				                      <tr>
				                        <td colSpan={7} style={{ padding: 6, color: "#9a3412", fontSize: 12 }}>
				                          {rowNotes[i]}
				                        </td>
				                      </tr>
				                    )}
				                    </React.Fragment>
				  
				  
				  
				  
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: 12, color: "#555" }}>
                    No rows parsed yet. Choose a CSV and click <strong>Parse CSV</strong>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
