import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const navigate = useNavigate();

  const fetchOptions = () => {
    axios.get('http://localhost:5000/api/options')
      .then(res => setOptions(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleGo = () => {
    if (selectedId) navigate(`/details/${selectedId}`);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Select an Option</h2>
      <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
        <option value="">-- Select --</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.options}</option>
        ))}
      </select>
      <button onClick={handleGo} style={{ marginLeft: '1rem' }}>Go</button>
      <button onClick={fetchOptions} style={{ marginLeft: '1rem' }}>Refresh</button>
    </div>
  );
}

export default Home;
