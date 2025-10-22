import React, { useState ,useEffect} from 'react';
import axios from 'axios';
import frontendMmtgconfig from '../frontendMmtgconfig'; // Import the configuration
import '../styles/MmtgParser.css';
import { useNavigate } from 'react-router-dom';

const MmtgParser = () => {
  const [loginUrl, setLoginUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deals, setDeals] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const history = useNavigate();
  
  const handleGoBack = () => {
    history.push('/');
  };

  useEffect(() => {
    document.title = "CBPT Automation Team Tracker";
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null); // Clear the response field

    try {
      const config = {
        login_url: loginUrl,
        username: username,
        password: password,
        deals: deals.split(',').map(deal => deal.trim())
      };
      console.log('config:', config)
      const startTime = Date.now();

      const res = await axios.post(`${frontendMmtgconfig.backendUrl}/run-script`, { config }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'output.xlsx'); // or any other extension
      document.body.appendChild(link);
      link.click();
      const endTime = Date.now();
      const totalSeconds = (endTime - startTime) / 1000; // Convert milliseconds to seconds
    // Calculate hours, minutes, and seconds
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const formattedTime = `${hours}h ${minutes}m ${seconds}s`;

      setResponse(`File downloaded successfully. Time took to run the script: ${formattedTime}` );
    }     catch (error) {
      console.error('Error running script:', error);
  
      // Extract error details
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      const statusCode = error.response?.status || 'No status code';
      const errorDetails = error.response?.data || 'No additional error details';
  
      // Set detailed error response
      setResponse({
        error: 'Error running script.',
        message: errorMessage,
        status: statusCode,
        details: errorDetails
      });
    }
    setLoading(false);
  };

  return (
    <div className="form-page">
      <h1>MMTG Parser Script</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Login URL:</label>
          <select value={loginUrl} onChange={(e) => setLoginUrl(e.target.value)} required>
            <option value="">Select URL</option>
            <option value="https://sit.cibc.digitalmmortgage.com/login/">https://sit.cibc.digitalmmortgage.com/login/</option>
            <option value="https://sit2.cibc.digitalmmortgage.com/login/">https://sit2.cibc.digitalmmortgage.com/login/</option>
            <option value="https://sit3.cibc.digitalmmortgage.com/login/">https://sit3.cibc.digitalmmortgage.com/login/</option>
            <option value="https://sit4.cibc.digitalmmortgage.com/login/">https://sit4.cibc.digitalmmortgage.com/login/</option>
          </select>
        </div>
        <br></br>
        <div className="form-row">
          <div className="form-row">
            <label>MMTG Username:</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>MMTG Password:</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>

        <div className="form-row"  style={{ marginBottom: '-10px' }}>
          <label className="label-mmtg">Deals (comma-separated):</label>
          <input type="text" value={deals} onChange={(e) => setDeals(e.target.value)} required />
        </div>
        <label className="form-row-temp" style={{ color: 'green' , marginTop: '0px' }}>*Try to pass not more than 5 deals at a time to avoid long wait!!!</label>
        <div className="form-row">
          <button type="submit" className="back-button">Run Script</button>
          <button onClick={handleGoBack} className="back-button">Back to Main Menu</button>
        </div>
      </form>
      {loading && <div className="loading-spinner"></div>}
      {response && (
        <div className="response">
          <h2>Response</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default MmtgParser;