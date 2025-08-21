import React, { useState, useEffect } from 'react';

const ProjectROI = () => {
  const [projects, setProjects] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState('');

  
  
  // [1] Fetch projects for dropdown
  useEffect(() => {
    fetch('http://localhost:5000/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error('Error fetching projects:', err));
  }, []);

  
  
  // [1] Fetch initiatives for Transformation Initiative dropdown
  useEffect(() => {
    fetch('http://localhost:5000/api/initiatives')
      .then(res => res.json())
      .then(data => setInitiatives(data.initiatives || []))
      .catch(err => console.error('Error fetching initiatives:', err));
  }, []);
  
  
  
  // [2] When Go is clicked, show form and populate initial values
  const handleGoClick = () => {
    if (!selectedProject) return;
    const selectedObj = projects.find(
      proj => String(proj.intake_number) === String(selectedProject)
    );
    if (!selectedObj) return;

    setFormData({
      Project: `${selectedObj.intake_number} - ${selectedObj.intake_name}`,
      FP: selectedObj.DeliveryModel || "",
      Lead: selectedObj.Lead || "",
      FY: "",
      ROIReportingQr: "",
      TransformationInitiative: "",
      intake_number: selectedObj.intake_number // for backend reference
    });
    setMessage('');
  };

  
  // Handle user input change
  const handleChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  
   
  // [4] Save form data to backend
  const handleSave = async () => {
    if (!formData || !formData.intake_number) {
      setMessage('Project info missing!');
      return;
    }
    const res = await fetch('http://localhost:5000/api/projectroiupdate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await res.json();
    setMessage(result.message || 'Saved successfully!');
  };

  
  
  
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Project ROI</h2>
      {/* [1] Project select dropdown */}
      <select
        value={selectedProject}
        onChange={e => setSelectedProject(e.target.value)}
      >
        <option value="">--Select a project--</option>
        {projects.map(proj => (
          <option key={proj.intake_number} value={proj.intake_number}>
            {proj.intake_number} - {proj.intake_name}
          </option>
        ))}
		
      </select>
      <button
        onClick={handleGoClick}
        style={{ marginLeft: '1rem' }}
        disabled={!selectedProject}
      >
        Go
      </button>

      {/* [2] User Form */}
      {formData && (
        <div style={{ marginTop: '2rem' }}>
          <table border="1" cellPadding="8">
            <tbody>
              <tr>
                <td>Project</td>
                <td>
                  <input
                    type="text"
                    value={formData.Project}
                    disabled
                  />
                </td>
              </tr>
              
              
              <tr>
                <td>FY</td>
                <td>
                  <select
                    value={formData.FY}
                    onChange={e => handleChange(e, 'FY')}
                  >
                    <option value="">--Select--</option>
                    <option value="FY2025">FY2025</option>
                    <option value="FY2026">FY2026</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>ROI Reporting Qr</td>
                <td>
                  <select
                    value={formData.ROIReportingQr}
                    onChange={e => handleChange(e, 'ROIReportingQr')}
                  >
                    <option value="">--Select--</option>
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                  </select>
                </td>
              </tr>
              
			  <tr>
			                <td>Automation Framework</td>
			                <td>
			                  <select value={formData.AutomationFramework || ""} onChange={(e) => handleChange(e, "AutomationFramework")}>
			                    <option value="1">1</option>
			                    <option value="2">2</option>
			                    <option value="3">3</option>
			                  </select>
			                </td>
			              </tr>
						  
						  <tr>
						                 <td>Portfolio</td>
						  			<td>
						  			                  <select
						  			                    value={formData.Portfolio || ""}
						  			                    onChange={(e) => handleChange(e, "Portfolio")}
						  			                  >
						  			                    <option value="">--Select--</option>
						  			                    <option value="Lending">Lending</option>
						  			                    <option value="Deposit">Deposit</option>
						  			                    <option value="ECMT">ECMT</option>
						  			                    <option value="Payments">Payments</option>
						  			                  </select>
						  			                </td>
						               </tr>
									   
									   	  
						  
									   <tr>
									                   <td>Application</td>
									                   <td>
									                     <select value={formData.Application || ""} onChange={(e) => handleChange(e, "Application")}>
									                       <option value="Class">Class</option>
									                       <option value="LCMS">LCMS</option>
									                     </select>
									                   </td>
									                 </tr>
									                 <tr>
									                   <td>$ ROI</td>
									                   <td>
									                     <input
									                       type="number"
									                       step="0.01"
									                       value={formData.Amount || ""}
									                       onChange={(e) => handleChange(e, "Amount")}
									                     />
									                   </td>
									                 </tr>
													 
													 
													 <tr>
													                <td>Delivery</td>
													                <td><input type="text" value={formData.FP || ""} disabled /></td>
													              </tr>
													              <tr>
													                <td>#Deal Count</td>
													                <td><input type="number" value={formData.DealCount || ""} onChange={(e) => handleChange(e, "DealCount")} /></td>
													              </tr>
													              <tr>
													                <td>#Tests case Design</td>
													                <td><input type="number" value={formData.TestCaseDesign || ""} onChange={(e) => handleChange(e, "TestCaseDesign")} /></td>
													              </tr>
													              <tr>
													                <td>#Tests Updated</td>
													                <td><input type="number" value={formData.TestUpdated || ""} onChange={(e) => handleChange(e, "TestUpdated")} /></td>
													              </tr>
													              <tr>
													                <td>#Tests Executed</td>
													                <td><input type="number" value={formData.TestCaseExecuted || ""} onChange={(e) => handleChange(e, "TestCaseExecuted")} /></td>
													              </tr>
													              <tr>
													                <td>ROI Sheet location</td>
													                <td><input type="text" value={formData.ROISheet || ""} onChange={(e) => handleChange(e, "ROISheet")} /></td>
													              </tr>
													              <tr>
													                <td>QE Lead</td>
													                <td><input type="text" value={formData.Lead || ""} disabled /></td>
													              </tr>
													              <tr>
													                <td>Comments</td>
													                <td><input type="text" value={formData.Comment || ""} onChange={(e) => handleChange(e, "Comment")} /></td>
													              </tr>
																  
													 
													 <tr>
						    <td>Transformation Initiative</td>
						    <td>
						      <select
						        value={formData.TransformationInitiative}
						        onChange={e => handleChange(e, 'TransformationInitiative')}
						      >
						        <option value="">--Select--</option>
						        {initiatives.map(ini => (
						          <option key={ini.IniName} value={ini.IniName}>
						            {ini.IniName}
						          </option>
						        ))}
						      </select>
						    </td>
						  </tr>
			
			  
			  
			  
            </tbody>
          </table>
          {/* [3][4] Save button and message */}
          <button onClick={handleSave} style={{ marginTop: '1rem' }}>
            Save
          </button>
          {message && <span style={{ color: 'green', marginLeft: '1rem' }}>{message}</span>}
        </div>
      )}
    </div>
  );
};

export default ProjectROI;