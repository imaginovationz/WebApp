import React from "react";

import "../../styles/roiTabs.css";
import "../../styles/RecordEntry.css";

import { NavLink, Outlet } from "react-router-dom";

export default function AutomationMetricMain() {
  return (
    <div className="container">
      <h2>Automation Metrices</h2>
      <div className="tabs">
        <NavLink className="roi-tab" to={`CountDashboard`}>Automation Inventory</NavLink>
        <NavLink className="roi-tab" to={`AutomationMetricProjects`}>Projects Level View</NavLink>
        <NavLink className="roi-tab" to={`AutomationCreation`}>Automation Creation</NavLink>
        <NavLink className="roi-tab" to={`AutomationExecution`}>Automation Execution</NavLink>
        <NavLink className="roi-tab" to={`AutoRegression`}>RELEASE REGRESSION</NavLink>
        <NavLink className="roi-tab" to={`TDM`}>TDM</NavLink>
        <NavLink className="roi-tab" to={`Downloads`}>Downloads</NavLink>
      </div>
      <Outlet />
    </div>
  );
}
