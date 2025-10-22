import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import frontendJenkinsconfig from '../frontendJenkinsconfig';
import '../styles/MmtgParser.css';
import { useNavigate } from 'react-router-dom';

const TestCaseManager = () => {
  const history = useNavigate();
  const [formData, setFormData] = useState({
    repositoryName: '',
    branchName: '',
    robotFileName: ''
  });

  const [repositories, setRepositories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [robotFiles, setRobotFiles] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [storedTestCases, setStoredTestCases] = useState([]);
  const [filteredStoredTestCases, setFilteredStoredTestCases] = useState([]);
  const [viewMode, setViewMode] = useState(''); // '', 'insert' or 'view'
  const [storedFilters, setStoredFilters] = useState({
    repositoryName: '',
    branchName: '',
    robotFilePath: '',
    testCaseName: '',
    documentation: '',
    steps: '',
    hasDocumentation: 'all'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRepositories, setIsLoadingRepositories] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingRobotFiles, setIsLoadingRobotFiles] = useState(false);
  const [isLoadingTestCases, setIsLoadingTestCases] = useState(false);
  const [isLoadingStoredTestCases, setIsLoadingStoredTestCases] = useState(false);
  const [isInsertingTestCases, setIsInsertingTestCases] = useState(false);
  const [logs, setLogs] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const logContainerRef = useRef(null);

  useEffect(() => {
    document.title = 'Test Case Database Manager';
    fetchRepositories();
    if (viewMode === 'view') {
      fetchStoredTestCases();
    }

    return () => {
      setIsLoading(false);
    };
  }, [viewMode]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    // Apply filters to stored test cases
    let filtered = storedTestCases;

    if (storedFilters.repositoryName) {
      filtered = filtered.filter(testCase => 
        testCase.repository_name.toLowerCase().includes(storedFilters.repositoryName.toLowerCase())
      );
    }

    if (storedFilters.branchName) {
      filtered = filtered.filter(testCase => 
        testCase.branch_name.toLowerCase().includes(storedFilters.branchName.toLowerCase())
      );
    }

    if (storedFilters.robotFilePath) {
      filtered = filtered.filter(testCase => 
        testCase.robot_file_path.toLowerCase().includes(storedFilters.robotFilePath.toLowerCase())
      );
    }

    if (storedFilters.testCaseName) {
      filtered = filtered.filter(testCase => 
        testCase.test_case_name.toLowerCase().includes(storedFilters.testCaseName.toLowerCase())
      );
    }

    if (storedFilters.documentation) {
      filtered = filtered.filter(testCase => 
        testCase.documentation && testCase.documentation.toLowerCase().includes(storedFilters.documentation.toLowerCase())
      );
    }

    if (storedFilters.steps) {
      filtered = filtered.filter(testCase => {
        if (testCase.steps) {
          const steps = JSON.parse(testCase.steps || '[]');
          return steps.some(step => 
            step.toLowerCase().includes(storedFilters.steps.toLowerCase())
          );
        }
        return false;
      });
    }

    if (storedFilters.hasDocumentation !== 'all') {
      if (storedFilters.hasDocumentation === 'yes') {
        filtered = filtered.filter(testCase => testCase.documentation && testCase.documentation.trim() !== '');
      } else if (storedFilters.hasDocumentation === 'no') {
        filtered = filtered.filter(testCase => !testCase.documentation || testCase.documentation.trim() === '');
      }
    }

    setFilteredStoredTestCases(filtered);
  }, [storedTestCases, storedFilters]);

  const fetchStoredTestCases = async () => {
    setIsLoadingStoredTestCases(true);
    setError(null);
    
    try {
      const response = await axios.get(`${frontendJenkinsconfig.backendUrl}/view-test-cases`);
      
      setStoredTestCases(response.data.test_cases || []);
    } catch (error) {
      console.error('Error fetching stored test cases:', error);
      setError('Failed to fetch stored test cases: ' + (error.response?.data?.detail || error.message));
      setStoredTestCases([]);
    } finally {
      setIsLoadingStoredTestCases(false);
    }
  };

  const fetchRepositories = async () => {
    setIsLoadingRepositories(true);
    setError(null);
    
    try {
      const organizationUrl = 'https://github.cibcdevops.com/CB-PT-QE-Automation';
      const response = await axios.get(`${frontendJenkinsconfig.backendUrl}/git-repositories`, {
        params: {
          organization_url: organizationUrl
        }
      });
      
      setRepositories(response.data.repositories || []);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setError('Failed to fetch repositories: ' + (error.response?.data?.detail || error.message));
      setRepositories([]);
    } finally {
      setIsLoadingRepositories(false);
    }
  };

  const fetchBranches = async (repositoryName) => {
    if (!repositoryName) {
      setBranches([]);
      setRobotFiles([]);
      return;
    }

    setIsLoadingBranches(true);
    setError(null);
    
    try {
      const repositoryUrl = `git@github.cibcdevops.com:CB-PT-QE-Automation/${repositoryName}.git`;
      const response = await axios.get(`${frontendJenkinsconfig.backendUrl}/git-branches`, {
        params: {
          repository_url: repositoryUrl
        }
      });
      
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to fetch branches: ' + (error.response?.data?.detail || error.message));
      setBranches([]);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const fetchRobotFiles = async (repositoryName, branchName) => {
    if (!repositoryName || !branchName) {
      setRobotFiles([]);
      setTestCases([]);
      setSelectedTestCases([]);
      return;
    }

    setIsLoadingRobotFiles(true);
    setError(null);
    
    try {
      const response = await axios.get(`${frontendJenkinsconfig.backendUrl}/git-robot-files`, {
        params: {
          repository_name: repositoryName,
          branch_name: branchName,
          organization: 'CB-PT-QE-Automation'
        }
      });
      
      setRobotFiles(response.data.robot_files || []);
    } catch (error) {
      console.error('Error fetching robot files:', error);
      setError('Failed to fetch robot files: ' + (error.response?.data?.detail || error.message));
      setRobotFiles([]);
    } finally {
      setIsLoadingRobotFiles(false);
    }
  };

  const fetchTestCases = async (repositoryName, branchName, robotFileName) => {
    if (!repositoryName || !branchName || !robotFileName) {
      setTestCases([]);
      setSelectedTestCases([]);
      return;
    }

    setIsLoadingTestCases(true);
    setError(null);
    
    try {
      const response = await axios.get(`${frontendJenkinsconfig.backendUrl}/git-robot-testcases-details`, {
        params: {
          repository_name: repositoryName,
          branch_name: branchName,
          robot_file_path: robotFileName,
          organization: 'CB-PT-QE-Automation'
        }
      });
      
      setTestCases(response.data.test_cases || []);
      setSelectedTestCases([]); // Reset selected test cases
    } catch (error) {
      console.error('Error fetching test cases:', error);
      setError('Failed to fetch test cases: ' + (error.response?.data?.detail || error.message));
      setTestCases([]);
      setSelectedTestCases([]);
    } finally {
      setIsLoadingTestCases(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'repositoryName') {
      setFormData({
        ...formData,
        [name]: value,
        branchName: '', // Reset branch selection when repository changes
        robotFileName: '' // Reset robot file selection when repository changes
      });
      setTestCases([]);
      setSelectedTestCases([]);
      fetchBranches(value);
    }

    if (name === 'branchName') {
      setFormData({
        ...formData,
        [name]: value,
        robotFileName: '' // Reset robot file selection when branch changes
      });
      setTestCases([]);
      setSelectedTestCases([]);
      fetchRobotFiles(formData.repositoryName, value);
    }

    if (name === 'robotFileName') {
      setTestCases([]);
      setSelectedTestCases([]);
      fetchTestCases(formData.repositoryName, formData.branchName, value);
    }
  };

  const handleTestCaseSelection = (testCase) => {
    setSelectedTestCases(prev => {
      if (prev.some(tc => tc.name === testCase.name)) {
        return prev.filter(tc => tc.name !== testCase.name);
      } else {
        return [...prev, testCase];
      }
    });
  };

  const handleStoredFilterChange = (filterName, value) => {
    setStoredFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearStoredFilters = () => {
    setStoredFilters({
      repositoryName: '',
      branchName: '',
      robotFilePath: '',
      testCaseName: '',
      documentation: '',
      steps: '',
      hasDocumentation: 'all'
    });
  };

  // Helper function to determine which test cases to display
  const getDisplayedTestCases = () => {
    // Check if any filters are active
    const hasActiveFilters = Object.values(storedFilters).some(filter => 
      filter !== '' && filter !== 'all'
    );
    
    // If no filters are active, show all test cases
    if (!hasActiveFilters) {
      return storedTestCases;
    }
    
    // If filters are active, show filtered results (even if empty)
    return filteredStoredTestCases;
  };

  const handleSelectAllTestCases = () => {
    if (selectedTestCases.length === testCases.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases([...testCases]);
    }
  };

  const handleGoBack = () => {
    history.push('/');
  };

  const handleInsertTestCases = async () => {
    if (selectedTestCases.length === 0) {
      setError('Please select at least one test case to insert.');
      return;
    }

    setIsInsertingTestCases(true);
    setError(null);
    setSuccessMessage('');
    setLogs('Starting test case insertion...\n');

    try {
      const payload = {
        repository_name: formData.repositoryName,
        branch_name: formData.branchName,
        robot_file_path: formData.robotFileName,
        test_cases: selectedTestCases
      };

      setLogs(prev => prev + 'Sending test cases to backend for database insertion...\n');

      const response = await axios.post(`${frontendJenkinsconfig.backendUrl}/insert-test-cases`, payload);

      if (response.data.status === 'success') {
        const { inserted_count, updated_count, skipped_count, total_processed } = response.data;
        
        setSuccessMessage(
          `Test cases processed successfully!\n` +
          `Total Processed: ${total_processed}\n` +
          `Inserted: ${inserted_count}\n` +
          `Updated: ${updated_count}\n` +
          `Skipped (already exists): ${skipped_count}`
        );
        
        setLogs(prev => prev + 
          ` Database operation completed!\n` +
          ` Results:\n` +
          `  • Total Processed: ${total_processed}\n` +
          `  • New Records Inserted: ${inserted_count}\n` +
          `  • Existing Records Updated: ${updated_count}\n` +
          `  • Skipped (Duplicates): ${skipped_count}\n`
        );
      } else {
        setError('Failed to insert test cases: ' + response.data.message);
        setLogs(prev => prev + `❌ Error: ${response.data.message}\n`);
      }
    } catch (error) {
      console.error('Error inserting test cases:', error);
      setError('Failed to insert test cases: ' + (error.response?.data?.detail || error.message));
      setLogs(prev => prev + `❌ Error: ${error.response?.data?.detail || error.message}\n`);
    } finally {
      setIsInsertingTestCases(false);
    }
  };

  return (
    <div className="form-page">
      <h1>Test Case Database Manager</h1>
      
      <div className="info-banner" style={{ 
        backgroundColor: '#e7f3ff', 
        padding: '10px', 
        margin: '10px 0', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <strong>Purpose:</strong> Extract test cases from Robot Framework files and store them in MySQL database with documentation and steps.
        <br />
        <strong>Github Organization:</strong> https://github.cibcdevops.com/CB-PT-QE-Automation
      </div>

            <div className="form-type-row">
                <label htmlFor="formType">Select Operation Mode:</label>
                <select id="formType" className="select-form-type-row"           value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}>
            <option value="">Select Mode</option>
          <option value="insert">Insert New Test Cases</option>
          <option value="view">View Stored Test Cases</option>
                </select>
            </div>


      <div className="form-container">
        {viewMode === '' ? (
          <div >
          </div>
        ) : viewMode === 'insert' ? (
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <label>Select Repository:</label>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              alignItems: 'center',
              marginTop: '5px'
            }}>
              <select
                name="repositoryName"
                value={formData.repositoryName}
                onChange={handleInputChange}
                className="form-control"
                required
                disabled={isLoadingRepositories}
                style={{ flex: 1, minWidth: '450px' }}
              >
                <option value="">
                  {isLoadingRepositories ? 'Loading repositories...' : 'Select a repository'}
                </option>
                {repositories.map((repo, index) => (
                  <option key={index} value={repo}>
                    {repo}
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={fetchRepositories} 
                className="refresh-button"
                disabled={isLoadingRepositories}
                style={{ 
                  whiteSpace: 'nowrap',
                  minWidth: '150px',
                  padding: '8px 16px'
                }}
              >
                {isLoadingRepositories ? 'Refreshing...' : 'Refresh Repositories'}
              </button>
            </div>
            {isLoadingRepositories && <div className="loading-spinner" style={{ marginTop: '5px' }}></div>}
          </div>

          <div className="form-row">
            <label>Select Branch:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                className="form-control"
                required
                disabled={isLoadingBranches || !formData.repositoryName}
                style={{ flex: 1, minWidth: '500px' }}
              >
                <option value="">
                  {!formData.repositoryName 
                    ? 'Select a repository first' 
                    : isLoadingBranches 
                      ? 'Loading branches...' 
                      : 'Select a branch'
                  }
                </option>
                {branches.map((branch, index) => (
                  <option key={index} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={() => fetchBranches(formData.repositoryName)} 
                className="refresh-button"
                disabled={isLoadingBranches || !formData.repositoryName}
              >
                {isLoadingBranches ? 'Refreshing...' : 'Refresh Branches'}
              </button>
            </div>
            {isLoadingBranches && <div className="loading-spinner"></div>}
          </div>

          {/* Robot Files Selection - Only show if branch is selected and robot files are available */}
          {formData.branchName && (
            <div className="form-row">
              <label>Select Robot Script:</label>
              <div style={{ 
                display: 'flex', 
                gap: '15px', 
                alignItems: 'center',
                marginTop: '5px'
              }}>
                <select
                  name="robotFileName"
                  value={formData.robotFileName}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                  disabled={isLoadingRobotFiles}
                  style={{ flex: 1, minWidth: '450px' }}
                >
                  <option value="">
                    {isLoadingRobotFiles 
                      ? 'Loading robot files...' 
                      : robotFiles.length === 0 
                        ? 'No robot files found' 
                        : 'Select a robot script'
                    }
                  </option>
                  {robotFiles.map((file, index) => (
                    <option key={index} value={file}>
                      {file}
                    </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => fetchRobotFiles(formData.repositoryName, formData.branchName)} 
                  className="refresh-button"
                  disabled={isLoadingRobotFiles || !formData.branchName}
                  style={{ 
                    whiteSpace: 'nowrap',
                    minWidth: '150px',
                    padding: '8px 16px'
                  }}
                >
                  {isLoadingRobotFiles ? '' : 'Refresh Scripts'}
                </button>
              </div>
              {isLoadingRobotFiles && <div className="loading-spinner"></div>}
            </div>
          )}

          {/* Test Cases Selection - Only show if robot file is selected and test cases are available */}
          {formData.robotFileName && (
            <div className="form-row">
              <label>Test Cases with Documentation:</label>
              <div style={{ marginTop: '5px' }}>
                {isLoadingTestCases ? (
                  <div>Loading test cases with documentation...</div>
                ) : testCases.length === 0 ? (
                  <div>No test cases found in selected robot file</div>
                ) : (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '15px', 
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <button 
                        type="button" 
                        onClick={handleSelectAllTestCases}
                        className="refresh-button"
                        style={{ 
                          padding: '6px 12px',
                          fontSize: '12px'
                        }}
                      >
                        {selectedTestCases.length === testCases.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {selectedTestCases.length} of {testCases.length} test cases selected
                      </span>
                      <button 
                        type="button" 
                        onClick={() => fetchTestCases(formData.repositoryName, formData.branchName, formData.robotFileName)} 
                        className="refresh-button"
                        disabled={isLoadingTestCases}
                        style={{ 
                          whiteSpace: 'nowrap',
                          minWidth: '120px',
                          padding: '6px 12px',
                          fontSize: '12px'
                        }}
                      >
                        {isLoadingTestCases ? 'Refreshing...' : 'Refresh Test Cases'}
                      </button>
                    </div>
                    
                    {/* Test cases in grid/table format */}
                    <div style={{
                      maxHeight: '500px',
                      overflowY: 'auto',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff'
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                      }}>
                        <thead style={{
                          backgroundColor: '#f8f9fa',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1
                        }}>
                          <tr>
                            <th style={{
                              padding: '12px 8px',
                              textAlign: 'left',
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: 'bold',
                              width: '40px'
                            }}>
                              <input
                                type="checkbox"
                                checked={selectedTestCases.length === testCases.length && testCases.length > 0}
                                onChange={handleSelectAllTestCases}
                                style={{ cursor: 'pointer' }}
                              />
                            </th>
                            <th style={{
                              padding: '12px 8px',
                              textAlign: 'left',
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: 'bold',
                              width: '30%'
                            }}>
                              Test Case Name
                            </th>
                            <th style={{
                              padding: '12px 8px',
                              textAlign: 'left',
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: 'bold',
                              width: '35%'
                            }}>
                              Documentation
                            </th>
                            <th style={{
                              padding: '12px 8px',
                              textAlign: 'center',
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: 'bold',
                              width: '80px'
                            }}>
                              Steps Count
                            </th>
                            <th style={{
                              padding: '12px 8px',
                              textAlign: 'left',
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: 'bold'
                            }}>
                              Preview Steps
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {testCases.map((testCase, index) => (
                            <tr key={index} style={{
                              borderBottom: '1px solid #dee2e6',
                              backgroundColor: selectedTestCases.some(tc => tc.name === testCase.name) ? '#e8f4f8' : 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleTestCaseSelection(testCase)}
                            onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = selectedTestCases.some(tc => tc.name === testCase.name) ? '#d1ecf1' : '#f8f9fa'}
                            onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = selectedTestCases.some(tc => tc.name === testCase.name) ? '#e8f4f8' : 'transparent'}
                            >
                              <td style={{
                                padding: '12px 8px',
                                verticalAlign: 'top'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={selectedTestCases.some(tc => tc.name === testCase.name)}
                                  onChange={() => handleTestCaseSelection(testCase)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ cursor: 'pointer' }}
                                />
                              </td>
                              <td style={{
                                padding: '12px 8px',
                                verticalAlign: 'top',
                                fontWeight: '500',
                                color: '#2c3e50',
                                wordWrap: 'break-word'
                              }}>
                                {testCase.name}
                              </td>
                              <td style={{
                                padding: '12px 8px',
                                verticalAlign: 'top',
                                color: '#6c757d',
                                fontStyle: testCase.documentation ? 'normal' : 'italic',
                                wordWrap: 'break-word'
                              }}>
                                {testCase.documentation || 'No documentation available'}
                              </td>
                              <td style={{
                                padding: '12px 8px',
                                verticalAlign: 'top',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: '#28a745'
                              }}>
                                {testCase.steps ? testCase.steps.length : 0}
                              </td>
                              <td style={{
                                padding: '12px 8px',
                                verticalAlign: 'top',
                                fontSize: '12px',
                                color: '#6c757d'
                              }}>
                                {testCase.steps && testCase.steps.length > 0 ? (
                                  <div>
                                    {testCase.steps.slice(0, 2).map((step, stepIndex) => (
                                      <div key={stepIndex} style={{ 
                                        marginBottom: '3px',
                                        padding: '2px 0',
                                        borderLeft: '2px solid #e9ecef',
                                        paddingLeft: '6px'
                                      }}>
                                        • {step.length > 50 ? `${step.substring(0, 50)}...` : step}
                                      </div>
                                    ))}
                                    {testCase.steps.length > 2 && (
                                      <div style={{ 
                                        color: '#868e96', 
                                        fontStyle: 'italic',
                                        fontSize: '11px'
                                      }}>
                                        ... and {testCase.steps.length - 2} more steps
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ fontStyle: 'italic', color: '#adb5bd' }}>
                                    No steps available
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {testCases.length === 0 && (
                        <div style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#6c757d',
                          fontStyle: 'italic'
                        }}>
                          No test cases found in the selected Robot Framework file
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {isLoadingTestCases && <div className="loading-spinner" style={{ marginTop: '5px' }}></div>}
              </div>
            </div>
          )}

          <div className="button-row">
            <button 
              type="button" 
              onClick={handleInsertTestCases}
              className="back-button" 
              disabled={isInsertingTestCases || selectedTestCases.length === 0}
              style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
            >
              {isInsertingTestCases ? 'Inserting Test Cases...' : `Insert ${selectedTestCases.length} Test Cases to Database`}
            </button>
            <button type="button" className="back-button" onClick={handleGoBack}>
              Back to Main
            </button>
          </div>


          {/* Operation Logs - Only for Insert Mode */}
          <div className="logs-section">
            <h2>Operation Logs</h2>
            <div
              className="logs-container"
              ref={logContainerRef}
            >
              {logs ? <pre>{logs}</pre> : <p className="no-logs-message">Logs will appear here during operation</p>}
            </div>
          </div>
        </form>
        ) : (
        // View Mode - Show stored test cases
        <div>
          {/* <h2 style={{ color: '#28a745', marginBottom: '20px' }}>Stored Test Cases Database</h2> */}
          
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <button 
              type="button" 
              onClick={fetchStoredTestCases}
              className="refresh-button"
              disabled={isLoadingStoredTestCases}
              style={{ 
                padding: '8px 16px',
                fontSize: '14px'
              }}
            >
              {isLoadingStoredTestCases ? 'Loading...' : 'Refresh Data'}
            </button>
            <button 
              type="button" 
              onClick={clearStoredFilters}
              className="refresh-button"
              style={{ 
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#6c757d',
                borderColor: '#6c757d'
              }}
            >
              Clear Filters
            </button>
            <span style={{ fontSize: '14px', color: '#666', marginLeft: 'auto' }}>
              Showing {getDisplayedTestCases().length} of {storedTestCases.length} test cases
              {Object.values(storedFilters).some(filter => filter !== '' && filter !== 'all') && (
                <span style={{ color: '#007bff', marginLeft: '5px' }}>
                  (filtered)
                </span>
              )}
            </span>
          </div>

          {/* Stored Test Cases Table */}
          {isLoadingStoredTestCases ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading stored test cases...</div>
          ) : (
            <div style={{
              maxHeight: '600px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#ffffff'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead style={{
                  backgroundColor: '#f8f9fa',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  <tr>
                    <th style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      width: '10%'
                    }}>
                      <div style={{ marginBottom: '8px' }}>Repository</div>
                      <input
                        type="text"
                        placeholder="Filter repository"
                        value={storedFilters.repositoryName}
                        onChange={(e) => handleStoredFilterChange('repositoryName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '12px',
                          border: '1px solid #ced4da',
                          borderRadius: '3px'
                        }}
                      />
                    </th>
                    <th style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      width: '8%'
                    }}>
                      <div style={{ marginBottom: '8px' }}>Branch</div>
                      <input
                        type="text"
                        placeholder="Filter branch"
                        value={storedFilters.branchName}
                        onChange={(e) => handleStoredFilterChange('branchName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '12px',
                          border: '1px solid #ced4da',
                          borderRadius: '3px'
                        }}
                      />
                    </th>
                    <th style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      width: '20%'
                    }}>
                      <div style={{ marginBottom: '8px' }}>Robot File Path</div>
                      <input
                        type="text"
                        placeholder="Filter file path"
                        value={storedFilters.robotFilePath}
                        onChange={(e) => handleStoredFilterChange('robotFilePath', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '12px',
                          border: '1px solid #ced4da',
                          borderRadius: '3px'
                        }}
                      />
                    </th>
                    <th style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      width: '20%'
                    }}>
                      <div style={{ marginBottom: '8px' }}>Test Case Name</div>
                      <input
                        type="text"
                        placeholder="Filter test case"
                        value={storedFilters.testCaseName}
                        onChange={(e) => handleStoredFilterChange('testCaseName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '12px',
                          border: '1px solid #ced4da',
                          borderRadius: '3px'
                        }}
                      />
                    </th>
                    <th style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      width: '20%'
                    }}>
                      <div style={{ marginBottom: '8px' }}>Documentation</div>
                      <input
                        type="text"
                        placeholder="Filter documentation"
                        value={storedFilters.documentation}
                        onChange={(e) => handleStoredFilterChange('documentation', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '12px',
                          border: '1px solid #ced4da',
                          borderRadius: '3px'
                        }}
                      />
                    </th>
                    <th style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      width: '22%'
                    }}>
                      <div style={{ marginBottom: '8px' }}>Steps</div>
                      <input
                        type="text"
                        placeholder="Filter steps"
                        value={storedFilters.steps || ''}
                        onChange={(e) => handleStoredFilterChange('steps', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '12px',
                          border: '1px solid #ced4da',
                          borderRadius: '3px'
                        }}
                      />
                    </th>
                    <th style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      width: '10%'
                    }}>
                      <div style={{ marginBottom: '8px' }}>Created Date</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getDisplayedTestCases().map((testCase, index) => (
                    <tr key={testCase.id || index} style={{
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: 'transparent'
                    }}>
                      <td style={{
                        padding: '12px 8px',
                        verticalAlign: 'top',
                        fontWeight: '500',
                        color: '#2c3e50',
                        border: '1px solid #dee2e6',
                        wordWrap: 'break-word'
                      }}>
                        {testCase.repository_name}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        verticalAlign: 'top',
                        color: '#6c757d',
                        border: '1px solid #dee2e6',
                        wordWrap: 'break-word'
                      }}>
                        {testCase.branch_name}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        verticalAlign: 'top',
                        color: '#6c757d',
                        fontSize: '12px',
                        border: '1px solid #dee2e6',
                        wordWrap: 'break-word'
                      }}>
                        {testCase.robot_file_path}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        verticalAlign: 'top',
                        fontWeight: '500',
                        color: '#2c3e50',
                        border: '1px solid #dee2e6',
                        wordWrap: 'break-word'
                      }}>
                        {testCase.test_case_name}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        verticalAlign: 'top',
                        color: '#6c757d',
                        fontStyle: testCase.documentation ? 'normal' : 'italic',
                        border: '1px solid #dee2e6',
                        wordWrap: 'break-word'
                      }}>
                        {testCase.documentation || 'No documentation available'}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        verticalAlign: 'top',
                        fontSize: '12px',
                        color: '#6c757d',
                        maxWidth: '300px',
                        border: '1px solid #dee2e6',
                        wordWrap: 'break-word'
                      }}>
                        {testCase.steps ? (
                          <div style={{ 
                            maxHeight: '200px',
                            overflowY: 'auto',
                            border: '1px solid #e9ecef',
                            borderRadius: '3px',
                            padding: '6px',
                            backgroundColor: '#f8f9fa'
                          }}>
                            {JSON.parse(testCase.steps || '[]').map((step, stepIndex) => (
                              <div key={stepIndex} style={{ 
                                marginBottom: '4px',
                                padding: '3px 0',
                                borderLeft: '2px solid #007bff',
                                paddingLeft: '8px',
                                lineHeight: '1.4'
                              }}>
                                <strong>{stepIndex + 1}.</strong> {step}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#adb5bd' }}>
                            No steps available
                          </span>
                        )}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        verticalAlign: 'top',
                        fontSize: '12px',
                        border: '1px solid #dee2e6',
                        color: '#6c757d'
                      }}>
                        {testCase.created_at ? new Date(testCase.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {getDisplayedTestCases().length === 0 && !isLoadingStoredTestCases && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  {Object.values(storedFilters).some(filter => filter !== '' && filter !== 'all') && storedTestCases.length > 0 
                    ? 'No test cases match the current filters' 
                    : 'No test cases found in the database'}
                </div>
              )}
            </div>
          )}

          <div className="form-row" style={{ marginTop: '20px', textAlign: 'center' }}>
            <button type="button" className="back-button" onClick={handleGoBack}>
              Back to Main
            </button>
          </div>
        </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '10px',
          margin: '10px 0',
          borderRadius: '5px',
          whiteSpace: 'pre-line'
        }}>
          <strong>Success:</strong> {successMessage}
        </div>
      )}
    </div>
  );
};

export default TestCaseManager;
