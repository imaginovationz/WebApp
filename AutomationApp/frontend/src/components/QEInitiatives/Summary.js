import React, { useState, useEffect } from 'react';

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
        setInitiatives(data);
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
            </tr>
          </thead>
          <tbody>
            {initiatives.map((initiative, index) => (
              <tr key={initiative.id || index}>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button onClick={() => setIsEditable(true)} style={{ marginTop: '1rem' }}>
        Edit
      </button>
      <button
        onClick={handleSave}
        style={{ marginTop: '1rem', marginLeft: '1rem' }}
        disabled={!isEditable}
      >
        Save
      </button>
    </div>
  );
};

export default Summary;
