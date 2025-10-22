// src/components/ROI/tabs/SummaryTab.js
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import "../../../styles/roiTabs.css";
import "../../../styles/RecordEntry.css";

/**
 * Tab1 (Summary) from TabsUI.xlsx
 * - Project Details (yellow section; blue values pulled from projectDetails)
 * - Test Case / Deals Count matrix with Category/Description columns
 *   and execution columns (green headers); orange cells are computed totals.
 * Note: The “UFT” cross-tab references in the Excel point to Tab2; once
 * real aggregation is wired we can pull values via backend. For now, this
 * tab computes within its own state using the same formulas.
 */
export default function SummaryTab() {
  const { intakeNumber, projectDetails } = useOutletContext();

  // Project details (light blue)
  const [details, setDetails] = useState({
    projectNumberAndName: "",
    releaseName: "",
    applicationsImpacted: "",
    automationLeadName: "",
  });

  // Grid rows under “Test Case / Deals Count”
  // We mirror the visible rows in the sheet (Category + Description)
  const [matrixRows, setMatrixRows] = useState([
    { category: "TDM", description: "Class TDM" },
    { category: "", description: "mmtg TDM" },
    { category: "Automation", description: "ConformIQ - Robot" },
    { category: "", description: "Standalone Robot" },
    { category: "", description: "UFT" },
    { category: "", description: "Java" },
    { category: "", description: "SOA" },
  ]);

  // Execution columns: Test Design, DIT Execution, SIT 1, SIT 2, SIT 3, E2E, UAT 1, UAT 2
  const executionCols = [
    "Test Design",
    "DIT Execution",
    "SIT 1 Execution",
    "SIT 2 Execution",
    "SIT 3 Execution",
    "E2E Execution",
    "UAT 1 Execution",
    "UAT 2 Execution",
  ];

  // For simplicity, hold orange totals as zeros now (these would sum per Tab2 later)
  const [matrixVals, setMatrixVals] = useState(
    matrixRows.map(() =>
      executionCols.reduce((acc, key) => ({ ...acc, [key]: 0 }), {})
    )
  );

  useEffect(() => {
    setDetails({
      projectNumberAndName: projectDetails
        ? `${projectDetails.intake_number} - ${projectDetails.intake_name}`
        : "",
      releaseName: projectDetails?.release || "",
      applicationsImpacted: "", // blue -> fetched later
      automationLeadName: projectDetails?.automation_qe_lead || "",
    });
  }, [projectDetails]);

  return (
    <div className="tab-wrap">
      {/* Yellow section: Project Details */}
      <div className="tab-section tab-section-yellow">Project Details</div>
      <div className="grid-2">
        <label className="tab-label tab-label-green">Project Number and Name</label>
        <input className="tab-input tab-input-blue" value={details.projectNumberAndName} disabled />

        <label className="tab-label tab-label-green">Release Name</label>
        <input className="tab-input tab-input-blue" value={details.releaseName} disabled />

        <label className="tab-label tab-label-green">Applications Impacted</label>
        <input className="tab-input tab-input-blue" value={details.applicationsImpacted} placeholder="Auto (DB)" disabled />

        <label className="tab-label tab-label-green">Automation Lead Name</label>
        <input className="tab-input tab-input-blue" value={details.automationLeadName} disabled />
      </div>

      {/* Yellow section: Test Case / Deals Count */}
      <div className="tab-section tab-section-yellow">Test Case / Deals Count</div>

      {/* Header row (green labels) */}
      <div className="grid-10 tab-matrix-header">
        <div className="tab-label tab-label-green">Category</div>
        <div className="tab-label tab-label-green">Description</div>
        {executionCols.map((h) => (
          <div key={h} className="tab-label tab-label-green">
            {h}
          </div>
        ))}
      </div>

      {/* Data rows (orange = computed, uneditable) */}
      {matrixRows.map((r, idx) => (
        <div key={idx} className="grid-10 tab-matrix-row">
          <div className="tab-cell">{r.category}</div>
          <div className="tab-cell">{r.description}</div>
          {executionCols.map((h) => (
            <input
              key={h}
              className="tab-input tab-input-orange"
              value={matrixVals[idx][h]}
              disabled
            />
          ))}
        </div>
      ))}
    </div>
  );
}


