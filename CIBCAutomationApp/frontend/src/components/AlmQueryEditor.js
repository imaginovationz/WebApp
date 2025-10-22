import React, { useState, useEffect } from 'react';
import axios from 'axios';
import frontendAlmconfig from '../frontendAlmconfig';
import PropTypes from 'prop-types';
import * as XLSX from 'xlsx';

const AlmQueryEditor = ({ headers }) => {
  const [customQuery, setCustomQuery] = useState('');
  const [customQueryResults, setCustomQueryResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedDomain, setSelectedDomain] = useState('');
  const [almProjectOptions, setAlmProjectOptions] = useState([]);
  const [selectedAlmProject, setSelectedAlmProject] = useState('');
  const [savedQueries, setSavedQueries] = useState([]);
  const [queryType, setQueryType] = useState('new');
  const [selectedStoredQuery, setSelectedStoredQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get(`${frontendAlmconfig.backendUrl}/alm_query_user`)
      .then(response => {
        setUsers(response.data);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
      });
  }, []);

  const handleCustomQueryChange = (event) => {
    setCustomQuery(event.target.value);
  };

  const handleDomainChange = (event) => {
    const domain = event.target.value;
    setSelectedDomain(domain);

    if (domain === 'MLIDT') {
      setAlmProjectOptions(['Deposits_F24', 'Deposits_F25', 'Lending_F24', 'Lending_F25', 'Securitization_F25']);
    } else if (domain === 'RBSS') {
      setAlmProjectOptions(['ATM_Release_36', 'ATM_BASE_2024']);
    } else {
      setAlmProjectOptions([]);
    }
  };

  const handleAlmProjectChange = (event) => {
    setSelectedAlmProject(event.target.value);
  };

  const handleQueryTypeChange = (event) => {
    setQueryType(event.target.value);
  };

  const handleUserChange = (event) => {
    const username = event.target.value;
    setSelectedUser(username);
    setSelectedStoredQuery('');
    if (username) {
      axios.get(`${frontendAlmconfig.backendUrl}/alm_query_stored_query/${username}`)
        .then(response => {
          console.log('Stored queries response:', response.data); // Debugging statement
          // Ensure the response is an array of objects
          const queries = Array.isArray(response.data) ? response.data : [response.data];
          setSavedQueries(queries);
        })
        .catch(error => {
          console.error('Error fetching stored queries:', error);
        });
    }
  };

  const handleStoredQueryChange = (event) => {
    const queryName = event.target.value;
    setSelectedStoredQuery(queryName);
    setCustomQuery(''); // Clear the textarea first
    axios.get(`${frontendAlmconfig.backendUrl}/alm_get_store_query/${queryName}`)
      .then(response => {
        if (response.data.length > 0) {
          setCustomQuery(response.data[0].sql_query);
        }
      })
      .catch(error => {
        console.error('Error fetching stored query:', error);
      });
  };

  const handleExecuteCustomQuery = () => {
    if (!selectedDomain || !selectedAlmProject) {
      alert('Please select both Domain and ALM Project.');
      return;
    }
    const restrictedKeywords = ['INSERT','Insert','insert','UPDATE', 'Update','update','Select *','SELECT *' ,'select *'];
    const lowerCaseQuery = customQuery.toLowerCase();
    for (const keyword of restrictedKeywords) {
      if (lowerCaseQuery.includes(keyword)) {
        alert(`The use of "${keyword}" is restricted.`);
        return;
      }
    }
    setLoading(true);
    axios.get(`${frontendAlmconfig.backendUrl}/alm_run_sql`, {
      params: {
        domain: selectedDomain,
        project: selectedAlmProject,
        query: customQuery
      }
    })
      .then(response => {
        setCustomQueryResults(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error executing custom query:', error);
        setLoading(false);
        alert('Error executing custom query:', error.message);
      });
  };

  const handleSaveQuery = () => {
    const username = prompt("Enter your username to save the query:");
    const sqlQueryName = prompt("Enter a name for your SQL query:");
    if (username && sqlQueryName) {
      const newQuery = {
        username: username,
        sql_query_name: sqlQueryName,
        sql_query: customQuery
      };
      axios.post(`${frontendAlmconfig.backendUrl}/store_sql_query`, newQuery)
        .then(response => {
          setSavedQueries([...savedQueries, newQuery]);
          alert('Query saved successfully!');
        })
        .catch(error => {
          console.error('Error saving query:', error);
          alert('Error saving query:', error.message);
        });
    } else {
      alert('Username and query name are required to save the query.');
    }
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(customQueryResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    XLSX.writeFile(workbook, 'query_results.xlsx');
  };

  const renderTable = (data, filters, handleFilterChange) => {
    if (!data || data.length === 0) {
      return <p>No data found!</p>;
    }

    let filteredData = data;

    // Apply individual filters on each column
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        filteredData = filteredData.filter(row =>
          row[key].toString().toLowerCase().includes(filters[key].toLowerCase())
        );
      }
    });

    return (
      <div className="table-container-alm">
        <table>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>
                  {key}
                  <br />
                  <input
                    type="text"
                    value={filters[key] || ''}
                    onChange={(e) => handleFilterChange(e, key)}
                    placeholder={`Filter ${key}`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, i) => (
                  <td key={i}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleFilterChange = (event, key) => {
    setFilters({
      ...filters,
      [key]: event.target.value
    });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="form-page-record-view">
      <div className="query-input-section">
        <h1>Execute ALM SQL Query</h1>
        <h4 style={{ color: '#0c8835' }}>Always refresh page for new search criteria.</h4> 

        <div className="form-row-alm">
          <div className="form-column-alm">
            <label className="auto-size-alm">*Query Type:</label>
            <select name="query_type" onChange={handleQueryTypeChange} required className="auto-size-alm">
              <option value="new">New Query</option>
              <option value="stored">Stored Query</option>
            </select>
          </div>
          {queryType === 'stored' && (
            <>
              <div className="form-column-alm">
                <label className="auto-size-alm">*User:</label>
                <select name="user" onChange={handleUserChange} required className="auto-size-alm">
                  <option value=""></option>
                  {users.map((user, index) => (
                    <option key={index} value={user.username}>{user.username}</option>
                  ))}
                </select>
              </div>
              {selectedUser && (
                <div className="form-column-alm">
                  <label className="auto-size-alm">*Stored Query:</label>
                  <select name="stored_query" onChange={handleStoredQueryChange} required className="auto-size-alm">
                    <option value=""></option>
                    {savedQueries.map((query, index) => (
                      <option key={index} value={query.sql_query_name}>{query.sql_query_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
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
        </div>
        <div className="form-row-alm">
          <div className="form-column-alm" style={{ width: '100%' }}>
            <label className="auto-size-alm">Custom SQL Query:</label>
            <textarea
              value={customQuery}
              onChange={handleCustomQueryChange}
              rows="10"
              cols="50"
              placeholder="Type your SQL query here.  Insert, Update, and Select * are restricted keywords."  
              className="auto-size-alm query-textarea"
              style={{ width: '100%', fontSize: '16px', color: 'blue', resize: 'both', overflow: 'auto' }}
            />
            <div className="button-row">
              <button onClick={handleExecuteCustomQuery} className="back-button">Execute Query</button>
              <button onClick={handleSaveQuery} className="back-button">Save Query</button>
              <button onClick={handleGoBack} className="back-button">Back to Main Menu</button>
            </div>
          </div>
        </div>
      </div>
      <div className="query-results-section">
        {loading && <div className="loading-spinner"></div>}
        {!loading && customQueryResults.length > 0 && (
          <div className="custom-query-results">
            <h2>Query Results</h2>
            {renderTable(customQueryResults, filters, handleFilterChange)}
            <button onClick={handleDownloadExcel} className="download-button">Download Excel</button>
          </div>
        )}
      </div>
    </div>
  );
};

AlmQueryEditor.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default AlmQueryEditor;