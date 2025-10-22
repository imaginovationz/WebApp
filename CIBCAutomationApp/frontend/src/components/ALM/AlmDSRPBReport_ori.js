import React, { useState, useEffect } from 'react';
import axios from 'axios';
import frontendAlmconfig from '../../frontendAlmconfig';
import Select from 'react-select';
import '../../styles/AlmProjectExecution.css';
import * as XLSX from 'xlsx';


const AlmDSRPBReport = () => {
  const [selectedDomain, setSelectedDomain] = useState('');
  const [almProjectOptions, setAlmProjectOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [selectedAlmProject, setSelectedAlmProject] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [cycleData, setCycleData] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [showReport, setShowReport] = useState(false);

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
      setCycleData([]);
    }

  };



  const handleAlmProjectChange = (event) => {
    const almProject = event.target.value;
    setSelectedAlmProject(almProject);
    setProjectOptions([]);
    setCycleData([]);


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

  };



  const handleProjectChange = (selectedOption) => {
    setSelectedProject(selectedOption ? selectedOption.value : '');
  };



  const handleCycleChange = (event) => {
    setSelectedCycle(event.target.value);
  };



  // Go button handler

  const handleGo = () => {
    
           // if (!selectedDomain || !almProject) {
           // alert('Please select both Domain and ALM Project.');
           // return;
         // } else {
                  setShowReport(true);
         // }
  };



  // Custom styles for Select

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

const handleGenerateEmail = () => {
  const projectName = selectedAlmProject;
  const releaseName = selectedProject;
  const currentDate = new Date().toISOString().split('T')[0];
  const cycle = selectedCycle;

  // Compose subject
  const subject = `QA Daily Status Report | ${projectName} ${releaseName} - ${currentDate} - ${cycle}`;
  // Compose body 
  const body = encodeURIComponent(
    `Hi,\n\nPlease find below the QE Daily Status Report.\n\n[Insert data summary or snapshot here]\n\nThanks,\nQA Team`
  );
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
};

const handleGenerateExcel = () => {
  const dataToExport = cycleData && cycleData.length > 0 ? cycleData : [{ message: "No data available" }];

  // Convert JSON data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  // Create a new workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, "QA_Daily_Status_Report.xlsx");
};





  return (
    <div className="form-page-record-view">
      <h1>ALM DSR PowerBI Report</h1>

      <div className="form-row-alm">
        <div className="form-column-alm">
          <label className="auto-size-alm">*Domain:</label>
          <select name="domain" onChange={handleDomainChange} required className="auto-size-alm">
            <option value=""></option>
            <option value="MLIDT">MLIDT</option>
            <option value="RBSS">RBSS</option>
          </select>
        </div>



        <div className="form-column-alm">
          <label className="auto-size-alm">*ALM Project:</label>
          <select name="alm_project" onChange={handleAlmProjectChange} required className="auto-size-alm">
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

          />

        </div>



        <div className="form-column-alm">
          <label className="auto-size-alm">*Cycle:</label>
          <select name="cycle" onChange={handleCycleChange} required className="auto-size-alm">
            <option value=""></option>
            <option value="All">All</option>
            {cycleData.map((option, index) => (
              <option key={index} value={option.CYCLE}>{option.CYCLE}</option>
            ))}
          </select>
        </div>
      </div>


      {/* Go Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={handleGo} className="go-button">Go</button>
      </div>


      {/* Show PowerBI iframe when Go is clicked */}

      {showReport && (
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <iframe title="ALM DSR" width="1140" height="541.25" src="https://app.powerbi.com/reportEmbed?reportId=c09b8d62-ab84-41a0-b507-16e7503527db&autoAuth=true&ctid=222fcaf7-15d0-455f-97e1-8fda2eaad539&actionBarEnabled=true&reportCopilotInEmbed=true"></iframe>
        
          <div style={{ marginTop: '20px' }}>
      <button onClick={handleGenerateEmail} className="action-button">Generate DSR Email</button>
      <button onClick={handleGenerateExcel} className="action-button" style={{ marginLeft: '10px' }}>Generate Excel</button>
    </div>

        
        </div>
      )}
    </div>
  );
};

export default AlmDSRPBReport;