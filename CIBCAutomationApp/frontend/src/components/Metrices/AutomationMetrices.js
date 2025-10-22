import React, { useState } from 'react';

const dashboards = [
  {
    key: 'automation',
    label: 'Automation Delivery Dashboard',
    iframeSrc:
      'https://app.powerbi.com/reportEmbed?reportId=98878cdb-1311-40b3-baef-200230694400&autoAuth=true&ctid=222fcaf7-15d0-455f-97e1-8fda2eaad539&actionBarEnabled=true&reportCopilotInEmbed=true',
    buttons: [
      { label: 'Update Selected', onClick: () => {} },
      { label: 'View Full Details of Selected', onClick: () => {} },
      { label: 'Download as PPT', onClick: () => {} },
      { label: 'Download as Excel', onClick: () => {} },

    ],
  },
  {
    key: 'regression',
    label: 'Release Regression Dashboard',
    iframeSrc:
      'https://app.powerbi.com/reportEmbed?reportId=26018aee-94a1-43bd-b05b-1fb36ce95b47&autoAuth=true&ctid=222fcaf7-15d0-455f-97e1-8fda2eaad539&actionBarEnabled=true&reportCopilotInEmbed=true',
    buttons: [
      { label: 'Update Selected', onClick: () => {} },
      { label: 'View Full Details of Selected', onClick: () => {} },
      { label: 'Download as PPT', onClick: () => {} },
      { label: 'Download as Excel', onClick: () => {} },

    ],
  },
];

const AutomationMetrices = () => {
  const [selectedDashboard, setSelectedDashboard] = useState('automation');

  // Handler for top level "Back" button
  const handleTopBack = () => {
    // Replace with your navigation logic (e.g. history.back() or router navigation)
    window.history.back();
  };

  const dashboard = dashboards.find((d) => d.key === selectedDashboard);

  return (
    <div style={{ padding: '2rem' }}>
      {/* Top menu - always visible */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginBottom: '2rem',
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 10,
        alignItems: 'center'
      }}>
        {/* Navigation Back Button */}
        <button
          style={{
            fontWeight: 'bold',
            fontSize: '1.1rem',
            padding: '0.5rem 1.5rem',
            background: '#fde68a',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
          onClick={handleTopBack}
        >
          Back
        </button>
        {/* Dashboard Selector Buttons */}
        {dashboards.map((d) => (
          <button
            key={d.key}
            style={{
              fontWeight: d.key === selectedDashboard ? 'bold' : 'normal',
              fontSize: '1.1rem',
              padding: '0.5rem 1.5rem',
              background: d.key === selectedDashboard ? '#304054ff' : '#46607aff',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedDashboard(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Dashboard iframe - embedded fully */}
      <div style={{ marginBottom: '2rem', width: '100%', minHeight: '80vh' }}>
        <iframe
          title={dashboard.label}
          src={dashboard.iframeSrc}
          style={{
            width: '100%',
            height: '80vh',
            border: 'none',
            borderRadius: '8px',
            display: 'block',
          }}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        ></iframe>
      </div>

      {/* Buttons for the selected dashboard */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {dashboard.buttons.map((btn, idx) => (
          <button key={idx} onClick={btn.onClick} style={{ padding: '0.5rem 1.5rem' }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AutomationMetrices;