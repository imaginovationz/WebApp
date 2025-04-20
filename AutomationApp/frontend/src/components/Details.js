import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Details() {
  const { value } = useParams();  // value = selectedId
  const [option, setOption] = useState('');
  const [original, setOriginal] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:5000/api/details/${value}`)
      .then(res => {
        setOption(res.data.options);
        setOriginal(res.data.options);
      })
      .catch(err => console.error(err));
  }, [value]);

  const handleUpdate = () => {
    axios.post('http://localhost:5000/api/update', {
      id: parseInt(value),
      old_value: original,
      new_value: option
    }).then(res => {
      alert(res.data.message);
	  
      navigate('/');
	  //setUpdateMessage(res.data.message); // Set the message from the response
    }).catch(err => {
      alert('Error: ' + (err.response?.data?.message || 'Update failed'));
	 //setUpdateMessage('Error: ' + (err.response?.data?.message || 'Update failed'));
	  
    });
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Edit Selected Value</h2>
      <input
        type="text"
        value={option}
        onChange={(e) => setOption(e.target.value)}
        style={{ width: '300px', marginRight: '1rem' }}
      />
      <button onClick={handleUpdate}>Update</button>
	  
	  
    
	  </div>
  );
}

export default Details;
