import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/RecordEntry.css";
import "../styles/roiTabs.css";


function Details() { // Declares a functional component named Details that will display and allow editing of a selected option's details.
	
  const { value } = useParams();  // value = selectedId // Retrieves the value from the URL parameters using useParams, which is expected to be the ID of the selected option.
  
  const [option, setOption] = useState('');
  const [original, setOriginal] = useState('');
  const navigate = useNavigate();

  
  // useState is used to declare state variables option and original, both initialized to an empty string.
  // useEffect is used to fetch the details of the selected option from the backend API when the component mounts or when the value changes.
   
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

  // handleUpdate is a function that sends a POST request to update the selected option with the new value entered by the user.

  
  
  
  // Renders an input field for the user to edit the selected option's value and a button to submit the update.
    return (
    <div style={{ padding: '2rem' }}>
      <h2>Edit the Selected Value</h2>
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
