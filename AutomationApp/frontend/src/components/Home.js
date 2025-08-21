import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
//import ProjectROIEntry from './ROI/ProjectROIEntry';


function Home() {
//Declares a state variable options (an array) to store the list of options fetched from the backend, with setOptions as its updater function.	
  const [options, setOptions] = useState([]); 
  
 //Declares a state variable selectedId (a string) to store the ID of the currently selected option, with setSelectedId as its updater function.
  const [selectedId, setSelectedId] = useState('');
  
 //Initializes the navigate function to enable navigation to other routes.
  const navigate = useNavigate();

 //Defines a function fetchOptions to fetch the list of options from the backend API.
  
 
 const fetchOptions = () => {
// Makes a GET request to the backend API /api/options endpoint of the backend  to list of retrieve options.
   axios.get('http://localhost:5000/api/options')
      .then(res => setOptions(res.data)) //Updates the options state with the data received from the API response.
      .catch(err => console.error(err)); //  Updates the options state with the data received from the API response.
	 	      
  };
  useEffect(() => {
    fetchOptions();
  }, []);

  
  const handleGo = () => {
    if (selectedId) navigate(`/details/${selectedId}`);
  };

  
  const handleQEInitiatives = () => {
	navigate('/QEInitiatives/Summary'); 
	//navigate('/summary'); // Navigate to the Summary.js component
   };
   


   const ProjectROI = () => {
     navigate('/ROI/ProjectROI');
	 //navigate('/ProjectROI'); // Navigate to the ProjectROI.js component
   };
    
	
   const ProjectLeadROIEntry = () => {
       navigate('/ROI/ProjectLeadROIEntry/:intakeNumber');
    //navigate('/ProjectROI'); // Navigate to the ProjectROI.js component
     };
	 
	     
  return ( //Starts the JSX to render the component's UI.
    <div style={{ padding: '2rem' }}> 
	
    
	  <h2>Select an Option</h2> 
    
	    <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
        <option value="">-- Select --</option> 
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.options}</option> //
        ))}
      </select>
	  
      <button onClick={handleGo} style={{ marginLeft: '1rem' }}>Go</button>
      <button onClick={fetchOptions} style={{ marginLeft: '1rem' }}>Refresh</button>
      <button onClick={handleQEInitiatives} style={{ marginLeft: '1rem' }}>QEInitiatives</button>
	  <button onClick={ProjectROI} style={{ marginLeft: '1rem' }}>Project ROI</button>
	  <button onClick={ProjectLeadROIEntry} style={{ marginLeft: '1rem' }}>Project ROI Entry</button>
	  
	</div>
  );
}

export default Home;
