import React, { useState, useEffect } from 'react';
import PptxGenJS from 'pptxgenjs'; //to download data as ppt
import * as XLSX from 'xlsx'; // to download as excel

const Summary = () => {
  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditable, setIsEditable] = useState(false);

  // Fetch data from the API
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

  // Handle input change
  const handleInputChange = (e, index, field) => {
    const updatedInitiatives = [...initiatives];
    updatedInitiatives[index][field] = e.target.value;
    setInitiatives(updatedInitiatives);
  };

  // Handle save
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

  // Download as PPT
  const downloadAsPPT = () => {
    const pptx = new PptxGenJS();
    const slide = pptx.addSlide();

    // Add title to the slide
    slide.addText('QE Initiatives Summary', { x: 0.5, y: 0.5, fontSize: 18, bold: true });

    // Add table data
    const tableData = [
      ['Initiative Name', 'Description', 'Status', 'Commentary', 'Cumulative ROI'], // Table headers
      ...initiatives.map((initiative) => [
        initiative.InitiativeName || '',
        initiative.InitiativeDescription || '',
        initiative.InitiativeStatus || '',
        initiative.InitiativeCommentary || '',
        initiative.CumulativeROI || '',
      ]),
    ];

    slide.addTable(tableData, {
      x: 0.5,
      y: 1.5,
      w: 9,
      border: { pt: 1, color: '000000' },
      fontSize: 12,
    });

    // Save the PowerPoint file
    pptx.writeFile('QE_Initiatives_Summary');
  };

  // Download as Excel
  const downloadAsExcel = () => {
    const wsData = [
      ['Initiative Name', 'Initiative Description', 'Initiative Status', 'Initiative Commentary', 'Cumulative ROI'], // Headers
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

  // Render UI
  return (
    <div style={{ padding: '2rem' }}>
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
};

export default Summary;