import React, { useState, useEffect } from 'react';
//import PptxGenJS from 'pptxgenjs'; //to download data as ppt
//import * as XLSX from 'xlsx'; // to download as excel
//import React, { useState, useEffect } from 'react';

const ProjectROI = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [roiData, setRoiData] = useState(null);
  const [message, setMessage] = useState("");

  // Fetch list of projects for dropdown
  useEffect(() => {
    fetch("http://localhost:5000/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  
  const handleGoClick = async () => {
    if (!selectedProject) return;
    const res = await fetch(`http://localhost:5000/api/projectroi/${selectedProject}`);
    const data = await res.json();
    setRoiData(data[0] || {}); // Assuming single record per project
  };

  const handleChange = (e, field) => {
    setRoiData({ ...roiData, [field]: e.target.value });
  };

  const handleSave = async () => {
    const res = await fetch("http://localhost:5000/api/projectroiupdate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roiData),
    });
    const result = await res.json();
    setMessage(result.message || "Error updating");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Project ROI</h2>

      {/* Step 1: Dropdown */}
      <select onChange={(e) => setSelectedProject(e.target.value)}>
        <option value="">--Select a project--</option>
        {projects.map((proj) => (
          <option key={proj.intake_number} value={proj.intake_number}>
            {proj.intake_number} - {proj.intake_name}
          </option>
        ))}
      </select>

      <button onClick={handleGoClick} style={{ marginLeft: "1rem" }}>
        Go
      </button>

      {/* Step 3: Editable Grid */}
      {roiData && (
        <div style={{ marginTop: "2rem" }}>
          <table border="1" cellPadding="8">
            <tbody>
              <tr>
                <td>Project</td>
                <td><input type="text" value={roiData.Project || ""} disabled /></td>
              </tr>
              <tr>
                <td>FY</td>
                <td>
                  <select value={roiData.FY || ""} onChange={(e) => handleChange(e, "FY")}>
                    <option value="FY2025">FY2025</option>
                    <option value="FY2026">FY2026</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>ROI Reporting Qr</td>
                <td>
                  <select value={roiData.ROIReportingQr || ""} onChange={(e) => handleChange(e, "ROIReportingQr")}>
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="Q3">Q3</option>
                    <option value="Q4">Q4</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>ROI Reporting Month</td>
                <td>
                  <select value={roiData.ROIReportingMonth || ""} onChange={(e) => handleChange(e, "ROIReportingMonth")}>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td>Portfolio</td>
                <td><input type="text" value={roiData.Portfolio || ""} disabled /></td>
              </tr>
              <tr>
                <td>Application</td>
                <td>
                  <select value={roiData.Application || ""} onChange={(e) => handleChange(e, "Application")}>
                    <option value="Class">Class</option>
                    <option value="LCMS">LCMS</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>$</td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={roiData.Amount || ""}
                    onChange={(e) => handleChange(e, "Amount")}
                  />
                </td>
              </tr>
              <tr>
                <td>Automation Framework</td>
                <td>
                  <select value={roiData.AutomationFramework || ""} onChange={(e) => handleChange(e, "AutomationFramework")}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Transformation Initiative</td>
                <td><input type="text" value={roiData.TransformationInitiative || ""} onChange={(e) => handleChange(e, "TransformationInitiative")} /></td>
              </tr>
              <tr>
                <td>FP</td>
                <td><input type="text" value={roiData.FP || ""} disabled /></td>
              </tr>
              <tr>
                <td>Deal Count</td>
                <td><input type="number" value={roiData.DealCount || ""} onChange={(e) => handleChange(e, "DealCount")} /></td>
              </tr>
              <tr>
                <td>Test case Design</td>
                <td><input type="number" value={roiData.TestCaseDesign || ""} onChange={(e) => handleChange(e, "TestCaseDesign")} /></td>
              </tr>
              <tr>
                <td>Test Updated</td>
                <td><input type="number" value={roiData.TestUpdated || ""} onChange={(e) => handleChange(e, "TestUpdated")} /></td>
              </tr>
              <tr>
                <td>Test case Executed</td>
                <td><input type="number" value={roiData.TestCaseExecuted || ""} onChange={(e) => handleChange(e, "TestCaseExecuted")} /></td>
              </tr>
              <tr>
                <td>ROI Sheet</td>
                <td><input type="text" value={roiData.ROISheet || ""} onChange={(e) => handleChange(e, "ROISheet")} /></td>
              </tr>
              <tr>
                <td>Lead</td>
                <td><input type="text" value={roiData.Lead || ""} disabled /></td>
              </tr>
              <tr>
                <td>Comment</td>
                <td><input type="text" value={roiData.Comment || ""} onChange={(e) => handleChange(e, "Comment")} /></td>
              </tr>
            </tbody>
          </table>

          <button onClick={handleSave} style={{ marginTop: "1rem" }}>
            Save
          </button>
          {message && <p style={{ color: "green" }}>{message}</p>}
        </div>
      )}
    </div>
  );
};

export default ProjectROI;
