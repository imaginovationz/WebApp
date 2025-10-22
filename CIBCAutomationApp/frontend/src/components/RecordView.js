import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import frontendconfig from '../frontendconfig'; // Import the configuration
import '../styles/RecordEntry.css';
import '../styles/RecordView.css';
import PropTypes from 'prop-types';
import { gradientColors } from './colors';

const RecordView = ({ headers }) => {
  const history = useNavigate();
  const [formType, setFormType] = useState('');
  const [recordData, setRecordData] = useState([]);
  const [viewType, setViewType] = useState('');
  const [filters, setFilters] = useState({});
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(null);
  // const [startMonth, setStartMonth] = useState(null);
  const [startMonth, setStartMonth] = useState(new Date().toISOString().slice(0, 7)); // Format as YYYY-MM
  const [resourceData, setResourceData] = useState({});
  const [endMonth, setEndMonth] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  const handleResourceChange = (e) => {
    setResourceData({ ...resourceData, [e.target.name]: e.target.value });
  };

  const formTypeDisplayNames = {
    resources: "Resource",
    projects: "Project",
    projects_timeline: "Project TimeLine",
    resource_allocations: "Resource Allocation",
    resource_allocations_monthly: "Resource Monthly Allocation",
    intake_resource_allocations_monthly: "Resource Allocation On Intake",
    intake_resource_allocations_weekly: "Weekly Allocation Of Resource On Intake",
    alm_stored_query : "ALM Stored Query",
    jenkins_logs : "Jenkins Logs",
    test_cases : "Test Cases"
  };

  const handleFormTypeChange = (e) => {
    const selectedFormType = e.target.value;
    setFormType(selectedFormType);
    setFilters({}); // Clear filters when form type changes
    if (selectedFormType) {
      setLoading(true); // Set loading to true before API call
      fetchRecordData(selectedFormType);
      if (selectedFormType === 'resource_allocations_monthly') {
        setViewType('resource_allocations_monthly');
      } else if (selectedFormType === 'intake_resource_allocations_monthly') {
        setViewType('intake_resource_allocations_monthly');
      } else if (selectedFormType === 'intake_resource_allocations_weekly') {
        setViewType('intake_resource_allocations_weekly');
      } else {
        setViewType('');
      }
    } else {
      setRecordData([]);
      setViewType('');
    }
  };

  const fetchRecordData = (type) => {
    axios.get(`${frontendconfig.backendUrl}/${type}`)
      .then(response => {
        setRecordData(response.data);
        setLoading(false); // Set loading to false after data is fetched
      })
      .catch(error => {
        console.error(`Error fetching ${type} data:`, error);
        setLoading(false); // Set loading to false in case of error
      });
  };

  const handleFilterChange = (e, header) => {
    const value = e.target.value;
    setFilters({
      ...filters,
      [header]: value,
    });
  };
  const parseDateMMMYY = (dateStr) => {
    const [month, year] = dateStr.split('-');
    return new Date(`${month} 01, 20${year}`);
  };

  const applyFilters2 = (data) => {
    return data.filter(record => {
        return Object.keys(filters).every(header => {
            if (!filters[header]) return true;
            const recordValue = record[header]?.toString().toLowerCase();
            const filterValue = filters[header].toLowerCase();
            if (filterValue === '!=0') {
                return recordValue !== '0';
            }
            if (filterValue === '>0') {
              return recordValue > '0';
            }
            if (filterValue === '!=1') {
              return recordValue !== '1';
            }
            if (filterValue === '>0&<1' || filterValue === '>0&<1.0' || filterValue === '>0<1') {
              const num = parseFloat(recordValue);
            return !isNaN(num) && num > 0 && num < 1;
            }
            return recordValue && recordValue.includes(filterValue);
        });
    });
};

  const applyFilters = (data) => {
    return data.filter(record => {
      return Object.keys(filters).every(header => {
        if (!filters[header]) return true;
        const recordValue = record[header]?.toString().toLowerCase();
        const filterValue = filters[header].toLowerCase();
        if (filterValue === '!=0') {
          return recordValue !== '0';
        }
        if (filterValue === '>0') {
          return recordValue > '0';
        }
        if (filterValue === '!=1') {
          return recordValue !== '1';
        }
        if (filterValue === '>0&<1' || filterValue === '>0&<1.0' || filterValue === '>0<1') {
          const num = parseFloat(recordValue);
          return !isNaN(num) && num > 0 && num < 1;
        }
        return recordValue && recordValue.includes(filterValue);
      });
    });
  };

  const handleGoBack = () => {
    history.push('/');
  };
  useEffect(() => {
    if (formType === 'intake_resource_allocations_monthly' || formType === 'resource_allocations_monthly') {
      setStartMonth(new Date().toISOString().slice(0, 7)); // Format as YYYY-MM
      setEndMonth('');
    }
  }, [formType]);

  useEffect(() => {
    document.title = "CBPT Automation Team Tracker";
  }, []);


const downloadExcel = () => {
    const headers = recordData.length > 0 ? Object.keys(recordData[0]) : [];
    const filteredData = (formType === 'resources' || formType === 'projects' || formType === 'projects_timeline' || formType === 'resource_allocations')
      ? applyFilters2(recordData)
      : applyFilters(recordData);

    const filteredHeaders = headers.filter((header, index) => {
      if (viewType === 'resource_allocations_monthly'
        || viewType === 'intake_resource_allocations_weekly') {
        if (index < 4) return true;
      }
      if (viewType === 'intake_resource_allocations_monthly') {
        if (index < 6) return true;
      }
      if (viewType === 'intake_resource_allocations_weekly') {
        const headerDate = new Date(header);
        return !isNaN(headerDate) &&
          (!startDate || headerDate >= new Date(startDate)) &&
          (!endDate || headerDate <= new Date(endDate));
      }
      if (viewType === 'resource_allocations_monthly'
        || viewType === 'intake_resource_allocations_monthly') {
        const headerDate = parseDateMMMYY(header);
        return !isNaN(headerDate) &&
          (!startMonth || headerDate >= new Date(startMonth)) &&
          (!endMonth || headerDate <= new Date(endMonth));
      }
      return true;
    });

    const exportData = [];
    for (const row of filteredData) {
      const newRow = {};
      for (const h of filteredHeaders) {
        newRow[h] = row[h];
      }
      exportData.push(newRow);
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData, { header: filteredHeaders });
    const workbook = XLSX.utils.book_new();
    let sheetName = formTypeDisplayNames[formType];
    if (sheetName.length > 31) {
      sheetName = sheetName.slice(0, 31);
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${formTypeDisplayNames[formType]}.xlsx`);
  };



  const renderTable = () => {
    if (!recordData || recordData.length === 0) {
      return <p>Table is empty!</p>;
    }

    const headers = Object.keys(recordData[0]);
    console.log('viewType:', viewType); // Debugging: Check the value of viewType
    const filteredData = (formType === 'resources' || formType === 'projects' || formType === 'projects_timeline' || formType === 'resource_allocations')
      ? applyFilters2(recordData)
      : applyFilters(recordData);

    const filteredHeaders = headers.filter((header, index) => {

      if (viewType === 'resource_allocations_monthly'
        || viewType === 'intake_resource_allocations_weekly') {
        if (index < 4) return true; // Always include the first 4 columns
      }
      if (viewType === 'intake_resource_allocations_monthly') { 
        if (index < 6) return true; // Always include the first 3 columns
      }
      if (viewType === 'intake_resource_allocations_weekly') {
        const headerDate = new Date(header);
        // console.log(`Header: ${header}, Header Date: ${headerDate}, Start Date: ${startDate}, End Date: ${endDate}`);
        return !isNaN(headerDate) &&
          (!startDate || headerDate >= new Date(startDate)) &&
          (!endDate || headerDate <= new Date(endDate));
      }
      if (viewType === 'resource_allocations_monthly'
        || viewType === 'intake_resource_allocations_monthly') {
        const headerDate = parseDateMMMYY(header);
        return !isNaN(headerDate) &&
          (!startMonth || headerDate >= new Date(startMonth)) &&
          (!endMonth || headerDate <= new Date(endMonth));
      }
      return true; // Include all columns if not 'intake_resource_allocations_monthly'
    });

    return (
      <div className="table-container">
        <table className={`table ${viewType === 'resource_allocations_monthly' ? 'freeze-columns-4' :
          viewType === 'intake_resource_allocations_monthly' ? 'freeze-columns-6' :
            viewType === 'intake_resource_allocations_weekly' ? 'freeze-columns-4' : ''}`}>
          <thead>
            <tr>
              {filteredHeaders.map((header, index) => (
                <th key={index}>
                  {header}
                  {(viewType === 'intake_resource_allocations_monthly'
                    || viewType === 'intake_resource_allocations_weekly'
                    || viewType === 'resource_allocations_monthly'
                    || formType === 'resources'
                    || formType === 'projects'
                    || formType === 'projects_timeline'
                    || formType === 'resource_allocations'
                    || formType === 'jenkins_logs'
                    || formType === 'alm_stored_query'
                    || formType === 'test_cases') && (
                      <input
                        type="text"
                        placeholder={`Filter ${header}`}
                        value={filters[header] || ''}
                        onChange={(e) => handleFilterChange(e, header)}
                      />
                    )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((record, index) => (
              <tr key={index}>
                {filteredHeaders.map((header, idx) => (
                  <td key={idx} className={
                    viewType === 'resource_allocations_monthly' && record[header] === 1 ? 'highlight-cell-green' :
                      viewType === 'resource_allocations_monthly' && record[header] > 1 ? 'highlight-cell-red' :
                        viewType === 'intake_resource_allocations_monthly' && record[header] === 1 ? 'highlight-cell-green' :
                          viewType === 'intake_resource_allocations_monthly' && record[header] > 1 ? 'highlight-cell-red' :
                            viewType === 'intake_resource_allocations_weekly' && record[header] === 1 ? 'highlight-cell-green' :
                              viewType === 'intake_resource_allocations_weekly' && record[header] > 1 ? 'highlight-cell-red' : ''
                  }>
                    {record[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="form-page-record-view">
      <h1>Record View Page</h1>
      <div className="button-row form-type-row" style={{ gap: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <label htmlFor="formType1" style={{ margin: 0 }}>Select Database Record:</label>
          <select
            id="formType1"
            className="select-form-type-row"
            value={formType}
            onChange={handleFormTypeChange}
            style={{ margin: 0 }}
          >
            <option value="">Select</option>
            <option value="resources">Resource</option>
            <option value="projects">Project</option>
            <option value="projects_timeline">Project TimeLine</option>
            <option value="resource_allocations">Resource Allocation</option>
            <option value="alm_stored_query">ALM Stored Query</option>
            <option value="jenkins_logs">Jenkins Logs</option>
            <option value="test_cases">Test Cases</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <label htmlFor="formType2" style={{ margin: 0 }}>Select Allocation Record:</label>
          <select
            id="formType2"
            className="select-form-type-row"
            value={formType}
            onChange={handleFormTypeChange}
            style={{ margin: 0 }}
          >
            <option value="">Select</option>
            <option value="resource_allocations_monthly">Resource Monthly Allocation</option>
            <option value="intake_resource_allocations_monthly">Monthly Resource Allocation On Intake</option>
            <option value="intake_resource_allocations_weekly">Weekly Resource Allocation On Intake</option>
          </select>
        </div>
      </div>
      {loading && <div className="loading-spinner"></div>} {/* Add loading spinner */}
      {!loading && formType === 'intake_resource_allocations_weekly' && (

        <div className="button-row">
          <div className="form-row">
            <div><label>Start Date:</label></div>
            <div><input type="date" id="start_date" name="start_date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div><label>End Date:</label></div>
            <div><input type="date" id="end_date" name="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
        </div>
      )}
      {!loading && (formType === 'intake_resource_allocations_monthly'
        || formType === 'resource_allocations_monthly') && (

          <div className="button-row">
            <div className="form-row">
              <div><label>Start Month:</label></div>
              <div><input type="month" id="start_month" name="start_month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div><label>End Month:</label></div>
              <div><input type="month" id="end_month" name="end_month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} /></div>
            </div>
          </div>
        )}
      {!loading && (formType === 'intake_resource_allocations_weekly' || formType === 'intake_resource_allocations_monthly'
        || formType === 'resource_allocations_monthly') && (

          <div className="form-row-temp">
           Use "!=0" : non 0 values, "!=1" : greater than 1, "{'>'}0" :  more than 0,  '{'>'}0&{'<'}1' : greater than 0 and less than 1. Past date can also be used in date filter.
          </div>
        )}
      {!loading && recordData && recordData.length > 0 && (
        <div className="record-data">
          {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
          {renderTable()}
        </div>
      )}
      <div className="button-row">
        <button onClick={downloadExcel} className="download-button">Download Excel</button>
        <button onClick={handleGoBack} className="back-button">Back to Main Menu</button>
      </div>
    </div>
  );
};

RecordView.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default RecordView;