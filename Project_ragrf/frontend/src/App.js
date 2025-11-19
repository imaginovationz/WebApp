import React from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import Home from './components/Home';
import Details from './components/Details';
import Summary from './components/QEInitiatives/Summary';
//import ProjectROI from './components/ROI/ProjectROI';
import ProjectROI from './components/ROI/ProjectROI';

import SummaryTab from './components/ROI/tabs/SummaryTab';
import ProjectStatusTab from './components/ROI/tabs/ProjectStatusTab';
import TestCaseCountTab from './components/ROI/tabs/TestCaseCountTab';

import SavingsTabs from './components/ROI/tabs/SavingsTabs';
import ProjectSavingsTab from './components/ROI/tabs/ProjectSavingsTab';
import InitiativeSavingsTab from './components/ROI/tabs/InitiativeSavingsTab';


import AutomationMetricMain from './components/Metrices/AutomationMetricMain'; // NEW

import AutomationMetricProjects from './components/Metrices/AutomationMetric_projects'; // NEW

import AutoRegression from './components/Metrices/AutoRegression';

import Downloads from './components/Metrices/Downloads';





import WorkflowsMain from './components/workflows/WorkflowsMain'; // NEW

import Workflows from './components/workflows/Workflows'; // NEW

import Reminders from './components/workflows/Reminders'; // NEW

import DashboardHome from './components/Dashboard/DashboardHome'





//import SOASavingsTab from './components/ROI/tabs/SOASavingsTab';

//import MonthlyBreakupTab from './components/ROI/tabs/MonthlyBreakupTab';

import ProjectForm from './components/ROI/IntakeEntry';

import ProjectLeadROIEntry from './components/ROI/ProjectLeadROIEntry';
Chart.register(ChartDataLabels);


function App() {

    return (

        <Routes>

            <Route path="/" element={<Home />} />

            <Route path="/details/:value" element={<Details />} />

            <Route path="/QEInitiatives/Summary" element={<Summary />} />

            <Route path="/ROI/ProjectROI" element={<ProjectROI />} />

            <Route path="/ROI/ProjectForm" element={<ProjectForm />} />
            


            {/* CHANGE: Automation Dashboard top-level route */}

            <Route path="/Dashboard/DashboardHome" element={<DashboardHome />} /> {/* NEW */}



            {/* Parent route WITH wildcard; nest all tab routes inside */}

            <Route path="/ROI/ProjectLeadROIEntry/:intakeNumber/*" element={<ProjectLeadROIEntry />}>

                {/* Default to SummaryTab within this parent only */}

                <Route index element={<Navigate to="SummaryTab" replace />} />

                <Route path="SummaryTab" element={<SummaryTab />} />

                <Route path="ProjectStatusTab" element={<ProjectStatusTab />} />

                <Route path="TestCaseCountTab" element={<TestCaseCountTab />} />



                {/* Savings parent + its 3 children */}

                <Route path="SavingsTabs" element={<SavingsTabs />}>

                    <Route index element={<Navigate to="ProjectSavingsTab" replace />} />

                    <Route path="ProjectSavingsTab" element={<ProjectSavingsTab />} />

                    <Route path="InitiativeSavingsTab" element={<InitiativeSavingsTab />} />





                </Route> {/* CLOSE SavingsTabs */}





            </Route> {/* CLOSE /ROI/ProjectLeadROIEntry parent */}



            {/* CHANGE: Automation Metrices (align path with Home.js) */}

            <Route path="/Metrices/AutomationMetricMain" element={<AutomationMetricMain />}>

                <Route index element={<Navigate to="AutomationMetricProjects" replace />} />

                <Route path="AutomationMetricProjects" element={<AutomationMetricProjects />} />

                <Route path="AutoRegression" element={<AutoRegression />} />

                <Route path="Downloads" element={<Downloads />} />



            </Route>



            {/* CHANGE: Automation Workflows / Reminders (top-level with 2 tabs) */}

            <Route path="/workflows" element={<WorkflowsMain />}> {/* NEW */}

                <Route index element={<Workflows />} /> {/* NEW default */}

                <Route path="reminders" element={<Reminders />} /> {/* NEW */}

            </Route>



        </Routes>

    );

}



export default App;

