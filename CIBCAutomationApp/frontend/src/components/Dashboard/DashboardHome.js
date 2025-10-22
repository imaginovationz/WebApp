// src/components/Dashboard/DashboardHome.js
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import "../../styles/roiTabs.css";
import "../../styles/Dashboard.css";
import "../../styles/RecordEntry.css";
import "../../styles/MainPage.css";

// Release view tabs
import RlsQE from './ReleaseView/RlsQE';
import RlsBSA from './ReleaseView/RlsBSA';
import RlsADM from './ReleaseView/RlsADM';
import RlsFinancials from './ReleaseView/RlsFinancials';
// [PH1-B] Replace prior RlsHome with the new Release QE Home component
import ReleaseQEHome from './ReleaseView/ReleaseQEHome'; // [PH1-B]

import CVAM from './Consolidated/CVAM';                 // Automation (keep as existing)
import CVTI from './Consolidated/CVTI';                 // Transformation Initiatives (keep)
import CVCBPTReleaseMgmt from './Consolidated/CVCBPTReleaseMgmt';   // NEW
import CVReleaseMetric from './Consolidated/CVReleaseMetric';       // NEW
import CVCCBCRs from './Consolidated/CVCCBCRs';                     // NEW
import CVChangeTickets from './Consolidated/CVChangeTickets';       // NEW
import CVProjects from './Consolidated/CVProjects';                 // NEW
import CVDefects from './Consolidated/CVDefects';                   // NEW
import CVFinancials from './Consolidated/CVFinancials';             // NEW
import CVSavingsROI from './Consolidated/CVSavingsROI';             // NEW

// Project view tabs
import ProjectQE from './ProjectView/ProjectQE';
import ProjectBSA from './ProjectView/ProjectBSA';
import ProjectADM from './ProjectView/ProjectADM';
import ProjectFinancials from './ProjectView/ProjectFinancials';
import ProjectCRs from './ProjectView/ProjectCRs';
import ProjectHarvestedHours from './ProjectView/ProjectHarvestedHours'; // reused for “Savings % ROI”
import ProjectQuickWins from './ProjectView/ProjectQuickWins';           // [PH2-C] NEW


// [PH1-B] NEW: Release Master View (when no release is selected)
import ReleaseMaster from './ReleaseMaster'; // [PH1-B]

