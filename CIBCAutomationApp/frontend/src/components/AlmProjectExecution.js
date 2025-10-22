import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import { useHistory } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
//useNavigate
import * as XLSX from 'xlsx';
import frontendAlmconfig from '../frontendAlmconfig';
import '../styles/RecordEntry.css';
import '../styles/RecordView.css';
import '../styles/AlmProjectExecution.css';
import PropTypes from 'prop-types';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import gantt from 'dhtmlx-gantt';
import Select from 'react-select';
//import { Bar, Line, Pie, Doughnut, Chart } from 'react-chartjs-2'; // Import Pie chart and Chart
//import ChartDataLabels from 'chartjs-plugin-datalabels'; // Import ChartDataLabels plugin
//import Chart from "chart.js/auto";
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'; // Only chart components
import Chart from "chart.js/auto"; // Chart.js core object
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register the ChartDataLabels plugin
Chart.register(ChartDataLabels);

const AlmProjectExecution = ({ headers }) => {
  const history = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState('');
  const [almProjectOptions, setAlmProjectOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [selectedAlmProject, setSelectedAlmProject] = useState('');

  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableName, setTableName] = useState('');
  const [recordData, setRecordData] = useState([]); //using for project timeline

  // daily record variable
  const [recordDailyTCData, setRecorddailyTCData] = useState([]); //using for daily TC 
  const [dailyTCFilter, setDailyTCFilter] = useState(''); // Filter for the daily TC table
  const [dailyChartData, setDailyChartData] = useState(null);

  // cumalative record variable
  const [recordCumalativeTCData, setRecordCumalativeTCData] = useState([]); //using for daily TC 
  const [cumulativeTCFilter, setCumulativeTCFilter] = useState(''); // Filter for the cumulative TC table
  const [cumulativeChartData, setCumulativeChartData] = useState(null);

  // trend daily record variable
  const [trendRecordDailyTCData, setTrendRecordDailyTCData] = useState([]); //using for daily TC 
  const [trendDailyTCFilter, setTrendDailyTCFilter] = useState(''); // Filter for the daily TC table
  const [trendDailyChartData, setTrendDailyChartData] = useState(null);

  // cumalative record variable
  const [recordCumalativeDefectSnSTCData, setCumalativeDefectSnSTCData] = useState([]); //using for daily TC 
  const [cumalativeDefectSnSTTCFilter, setcumalativeDefectSnSTTCFilter] = useState(''); // Filter for the cumulative TC table
  const [cumalativeDefectSnSChartData, setcumalativeDefectSnSChartData] = useState(null);

  // cumalative defect sev variable
  const [recordCumalativeDefectSeverityTCData, setCumalativeDefectSeverityTCData] = useState([]); //using for daily TC 
  const [cumalativeDefectSeverityTTCFilter, setcumalativeDefectSeverityTCFilter] = useState(''); // Filter for the cumulative TC table
  const [cumalativeDefectSeverityChartData, setcumalativeDefectSeverityChartData] = useState(null);

  // cumalative record variable
  const [recordSev_1_agingTCData, setSev_1_agingTCData] = useState([]); //using for daily TC 
  const [Sev_1_agingTTCFilter, setSev_1_agingTTCFilter] = useState(''); // Filter for the cumulative TC table
  const [Sev_1_agingChartData, setSev_1_agingChartData] = useState(null);

  // Daily variance created or fixed
  const [recordDailyVarainceCreatedTCData, setDailyVarainceCreatedTCData] = useState([]); //using for daily TC 
  const [DailyVarainceCreatedTTCFilter, setDailyVarainceCreatedTTCFilter] = useState(''); // Filter for the cumulative TC table
  const [DailyVarainceCreatedChartData, setDailyVarainceCreatedChartData] = useState(null);

  const [formTypeDisplayNames, setformTypeDisplayNames] = useState(null);

  // SIT Effectiveness
  const [recordSitEffectivenessTCData, setSitEffectivenessTCData] = useState([]); //using for daily TC 
  const [SitEffectivenessTTCFilter, setSitEffectivenessTTCFilter] = useState(''); // Filter for the cumulative TC table
  const [SitEffectivenessChartData, setSitEffectivenessChartData] = useState(null);
  const [loadingCount, setLoadingCount] = useState(0); // Counter for ongoing API calls


  const [CycleData, setCycleData] = useState([]); //using for daily TC 
  const [selectedCycle, setSelectedCycle] = useState(''); // Add state for selected cycle
  const [tableData, setTableData] = useState([]); // Add state for table data

  const [formType, setFormType] = useState('');
  const [filters, setFilters] = useState({});
  const [filter, setFilter] = useState('');

  const [ganttFilter, setGanttFilter] = useState(''); // Filter for the Gantt chart
  const handleChange = selectedOption => {
    handleResourceChange({ target: { name: 'project', value: selectedOption ? selectedOption.value : '' } });
  };
  const handleResourceChange = (event) => {
    const project = event.target.value;
    setSelectedProject(project); // Update state with selected project
    // Fetch data from alm_project_schedule endpoint

    setLoading(true);
    setTrendRecordDailyTCData([]);
    setRecordData([]);
    setRecorddailyTCData([]);
    setRecordCumalativeTCData([]);
    setCumalativeDefectSnSTCData([]);
    setSev_1_agingTCData([]);
    setDailyVarainceCreatedTCData([]);
    setSitEffectivenessTCData([]);
    setCumalativeDefectSeverityTCData([]);
    setCycleData([]);
    setLoading(true);
    let apiCallCount = 0;
    const fetchData = (dqlName, setData) => {
      apiCallCount++;
      axios.get(`${frontendAlmconfig.backendUrl}/alm_run_dql`, {
        params: {
          domain: selectedDomain,
          project: selectedAlmProject,
          release: project,
          dql_name: dqlName
        }
      })
        .then(response => {
          setData(response.data); // Set table data with response data
          setTableName('project_schedule'); // Set table name to project_schedule
          // setLoading(false); // Set loading to false when response is received
        })
        .catch(error => {
          if (error.response && (error.response.status === 400 || error.response.status === 500)) {
            console.warn(`400 error fetching ${dqlName}:`, error);
          } else {
            console.error(`Error fetching ${dqlName}:`, error);
            alert(`Error fetching ALM details: ${error.message}`);
          }
          setLoading(false); // Set loading to false in case of error
        })
        .finally(() => {
          apiCallCount--;
          if (apiCallCount === 0) {
            setLoading(false); // Set loading to false when all API calls are completed
          }
        });
    };

    fetchData('Target Schedule Template.sql', setRecordData);
    fetchData('Test Coverage Template.sql', setRecorddailyTCData);
    fetchData('Cumulative Test Coverage Template.sql', setRecordCumalativeTCData);
    fetchData('Cycle.sql', setCycleData);
    fetchData('Trend Test Coverage Template.sql', setTrendRecordDailyTCData);
    fetchData('Cumulative Test Coverage Template.sql', setRecordCumalativeTCData);
    fetchData('Cumulative Variances By Root Cause And Severity Template.sql', setCumalativeDefectSnSTCData);
    fetchData('Cumulative Variances By Severity And Status Template.sql', setCumalativeDefectSeverityTCData);
    fetchData('Sev 1 Aging Template.sql', setSev_1_agingTCData);
    fetchData('Daily Variance Created Or Closed Template.sql', setDailyVarainceCreatedTCData);
    fetchData('Cumulative SIT Effectiveness Template.sql', setSitEffectivenessTCData);
  };

  const handleProjectChange = (selectedOption) => {
    const project = selectedOption ? selectedOption.value : '';
    setSelectedProject(project); // Update state with selected project
    // Fetch data from alm_project_schedule endpoint
    setLoading(true);
    setTrendRecordDailyTCData([]);
    setRecordData([]);
    setRecorddailyTCData([]);
    setRecordCumalativeTCData([]);
    setCumalativeDefectSnSTCData([]);
    setSev_1_agingTCData([]);
    setDailyVarainceCreatedTCData([]);
    setSitEffectivenessTCData([]);
    setCumalativeDefectSeverityTCData([]);
    setCycleData([]);
    setLoading(true);
    let apiCallCount = 0;

    const fetchData = (dqlName, setData) => {
      apiCallCount++;

      axios.get(`${frontendAlmconfig.backendUrl}/alm_run_dql`, {
        params: {
          domain: selectedDomain,
          project: selectedAlmProject,
          release: project,
          dql_name: dqlName
        }
      })
        .then(response => {
          setData(response.data); // Set table data with response data
          setTableName('project_schedule'); // Set table name to project_schedule
        //  setLoading(false); // Set loading to false when response is received
        })
        .catch(error => {
          if (error.response && (error.response.status === 400 || error.response.status === 500)) {
            console.warn(`400 error fetching ${dqlName}:`, error);
          } else {
            console.error(`Error fetching ${dqlName}:`, error);
            alert(`Error fetching ALM details: ${error.message}`);
          }
          setLoading(false); // Set loading to false in case of error
        })
        .finally(() => {
          apiCallCount--;
          if (apiCallCount === 0) {
            setLoading(false); // Set loading to false when all API calls are completed
          }
        });
    };

    fetchData('Target Schedule Template.sql', setRecordData);
    fetchData('Test Coverage Template.sql', setRecorddailyTCData);
    fetchData('Cumulative Test Coverage Template.sql', setRecordCumalativeTCData);
    fetchData('Cycle.sql', setCycleData);
    fetchData('Trend Test Coverage Template.sql', setTrendRecordDailyTCData);
    fetchData('Cumulative Test Coverage Template.sql', setRecordCumalativeTCData);
    fetchData('Cumulative Variances By Root Cause And Severity Template.sql', setCumalativeDefectSnSTCData);
    fetchData('Cumulative Variances By Severity And Status Template.sql', setCumalativeDefectSeverityTCData);
    fetchData('Sev 1 Aging Template.sql', setSev_1_agingTCData);
    fetchData('Daily Variance Created Or Closed Template.sql', setDailyVarainceCreatedTCData);
    fetchData('Cumulative SIT Effectiveness Template.sql', setSitEffectivenessTCData);
  };

  const handleDomainChange = (event) => {
    const domain = event.target.value;
    setSelectedDomain(domain);

    if (domain === 'MLIDT') {
      setAlmProjectOptions(['Deposits_F24', 'Deposits_F25', 'Lending_F24', 'Lending_F25','Securitization_F25']);
      setProjectOptions([]);
    } else if (domain === 'RBSS') {
      setAlmProjectOptions(['ATM_Release_36', 'ATM_BASE_2024']);
      setProjectOptions([]);
    } else {
      setAlmProjectOptions([]);
      setProjectOptions([]);
      setCycleData([]);
    }
  };

  useEffect(() => {
    if (trendRecordDailyTCData && trendRecordDailyTCData.length > 0) {
      let filteredData = trendRecordDailyTCData;

      // Apply filter if a specific cycle is selected
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(trendRecordDailyTCData, selectedCycle);
      }

      // Get unique dates
      const dates = [...new Set(filteredData.map(data => data.EXECION_DATE))];
      const statuses = ['Failed', 'Blocked', 'Passed'];

      // Process data for each status
      const datasets = statuses.map(status => {
        const statusData = dates.map(date => {
          // Filter rows matching the current date and status
          const dateData = filteredData.filter(data => data.EXECION_DATE === date && data.Status === status);

          // Sum MANUAL and AUTOMATED counts for the date and status
          const manualSum = dateData.reduce((sum, data) => sum + parseInt(data.MANUAL || 0), 0);
          const automatedSum = dateData.reduce((sum, data) => sum + parseInt(data.AUTOMATED || 0), 0);

          return parseInt(manualSum) + parseInt(automatedSum);
        });

        // Generate random colors for the chart

        let backgroundColor, borderColor;
        if (status === 'Passed') {
          backgroundColor = 'rgba(40, 231, 6, 0.6)'; // Blue
          borderColor = 'rgb(24, 176, 93)';
        } else if (status === 'Failed') {
          backgroundColor = 'rgba(255, 0, 0, 0.6)'; // Red
          borderColor = 'rgba(255, 0, 0, 1)';
        } else if (status === 'Blocked') {
          backgroundColor = 'rgba(0, 0, 0, 0.6)'; // Black
          borderColor = 'rgba(0, 0, 0, 1)';
        } else {
          backgroundColor = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`;
          borderColor = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`;
        }

        return {
          label: status,
          data: statusData,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 1,
          fill: false,
        };
      });

      // Update chart data
      setTrendDailyChartData({ labels: dates, datasets });
    }
  }, [trendRecordDailyTCData, selectedCycle]);

  useEffect(() => {
    if (recordDailyTCData && recordDailyTCData.length > 0) {
      let filteredData = recordDailyTCData;
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(recordDailyTCData, selectedCycle);
      }
      const cycles = [...new Set(filteredData.map(data => data.CYCLE))];
      const statuses = ['Total Planned', 'Total Executed', 'Passed', 'Failed', 'Not Completed', 'Blocked', 'No Run', 'N/A (Descoped)'];

      const datasets = cycles.map(cycle => {
        const cycleData = filteredData.filter(data => data.CYCLE === cycle);
        const manualData = statuses.map(status => {
          const statusData = cycleData.find(data => data.Status === status);
          return statusData ? statusData.MANUAL : 0;
        });
        const automatedData = statuses.map(status => {
          const statusData = cycleData.find(data => data.Status === status);
          return statusData ? statusData.AUTOMATED : 0;
        });

        const randomColor = () => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`;

        return [
          {
            label: `${cycle} - MANUAL`,
            data: manualData,
            backgroundColor: randomColor(),
            borderColor: randomColor(),
            borderWidth: 1,
          },
          {
            label: `${cycle} - AUTOMATED`,
            data: automatedData,
            backgroundColor: randomColor(),
            borderColor: randomColor(),
            borderWidth: 1,
          },
        ];
      }).flat();

      setDailyChartData({ labels: statuses, datasets });
    }
  }, [recordDailyTCData, selectedCycle]);

  useEffect(() => {
    if (recordCumalativeTCData && recordCumalativeTCData.length > 0) {
      let filteredData = recordCumalativeTCData;
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(recordCumalativeTCData, selectedCycle);
      }
      const cycles = [...new Set(filteredData.map(data => data.CYCLE))];
      const statuses = ['Total Planned', 'Total Executed', 'Passed', 'Failed', 'Not Completed', 'Blocked', 'No Run', 'N/A (Descoped)'];

      const datasets = cycles.map(cycle => {
        const cycleData = filteredData.filter(data => data.CYCLE === cycle);
        const manualData = statuses.map(status => {
          const statusData = cycleData.find(data => data.Status === status);
          return statusData ? statusData.MANUAL : 0;
        });
        const automatedData = statuses.map(status => {
          const statusData = cycleData.find(data => data.Status === status);
          return statusData ? statusData.AUTOMATED : 0;
        });

        const randomColor = () => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`;

        return [
          {
            label: `${cycle} - MANUAL`,
            data: manualData,
            backgroundColor: randomColor(),
            borderColor: randomColor(),
            borderWidth: 1,
          },
          {
            label: `${cycle} - AUTOMATED`,
            data: automatedData,
            backgroundColor: randomColor(),
            borderColor: randomColor(),
            borderWidth: 1,
          },
        ];
      }).flat();

      setCumulativeChartData({ labels: statuses, datasets });
    }
  }, [recordCumalativeTCData, selectedCycle]);

  useEffect(() => {
    if (recordCumalativeDefectSnSTCData && recordCumalativeDefectSnSTCData.length > 0) {
      let filteredData = recordCumalativeDefectSnSTCData;
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(recordCumalativeDefectSnSTCData, selectedCycle);
      }

      const rootCause = [...new Set(filteredData.map(data => data.ROOTCAUSE))];
      const cycles = [...new Set(filteredData.map(data => data.CYCLE))];

      const datasets = cycles.map(cycle => {
        const cycleData = filteredData.filter(data => data.CYCLE === cycle);

        const sev1Data = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.ROOTCAUSE === cause);
          return causeData ? parseInt(causeData.SEV1 || 0, 10) : 0;
        });
        const sev2Data = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.ROOTCAUSE === cause);
          return causeData ? parseInt(causeData.SEV2 || 0, 10) : 0;
        });
        const sev3Data = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.ROOTCAUSE === cause);
          return causeData ? parseInt(causeData.SEV3 || 0, 10) : 0;
        });
        const sev4Data = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.ROOTCAUSE === cause);
          return causeData ? parseInt(causeData.SEV4 || 0, 10) : 0;
        });

        return [
          {
            label: `${cycle} - SEV1`,
            data: sev1Data,
            backgroundColor: 'rgba(248, 6, 58, 0.6)', // Red
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - SEV2`,
            data: sev2Data,
            backgroundColor: 'rgba(238, 59, 23, 0.6)', // Blue
            borderColor: 'rgb(219, 105, 5)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - SEV3`,
            data: sev3Data,
            backgroundColor: 'rgba(75, 192, 192, 0.6)', // Green
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - SEV4`,
            data: sev4Data,
            backgroundColor: 'rgba(153, 102, 255, 0.6)', // Purple
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
          },
        ];
      }).flat();

      setcumalativeDefectSnSChartData({ labels: rootCause, datasets });
    }
  }, [recordCumalativeDefectSnSTCData, selectedCycle]);


  useEffect(() => {
    if (recordSev_1_agingTCData && recordSev_1_agingTCData.length > 0) {
      let filteredData = recordSev_1_agingTCData;
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(recordSev_1_agingTCData, selectedCycle);
      }

      const agingCategories = [...new Set(filteredData.map(data => data.AgingCategory))];

      const counts = agingCategories.map(category => {
        return filteredData
          .filter(data => data.AgingCategory === category)
          .reduce((sum, data) => sum + parseInt(data.Count || 0, 10), 0);
      });

      const pieChartData = {
        labels: agingCategories,
        datasets: [
          {
            data: counts,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)', // Red
              'rgba(54, 162, 235, 0.6)', // Blue
              'rgba(75, 192, 192, 0.6)', // Green
              'rgba(153, 102, 255, 0.6)', // Purple
              'rgba(255, 206, 86, 0.6)', // Yellow
              'rgba(255, 159, 64, 0.6)', // Orange
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };

      setSev_1_agingChartData(pieChartData);
    }
  }, [recordSev_1_agingTCData, selectedCycle]);



  useEffect(() => {
    if (recordDailyVarainceCreatedTCData && recordDailyVarainceCreatedTCData.length > 0) {
      let filteredData = recordDailyVarainceCreatedTCData;
      const agingCategories = [...new Set(filteredData.map(data => data.Label))];

      const counts = agingCategories.map(category => {
        return filteredData
          .filter(data => data.Label === category)
          .reduce((sum, data) => sum + parseInt(data.Value || 0, 10), 0);
      });

      const pieChartData = {
        labels: agingCategories,
        datasets: [
          {
            data: counts,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)', // Red
              'rgba(54, 162, 235, 0.6)', // Blue
              'rgba(75, 192, 192, 0.6)', // Green
              'rgba(153, 102, 255, 0.6)', // Purple
              'rgba(255, 206, 86, 0.6)', // Yellow
              'rgba(255, 159, 64, 0.6)', // Orange
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };

      setDailyVarainceCreatedChartData(pieChartData);
    }
  }, [recordDailyVarainceCreatedTCData, setDailyVarainceCreatedChartData]);

  useEffect(() => {
    if (recordSitEffectivenessTCData.length > 0) {
      const data = recordSitEffectivenessTCData[0]; // Assuming only one row of data
  
      // Check if the expected properties exist in the data object
      if (data && data.SIT !== undefined && data.UAT !== undefined && data.SIT_EFFECTIVENESS !== undefined) {
        const labels = ['SIT', 'UAT', 'SIT_Effectiveness'];
        const values = [data.SIT, data.UAT, (parseInt(data.SIT_EFFECTIVENESS) * 100).toFixed(2)]; 
  
        const barChartData = {
          labels: labels,
          datasets: [
            {
              label: 'SIT Effectiveness Data',
              data: values,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)', // Red
                'rgba(54, 162, 235, 0.6)', // Blue
                'rgba(75, 192, 192, 0.6)', // Green
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)',
              ],
              borderWidth: 1,
            },
          ],
        };
  
        setSitEffectivenessChartData(barChartData);
      } else {
        console.error('Data format is incorrect or missing properties');
      }
    } else {
      console.error('recordSitEffectivenessTCData is not an array or is empty');
    }
  }, [recordSitEffectivenessTCData, selectedCycle]);

  
  useEffect(() => {
    if (recordCumalativeDefectSeverityTCData && recordCumalativeDefectSeverityTCData.length > 0) {
      let filteredData = recordCumalativeDefectSeverityTCData;
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(recordCumalativeDefectSeverityTCData, selectedCycle);
      }

      const rootCause = [...new Set(filteredData.map(data => data.SEV_NAME))];
      const cycles = [...new Set(filteredData.map(data => data.CYCLE))];

      const datasets = cycles.map(cycle => {
        const cycleData = filteredData.filter(data => data.CYCLE === cycle);

        const New = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.SEV_NAME === cause);
          return causeData ? parseInt(causeData.New || 0, 10) : 0;
        });
        const Opened = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.SEV_NAME === cause);
          return causeData ? parseInt(causeData.Opened || 0, 10) : 0;
        });
        const Fixed = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.SEV_NAME === cause);
          return causeData ? parseInt(causeData.Fixed || 0, 10) : 0;
        });
        const Awaiting = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.SEV_NAME === cause);
          return causeData ? parseInt(causeData.Awaiting || 0, 10) : 0;
        });
        const Monitor = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.SEV_NAME === cause);
          return causeData ? parseInt(causeData.Monitor || 0, 10) : 0;
        });
        const Reopen = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.SEV_NAME === cause);
          return causeData ? parseInt(causeData.Reopen || 0, 10) : 0;
        });
        const Deferred = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.SEV_NAME === cause);
          return causeData ? parseInt(causeData.Deferred || 0, 10) : 0;
        });
        const Rejected = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.SEV_NAME === cause);
          return causeData ? parseInt(causeData.Rejected || 0, 10) : 0;
        });
        const Closed = rootCause.map(cause => {
          const causeData = cycleData.find(data => data.SEV_NAME === cause);
          return causeData ? parseInt(causeData.Closed || 0, 10) : 0;
        });
        return [
          {
            label: `${cycle} - New`,
            data: New,
            backgroundColor: 'rgba(248, 6, 58, 0.6)', // Red
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - Opened`,
            data: Opened,
            backgroundColor: 'rgba(238, 59, 23, 0.6)', // Blue
            borderColor: 'rgb(219, 105, 5)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - Fixed`,
            data: Fixed,
            backgroundColor: 'rgba(75, 192, 192, 0.6)', // Green
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - Awaiting`,
            data: Awaiting,
            backgroundColor: 'rgba(153, 102, 255, 0.6)', // Purple
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - Monitor`,
            data: Monitor,
            backgroundColor: 'rgba(27, 240, 62, 0.6)', // Red
            borderColor: 'rgb(31, 230, 25)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - Reopen`,
            data: Reopen,
            backgroundColor: 'rgba(10, 13, 226, 0.6)', // Blue
            borderColor: 'rgb(26, 8, 180)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - Deferred`,
            data: Deferred,
            backgroundColor: 'rgba(236, 0, 165, 0.6)', // Green
            borderColor: 'rgba(202, 12, 145, 0.6)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - Rejected`,
            data: Rejected,
            backgroundColor: 'rgba(231, 36, 62, 0.6)', // Purple
            borderColor: 'rgba(170, 20, 40, 0.6)',
            borderWidth: 1,
          },
          {
            label: `${cycle} - Closed`,
            data: Closed,
            backgroundColor: 'rgba(26, 226, 116, 0.7)', // Purple
            borderColor: 'rgba(26, 226, 116, 0.95)',
            borderWidth: 1,
          }
        ];
      }).flat();

      setcumalativeDefectSeverityChartData({ labels: rootCause, datasets });
    }
  }, [recordCumalativeDefectSeverityTCData, selectedCycle]);


  const options = {
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        ticks: {
          stepSize: 1, // Ensure y-axis shows only whole numbers
        },
      },
    },
  };

  const doghnutOptions = {
    responsive: true,
    maintainAspectRatio: false, // Set to false to not maintain aspect ratio
    aspectRatio: 1, // Adjust the aspect ratio to control the size
    plugins: {
      datalabels: {
        display: true,
        color: 'white',
        formatter: (value, context) => {
          const label = context.chart.data.labels[context.dataIndex];
          return `${label}: ${value}`;
        },
      },
    },
  };
  const handleAlmProjectChange = (event) => {
    const almProject = event.target.value;
    setSelectedAlmProject(almProject);
    setProjectOptions([]);
    setRecordData([]);
    setRecorddailyTCData([]);
    setRecordCumalativeTCData([]);
    setCumalativeDefectSnSTCData([]);
    setSev_1_agingTCData([]);
    setDailyVarainceCreatedTCData([]);
    setSitEffectivenessTCData([]);
    setCumalativeDefectSeverityTCData([]);
    setTrendRecordDailyTCData([]);
    setLoading(true);
    axios.get(`${frontendAlmconfig.backendUrl}/alm_only_release`, {
      params: {
        domain: selectedDomain,
        project: almProject
      }
      

    })
      .then(response => {
        const projectNames = response.data.map(item => item.REL_NAME);
        setProjectOptions(projectNames);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching project options:', error);
        setLoading(false);

        alert('Error fetching project details:', error.message);
      });
  };

  const handleGanttFilterChange = (event) => {
    setGanttFilter(event.target.value);
  };

  const handleTrendDailyTCFilter = (event) => {
    setTrendDailyTCFilter(event.target.value);
  };

  const handleCumalativeDefectSeverityTTCFilterChange = (event) => {
    setcumalativeDefectSeverityTCFilter(event.target.value);
  };

  const handleCumalativeDefectSnSTTCFilterChange = (event) => {
    setcumalativeDefectSnSTTCFilter(event.target.value);
  };
  const handleSev_1_agingTCFilterChange = (event) => {
    setSev_1_agingTTCFilter(event.target.value);
  };
  const handleDSitEffectivenessFilterChange = (event) => {
    setSitEffectivenessTTCFilter(event.target.value);
  };
  const handleDailyVarainceCreatedFilterChange = (event) => {
    setDailyVarainceCreatedTTCFilter(event.target.value);
  };
  const handleCumulativeTCFilterChange = (event) => {
    setCumulativeTCFilter(event.target.value);
  };

  const handleDailyTCFilterChange = (event) => {
    setDailyTCFilter(event.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleCycleChange = (event) => {
    const cycle = event.target.value;
    if (cycle) {
      setSelectedCycle(cycle); // Update state with selected cycle
      if (cycle === 'All') {
        setTableData(recordData); // Show all data if "All" is selected
      } else {
        const filteredData = applyFilter(recordData, cycle); // Filter data based on selected cycle
        setTableData(filteredData); // Update table data with filtered data
      }
    }
  };

  const applyFilter = (data, cycle) => {
    // Implement your filtering logic here based on the selected cycle
    return data.filter(item => item.CYCLE === cycle);
  };

  const parseDateMMMYY = (dateStr) => {
    const [month, year] = dateStr.split('-');
    return new Date(`${month} 01, 20${year}`);
  };

  const handleGoBack = () => {
    history.push('/');
  };


  
  useEffect(() => {
    document.title = "CBPT Automation Team Tracker";
  }, []);

  useEffect(() => {
    if (recordData.length > 0) {
      gantt.config.columns = [
        { name: "text", label: "Task name", width: "*", tree: true },
        { name: "start_date", label: "Start time", align: "center" },
        { name: "duration", label: "Duration", align: "center" }
      ];
      gantt.config.scale_unit = "week";
      gantt.config.scale_height = 50;
      gantt.init("gantt_here");
      let filteredData = recordData;
      // if (selectedCycle && selectedCycle !== 'All') {
      //   filteredData = applyFilter(recordData, selectedCycle);
      // }
      const chartData = filteredData.map(row => ({
        id: row.CYCLE,
        text: row.CYCLE,
        start_date: new Date(row.PLANNED_START_DATE),
        end_date: new Date(row.PLANNED_END_DATE),
      }));
      gantt.clearAll();
      gantt.parse({ data: chartData });
    }
  }, [recordData, selectedCycle]);

  const renderTable = (data, filter, handleFilterChange, isTestCoverageTable = false, isDefectTable = false, istimeLine = false) => {
    if (!data || data.length === 0) {
      return <p>No data found!</p>;
    }

    let filteredData;
    if (selectedCycle === 'All' || !selectedCycle) {
      filteredData = data; // Show all data if "All" is selected or no cycle is selected
    } else {
      if (istimeLine === true) {
        filteredData = data;
      }
      else {
        filteredData = applyFilter(data, selectedCycle); // Filter data based on selected cycle
      }
    }

    // Apply individual filter on the first column
    if (filter) {
      filteredData = filteredData.filter(row =>
        Object.values(row)[0].toString().toLowerCase().includes(filter.toLowerCase())
      );
    }

    return (
      <div className="table-container-alm">
        <table>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key, index) => (
                <th key={key}>
                  {key}
                  {index === 0 && !istimeLine && (
                    <>
                      <br />
                      <input
                        type="text"
                        value={filter}
                        onChange={handleFilterChange}
                        placeholder={`Filter ${key}`}
                      />
                    </>
                  )}
                </th>
              ))}
              {(isTestCoverageTable || isDefectTable) && <th>TOTAL</th>} {/* Add header for the sum column if it's a test coverage table */}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, i) => (
                  <td key={i}>{value}</td>
                ))}
                {isTestCoverageTable && (
                  <td>
                    {parseFloat(Object.values(row)[2]) + parseFloat(Object.values(row)[3])}
                  </td>
                )}
                {isDefectTable && (
                  <td>
                    {parseFloat(Object.values(row)[2]) + parseFloat(Object.values(row)[3]) + parseFloat(Object.values(row)[4]) + parseFloat(Object.values(row)[5])}
                  </td>
                )}

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderGanttChart = () => {
    return (
      <div id="gantt_here" style={{ width: '100%', height: '250px' }}></div>
    );
  };
  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderWidth: '0.25px',
      borderColor: 'black',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'black',
    }),
  };

  // Add custom styles for h5 elements
  const h5Style = {
    color: 'blue', // Change this to your desired color
  };

  return (
    <div className="form-page-record-view">
      <h1>ALM Project Execution Details</h1>
      <h4 style={{ color: '#0c8835' }}>Always refresh page for new search criteria.</h4> 

      <div className="form-row-alm">
        <div className="form-column-alm">
          <label className="auto-size-alm">*Domain:</label>
          <select name="domain" onChange={handleDomainChange} required className="auto-size-alm">
            <option value=""></option>
            <option value="MLIDT">MLIDT</option>
            <option value="RBSS">RBSS</option>
          </select>
        </div>
        <div className="form-column-alm">
          <label className="auto-size-alm">*ALM Project:</label>
          <select name="alm_project" onChange={handleAlmProjectChange} required className="auto-size-alm">
            <option value=""></option>
            {almProjectOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="form-column-alm">
          <label className="auto-size-alm">*Project:</label>
          <Select
            name="project"
            options={projectOptions.map(option => ({ value: option, label: option }))}
            onChange={handleProjectChange}
            isClearable
            styles={customStyles}
            className="auto-size-alm select-form-type-row select"
          />
        </div>
        <div className="form-column-alm">
          <label className="auto-size-alm">*Cycle:</label>
          <select name="cycle" onChange={handleCycleChange} required className="auto-size-alm">
            <option value=""></option>
            <option value="All">All</option>
            {CycleData.map((option, index) => (
              <option key={index} value={option.CYCLE}>{option.CYCLE}</option>
            ))}
          </select>
        </div>
      </div>
      {loading && <div className="loading-spinner"></div>}

      <br />
      {trendRecordDailyTCData && trendRecordDailyTCData.length > 0 && (
        <div className="button-row-2">
          <div className="form-column-alm-2">
            <div className="record-data chart-box-alm-2">

              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {trendDailyChartData && <Line data={trendDailyChartData} options={options} />}
            </div>
          </div>

        </div>
      )}
      {trendRecordDailyTCData.length === 0 && loading === 'false' && (
        <div className="button-row-2">
          <div className="form-column-alm">
            <label className="label-wide" >Project Timeline</label>
            <div className="record-data">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {renderTable()}
            </div>
          </div>
          <div className="form-column-alm">
          </div>
        </div>
      )}
      <br />
      {recordData && recordData.length > 0 && (
        <div className="button-row-2">
          <div className="form-column-alm">
            <label className="label-wide" >Project Timeline</label>
            <div className="record-data">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {renderTable(recordData, false, null, false, false, true)}
            </div>
          </div>
          <div className="form-column-alm">
            <div className="flex-item">
              {renderGanttChart()}
            </div>
          </div>
        </div>
      )}
      {recordData.length === 0 && loading === 'false' && (
        <div className="button-row-2">
          <div className="form-column-alm">
            <label className="label-wide" >Project Timeline</label>
            <div className="record-data">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {renderTable()}
            </div>
          </div>
          <div className="form-column-alm">
          </div>
        </div>
      )}
      <br />
      {recordDailyTCData && recordDailyTCData.length > 0 && (
        <div className="button-row-2">
          <div className="form-column-alm">
            <label className="label-wide" >Daily Test Coverage</label>
            <div className="record-data">
              {renderTable(recordDailyTCData, dailyTCFilter, handleDailyTCFilterChange, true)}
            </div>
          </div>
          <div className="form-column-alm">
            <div className="record-data chart-box">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {dailyChartData && <Bar data={dailyChartData} options={options} />}
            </div>
          </div>
        </div>
      )}
      {recordDailyTCData.length === 0 && loading === 'false' && (
        <div className="button-row-2">
          <div className="form-column-alm">
            <label className="label-wide" >Project Timeline</label>
            <div className="record-data">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {renderTable()}
            </div>
          </div>
          <div className="form-column-alm">
          </div>
        </div>
      )}

      <br />
      {recordCumalativeTCData && recordCumalativeTCData.length > 0 && (
        <div className="button-row-2">
          <div className="form-column-alm">
            <label className="label-wide" >Cumulative Test Coverage </label>
            <div className="record-data">
              {renderTable(recordCumalativeTCData, cumulativeTCFilter, handleCumulativeTCFilterChange, true)}
            </div>
          </div>
          <div className="form-column-alm">
            <div className="record-data chart-box">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {cumulativeChartData && <Bar data={cumulativeChartData} options={options} />}
            </div>
          </div>
        </div>
      )}
      {recordCumalativeTCData.length === 0 && loading === 'false' && (
        <div className="button-row-2">
          <div className="form-column-alm">
            <label className="label-wide" >Project Timeline</label>
            <div className="record-data">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {renderTable()}
            </div>
          </div>
          <div className="form-column-alm">
          </div>
        </div>
      )}
      <br />
      {recordCumalativeDefectSnSTCData && recordCumalativeDefectSnSTCData.length > 0 && (
        <div className="button-row-4">
          <div className="form-column-alm">
            <label className="label-wide">
              Defect Root Cause. <span className="lowercase-text">*Ignoring ROOTCAUSE where there is no defect</span>
            </label>
            <div className="record-data">
              {renderTable(recordCumalativeDefectSnSTCData, cumalativeDefectSnSTTCFilter, handleCumalativeDefectSnSTTCFilterChange, false, true)}
            </div>
          </div>
          <div className="form-column-alm">
            <div className="record-data chart-box">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {cumalativeDefectSnSChartData && <Bar data={cumalativeDefectSnSChartData} options={options} />}
            </div>
          </div>
        </div>
      )}
      {recordCumalativeDefectSnSTCData.length === 0 && loading === 'false' && (
        <div className="button-row-2">
          <div className="form-column-alm">
            <label className="label-wide" >Project Timeline</label>
            <div className="record-data">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {renderTable()}
            </div>
          </div>
          <div className="form-column-alm">
          </div>
        </div>
      )}
      <br />
      {recordCumalativeDefectSeverityTCData && recordCumalativeDefectSeverityTCData.length > 0 && (
        <div className="button-row-4">
          <div className="form-column-alm">
            <label className="label-wide">Defect Severity</label>
            <div className="record-data">
              {renderTable(recordCumalativeDefectSeverityTCData, cumalativeDefectSeverityTTCFilter, handleCumalativeDefectSeverityTTCFilterChange, false, false)}
            </div>
          </div>
          <div className="form-column-alm">
            <div className="record-data chart-box">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {cumalativeDefectSeverityChartData && <Bar data={cumalativeDefectSeverityChartData} options={options} />}
            </div>
          </div>
        </div>
      )}
      {recordCumalativeDefectSeverityTCData.length === 0 && loading === 'false' && (
        <div className="button-row-2">
          <div className="form-column-alm">
            <label className="label-wide" >Project Timeline</label>
            <div className="record-data">
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {renderTable()}
            </div>
          </div>
          <div className="form-column-alm">
          </div>
        </div>
      )}

<br/>
      {recordSitEffectivenessTCData && recordSitEffectivenessTCData.length > 0 && (
        <div className="button-row-4">
          <div className="form-column-alm">
            <label className="label-wide">CUMULATIVE SIT EFFECTIVENESS</label>
            <div className="record-data">
              {renderTable(recordSitEffectivenessTCData, false, null, false, false, true)}

            </div>
          </div>
          <div className="form-column-alm">
            <div className="record-data chart-box">
            <h4 style={h5Style}>SIT Effectiveness</h4> {/* Apply custom style */}
            {SitEffectivenessChartData && <Bar data={SitEffectivenessChartData} options={options} />}
            </div>
          </div>
        </div>
      )}

      {recordSitEffectivenessTCData.length === 0 && loading === 'false' && (
        <div className="button-row-2">
        <div className="form-column-alm">
          <label className="label-wide" >CUMULATIVE SIT EFFECTIVENESS</label>
          <div className="record-data">
            <label className="label-wide" >No Data for CUMULATIVE SIT EFFECTIVENESS.</label>
          </div>
        </div>
        <div className="form-column-alm">
        </div>
        </div>
      )}

      <br />
      {recordSev_1_agingTCData && recordSev_1_agingTCData.length > 0 && (
        <div className="button-row-4">
          <div className="form-column-alm">
            <label className="label-wide">Sev 1 Aging.</label>
            <div className="record-data">
              {renderTable(recordSev_1_agingTCData, Sev_1_agingTTCFilter, handleSev_1_agingTCFilterChange, false, false)}

            </div>
          </div>
          <div className="form-column-alm">
            <div className="record-data chart-box" style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}> {/* Center align the chart */}
              {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
              {Sev_1_agingChartData && <Doughnut data={Sev_1_agingChartData} options={doghnutOptions} />} {/* Add Pie chart */}

            </div>
          </div>
        </div>
      )}

      {recordSev_1_agingTCData.length === 0 && loading === 'false' && (
        <div className="button-row-2">
          <div className="form-column-alm">
            <label className="label-wide" >Sev 1 Aging</label>
            <div className="record-data">
              <label className="label-wide" >No Data for Sev 1 Aging.</label>
            </div>
          </div>
          <div className="form-column-alm">
          </div>
        </div>
      )}
      <br />
      {recordDailyVarainceCreatedTCData && recordDailyVarainceCreatedTCData.length > 0 && (
        <div className="button-row-4">
          <div className="form-column-alm">
            <label className="label-wide">DAILY VARIANCE CREATED / CLOSED.</label>
            <div className="record-data">
              {renderTable(recordDailyVarainceCreatedTCData, false, null, false, false, true)}
            </div>
          </div>
          <div className="form-column-alm">
            <div className="record-data chart-box" style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}> {/* Center align the chart */}
              {formType}
              {DailyVarainceCreatedChartData && <Doughnut data={DailyVarainceCreatedChartData} options={doghnutOptions} />} {/* Add Pie chart */}
            </div>
          </div>
        </div>
      )}
      {recordDailyVarainceCreatedTCData.length === 0 && loading === 'false' && (
        <div className="button-row-2">
        <div className="form-column-alm">
          <label className="label-wide" >DAILY VARIANCE CREATED / CLOSED.</label>
          <div className="record-data">
            <label className="label-wide" >No Data for DAILY VARIANCE CREATED / CLOSED.</label>
          </div>
        </div>
        <div className="form-column-alm">
        </div>
        </div>
      )}


      
      <br/>
      <div className="button-row">
        {/* <button onClick={downloadExcel} className="download-button">Download Excel</button> */}
        <button onClick={handleGoBack} className="back-button">Back to Main Menu</button>
      </div>
    </div>
  );
};

AlmProjectExecution.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default AlmProjectExecution;