import React from 'react';
//import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';

import { BrowserRouter as Router, Route, Switch, Routes } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";

import Home from './components/Home';
import Details from './components/Details';
import Summary from './components/QEInitiatives/Summary';
import ProjectROI from './components/ROI/ProjectROI';
import SummaryTab from './components/ROI/tabs/SummaryTab';
import ProjectStatusTab from './components/ROI/tabs/ProjectStatusTab';
import TestCaseCountTab from './components/ROI/tabs/TestCaseCountTab';
import SavingsTabs from './components/ROI/tabs/SavingsTabs';
import ProjectSavingsTab from './components/ROI/tabs/ProjectSavingsTab';
import InitiativeSavingsTab from './components/ROI/tabs/InitiativeSavingsTab';

import AutomationMetricMain from './components/Metrices/AutomationMetricMain';        // NEW
import AutomationMetricProjects from './components/Metrices/AutomationMetric_projects'; // NEW
import AutoRegression from './components/Metrices/AutoRegression'; 
import Downloads from './components/Metrices/Downloads';

import AutomationCreationTab from "./components/Metrices/AutomationCreationTab";
import AutomationExecutionTab from "./components/Metrices/AutomationExecutionTab";
import AutomationTDMTab from "./components/Metrices/AutomationTDMTab";
import CountDashboardTab from "./components/Metrices/CountDashboardTab";

import WorkflowsMain from './components/workflows/WorkflowsMain';  // NEW
import Workflows from './components/workflows/Workflows';          // NEW
import Reminders from './components/workflows/Reminders';          // NEW
import DashboardHome from './components/Dashboard/DashboardHome'

//import SOASavingsTab from './components/ROI/tabs/SOASavingsTab';
//import MonthlyBreakupTab from './components/ROI/tabs/MonthlyBreakupTab';
import ProjectForm from './components/ROI/ProjectForm';
import ProjectLeadROIEntry from './components/ROI/ProjectLeadROIEntry';

import MainPage from './components/MainPage';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskEntry from './components/TaskEntry';

import CapacityPlanning  from './components/CapacityPlanning';
import RecordEntry from './components/RecordEntry';
import RecordView from './components/RecordView';
import RecordUpdate from './components/RecordUpdate';
import DashboardResourceAllocation from './components/DashboardResourceAllocation';
import DashboardResourceCapacity from './components/DashboardResourceCapacity'; // Corrected import
import TDMView from './components/TdmView';
import TestCaseGenerator from './components/TestCaseGenerator';

import InitiativeDetails from './components/QEInitiatives/InitiativeDetails';
import AutomationMetrices from './components/Metrices/AutomationMetrices';
import AutomationInventory from './components/Metrices/AutomationInventory';
import UtilitiesDetails from './components/Utilities/UtilitiesDetails';

