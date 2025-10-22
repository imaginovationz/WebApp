import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import frontendJenkinsconfig from '../frontendJenkinsconfig';
import '../styles/MmtgParser.css';
import { useNavigate } from 'react-router-dom';

const MmtgDealGenerate = () => {
  const history = useNavigate();
  const [formData, setFormData] = useState({
    excelFilePath: '',
    env: '',
    crm_url: '',
    mmtg_url: '',
    crm_User_Name : '',
    branch: '',
    email:  ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState('');
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const logContainerRef = useRef(null);

  useEffect(() => {
    document.title = 'CBPT Automation Team Tracker';

    fetchBranches();

    // Cleanup function to stop polling on unmount
    return () => {
      setIsLoading(false);
    };
  }, []);

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const repositoryUrl = 'https://github.cibcdevops.com/CB-PT-QE-Automation/MMTG_TDM.git';
      const response = await axios.get(`${frontendJenkinsconfig.backendUrl}/git-branches`, {
        params: { repository_url: repositoryUrl }
      });
      
      if (response.data.status === 'success') {
        setBranches(response.data.branches);
      } else {
        console.error('Failed to fetch branches:', response.data);
        setError('Failed to fetch branches from repository');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Error fetching branches from repository');
      // Fallback to default branches if API fails
      setBranches(['mvp_8.2_1e', 'master']);
    } finally {
      setBranchesLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the logs whenever they update
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isLoading) {
        event.preventDefault();
        // This message will not be displayed but still adding it..it will not be displayed due to sec issues.
        event.returnValue = 'A job is currently running. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleGoBack = () => {
    history.push('/');
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

        // If the job is complete, stop polling
        if (complete) {
          const resultMessage = `\nJob completed with result: ${result || 'UNKNOWN'}\n`;
          setLogs((prevLogs) => prevLogs + resultMessage);
          setIsLoading(false);
          alert(`Job completed!\nBuild Number: ${build_number}\nResult: ${result || 'UNKNOWN'}`);
          
          axios
          .post(`${frontendJenkinsconfig.backendUrl}/update-job-log`, {
            job_path,
            build_number,
          })
          .then(() => {
            console.log(`Logs for job '${job_path}' (Build #${build_number}) updated in the database.`);
          })
          .catch((error) => {
            console.error('Error updating job logs in the database:', error);
            setLogs((prevLogs) => prevLogs + `\nError updating job logs in the database: ${error.message}\n`);
          });
          
          return; // Stop further polling
        }

        // If the job is still running, poll again after 2 seconds
        setTimeout(() => {
          const newOffset = previousLength + (newLogs ? newLogs.length : 0);
          pollJobLogs(job_path, build_number, newOffset);
        }, 2000);
      })
      .catch((error) => {
        console.error('Error polling logs:', error);
        setLogs((prevLogs) => prevLogs + `\nError polling logs: ${error.message}. Retrying in 2 seconds...\n`);

        // Retry after 2 seconds in case of an error
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
      const { username, password, env, email } = formData;
      let baseUrl = '';
      let mmtgBaseUrl = '';

      switch (env) {
        case 'SIT':
          baseUrl = 'dev.cibccrm.cibc.com/CIBCMortgageSIT/main.aspx';
          mmtgBaseUrl = 'https://sit.cibc.digitalmmortgage.com/login/';
          break;
        case 'SIT2':
          baseUrl = 'dev.cibccrm.cibc.com/CIBCMortgageSIT2/main.aspx';
          mmtgBaseUrl = 'https://sit2.cibc.digitalmmortgage.com/login/';
          break;
        case 'SIT3':
          baseUrl = 'dev.cibccrm.cibc.com/CIBCMortgageSIT3/main.aspx';
          mmtgBaseUrl = 'https://sit3.cibc.digitalmmortgage.com/login/';
          break;
        case 'SIT4':
          baseUrl = 'dev.cibccrm.cibc.com/CIBCMortgageSIT4/main.aspx';
          mmtgBaseUrl = 'https://sit4.cibc.digitalmmortgage.com/login/';
          break;
        case 'UAT':
          baseUrl = 'preprod.cibccrm.cibc.com/CIBCMortgageUAT/main.aspx';
          mmtgBaseUrl = 'https://uat.cibc.digitalmmortgage.com/login/';
          break;
        default:
          throw new Error('Invalid environment selected');
      }

      const updatedPassword = `${password}@`;
      const crmUrl = `https://${username}:${encodeURIComponent(updatedPassword)}@${baseUrl}`;


      const payload = {

        job_path: 'job/Automation_Portal/job/MMTG_TDM', // Replace with the actual job path
        parameters: {
          BRANCH_NAME: formData.branch.trim(),
          EXCEL_FILE_PATH: formData.excelFilePath.trim(),
          ENV: formData.env.trim(),
          CRM_URL: crmUrl.trim(),
          MMTG_URL: mmtgBaseUrl.trim(),
          CRM_USER :username.trim(),
          EMAIL_RECIPIENT : email.trim()
        },
      };

      alert('Payload is ' + JSON.stringify(payload, null, 2));
      setLogs('Triggering Jenkins job...\n');


      // Trigger the Jenkins job
      const response = await axios.post(`${frontendJenkinsconfig.backendUrl}/trigger-job`, payload);

      // Extract job path and build number from the response
      const { job_path, build_number } = response.data;

      setLogs((prevLogs) => prevLogs + `Job triggered successfully!\nBuild number: ${build_number}\n\n`);

      // Start polling for logs
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
      <h1>MMTG Origination Deal Creation</h1>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Enter Excel File Path:</label>
            <input
              type="text"
              id="excelFilePath"
              name="excelFilePath"
              value={formData.excelFilePath}
              onChange={handleInputChange}
              className="form-control"
              required
              placeholder="Enter Excel file path"
            />
          </div>
          <label className="form-row-temp" style={{ color: 'green', marginTop: '-30px' }}>
            *Fill TDM Sheet and pass the path of T Drive. e.g. T:\IT\mMTG_Data Sheet_V4.9_v5_second new.xlsm
          </label>
          <br></br>
          <div className="form-row">
            <label>Email for Notification:</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-control"
                required
                placeholder="Enter Email address. TO pass multiple email_id use comma separated values"
              />
            </div>
            <br></br>
          <div className="form-row">
            <div className="form-row">
              <label>Enter CRM Userid:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="form-control"
                required
                placeholder="Enter CRM username"
              />
            </div>

            <div className="form-row">
              <label>Enter CRM Password:</label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-control"
                required
                placeholder="Enter CRM password"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-row">
              <label>ExecutedEnvironment:</label>
              <select
                name="env"
                value={formData.env}
                onChange={handleInputChange}
                style={{ marginRight: '10px' }} // Add space between the selects
                required
              >
                <option value=""></option>
                <option value="SIT">SIT</option>
                <option value="SIT2">SIT2</option>
                <option value="SIT3">SIT3</option>
                <option value="SIT4">SIT4</option>
                <option value="UAT">UAT</option>
              </select>
            </div>
            <div className="form-row">
              <label>Run TDM for:</label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                required
                disabled={branchesLoading}
              >
                <option value="">
                  {branchesLoading ? 'Loading MMTG TDM branches...' : 'Select a branch'}
                </option>
                {branches.map((branch, index) => (
                  <option key={index} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              {branchesLoading && (
                <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                  Fetching MMTG TDM branches from repository...
                </span>
              )}
            </div>
          </div>
          <div className="form-row">
            <button type="submit" className="back-button" disabled={isLoading}>
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
          {logs ? <pre>{logs}</pre> : <p className="no-logs-message">Logs sections</p>}
        </div>
      </div>
    </div>
  );
};

export default MmtgDealGenerate;