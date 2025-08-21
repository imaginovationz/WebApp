import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

// Benchmarks text based on Savings Category
const benchmarks = {
  mmtgDealexecution: "Infra benchmark guidelines: Infra automation usually targets server provisioning, cloud infra, etc.",
  savvyDealexecution: "License benchmark guidelines: License cost optimization benchmarks go here.",
  TestCaseCreation: "Productivity benchmark guidelines: Productivity automation benchmarks, e.g. CI/CD pipelines, dashboards.",
  TestCaseExecution: "Productivity benchmark guidelines: Productivity automation benchmarks, e.g. CI/CD pipelines, dashboards."
};


const deleteRow = (index) => {
  const newRows = [...rows];
  newRows.splice(index, 1);
  setRows(newRows);
};


const ProjectLeadROIEntry = () => {
  const { intakeNumber } = useParams();
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
  const [projectDetails, setProjectDetails] = useState(null);
  const [popupText, setPopupText] = useState("");

  // Fetch ProjectName and AutomationLead from DB
  useEffect(() => {
    if (intakeNumber) {
      axios
        .get(`http://localhost:5000/api/projects/${intakeNumber}`)
        .then((res) => {
          setProjectDetails(res.data);
          setRows((prev) =>
            prev.map((row) => ({
              ...row,
              ProjectName: res.data.ProjectName,
              AutomationLead: res.data.AutomationLead,
            }))
          );
        })
        .catch((err) => console.error("Error fetching project details", err));
    }
  }, [intakeNumber]);

  // Formula calculations
  const calculateFormulas = (row) => {
    const manualPD =
      parseInt(row.TotalTCsCount || 0) * parseInt(row.ManualTCsPD || 0);
    const manualCost = manualPD * 100; // Example multiplier
    const automatedPD =
      parseInt(row.AutomatedTCCreatedPD || 0) *
      parseInt(row.NumberofCycles || 0);
    const automationCost = automatedPD * 50; // Example multiplier
    const savings = manualCost - automationCost;

    return {
      TotalManualPD: manualPD,
      TotalManualCost: manualCost,
      TotalAutomatedPD: automatedPD,
      TotalAutomationCost: automationCost,
      Savings: savings,
    };
  };

  // Handle input change
  const handleChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;

    // Recalculate formulas
    const formulas = calculateFormulas(newRows[index]);
    newRows[index] = { ...newRows[index], ...formulas };

    setRows(newRows);
  };

  // Fetch TC Count from ALM
  const fetchFromALM = async (index) => {
    try {
      const res = await axios.get("http://localhost:5000/api/fetch_tc_count");
      const count = res.data.count || 0;
      const newRows = [...rows];
      newRows[index].TotalTCsCount = count;
      setRows(newRows);
    } catch (err) {
      alert("Failed to fetch from ALM");
    }
  };

  // Show benchmark popup
  const showBenchmark = (category) => {
     const msg =
       benchmarks[category] || "No benchmark available for this category";
     window.alert(msg);
   };

  // Add new row
  const addRow = () => {
    setRows([
      ...rows,
      {
        Release: "",
        ROIMonth: "",
        ProjectName: projectDetails?.ProjectName || "",
        AutomationLead: projectDetails?.AutomationLead || "",
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
  };

  // Save rows to backend
  const saveRows = () => {
    const payload = {
      entries: rows.map((row) => ({
        intake_number: intakeNumber,
        ...row,
      })),
    };

    axios
      .post("http://localhost:5000/api/projectroientry", payload)
      .then(() => alert("Entries saved successfully"))
      .catch(() => alert("Error saving entries"));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Project ROI Entry</h2>

      {rows.map((row, index) => (
        <div
          key={index}
          className="relative mb-8 p-6 rounded-xl shadow-md bg-white grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Delete button for newly added rows (not the first one) */}
          {index > 0 && (
            <button
              onClick={() => deleteRow(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold"
              title="Delete Row"
            >
              ✕
            </button>
          )}

          {/* Section 1: Project Details (only in first row) */}
          {index === 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Project Details</h3>
              <div className="flex items-center gap-2">
                <label className="w-32 text-gray-600">Release:</label>
                <input
                  type="text"
                  value={row.Release}
                  onChange={(e) => handleChange(index, "Release", e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-gray-600">ROI Month:</label>
                <input
                  type="text"
                  value={row.ROIMonth}
                  onChange={(e) => handleChange(index, "ROIMonth", e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-gray-600">Project Name:</label>
                <input type="text" value={row.ProjectName} disabled className="flex-1 border rounded-md px-3 py-2 bg-gray-100" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-gray-600">Automation Lead:</label>
                <input type="text" value={row.AutomationLead} disabled className="flex-1 border rounded-md px-3 py-2 bg-gray-100" />
              </div>
            </div>
          )}

          {/* Section 2: ROI Entry */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">ROI Entry</h3>
            <div className="flex items-center gap-2">
              <label className="w-32 text-gray-600">Savings Category:</label>
              <select
                value={row.SavingsCategory}
                onChange={(e) => handleChange(index, "SavingsCategory", e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Savings Category</option>
                <option value="mmtgDealexecution">mmtg Deal execution</option>
                <option value="savvyDealexecution">savvy Deal execution</option>
                <option value="TestCaseCreation">Test Case Creation</option>
                <option value="TestCaseExecution">Test Case Execution</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-32 text-gray-600">
                {row.SavingsCategory ? `Total ${row.SavingsCategory} Count:` : "Total TCs Count:"}
              </label>
              <input
                type="number"
                value={row.TotalTCsCount}
                onChange={(e) => handleChange(index, "TotalTCsCount", e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={() => fetchFromALM(index)}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                Fetch from ALM
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-32 text-gray-600">Manual TCs PD:</label>
              <input
                type="number"
                value={row.ManualTCsPD}
                onChange={(e) => handleChange(index, "ManualTCsPD", e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-32 text-gray-600">Automated TC Created PD:</label>
              <input
                type="number"
                value={row.AutomatedTCCreatedPD}
                onChange={(e) => handleChange(index, "AutomatedTCCreatedPD", e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={() => showBenchmark(row.SavingsCategory)}
                className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition"
              >
                Refer Benchmark
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-32 text-gray-600">Number of Cycles:</label>
              <input
                type="number"
                value={row.NumberofCycles}
                onChange={(e) => handleChange(index, "NumberofCycles", e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Section 3: ROI Calculations */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">ROI Calculations</h3>
            {[
              { label: "Total Manual PD", value: row.TotalManualPD },
              { label: "Total Manual Cost", value: row.TotalManualCost },
              { label: "Total Automated PD", value: row.TotalAutomatedPD },
              { label: "Total Automation Cost", value: row.TotalAutomationCost },
              { label: "Savings", value: row.Savings },
            ].map((item, idx) => (
              <div className="flex items-center gap-2" key={idx}>
                <label className="w-32 text-gray-600">{item.label}:</label>
                <input type="number" value={item.value} disabled className="flex-1 border rounded-md px-3 py-2 bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Action buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={addRow}
          className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          Add Row
        </button>
        <button
          onClick={saveRows}
          className="px-5 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
        >
          Save
        </button>
      </div>

      {/* Popup for benchmarks */}
      {popupText && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-xl shadow-lg w-11/12 md:w-1/3">
            <p className="mb-4 text-gray-700">{popupText}</p>
            <button
              onClick={() => setPopupText("")}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  
  
  };



export default ProjectLeadROIEntry;
