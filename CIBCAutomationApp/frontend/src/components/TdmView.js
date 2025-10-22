import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import frontendconfig from '../frontendconfig'; // Import the configuration
import '../styles/RecordEntry.css';
import '../styles/RecordView.css';
import PropTypes from 'prop-types';

const RecordView = ({ headers }) => {
  const history = useNavigate();
  const [formType, setFormType] = useState('');
  const [recordData, setRecordData] = useState([]);
  const [viewType, setViewType] = useState('');
  const [filters, setFilters] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state
  console.log('viewType:', viewType); // Debugging: Check the value of viewType
  const [resourceData, setResourceData] = useState({});
  const handleResourceChange = (e) => {
    setResourceData({ ...resourceData, [e.target.name]: e.target.value });
  };

  const formTypeDisplayNames = {
    class_tdm: "CLASS Deal",
    ecif_deal: "ECIF Number",
  };

  const handleFormTypeChange = (e) => {
    const selectedFormType = e.target.value;
    setFormType(selectedFormType);
    if (selectedFormType) {
      setLoading(true); // Set loading to true before API call
      fetchRecordData(selectedFormType);
      if (selectedFormType === 'class_tdm') {
        setViewType('class_tdm');
      } else if (selectedFormType === 'ecif_deal') {
        setViewType('ecif_deal');
      }  else {
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
            return recordValue.includes(filterValue);
        });
    });
};

  const handleGoBack = () => {
    history.push('/');
  };

  useEffect(() => {
    document.title = "CBPT Automation Team Tracker"; 
  }, []);

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(recordData);
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
    const filteredData = applyFilters(recordData);

    const filteredHeaders = headers.filter((header, index) => {
      if (index < 4) return true; // Always include the first 4 columns
     
      return true; // Include all columns if not 'intake_resource_allocations_monthly'
  });

    return (
      <div className="table-container">
        <table className={`table ${viewType === 'class_tdm' ? 'freeze-columns-2' :
                                   viewType === 'ecif_deal' ? 'freeze-columns-2' : ''}`}>
          <thead>
            <tr>
              {filteredHeaders.map((header, index) => (
                <th key={index}>
                  {header}
                  {(viewType === 'class_tdm' || viewType === 'ecif_deal')   && (
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
      <h1>TDM Record View Page</h1>
      <div className="form-type-row">
        <label htmlFor="formType">Select TDM Record to be viewed:</label>
        <select id="formType" className="select-form-type-row" value={formType} onChange={handleFormTypeChange}>
          <option value="">Select</option>
          <option value="class_tdm">CLASS Deal</option>
        </select>
      </div>

      {loading && <div className="loading-spinner"></div>} {/* Add loading spinner */}
      {!loading && recordData && recordData.length > 0 && (
        <div className="record-data">
          {formType && <h4>ECIF Customer Detail, created by TDM Automation:</h4>}
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