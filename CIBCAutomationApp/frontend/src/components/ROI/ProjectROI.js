import React, { useState, useEffect } from 'react';
// CHANGED: import navigate to jump to entry page
//import { useNavigate } from 'react-router-dom'; // CHANGED
import "../../styles/roiTabs.css";
import "../../styles/RecordEntry.css";
//import { useHistory } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function ProjectROI() {
  // NOTE: Keeping your existing state usage the same
  // (You can fold this file into your existing styling/layout as-is)

  // ---- Project search (AJAX) ----
  const [projectSearch, setProjectSearch] = useState('');
  const [projectOptions, setProjectOptions] = useState([]);
  const [ajaxTimer, setAjaxTimer] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');

  //const navigate = useNavigate(); // CHANGED
  //const navigate = useHistory();
const navigate =  useNavigate();

  // ---- (Optional) Initiatives state kept if you were using it elsewhere on this page ----
  const [initiatives, setInitiatives] = useState([]);

  // Example: if you had been loading initiatives here
  useEffect(() => {
    // (kept as placeholder; no change in logic)
    // fetch('http://localhost:5000/api/initiatives')
    //   .then(r => r.json())
    //   .then(setInitiatives)
    //   .catch(() => {});
  }, []);

  // Debounced AJAX search to `/api/projects/search?query=...`
  useEffect(() => {
    if (ajaxTimer) clearTimeout(ajaxTimer);
    const t = setTimeout(() => {
      const q = projectSearch?.trim();
      if (!q) {
        setProjectOptions([]);
        return;
      }
      fetch(`http://localhost:5000/api/projects/search?query=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(list => {
          // Expecting: [{ intake_number, intake_name }, ...]
          setProjectOptions(Array.isArray(list) ? list : []);
        })
        .catch(() => setProjectOptions([]));
    }, 350);
    setAjaxTimer(t);
    return () => clearTimeout(t);
  }, [projectSearch]);

  const handleGoClick = () => {
    // CHANGED: navigate to the Project Lead Entry page instead of loading details here
    if (!selectedProject) return; // CHANGED
    navigate(`/ROI/ProjectLeadROIEntry/${selectedProject}`); // CHANGED
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Project ROI</h2>

      <div className="mb-4">
        <label className="block text-sm mb-1">Search Project by Intake Number or Name</label>
        <input
          type="text"
          value={projectSearch}
          onChange={(e) => setProjectSearch(e.target.value)}
          placeholder="Type to search..."
          className="border rounded px-3 py-2 w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Select a Project</label>
        <select
          className="border rounded px-3 py-2 w-full"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">-- Choose --</option>
          {projectOptions.map((p) => (
            <option key={p.intake_number} value={p.intake_number}>
              {p.intake_number} — {p.intake_name}
            </option>
          ))}
        </select>
      </div>

      <button
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        onClick={handleGoClick}
        disabled={!selectedProject}
      >
        Go
      </button>
    </div>
  );
}