import AlmProjectExecution from './components/AlmProjectExecution';
import AlmDailyStatus from './components/AlmDailyStatus';
import AlmTable from './components/AlmTable';
import AlmQueryEditor from './components/AlmQueryEditor'; 
import MmtgParser from './components/MmtgParser';
import MmtgDealGenerate from './components/MmtgDealGenerate';
import CBPTQEAutomationJob from './components/CBPTQEAutomationJob';
import TestCaseManager from './components/TestCaseManager';
import TestCaseKnowledgeBase from './components/TestCaseKnowledgeBase';
import RAGTestCaseGenerator from './components/RAGTestCaseGenerator';
import FunctionalDashboard from './components/Functional/Dashboard';
import FunctionalRecordEntry from './components/Functional/RecordEntry';
import FunctionalRecordView from './components/Functional/RecordView';
import FunctionalRecordUpdate from './components/Functional/RecordUpdate';
import FunctionalDeletionPage from './components/Functional/DeletionPage';
import FunctionalDashboardResourceAllocation from './components/Functional/DashboardResourceAllocation';
import FunctionalDashboardResourceCapacity from './components/Functional/DashboardResourceCapacity'; // Corrected import
import FunctionalCapacityPlanning  from './components/Functional/CapacityPlanning';
import ProcessHomeImp from './components/QEProcessesImp/ProcessHomeImp';
import Latest from './components/Other/Latest';
import SchemaBuilder from './components/SchemaBuilder';
import DynamicSchemaPage from './components/DynamicSchemaPage';
import SchemaIndex from './components/SchemaIndex';
Chart.register(ChartDataLabels);
//import ProjectForm from './components/ROI/ProjectForm';
//import ProjectROI from './components/ROI/ProjectROI';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
//ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route exact path="/" component={MainPage} />
        <Route  path="/tasks" component={TaskList} />
        
        <Route path="/dashboard" component={Dashboard} />
        {/* <Route path="/task-entry" component={TaskEntry} /> */}
        <Route path="/dashboardResourceAllocation" component={DashboardResourceAllocation} />
        <Route path="/dashboardResourceCapacity" component={DashboardResourceCapacity} /> {/* Corrected route */}
        <Route path="/dashboardCapacityPlanning" component={CapacityPlanning} />

       <Route path="/ROI/ProjectROI" component={ProjectROI} />
        <Route path="/ROI/ProjectForm" component={ProjectForm} />

        <Route path="/RecordEntry" component={RecordEntry} />
        <Route path="/RecordView" component={RecordView} />
        <Route path="/RecordUpdate" component={RecordUpdate} />


        <Route path="/Functional/dashboard" component={FunctionalDashboard} />
        {/* <Route path="/task-entry" component={TaskEntry} /> */}
        <Route path="/Functional/dashboardResourceAllocation" component={FunctionalDashboardResourceAllocation} />
        <Route path="/Functional/dashboardResourceCapacity" component={FunctionalDashboardResourceCapacity} /> {/* Corrected route */}
        <Route path="/Functional/dashboardCapacityPlanning" component={FunctionalCapacityPlanning} />
        <Route path="/Functional/RecordEntry" component={FunctionalRecordEntry} />
        <Route path="/Functional/RecordView" component={FunctionalRecordView} />
        <Route path="/Functional/RecordUpdate" component={FunctionalRecordUpdate} />
        <Route path="/Functional/RecordDelete" component={FunctionalDeletionPage} />
        <Route path="/test-case-generator" component={TestCaseGenerator} />
        <Route path="/test-case-generator" component={TestCaseGenerator} />

        <Route path="/AlmDailyStatus" component={AlmDailyStatus} />
        <Route path="/AlmTable" component={AlmTable} />
        <Route path="/AlmQueryEditor" component={AlmQueryEditor} />

        <Route path="/AlmProjectExecution" component={AlmProjectExecution} />
        <Route path="/MmtgDealGenerate" component={MmtgDealGenerate} />
        <Route path="/MmtgParser" component={MmtgParser} />
        <Route path="/CBPTQEAutomationJob" component={CBPTQEAutomationJob} />
        <Route path="/TestCaseManager" component={TestCaseManager} />
        <Route path="/TDMView" component={TDMView} />
        
        <Route path="/QEProcessesImp/ProcessHomeImp" component={ProcessHomeImp} />
        <Route path="/QEProcessesImp/ProcessHomeImp" render={() => <ProcessHomeImp />} />
        <Route path="/QE Initiatives/InitiativeDetails" component={InitiativeDetails} />
        <Route path="/Metrices/AutomationMetrices" component={AutomationMetrices} />
        <Route path="/Metrices/AutomationInventory" component={AutomationInventory} />
        <Route path="/Utilities/UtilitiesDetails" component={UtilitiesDetails} />
        
        <Route path="/Other/Latest" component={Latest} />
        <Route path="/RAGTestCaseGenerator" component={RAGTestCaseGenerator} />
        <Route path="/TestCaseKnowledgeBase" component={TestCaseKnowledgeBase} />      
        <Route path="/SchemaBuilder" component={SchemaBuilder} />
        <Route exact path="/schema" component={SchemaIndex} />
          <Route path="/schema/:name" component={DynamicSchemaPage} />

      <Route path="/QEInitiatives/Summary" component={<Summary />} />
      <Route path="/ROI/ProjectROI" component={<ProjectROI />} />
	    <Route path="/ROI/ProjectForm" component={<ProjectForm />}/>
      <Route path="/Dashboard/DashboardHome" component={<DashboardHome />} />  {/* NEW */}

      {/* Parent route WITH wildcard; nest all tab routes inside */}
      <Route path="/ROI/ProjectLeadROIEntry/:intakeNumber/*" component={<ProjectLeadROIEntry />}>
       
        {/* Default to SummaryTab within this parent only */}
        <Route index component={<Navigate to="SummaryTab" replace />} />
        <Route path="SummaryTab" component={<SummaryTab />} />
        <Route path="ProjectStatusTab" component={<ProjectStatusTab />} />
        <Route path="TestCaseCountTab" component={<TestCaseCountTab />} />
       
        {/* Savings parent + its 3 children */}
        <Route path="SavingsTabs" component={<SavingsTabs />}>
          <Route index component={<Navigate to="ProjectSavingsTab" replace />} />
          <Route path="ProjectSavingsTab" component={<ProjectSavingsTab />} />
          <Route path="InitiativeSavingsTab" component={<InitiativeSavingsTab />} />
        </Route> {/* CLOSE SavingsTabs */}
      </Route>   {/* CLOSE /ROI/ProjectLeadROIEntry parent */}

      {/* CHANGE: Automation Metrices (align path with Home.js) */}
      <Route path="/Metrices/AutomationMetricMain" component={<AutomationMetricMain />}>
      <Route index component={<CountDashboardTab />} /> {/* default landing */}
      <Route path="CountDashboard" component={<CountDashboardTab />} />
        <Route index component={<Navigate to="AutomationMetricProjects" replace />} />
        <Route path="AutomationMetricProjects" component={<AutomationMetricProjects />} />
        <Route path="AutoRegression" component={<AutoRegression />} />
        <Route path="Downloads" component={<Downloads />} />

          <Route path="AutomationCreation" component={<AutomationCreationTab />} />
          <Route path="AutomationExecution" component={<AutomationExecutionTab />} />
          <Route path="TDM" component={<AutomationTDMTab />} />
      </Route>

      
      <Route path="/workflows" element={<WorkflowsMain />}>                 
        <Route index element={<Workflows />} />                           
        <Route path="reminders" element={<Reminders />} />                  
      </Route>

      </Routes>
    </Router>
  </React.StrictMode>,
);
  //document.getElementById('root')
//);