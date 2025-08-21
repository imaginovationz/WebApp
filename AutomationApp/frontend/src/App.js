import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Details from './components/Details';
import Summary from './components/QEInitiatives/Summary';
import ProjectROI from './components/ROI/ProjectROI';
import ProjectLeadROIEntry from './components/ROI/ProjectLeadROIEntry';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/details/:value" element={<Details />} />
	  <Route path="/QEInitiatives/Summary" element={<Summary />} />
	  <Route path="/ROI/ProjectROI" element={<ProjectROI />} />
	  <Route path="/ROI/ProjectLeadROIEntry/:intakeNumber" element={<ProjectLeadROIEntry />} />
	  
    </Routes>
  );
}

export default App;
