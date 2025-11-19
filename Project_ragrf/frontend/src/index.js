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
import ProjectBulkUpdateTab from './components/ROI/tabs/ProjectBulkUpdateTab';

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

import IntakeEntry from './components/ROI/IntakeEntry';
import ProjectLeadROIEntry from './components/ROI/ProjectLeadROIEntry';
import WorkflowsMain from './components/workflows/WorkflowsMain';  // NEW
import Workflows from './components/workflows/Workflows';          // NEW
import Reminders from './components/workflows/Reminders';          // NEW
import DashboardHome from './components/Dashboard/DashboardHome'

//import SOASavingsTab from './components/ROI/tabs/SOASavingsTab';
//import MonthlyBreakupTab from './components/ROI/tabs/MonthlyBreakupTab';


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


const container = document.getElementById('root');
const root = createRoot(container);
//<Route exact path="/" component={MainPage} />


root.render(
//ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        
        <Route path="/" element={<MainPage />}/>
        <Route  path="/tasks" component={TaskList} />
        
        <Route path="/Dashboard" element={<Dashboard/>} />
        {/* <Route path="/task-entry" component={TaskEntry} /> */}
        <Route path="/DashboardResourceAllocation" element={<DashboardResourceAllocation/>} />
        <Route path="/DashboardResourceCapacity" element={<DashboardResourceCapacity/>} /> {/* Corrected route */}
        <Route path="/DashboardCapacityPlanning" element={<CapacityPlanning/>} />

        <Route path="/ROI/ProjectROI" element={<ProjectROI />} />
        <Route path="/ROI/IntakeEntry" element={<IntakeEntry/>} />
        <Route path="/workflows/WorkflowsMain" element={<WorkflowsMain/>} />
        <Route path="/QEInitiatives/Summary" element={<Summary />} />
        
        <Route path="/RecordEntry" element={<RecordEntry/>} />
        <Route path="/RecordView" element={<RecordView/>} />
        <Route path="/RecordUpdate" element={<RecordUpdate/>} />


        
        <Route path="/Functional/Dashboard" element={<FunctionalDashboard />} />
        {/* <Route path="/task-entry" component={TaskEntry} /> */}
        <Route path="/Functional/DashboardResourceAllocation" element={<FunctionalDashboardResourceAllocation/>} />
        <Route path="/Functional/DashboardResourceCapacity" element={<FunctionalDashboardResourceCapacity/>} /> 
        <Route path="/Functional/DashboardCapacityPlanning" element={<FunctionalCapacityPlanning/>} />
        <Route path="/Functional/RecordEntry" element={<FunctionalRecordEntry/>} />
        <Route path="/Functional/RecordView" element={<FunctionalRecordView/>} />
        

        <Route path="/Functional/RecordUpdate" element={<FunctionalRecordUpdate/>} />
        <Route path="/Functional/RecordDelete" element={<FunctionalDeletionPage/>} />
        <Route path="/test-case-generator" element={<TestCaseGenerator/>} />
        <Route path="/test-case-generator" element={<TestCaseGenerator/>} />

        <Route path="/AlmDailyStatus" element={<AlmDailyStatus/>} />
        <Route path="/AlmTable" element={<AlmTable/>} />
        <Route path="/AlmQueryEditor" element={<AlmQueryEditor/>} />

        <Route path="/AlmProjectExecution" element={<AlmProjectExecution/>} />
        <Route path="/MmtgDealGenerate" element={<MmtgDealGenerate/>} />
        <Route path="/MmtgParser" element={<MmtgParser/>} />
        <Route path="/CBPTQEAutomationJob" element={<CBPTQEAutomationJob/>} />
        <Route path="/TestCaseManager" element={<TestCaseManager/>} />
        <Route path="/TDMView" element={<TDMView/>} />
        
        <Route path="/QEProcessesImp/ProcessHomeImp" element={<ProcessHomeImp/>} />
        <Route path="/QEProcessesImp/ProcessHomeImp" element={() => <ProcessHomeImp />} />
        <Route path="/QE Initiatives/InitiativeDetails" element={<InitiativeDetails/>} />
        <Route path="/Metrices/AutomationMetrices" element={<AutomationMetrices/>} />
        <Route path="/Metrices/AutomationInventory" element={<AutomationInventory/>} />
        <Route path="/Utilities/UtilitiesDetails" element={<UtilitiesDetails/>} />
        
        <Route path="/Other/Latest" element={<Latest/>} />
        <Route path="/RAGTestCaseGenerator" element={<RAGTestCaseGenerator/>} />
        <Route path="/TestCaseKnowledgeBase" element={<TestCaseKnowledgeBase/>} />      
        <Route path="/SchemaBuilder" element={<SchemaBuilder/>} />
        <Route exact path="/schema" element={<SchemaIndex/>} />
          <Route path="/schema/:name" element={<DynamicSchemaPage/>} />


      
	    <Route path="/Dashboard/DashboardHome" element={<DashboardHome />} />  {/* NEW */}

      {/* Parent route WITH wildcard; nest all tab routes inside */}
      <Route path="/ROI/ProjectLeadROIEntry/:intakeNumber/*" element={<ProjectLeadROIEntry />}>
       
        {/* Default to SummaryTab within this parent only */}
        <Route index component={<Navigate to="SummaryTab" replace />} />
        <Route path="SummaryTab" element={<SummaryTab />} />
        <Route path="ProjectStatusTab" element={<ProjectStatusTab />} />
        <Route path="ProjectBulkUpdateTab" element={<ProjectBulkUpdateTab />} />
        <Route path="TestCaseCountTab" element={<TestCaseCountTab />} />
       
        {/* Savings parent + its 3 children */}
        <Route path="SavingsTabs" component={<SavingsTabs />}>
          <Route index element={<Navigate to="ProjectSavingsTab" replace />} />
          <Route path="ProjectSavingsTab" element={<ProjectSavingsTab />} />
          <Route path="InitiativeSavingsTab" element={<InitiativeSavingsTab />} />
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