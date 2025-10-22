// [PH3-TABS] (unchanged imports retained)
import React, { useState, useEffect } from 'react';
import PptxGenJS from 'pptxgenjs'; //to download data as ppt
import * as XLSX from 'xlsx'; // to download as excel

// [PH3-TABS] Scoped styles borrowed from AutomationCreationTab.js to match look & feel
const styles = `
.metric-vertabs { display: flex; gap: 12px; }
.metric-vertabs .tablinks { display: flex; flex-direction: column; min-width: 220px; }
.metric-vertabs .tablinks button {
  background: #f7f7f7;
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  color: #222;
}
.metric-vertabs .tablinks button:hover { background: #eee; }
.metric-vertabs .tablinks button.active {
  background: #ffffff;
  border-right-color: #ffffff;
  font-weight: 700;
  color: #111;
}
.metric-vertabs .tabcontent {
  flex: 1; background: #fff; border: 1px solid #ddd; padding: 12px; border-radius: 4px;
}
.metric-table-wrap { overflow-x: auto; }
.metric-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.metric-table th, .metric-table td {
  border: 1px solid #cfd3d7; padding: 8px 10px; vertical-align: top; word-break: break-word; background: #fff;
}
.metric-table thead th { background: #f0f3f6; font-weight: 600; }
.metric-toolbar { display:flex; gap:12px; align-items: end; margin-bottom: 10px; }
.input { width:100%; }
.download-row { display:flex; gap:8px; flex-wrap: wrap; }
.tab-section { font-weight: 700; margin-bottom: 8px; }
.tab-section-yellow { background: #fff7ed; border: 1px solid #fde68a; padding: 8px 10px; border-radius: 6px; }
.small-label { display:block; font-size:12px; color:#6b7280; margin-bottom:4px; }
`;

