import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import frontendJenkinsconfig from '../frontendJenkinsconfig';
import '../styles/MmtgParser.css';
//import { useHistory } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const CBPTQEAutomationJob = () => {
  //const history = useHistory();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    repositoryName: '',
    branchName: '',
    robotFileName: '',
    configFilePath: '',
    email: ''
  });

  const [repositories, setRepositories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [robotFiles, setRobotFiles] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [configSourcePath, setConfigSourcePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRepositories, setIsLoadingRepositories] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingRobotFiles, setIsLoadingRobotFiles] = useState(false);
  const [isLoadingTestCases, setIsLoadingTestCases] = useState(false);
  const [logs, setLogs] = useState('');
  const [error, setError] = useState(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    document.title = 'CB&PT QE RobotFramework Job Runner';
    fetchRepositories();

    return () => {
      setIsLoading(false);
    };
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isLoading) {
        event.preventDefault();
        event.returnValue = 'A job is currently running. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoading]);

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
      const response = await axios.get(`${frontendJenkinsconfig.backendUrl}/git-robot-testcases`, {
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
      if (prev.includes(testCase)) {
        return prev.filter(tc => tc !== testCase);
      } else {
        return [...prev, testCase];
      }
    });
  };

  const handleSelectAllTestCases = () => {
    if (selectedTestCases.length === testCases.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases([...testCases]);
    }
  };

  const handleConfigSourcePathChange = (e) => {
    setConfigSourcePath(e.target.value);
    setError(null);
  };

  const handleGoBack = () => {
    //history.push('/');
    navigate('/');
  };

  // Poll logs every 2 seconds
  const pollJobLogs = (job_path, build_number, previousLength = 0) => {
    axios
      .get(`${frontendJenkinsconfig.backendUrl}/job-logs-poll/${job_path}/${build_number}?offset=${previousLength}`)
      .then((response) => {
        const { logs: newLogs, complete, result } = response.data;

        // Append new logs to the UI
        if (newLogs && newLogs.length > 0) {
          setLogs((prevLogs) => prevLogs + newLogs);
        }

        if (complete) {
          const jobResult = result || 'UNKNOWN';
          const resultMessage = `\nJob completed with result: ${jobResult}\n`;
          setLogs((prevLogs) => prevLogs + resultMessage);
          setIsLoading(false);
          
          const isSuccess = jobResult === 'SUCCESS';
          const alertMessage = `Job ${isSuccess ? 'completed successfully' : 'failed'}!\nBuild Number: ${build_number}\nResult: ${jobResult}`;
          
          if (isSuccess) {
            alert(alertMessage);
          } else {
            // Show error styling for failed jobs
            setError(`Job failed with result: ${jobResult}`);
            // Still show alert but with failure context
            alert(alertMessage);
          }
          
          axios
            .post(`${frontendJenkinsconfig.backendUrl}/update-job-log`, {
              job_path,
              build_number,
              job_status: jobResult // Explicitly pass the job status
            })
            .then(() => {
              console.log(`Logs for job '${job_path}' (Build #${build_number}) updated in the database with status: ${jobResult}`);
            })
            .catch((error) => {
              console.error('Error updating job logs in the database:', error);
              setLogs((prevLogs) => prevLogs + `\nError updating job logs in the database: ${error.message}\n`);
            });
          
          return; // Stop further polling
        }

        setTimeout(() => {
          const newOffset = previousLength + (newLogs ? newLogs.length : 0);
          pollJobLogs(job_path, build_number, newOffset);
        }, 2000);
      })
      .catch((error) => {
        console.error('Error polling logs:', error);
        setLogs((prevLogs) => prevLogs + `\nError polling logs: ${error.message}. Retrying in 2 seconds...\n`);

        setTimeout(() => {
          pollJobLogs(job_path, build_number, previousLength);
        }, 2000);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLogs('');
    setError(null);

    try {
      const payload = {
        job_path: 'job/Automation_Portal/job/Generic_Robot_Framework_Job', // Correct Jenkins job path
        build_token: 'AutomationRobotframeworkJobTrigger', // Jenkins build trigger token
        parameters: {
          REPOSITORY_NAME: formData.repositoryName.trim(),
          BRANCH_NAME: formData.branchName.trim(),
          ROBOT_FILE_NAME: formData.robotFileName.trim(),
          SELECTED_TEST_CASES: selectedTestCases.join(','),
          CONFIG_FILE_SOURCE_PATH: configSourcePath,
          CONFIG_FILE_DESTINATION_PATH: formData.configFilePath.trim(),
          EMAIL_RECIPIENT: formData.email.trim(),
          REPOSITORY_URL: `git@github.cibcdevops.com:CB-PT-QE-Automation/${formData.repositoryName.trim()}.git`
        },
      };

      alert('Payload is ' + JSON.stringify(payload, null, 2));
      setLogs((prevLogs) => prevLogs + 'Triggering CB&PT QE Automation Jenkins job...\n');

      const response = await axios.post(`${frontendJenkinsconfig.backendUrl}/trigger-job`, payload);

      const { job_path, build_number } = response.data;

      setLogs((prevLogs) => prevLogs + `Job triggered successfully!\nBuild number: ${build_number}\n\n`);

      pollJobLogs(job_path, build_number);
    } catch (error) {
      console.error('Error triggering job:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to trigger Jenkins job');
      setLogs((prevLogs) => prevLogs + `Error: ${error.message}\n`);
      setIsLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h1>CB&PT QE RobotFramework Job Runner</h1>
      
      <div className="info-banner" style={{ 
        backgroundColor: '#e7f3ff', 
        padding: '10px', 
        margin: '10px 0', 
        borderRadius: '5px',
        // borderLeft: '4px solid #007bff',
        fontSize: '14px'
      }}>
        <strong>Organization:</strong> https://github.cibcdevops.com/CB-PT-QE-Automation
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
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
            <div style={{ display: 'flex',  alignItems: 'center' }}>
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
              <label>Select Test Cases:</label>
              <div style={{ marginTop: '5px' }}>
                {isLoadingTestCases ? (
                  <div>Loading test cases...</div>
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
                    <select
                      multiple
                      value={selectedTestCases}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedTestCases(selectedOptions);
                      }}
                      className="form-control"
                      style={{ 
                        height: '200px', 
                        fontSize: '14px',
                        padding: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      {testCases.map((testCase, index) => (
                        <option 
                          key={index} 
                          value={testCase}
                          style={{ 
                            padding: '4px 8px',
                            margin: '2px 0'
                          }}
                        >
                          {testCase}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {isLoadingTestCases && <div className="loading-spinner" style={{ marginTop: '5px' }}></div>}
              </div>
            </div>
          )}

          <div className="form-row">
            <label>Config File Source Path:</label>
            <input
              type="text"
              name="configSourcePath"
              className="form-control"
              placeholder="Enter complete file path (e.g., T:\path\to\config.py or C:\Users\YourName\Desktop\config.yaml)"
              value={configSourcePath}
              onChange={handleConfigSourcePathChange}
              required
            />
          </div>
          <label className="form-row-temp" style={{ color: 'green', marginTop: '-20px' }}>
            *Enter the complete file path including drive letter. Supported formats: .py, .yaml, .yml, .toml
          </label>

          <div className="form-row">
            <label>Config File Destination Path (where to place the file after git clone):</label>
            <input
              type="text"
              name="configFilePath"
              value={formData.configFilePath}
              onChange={handleInputChange}
              className="form-control"
              placeholder="e.g., Resources/Config/config.py or path/to/config.yaml"
              required={!!configSourcePath}
            />
          </div>
          <label className="form-row-temp" style={{ color: 'green', marginTop: '-20px' }}>
            *Specify the relative path where the config file should be copied after git clone
          </label>

          <div className="form-row">
            <label>Email for Notification:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-control"
              required
              placeholder="Enter email address for notifications"
            />
          </div>

          <div className="form-row">
            <button type="submit" className="back-button" disabled={isLoading || isLoadingRepositories || isLoadingBranches || isLoadingRobotFiles || isLoadingTestCases}>
              {isLoading ? 'Running...' : 'Run Jenkins Job'}
            </button>
            <button type="button" className="back-button" onClick={handleGoBack}>
              Back to Main
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="logs-section">
        <h2>Job Logs</h2>
        <div
          className="logs-container"
          ref={logContainerRef}
        >
          {logs ? <pre>{logs}</pre> : <p className="no-logs-message">Logs will appear here when job starts</p>}
        </div>
      </div>
    </div>
  );
};

export default CBPTQEAutomationJob;
