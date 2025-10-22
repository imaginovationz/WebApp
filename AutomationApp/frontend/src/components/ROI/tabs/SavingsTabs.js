// src/components/ROI/tabs/SavingsTabs.js
import React from "react";
import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import "../../../styles/roiTabs.css";


export default function SavingsTabs() {
  const ctx = useOutletContext(); // context is still passed down to children

  return (
    <div>
      {/* Removed the redundant Save button here per requirement #3 */}

      {/* 3 sub-tabs under Savings */}
      <div className="roi-tabs" style={{ marginBottom: 10 }}>
        <NavLink className="roi-tab" to="ProjectSavingsTab">Project Savings</NavLink>
        <NavLink className="roi-tab" to="InitiativeSavingsTab">Initiative Savings</NavLink>
        
        {/* <NavLink className="roi-tab" to="SOASavingsTab">SOA Savings</NavLink>*/}
        
      </div>

      {/* Child content */}
      <div className="roi-tab-panel">
        <Outlet context={ctx} />
      </div>
    </div>
  );
}
