import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Details from './components/Details';
import Summary from './components/QEInitiatives/Summary';
import ProjectROI from './components/ROI/ProjectROI';




function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/details/:value" element={<Details />} />
	  <Route path="/summary" element={<Summary />} />
	  <Route path="/ProjectROI" element={<ProjectROI />} />	
				
        {/* Uncomment the above line to enable Project ROI component */}
    </Routes>
  );
}

export default App;