// ========================
// Existing component logic
// ========================
const Summary = () => {
  // [PH3-TABS] NEW: active tab state (roi | raw | update)
  const [vtab, setVtab] = useState('roi');

  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditable, setIsEditable] = useState(false);

  // Fetch data from the API (unchanged)
  useEffect(() => {
    const fetchInitiatives = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/initiatives');
        if (!response.ok) {
          throw new Error('Failed to fetch initiatives');
        }
        const data = await response.json();
        setInitiatives(data.initiatives); // expects fields: InitiativeName, InitiativeDescription, etc.
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitiatives();
  }, []);

  // Handle input change (unchanged)
  const handleInputChange = (e, index, field) => {
    const updatedInitiatives = [...initiatives];
    updatedInitiatives[index][field] = e.target.value;
    setInitiatives(updatedInitiatives);
  };

  // Handle save (unchanged)
  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/updateInitiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiatives }),
      });
      if (!response.ok) {
        throw new Error('Failed to save initiatives');
      }
      alert('Initiatives updated successfully');
      setIsEditable(false);
    } catch (err) {
      alert(err.message);
    }
  };

  // Download as PPT (unchanged; used in Update tab)
  const downloadAsPPT = () => {
    const pptx = new PptxGenJS();
    const slide = pptx.addSlide();
    slide.addText('QE Initiatives Summary', { x: 0.5, y: 0.5, fontSize: 18, bold: true });

    const tableData = [
      ['Initiative Name', 'Description', 'Status', 'Commentary', 'Cumulative ROI'],
      ...initiatives.map((initiative) => [
        initiative.InitiativeName || '',
        initiative.InitiativeDescription || '',
        initiative.InitiativeStatus || '',
        initiative.InitiativeCommentary || '',
        initiative.CumulativeROI || '',
      ]),
    ];

    slide.addTable(tableData, {
      x: 0.5, y: 1.5, w: 9,
      border: { pt: 1, color: '000000' },
      fontSize: 12,
    });

    pptx.writeFile('QE_Initiatives_Summary');
  };

  // Download as Excel (unchanged; used in Update tab)
  const downloadAsExcel = () => {
    const wsData = [
      ['Initiative Name', 'Initiative Description', 'Initiative Status', 'Initiative Commentary', 'Cumulative ROI'],
      ...initiatives.map((i) => [
        i.InitiativeName || '',
        i.InitiativeDescription || '',
        i.InitiativeStatus || '',
        i.InitiativeCommentary || '',
        i.CumulativeROI || '',
      ])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'QE Initiatives');
    XLSX.writeFile(workbook, 'QE_Initiatives_Summary.xlsx');
  };

  // [PH3-TABS] NEW: ROI tab button stubs (logic to be implemented later)
  const roiDownloadExcel = () => alert('Download as Excel — to be implemented');
  const roiDownloadPPT = () => alert('Download as PPT — to be implemented');
  const roiSendEmail = () => alert('Send Email — to be implemented');

  // [PH3-TABS] Factored: the **original** Summary UI moved intact into this renderer for Tab 3
  const renderUpdateTab = () => (
    <div style={{ padding: '0' /* was 2rem; contained inside tabcontent now */ }}>
      <h2>QE Initiatives Summary</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Initiative Name</th>
              <th>Initiative Description</th>
              <th>Initiative Status</th>
              <th>Initiative Commentary</th>
              <th>Cumulative ROI</th>
            </tr>
          </thead>
          <tbody>
            {initiatives.map((initiative, index) => (
              <tr key={initiative.InitiativeID || index}>
                <td>
                  <input
                    type="text"
                    value={initiative.InitiativeName || ''}
                    disabled={!isEditable}
                    onChange={(e) => handleInputChange(e, index, 'InitiativeName')}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={initiative.InitiativeDescription || ''}
                    disabled={!isEditable}
                    onChange={(e) =>
                      handleInputChange(e, index, 'InitiativeDescription')
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={initiative.InitiativeStatus || ''}
                    disabled={!isEditable}
                    onChange={(e) => handleInputChange(e, index, 'InitiativeStatus')}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={initiative.InitiativeCommentary || ''}
                    disabled={!isEditable}
                    onChange={(e) =>
                      handleInputChange(e, index, 'InitiativeCommentary')
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={initiative.CumulativeROI || ''}
                    disabled={!isEditable}
                    onChange={(e) =>
                      handleInputChange(e, index, 'CumulativeROI')
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button onClick={() => setIsEditable(true)} style={{ marginTop: '1rem' }}>
        Edit
      </button>
      <button
        onClick={() => setIsEditable(false)}
        style={{ marginTop: '1rem', marginLeft: '0.5rem' }}
      >
        Cancel Edit
      </button>
      <button
        onClick={handleSave}
        style={{ marginTop: '1rem', marginLeft: '1rem' }}
        disabled={!isEditable}
      >
        Save
      </button>
      <button
        onClick={downloadAsPPT}
        style={{ marginTop: '1rem', marginLeft: '1rem' }}
      >
        Download as PPT
      </button>
      <button
        onClick={downloadAsExcel}
        style={{ marginTop: '1rem', marginLeft: '1rem' }}
      >
        Download as Excel
      </button>
    </div>
  );

  // ========================
  // TABBED LAYOUT (new)
  // ========================
  return (
    <div className="tab-wrap">
      {/* [PH3-TABS] Inject scoped styles to mimic AutomationCreationTab.js visuals */}
      <style>{styles}</style>

      <div className="metric-vertabs">
        {/* Left: vertical tab buttons */}
        <div className="tablinks">
          <button
            className={vtab === 'roi' ? 'active' : ''}
            onClick={() => setVtab('roi')}
          >
            ROI Report (PowerBI)
          </button>
          <button
            className={vtab === 'raw' ? 'active' : ''}
            onClick={() => setVtab('raw')}
          >
            Raw Data
          </button>
          <button
            className={vtab === 'update' ? 'active' : ''}
            onClick={() => setVtab('update')}
          >
            Update
          </button>
        </div>

        {/* Right: panel */}
        <div className="tabcontent">
          {/* TAB 1: ROI Report (PowerBI) */}
          {vtab === 'roi' && (
            <>
              <div className="tab-section tab-section-yellow">ROI Report (PowerBI)</div>

              {/* [PH3-TABS] Placeholder for PowerBI — embed iframe/powerbi-client here later */}
              <div style={{
                height: 420,
                border: '1px dashed #cbd5e1',
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                marginBottom: 12,
                background: '#fafafa'
              }}>
                <span style={{ color: '#64748b' }}>PowerBI report placeholder</span>
              </div>

              {/* [PH3-TABS] Buttons (logic to be implemented later) */}
              <div className="download-row">
                <button className="btn" onClick={roiDownloadExcel}>Download as Excel</button>
                <button className="btn" onClick={roiDownloadPPT}>Download as PPT</button>
                <button className="btn" onClick={roiSendEmail}>Send Email</button>
              </div>
            </>
          )}

          {/* TAB 2: Raw Data */}
          {vtab === 'raw' && (
            <>
              <div className="tab-section tab-section-yellow">Raw Data</div>
              <div className="text-gray-600">
                Placeholder for Raw Data view. (Logic to be implemented later.)
              </div>
            </>
          )}

          {/* TAB 3: Update (entire existing page moved here unchanged) */}
          {vtab === 'update' && renderUpdateTab()}
        </div>
      </div>
    </div>
  );
};

export default Summary;