export default function DashboardHome() {
  const [releases, setReleases] = useState([]);
  const [selectedRelease, setSelectedRelease] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [mode, setMode] = useState("release"); // 'release' | 'project'
  const [activeTab, setActiveTab] = useState("QE"); // default tab in both modes

  // [PH1-A] NEW: Consolidated View selector state
    const [cvSelect, setCvSelect] = useState("");

  // fetch releases once
  useEffect(() => {
    fetch("http://localhost:5000/api/fetchreleases")
      .then(r => r.json())
      .then(j => setReleases(Array.isArray(j?.releases) ? j.releases : []))
      .catch(() => setReleases([]));
  }, []);

  // when release changes, fetch projects for that release
  useEffect(() => {
    setProjects([]);
    setSelectedProject(null);
    setMode("release");
    setActiveTab("QE");

    if (!selectedRelease) return;
    const url = `http://localhost:5000/api/projects/search?release=${encodeURIComponent(selectedRelease)}&limit=200`;
    fetch(url)
      .then(r => r.json())
      .then(list => {
        // list: [{intake_number, intake_name}, ...]
        setProjects(Array.isArray(list) ? list : []);
      })
      .catch(() => setProjects([]));
  }, [selectedRelease]);

  const onGo = () => {
    if (selectedProject) {
      setMode("project");
      setActiveTab("RlsHome"); // keeping the existing behavior
    }
  };

  // [PH1-B] Render RELEASE-level tabs OR Release Master View if no release selected
  const renderReleaseArea = () => {
    if (!selectedRelease) {
      return (
        <>
          <div className="tabs">
            <button className={`roi-tab qe active`} onClick={() => { /* single tab */ }}>
              Releases Master View
            </button>
          </div>
          <div className="tab-panel">
            <ReleaseMaster />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="tabs">
          {/* [PH1-B] Keep tab label as requested: Release QE Home */}
          <button
            className={`roi-tab qe ${activeTab === "RlsHome" ? "active" : ""}`}
            onClick={() => setActiveTab("RlsHome")}
          >
            Release Home
          </button>
          <button className={`roi-tab qe ${activeTab === "QE" ? "active" : ""}`} onClick={() => setActiveTab("QE")}>QE</button>
          <button className={`roi-tab bsa ${activeTab === "BSA" ? "active" : ""}`} onClick={() => setActiveTab("BSA")}>BSA</button>
          <button className={`roi-tab adm ${activeTab === "ADM" ? "active" : ""}`} onClick={() => setActiveTab("ADM")}>ADM</button>
          <button className={`roi-tab fin ${activeTab === "Financials" ? "active" : ""}`} onClick={() => setActiveTab("Financials")}>Financials</button>
        </div>

        <div className="tab-panel">
          {activeTab === "RlsHome" && <ReleaseQEHome release={selectedRelease} />} {/* [PH1-B] */}
          {activeTab === "QE" && <RlsQE release={selectedRelease} />}
          {activeTab === "BSA" && <RlsBSA release={selectedRelease} />}
          {activeTab === "ADM" && <RlsADM release={selectedRelease} />}
          {activeTab === "Financials" && <RlsFinancials release={selectedRelease} />}
        </div>
      </>
    );
  };

  const renderConsolidatedArea = () => {
    if (!cvSelect) return null;

    if (cvSelect === "CBPT Releases Management Status") return <CVCBPTReleaseMgmt />; // Release Master tab inside
    if (cvSelect === "Release metric") return <CVReleaseMetric />;
    if (cvSelect === "Change Control Board CRs") return <CVCCBCRs />;
    if (cvSelect === "Change Tickets") return <CVChangeTickets />;
    if (cvSelect === "Projects") return <CVProjects />;
    if (cvSelect === "Defects") return <CVDefects />;

    if (cvSelect === "Automation") return <CVAM />;                          // unchanged, with its existing tabs
    if (cvSelect === "Transformation Initiatives") return <CVTI />;          // unchanged
    if (cvSelect === "Financials") return <CVFinancials />;                  // Home tab
    if (cvSelect === "Savings and ROI") return <CVSavingsROI />;             // “Harvested Hours”, “Savings & ROI”

    return null;
  };

  return (
    <div className="container dashboard-container" tn-text-heading-l>
      {/* Header */}
      <header className="dash-header" tn-text-heading-l>
        <h2 className="dash-title" tn-text-heading-l>CCD - Centralized CB&PT DASHBOARD</h2>
        <p className="dash-sub" tn-text-body>Realtime Analytics and Insights across releases and projects, at your fingertips</p>
      </header>

 <div className="top-row-3up"> 
      {/* ============================ */}
      {/* [PH1-A] Section [1] Consolidated Views */}
      {/* ============================ */}

        
      <section className="filter-section">
        <div className="filter-card">
      
      
          <div className="filter-card__title">
            <span className="dot dot-blue" />
            <span>Consolidated Views</span> {/* [PH1-A] */}
          </div>
          <div className="filter-row">
            <div className="select-wrap" data-label="Select a View">
              <select
                className="select-red wide"
                value={cvSelect}
                onChange={(e) => setCvSelect(e.target.value)}
              >
                
                 <option value="">{`--Select a Dashboard to view--`}</option>
                  <option>CBPT Releases Management Status</option>
                  <option>Release metric</option>
                  <option>Change Control Board CRs</option>
                  <option>Change Tickets</option>
                  <option>Projects</option>
                  <option>Defects</option>
                  <option>Automation</option> 
                  <option>Transformation Initiatives</option> 
                  <option>Financials</option>
                  <option>Savings and ROI</option>
              </select>
            </div>
          </div>
        </div>
      </section>

        {cvSelect && (
        <div className="tab-panel consolidated-panel" style={{ marginTop: 12 }}>
          {renderConsolidatedArea()}
        </div>
      )}


      {/* ============================ */}
      {/* [PH1-A] Section [2] Releases & Projects View (existing behavior) */}
      {/* ============================ */}

      {!cvSelect && (

      <section className="filter-section">
        {/* Release card */}
        <div className="filter-card">
          <div className="filter-card__title">
            <span className="dot dot-blue" />
            <span>CBPT Releases</span>
          </div>
          <div className="filter-row">
            <div className="select-wrap" data-label="Select Release">
              <select
                value={selectedRelease}
                onChange={(e) => setSelectedRelease(e.target.value)}
                className="select-red fancy-select"
              >
                <option value="">{`<Select Release>`}</option>
                {releases.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Project card (shown after release chosen) */}
        {selectedRelease && (
          <div className="filter-card">
            <div className="filter-card__title">
              <span className="dot dot-amber" />
              <span>Select Project</span>
            </div>
            <div className="filter-row">
              <div className="select-wrap" data-label="Project">
                <select
                  value={selectedProject?.intake_number || ""}
                  onChange={(e) => {
                    const inum = e.target.value;
                    const found = projects.find(p => String(p.intake_number) === String(inum));
                    setSelectedProject(found || null);
                  }}
                  className="select-red fancy-select wide"
                >
                  <option value="">{`<Select Project>`}</option>
                  {projects.map((p) => (
                    <option key={`${p.intake_number}-${p.intake_name}`} value={p.intake_number}>
                      {`${p.intake_number} — ${p.intake_name}`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn-compact btn-add go-btn"
                disabled={!selectedProject}
                onClick={onGo}
                title="Load project view tabs"
              >
                Go
              </button>
            </div>
          </div>
        )}
      </section>
  )}
  </div>

      {/* Tabs */}
      {!cvSelect && (mode === "release" ? renderReleaseArea() : (
        <>
          <div className="tabs">
            <button className={`roi-tab qe ${activeTab === "QE" ? "active" : ""}`} onClick={() => setActiveTab("QE")}>QE</button>
            <button className={`roi-tab bsa ${activeTab === "BSA" ? "active" : ""}`} onClick={() => setActiveTab("BSA")}>BSA</button>
            <button className={`roi-tab adm ${activeTab === "ADM" ? "active" : ""}`} onClick={() => setActiveTab("ADM")}>ADM</button>
            <button className={`roi-tab fin ${activeTab === "Financials" ? "active" : ""}`} onClick={() => setActiveTab("Financials")}>Financials</button>
            <button className={`roi-tab crs ${activeTab === "CRs" ? "active" : ""}`} onClick={() => setActiveTab("CRs")}>CRs</button>
          <button
              className={`roi-tab hrs ${activeTab === "SavingsROI" ? "active" : ""}`}
              onClick={() => setActiveTab("SavingsROI")}
              title="Savings and ROI"
            >
              Savings & ROI
            </button>
             <button
              className={`roi-tab qe ${activeTab === "QuickWins" ? "active" : ""}`}
              onClick={() => setActiveTab("QuickWins")}
              title="Project Quick Wins"
            >
              Project Quick Wins
            </button>

          </div>

          <div className="tab-panel">
            {activeTab === "QE" && <ProjectQE project={selectedProject} />}
            {activeTab === "BSA" && <ProjectBSA project={selectedProject} />}
            {activeTab === "ADM" && <ProjectADM project={selectedProject} />}
            {activeTab === "Financials" && <ProjectFinancials project={selectedProject} />}
            {activeTab === "CRs" && <ProjectCRs project={selectedProject} />}
            {activeTab === "HarvestedHours" && <ProjectHarvestedHours project={selectedProject} />}

            
            {activeTab === "SavingsROI" && <ProjectHarvestedHours project={selectedProject} />}

            
            {activeTab === "QuickWins" && <ProjectQuickWins project={selectedProject} />}

          </div>
        </>
      ))}
    </div>
  );
}


