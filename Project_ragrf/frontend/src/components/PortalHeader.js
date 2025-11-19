import React, { useState } from 'react';

const PortalHeader = ({ handleLogout }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <header className="portal-header">
      <div className="header-content">
        <img src="/cibc-logo.png" alt="CIBC Logo" className="logo" />
        <h1>

          Welcome to CBPT - S.T.E.P

          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          [Smart|Transformative|Execution|Process]
            <button
              onClick={() => setShowPopup(true)}
              style={{
                background: 'none',
                border: 'none',
                marginLeft: '8px',
                cursor: 'pointer',
                padding: 0,
                fontSize: '1.1rem',
                verticalAlign: 'middle',
              }}
              aria-label="Show STEP Info"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <rect x="11" y="10" width="2" height="6" rx="1" />
                <rect x="11" y="7" width="2" height="2" rx="1" />
              </svg>

            </button>
          </span>
        </h1>

        <div className="sub-heading">
          <h2 style={{ fontWeight: 'normal', fontSize: '1.25rem', margin: 0 }}>
            a STEP towards 100%
            Quality Engineers..
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
        {showPopup && (
  <div
    className="step-popup-overlay"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}
    onClick={() => setShowPopup(false)}
  >
    <div
      className="step-popup-content"
      style={{
        background: '#23272f',          // dark background
        padding: '24px',
        borderRadius: '8px',
        minWidth: '320px',
        position: 'relative',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        color: 'white'                  // popup text color white
      }}
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={() => setShowPopup(false)}
        style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          background: 'none',
          border: 'none',
          fontSize: '1.3rem',
          cursor: 'pointer',
          color: '#dc3545',             // red color for close 'X'
          fontWeight: 'bold'
        }}
        aria-label="Close"
      >
        &times;
      </button>
      <h3>About S.T.E.P</h3>
      <p>
        <strong>S.T.E.P</strong> stands for    <strong>Smart. Transformative. Execution. Process.</strong>
        <br /><br />
        | Smart       =  Leverages automation, advanced intelligence, and AI capabilities.                                 |
        <br /><br />
        | Transformative = Facilitates a cultural shift towards Quality Engineering (QE).
        <br /><br />
        | Execution   = Enables seamless implementation of utilities, workflows, and scripts.                            |
        <br /><br />
        | Process     = Serves as a centralized hub for tracking, reporting, analytics, and dashboards.|
        <br /><br />

      </p>
    </div>
  </div>
)}
      </div>
    </header>
  );
};

export default PortalHeader;