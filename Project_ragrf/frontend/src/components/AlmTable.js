import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import { useHistory } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import frontendAlmconfig from '../frontendAlmconfig';
import '../styles/RecordEntry.css';
import '../styles/RecordView.css';
import '../styles/AlmProjectTableView.css';
import PropTypes from 'prop-types';
import Select from 'react-select';

const AlmDailyStatus = ({ headers }) => {
  //const history = useHistory();
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState('');
  const [almProjectOptions, setAlmProjectOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [selectedAlmProject, setSelectedAlmProject] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [recordData, setRecordData] = useState([]);
  const [filter, setFilter] = useState('');
  const [cycleData, setCycleData] = useState([]);
  const [sqlResults, setSqlResults] = useState({});
  const [activeTable, setActiveTable] = useState(null);

  const sqlFilesWithTotalColumn = [
    'Test Coverage Template.sql',
    'Cumulative Test Coverage Template.sql',
    'Cumulative Variances By Root Cause And Severity Template.sql',
    'Trend Test Coverage Template.sql',
  ];

  const columnToSum = {
    'Test Coverage Template.sql': ['MANUAL', 'AUTOMATED'],
    'Cumulative Test Coverage Template.sql': ['MANUAL', 'AUTOMATED'],
    'Cumulative Variances By Root Cause And Severity Template.sql': ['SEV1', 'SEV2', 'SEV3', 'SEV4'],
    'Trend Test Coverage Template.sql': ['MANUAL', 'AUTOMATED'],
    'Daily_Created_defect.sql': ['MANUAL', 'AUTOMATED'],
  };

  const handleDomainChange = (event) => {
    const domain = event.target.value;
    setSelectedDomain(domain);

    if (domain === 'MLIDT') {
      setAlmProjectOptions(['Deposits_F24', 'Deposits_F25', 'Lending_F24', 'Lending_F25','Securitization_F25']);
      setProjectOptions([]);
    } else if (domain === 'RBSS') {
      setAlmProjectOptions(['ATM_Release_36', 'ATM_BASE_2024']);
      setProjectOptions([]);
    } else {
      setAlmProjectOptions([]);
      setProjectOptions([]);
    }
  };

  const handleAlmProjectChange = (event) => {
    const almProject = event.target.value;
    setSelectedAlmProject(almProject);
    setProjectOptions([]);
    setTableData([]);
    setRecordData([]); // Clear record data
    setSqlResults({}); // Clear SQL results
    setLoading(true);
    axios.get(`${frontendAlmconfig.backendUrl}/alm_only_release`, {
      params: {
        domain: selectedDomain,
        project: almProject
      }
    })
      .then(response => {
        const projectNames = response.data.map(item => item.REL_NAME);
        setProjectOptions(projectNames);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching project options:', error);
        setLoading(false);
        alert('Error fetching project details:', error.message);
      });
  };

const handleProjectChange = (selectedOption) => {
  const project = selectedOption ? selectedOption.value : '';
  setSelectedProject(project); // Update state with selected project
  setLoading(true);
  setRecordData([]);
  setTableData([]);
  setSqlResults({});
  
  const sqlFiles = [
    'Target Schedule Template.sql',
    'Test Coverage Template.sql',
    'Application_open_defect.sql',
    'Cumulative Test Coverage Template.sql',
    'Cumulative Test Execution Query Template.sql',
    'Daily_Closed_defect_table.sql',
    'Daily_Created_defect_table.sql',
    'Application_defect_table.sql',
    'Defect_open_days.sql',
    'Defect_trends.sql',
    'Tester_Count.sql',
    'Cycle.sql',
    'Active Defects Template.sql',
    'Cumulative Variances By Root Cause And Severity Template.sql',
    'Cumulative Variances By Severity And Status Template.sql',
    'Sev 1 Aging Template.sql',
    'Daily Variance Created Or Closed Template.sql',
    'Cumulative SIT Effectiveness Template.sql',
    'Trend Test Coverage Template.sql',
  ];
  
  // Keep track of pending API calls
  let pendingApiCalls = sqlFiles.length;

  const fetchData = (dqlName) => {
    axios.get(`${frontendAlmconfig.backendUrl}/alm_run_dql`, {
      params: {
        domain: selectedDomain,
        project: selectedAlmProject,
        release: project,
        dql_name: dqlName
      }
    })
      .then(response => {
        setSqlResults(prevResults => ({
          ...prevResults,
          [dqlName]: response.data
        }));
        if (dqlName === 'Cycle.sql') {
          setCycleData(response.data); // Update cycle data
        }
      })
      .catch(error => {
        if (error.response && (error.response.status === 400 || error.response.status === 500)) {
          console.warn(`400 error fetching ${dqlName}:`, error);
        } else {
          console.error(`Error fetching ${dqlName}:`, error);
          alert(`Error fetching ALM details: ${error.message}`);
        }
      })
      .finally(() => {
        pendingApiCalls--; // Decrement counter regardless of success or failure
        if (pendingApiCalls === 0) {
          setLoading(false); // Only set loading to false when ALL API calls are completed
        }
      });
  };

  sqlFiles.forEach(sqlFile => fetchData(sqlFile));
};

  const handleCycleChange = (event) => {
    const cycle = event.target.value;
    if (cycle) {
      setSelectedCycle(cycle); // Update state with selected cycle
      if (cycle === 'All') {
        setTableData(recordData); // Show all data if "All" is selected
      } else {
        const filteredData = applyFilter(recordData, cycle); // Filter data based on selected cycle
        setTableData(filteredData); // Update table data with filtered data
      }
    }
  };

  const applyFilter = (data, cycle) => {
    // Implement your filtering logic here based on the selected cycle
    return data.filter(item => item.CYCLE === cycle);
  };

  const renderTable = (data, filter, handleFilterChange, sqlFile) => {
    if (!data || data.length === 0) {
      return <p>No data found!</p>;
    }

    let filteredData = data;

    // Apply individual filter on the first column
    if (filter) {
      filteredData = filteredData.filter(row =>
        Object.values(row)[0].toString().toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Apply cycle filter if the first column is 'CYCLE' and the table is not 'Target Schedule'
    if (Object.keys(data[0])[0] === 'CYCLE' && selectedCycle && selectedCycle !== 'All' && sqlFile !== 'Target Schedule Template.sql') {
      filteredData = filteredData.filter(row => row.CYCLE === selectedCycle);
    }

    return (
      <div className="table-container-alm">
        <table>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key, index) => (
                    <th key={key}>
      {index === 0 && key === 'CYCLE' && sqlFile !== 'Target Schedule Template.sql' ? (
        <input
          type="text"
          value={filter}
          onChange={handleFilterChange}
          placeholder={`Filter ${key}`}
        />
      ) : (
        key
      )}
    </th>
              ))}
              {sqlFilesWithTotalColumn.includes(sqlFile) && <th>Total</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, i) => (
                  <td key={i}>{value}</td>
                ))}
                {sqlFilesWithTotalColumn.includes(sqlFile) && (
                  <td>
                    {columnToSum[sqlFile].reduce((acc, colName) => {
                      const colValue = parseInt(row[colName], 10);
                      return acc + (isNaN(colValue) ? 0 : colValue);
                    }, 0)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleGoBack = () => {
    //history.push('/');
    navigate('/');
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

  useEffect(() => {
    document.title = "CBPT Automation Team Tracker";
  }, []);

  const queryToTableName = {
    'Defect_trends.sql': 'Defect Trends',
    'Defect_open_days.sql': 'Defect with Open Days',
    'Application_open_defect.sql': 'Application Overall Defects',
    'Daily_Closed_defect_table.sql': 'Daily Closed Defects',
    'Daily_Created_defect_table.sql': 'Daily Created Defects',
    'Active Defects Template.sql': 'Active Defects',
    'Application_defect_table.sql': 'Application Open Defects',
    'Target Schedule Template.sql': 'Target Schedule',
    'Test Coverage Template.sql': 'Test Coverage',
    'Cumulative Test Coverage Template.sql': 'Cumulative Test Coverage',
    'Cumulative Test Execution Query Template.sql': 'Cumulative Test Execution',
    'Tester_Count.sql': 'Tester Count',
    'Cumulative Variances By Root Cause And Severity Template.sql': 'Cumulative Variances By Root Cause And Severity',
    'Cumulative Variances By Severity And Status Template.sql': 'Cumulative Variances By Severity And Status',
    'Sev 1 Aging Template.sql': 'Sev 1 Aging',
    'Daily Variance Created Or Closed Template.sql': 'Daily Variance Created Or Closed',
    'Cumulative SIT Effectiveness Template.sql': 'Cumulative SIT Effectiveness',
    'Trend Test Coverage Template.sql': 'Trend Test Coverage',
  };

  // Add function to handle scrolling to specific table
  const scrollToTable = (tableId, index) => {
    const element = document.getElementById(tableId);
    if (element) {
      // Set active table for highlighting the current selection
      setActiveTable(index);
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="form-page-record-view">
      <h1>ALM Project Execution Details in Table</h1>
      
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
      <br/>
      {loading && <div className="loading-spinner"></div>}
      {!loading && Object.keys(sqlResults).some(sqlFile => sqlFile !== 'Cycle.sql' && sqlResults[sqlFile]?.length > 0) && (
                
        <div className="table-navigation-index">
          <h4>Quick Navigation:</h4>
          <div className="table-nav-list">
            {Object.keys(sqlResults)
              .filter(sqlFile => sqlFile !== 'Cycle.sql' && sqlResults[sqlFile]?.length > 0)
              .map((sqlFile, index) => (
                <button 
                  key={index}
                  onClick={() => scrollToTable(`table-${index}`, index)}
                  className={`table-nav-button ${activeTable === index ? 'active-table-nav' : ''}`}
                >
                  {queryToTableName[sqlFile] || sqlFile}
                </button>
              ))}
          </div>
        </div>
      )}
      {!loading && (
        <div className="tables-container">
          {Object.keys(sqlResults)
            .filter(sqlFile => sqlFile !== 'Cycle.sql')
            .map((sqlFile, index) => (
              <div key={index} className="table-row" id={`table-${index}`}>
                <div className="table-card">
                  <h3 className="table-title">{queryToTableName[sqlFile]}</h3>
                  <div className="record-data">
                    {sqlResults[sqlFile] && sqlResults[sqlFile].length > 0 && renderTable(sqlResults[sqlFile], filter, handleFilterChange, sqlFile)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      <div className="button-row">
        <button onClick={handleGoBack} className="back-button">Back to Main Menu</button>
      </div>
    </div>
  );
};

AlmDailyStatus.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default AlmDailyStatus;