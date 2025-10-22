import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/MainPage.css';
import functionalfrontendconfig from './Functional/functionalfrontendconfig'; 
import frontendconfig from '../frontendconfig';
import Latest from './Other/Latest';

const MainPage = () => {
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const SESSION_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours

  useEffect(() => {
    document.title = "CBPT Portal";
    
    // Check if user is already logged in from localStorage
    const storedSession = localStorage.getItem('cbptSession');
    if (storedSession) {
      const session = JSON.parse(storedSession);
      const currentTime = new Date().getTime();
      
      if (currentTime - session.loginTime < SESSION_TIMEOUT) {
        setIsLoggedIn(true);
        setRole(session.role);
        setUserid(session.userid);
        
        // Set timeout for automatic logout
        const remainingTime = SESSION_TIMEOUT - (currentTime - session.loginTime);
        setTimeout(() => {
          handleLogout();
        }, remainingTime);
      } else {
        // Session expired, clear storage
        localStorage.removeItem('cbptSession');
      }
    }
  }, []);

const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setRole('');
  
  try {
    let data = null;
    
    try {
      let response = await axios.get(`${frontendconfig.backendUrl}/user_role`, { 
        params: { userid, password } 
      });
      data = response.data;
    } catch (firstError) {
      console.log('First backend failed:', firstError.message);
    }
    
    // If first backend didn't return a role, try functional backend
    if (!data || !data.role) {
      try {
        let response = await axios.get(`${functionalfrontendconfig.backendUrl}/user_role`, { 
          params: { userid, password } 
        });
        data = response.data;
      } catch (secondError) {
        console.log('Second backend failed:', secondError.message);
      }
    }
    
    if (data && data.role) {
      setRole(data.role);
      setIsLoggedIn(true);
      
      // Store session in localStorage
      const sessionData = {
        userid: userid,
        role: data.role,
        loginTime: new Date().getTime()
      };
      localStorage.setItem('cbptSession', JSON.stringify(sessionData));
      
      // Set automatic logout timer
      setTimeout(() => {
        handleLogout();
      }, SESSION_TIMEOUT);
      
    } else {
      setError('Invalid credentials or user not found.');
    }
  } catch (error) {
    console.error('Login error:', error);
    setError('Connection error. Please try again.');
  }
};

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole('');
    setUserid('');
    setPassword('');
    setError('');
    localStorage.removeItem('cbptSession');
    
    // Show session expired message
    alert('Your session has expired. Please login again.');
  };

  if (!isLoggedIn) {
    return (
      <div className="cbpt-portal">
        <header className="portal-header">
          
          <div className="header-content">
            <img src="/cibc-logo.png" alt="CIBC Logo" className="logo" />
              <div className="sub-heading">
              <h2>Analytics, Tracking, Project Management, Dashboards and more...</h2>
                </div>
          </div>
          


        </header>

         <Latest/>
         
         <main className="portal-content">
          <form className="login-form" onSubmit={handleLogin}>
            <h2>Login</h2>
            <br></br>
            <input
              type="text"
              placeholder="Enter Portal User ID"
              value={userid}
              onChange={e => setUserid(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Enter Portal Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
            <br></br>
            {error && <div className="error-message">{error}</div>}
          </form>
        </main>
      </div>
    );
  }

  // After login, show menu based on role
  return (
    <div className="cbpt-portal">
      <header className="portal-header">
         
        <div className="header-content">
          <img src="/cibc-logo.png" alt="CIBC Logo" className="logo" />
          <h1>Centralized CBPT Portal</h1>




  <div className="sub-heading">
    <h2 style={{ fontWeight: 'normal', fontSize: '1.25rem', margin: 0 }}>
      Analytics, Tracking, Project Management, Dashboards and more...
    </h2>
  </div>



          
          
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            style={{
              position: 'absolute',
              right: '20px',
              top: '20px',
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <nav className="portal-nav">
        <div className="nav-container">
          
          
          {/* ALM - Admin, Director, Functional Manager, Automation Manager */}
          {['admin', 'director', 'sr. manager', 'automation manager', 'project manager','test consultant'].includes(role.toLowerCase()) && (
            <div className="nav-item">
              <span className="nav-title">ALM</span>
              <div className="dropdown">
                <Link to="/AlmProjectExecution" className="dropdown-item">Project Execution Detail</Link>
                <Link to="/AlmDailyStatus" className="dropdown-item">Daily Execution Detail - Graph View</Link>
                <Link to="/AlmTable" className="dropdown-item">Daily Detail - Table</Link>
                <Link to="/AlmQueryEditor" className="dropdown-item">Test ALM Query</Link>
              </div>
            </div>
            )}

          

          {/* Functional Tracker - Admin, Director, Functional Manager */}
          {['admin', 'director', 'sr. manager','test consultant'].includes(role.toLowerCase()) && (
            <div className="nav-item">
              <span className="nav-title">Functional Tracker</span>
              <div className="dropdown">
                <Link to="/Functional/RecordView" className="dropdown-item">View Records</Link>
                <Link to="/Functional/RecordEntry" className="dropdown-item">Insert Record</Link>
                <Link to="/Functional/RecordUpdate" className="dropdown-item">Update Record</Link>
                <Link to="/Functional/RecordDelete" className="dropdown-item">Delete Records</Link>
                <div className="nested-dropdown">
                  <span className="nested-title">Dashboard</span>
                  <div className="nested-content">
                    <Link to="/Functional/Dashboard" className="dropdown-item">Generic Dashboard</Link>
                    <Link to="/Functional/dashboardResourceCapacity" className="dropdown-item">Resource Dashboard</Link>
                    <Link to="/Functional/dashboardResourceAllocation" className="dropdown-item">Intake Dashboard</Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Automation Tracker - Admin, Director, Automation Manager */}
          {['admin', 'director', 'automation manager','automation lead'].includes(role.toLowerCase()) && (
            <div className="nav-item">
              <span className="nav-title">Automation Tracker</span>
              <div className="dropdown">
                <Link to="/ROI/ProjectForm" className="dropdown-item">Intake Entry</Link>
                <Link to="/ROI/ProjectROI" className="dropdown-item">Project Tracking</Link>
                
                <Link to="/RecordView" className="dropdown-item">View Records</Link>
                <Link to="/RecordEntry" className="dropdown-item">Insert Record</Link>
                <Link to="/RecordUpdate" className="dropdown-item">Update Record</Link>
                <div className="nested-dropdown">
                  <span className="nested-title">Dashboard</span>
                  <div className="nested-content">
                    <Link to="/Dashboard" className="dropdown-item">Generic Dashboard</Link>
                    <Link to="/dashboardResourceCapacity" className="dropdown-item">Resource Dashboard</Link>
                    <Link to="/dashboardResourceAllocation" className="dropdown-item">Intake Dashboard</Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TDM - All except Director, Functional Manager, Automation Manager */}
          {![ 'functional manager', 'automation manager', 'project manager'].includes(role.toLowerCase()) && (
            <div className="nav-item">
              <span className="nav-title">TDM</span>
              <div className="dropdown">
                <Link to="/TDMView" className="dropdown-item">Class Deal Records</Link>
                <Link to="/MmtgDealGenerate" className="dropdown-item">Create MMTG Origination Deal</Link>
                <Link to="/CBPTQEAutomationJob" className="dropdown-item">CB-PT QE Automation Job Runner</Link>
                <Link to="/TestCaseManager" className="dropdown-item">Test Case Database Manager</Link>
              </div>
            </div>
          )}


        {/* QE Utilities - All except Director, Functional Manager, Automation Manager */}
          {['admin'].includes(role.toLowerCase()) && (
            <div className="nav-item">
              <span className="nav-title">QE Utilities</span>
              <div className="dropdown">
                <Link to="/MmtgParser" className="dropdown-item">Parse Mmtg</Link>
                <a href={`http://localhost:5051?userid=${userid}`} className="dropdown-item">Robot Code Generator</a>
                <Link to="/Utilities/UtilitiesDetails" className="dropdown-item">Utilities Details</Link>
                <Link to="/test-case-generator" className="dropdown-item">Test Case Generator</Link>
                <Link to="/RaGTestCaseGenerator" className="dropdown-item">RAG TCs Generator</Link>
                <Link to="/SchemaBuilder" className="dropdown-item">Schema Builder</Link>
                <Link to="/schema" className="dropdown-item">Published Schemas</Link>

              </div>
            </div>
          )}

          {/* All, Except L9, L10 */}
                    {['admin'].includes(role.toLowerCase()) && (
                      <div className="nav-item">
                        <span className="nav-title">Scripts Inventory</span>
                        <div className="dropdown">
                          <Link to="/AutomationInventory" className="dropdown-item">Lending</Link>
                          <Link to="/AutomationInventory" className="dropdown-item">Deposit</Link>
                          <Link to="/AutomationInventory" className="dropdown-item">ECMT, FM</Link>
                          <Link to="/AutomationInventory" className="dropdown-item">Payments</Link>
                        </div>
                      </div>
                   )}
         
           {/* QE initiatives - All RO. L9-L10 - Edit */}
                    {['admin'].includes(role.toLowerCase()) && (
                      <div className="nav-item">
                        <span className="nav-title">QE Dashboard</span>
                          <div className="dropdown">
                        <Link to="/QE Initiatives/InitiativeDetails" className="nav-title standalone">Transformation Initiatives Dashboard</Link>              
                        <Link to="/Metrices/AutomationMetrices" className="nav-title standalone">QE Metrices Dashboard</Link>
                         <a href="https://confluence.cibcatl.com/display/PBPTQA/Process+Improvements" target="_blank" className="nav-title standalone" rel="noopener noreferrer">
                       QE Processes Home
                        </a>
          
                      </div>
                      </div>
                    )}

    

        </div>
      </nav>
          <Latest/>
      <main className="portal-content">

        <div className="cbpt-portalBackground"
          style={{
            backgroundImage: "url('/1280x720_IC_CIBCSquare.jpg')"
          }}
        >
          <span className="visually-hidden">
            Background image: CIBC Square, Toronto. Source: Ivanhoé Cambridge.
          </span>
        </div>

        <div className="info-card">
          <p className="info-text">This portal is built and owned by CB&PT QE team which will be used by Reporting and other purpose.</p>
          <div className="contact-section">
            <h3 className="contact-heading">Contact Details</h3>
            <div className="contact-grid">
              <div className="contact-item">
                <span className="contact-title">Sr. Director:</span>
                <span className="contact-info">Franca Cappa - franca.cappa@cibc.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-title">Director:</span>
                <span className="contact-info">Pragyesh Pandey - pragyesh.pandey@cibc.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-title">Automation Team:</span>
                <span className="contact-info">DL CBP Automation Team - dlcbpautomationteam@cibc.com</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};


export default MainPage;