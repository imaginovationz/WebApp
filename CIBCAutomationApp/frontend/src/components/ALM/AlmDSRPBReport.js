import React, { useState } from 'react';
import axios from 'axios';
import frontendAlmconfig from '../../frontendAlmconfig';
import Select from 'react-select';
import '../../styles/AlmProjectExecution.css';
import PowerBIEmbed from './PBReactUI'; // Import the PowerBIEmbed component

const AlmDSRPBReport = () => {
  const [selectedDomain, setSelectedDomain] = useState('');
  const [almProjectOptions, setAlmProjectOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [selectedAlmProject, setSelectedAlmProject] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Handle dropdown changes
  const handleDomainChange = (event) => {
    const domain = event.target.value;
    setSelectedDomain(domain);

    if (domain === 'MLIDT') {
      setAlmProjectOptions(['Deposits_F24', 'Deposits_F25', 'Lending_F24', 'Lending_F25', 'Securitization_F25']);
      setProjectOptions([]);
    } else if (domain === 'RBSS') {
      setAlmProjectOptions(['ATM_Release_36', 'ATM_BASE_2024']);
      setProjectOptions([]);
    } else {
      setAlmProjectOptions([]);
      setProjectOptions([]);
    }
    setSelectedAlmProject('');
    setSelectedProject('');
    setShowReport(false);
    setReportData(null);
  };

  const handleAlmProjectChange = (event) => {
    const almProject = event.target.value;
    setSelectedAlmProject(almProject);
    setProjectOptions([]);

    axios.get(`${frontendAlmconfig.backendUrl}/alm_only_release`, {
      params: { domain: selectedDomain, project: almProject }
    })
    .then(response => {
      const projectNames = response.data.map(item => item.REL_NAME);
      setProjectOptions(projectNames);
    })
    .catch(error => {
      console.error('Error fetching project options:', error);
      alert('Error fetching project details: ' + error.message);
    });
    setSelectedProject('');
    setShowReport(false);
    setReportData(null);
  };

  const handleProjectChange = (selectedOption) => {
    setSelectedProject(selectedOption ? selectedOption.value : '');
    setShowReport(false);
    setReportData(null);
  };

  // Go button handler
  const handleGo = async () => {
    try {
      // Fetch the SQL from local file
      const sqlQuery = await axios.get('/dql/Cumulative Test Execution Query Template.sql').then(res => res.data);

      // Call Flask backend
      const response = await axios.get(`${frontendAlmconfig.backendUrl}/alm_run_sql`, {
        params: {
          domain: selectedDomain,
          project: selectedAlmProject,
          release: selectedProject,
          sql_query_name: "Cumulative Test Execution Query Template.sql"
        }
      });

      setReportData(response.data); // Data: {TotalTestCases, Passed, Failed, Blocked, ...}
      setShowReport(true);

    } catch (error) {
      alert('Error fetching report data: ' + error.message);
      setShowReport(true);
    }
  };


  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderWidth: '0.25px',
      borderColor: 'black',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'black',
    }),
  };

 // const isGoEnabled = selectedDomain && selectedAlmProject && selectedProject;

  return (
    <div className="form-page-record-view">
      <h1>ALM DSR PowerBI Report</h1>
      <div className="form-row-alm">
        <div className="form-column-alm">
          <label className="auto-size-alm">*Domain:</label>
          <select name="domain" onChange={handleDomainChange} required className="auto-size-alm" value={selectedDomain}>
            <option value=""></option>
            <option value="MLIDT">MLIDT</option>
            <option value="RBSS">RBSS</option>
          </select>
        </div>
        <div className="form-column-alm">
          <label className="auto-size-alm">*ALM Project:</label>
          <select name="alm_project" onChange={handleAlmProjectChange} required className="auto-size-alm" value={selectedAlmProject}>
            <option value=""></option>
            {almProjectOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="form-column-alm">
          <label className="auto-size-alm">*Project:</label>
          <Select
            name="project"
            options={projectOptions.map(option => ({ value: option, label: option }))}
            onChange={handleProjectChange}
            isClearable
            styles={customStyles}
            className="auto-size-alm select-form-type-row select"
            value={selectedProject ? { value: selectedProject, label: selectedProject } : null}
          />
        </div>
      </div>
      {/* Go Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <button onClick={handleGo} className="go-button">Fetch Report</button>
      </div>

      {/* Show PowerBI iframe when Go is clicked */}
      {showReport && (
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <PowerBIEmbed reportData={reportData} /> {/* Pass the API data to PowerBI */}
        </div>
      )}
    </div>
  );
};

export default AlmDSRPBReport;