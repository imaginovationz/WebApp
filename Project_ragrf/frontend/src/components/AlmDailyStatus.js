import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import { useHistory } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
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
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'; // Only chart components
import Chart from "chart.js/auto"; // Chart.js core object
import ChartDataLabels from 'chartjs-plugin-datalabels';


Chart.register(ChartDataLabels);

const colorPalette = [
  {
    bg: 'rgba(54, 162, 235, 0.7)',
    border: 'rgba(54, 162, 235, 1)',
    gradient: ['rgba(54, 162, 235, 0.9)', 'rgba(54, 162, 235, 0.2)']
  },
  {
    bg: 'rgba(75, 192, 192, 0.7)',
    border: 'rgba(75, 192, 192, 1)',
    gradient: ['rgba(75, 192, 192, 0.9)', 'rgba(75, 192, 192, 0.2)']
  },
  {
    bg: 'rgba(153, 102, 255, 0.7)',
    border: 'rgba(153, 102, 255, 1)',
    gradient: ['rgba(153, 102, 255, 0.9)', 'rgba(153, 102, 255, 0.2)']
  },
  {
    bg: 'rgba(255, 99, 132, 0.7)',
    border: 'rgba(255, 99, 132, 1)',
    gradient: ['rgba(255, 99, 132, 0.9)', 'rgba(255, 99, 132, 0.2)']
  },
  {
    bg: 'rgba(255, 159, 64, 0.7)',
    border: 'rgba(255, 159, 64, 1)',
    gradient: ['rgba(255, 159, 64, 0.9)', 'rgba(255, 159, 64, 0.2)']
  },
  {
    bg: 'rgba(255, 206, 86, 0.7)',
    border: 'rgba(255, 206, 86, 1)',
    gradient: ['rgba(255, 206, 86, 0.9)', 'rgba(255, 206, 86, 0.2)']
  },
  {
    bg: 'rgba(45, 52, 84, 0.7)',
    border: 'rgba(45, 52, 84, 1)',
    gradient: ['rgba(45, 52, 84, 0.9)', 'rgba(45, 52, 84, 0.2)']
  },
  {
    bg: 'rgba(16, 121, 105, 0.7)',
    border: 'rgba(16, 121, 105, 1)',
    gradient: ['rgba(16, 121, 105, 0.9)', 'rgba(16, 121, 105, 0.2)']
  },
  {
    bg: 'rgba(128, 0, 128, 0.7)',
    border: 'rgba(128, 0, 128, 1)',
    gradient: ['rgba(128, 0, 128, 0.9)', 'rgba(128, 0, 128, 0.2)']
  },
  {
    bg: 'rgba(0, 68, 102, 0.7)',
    border: 'rgba(0, 68, 102, 1)',
    gradient: ['rgba(0, 68, 102, 0.9)', 'rgba(0, 68, 102, 0.2)']
  },
  {
    bg: 'rgba(139, 69, 19, 0.7)',
    border: 'rgba(139, 69, 19, 1)',
    gradient: ['rgba(139, 69, 19, 0.9)', 'rgba(139, 69, 19, 0.2)']
  },
  {
    bg: 'rgba(35, 87, 137, 0.7)',
    border: 'rgba(35, 87, 137, 1)',
    gradient: ['rgba(35, 87, 137, 0.9)', 'rgba(35, 87, 137, 0.2)']
  },
];

const getModernChartOptions = (xLabel, yLabel, stacked = true) => {
  return {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
      delay: (context) => context.dataIndex * 100
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            family: "'Poppins', 'Roboto', sans-serif",
            weight: '500'
          },
          color: '#333',
          boxWidth: 12,
          boxHeight: 12
        }
      },
      title: {
        display: false,
        font: {
          size: 18,
          family: "'Poppins', 'Roboto', sans-serif",
          weight: '700'
        },
        padding: {
          top: 20,
          bottom: 20
        },
        color: '#333'
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        titleFont: {
          size: 14,
          family: "'Poppins', 'Roboto', sans-serif",
          weight: '700'
        },
        bodyFont: {
          size: 13,
          family: "'Poppins', 'Roboto', sans-serif"
        },
        padding: 15,
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        boxPadding: 5,
        usePointStyle: true,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}`;
          }
        }
      },
      datalabels: {
        display: true,
        align: 'top',
        offset: 7,
        color: '#333',
        font: {
          weight: 'bold',
          size: 11,
          family: "'Poppins', 'Roboto', sans-serif",
        },
        formatter: (value) => value || ''
      }
    },
    scales: {
      x: {
        stacked: stacked,
        title: {
          display: true,
          text: xLabel,
          font: {
            size: 15,
            family: "'Poppins', 'Roboto', sans-serif",
            weight: '600'
          },
          padding: { top: 15, bottom: 10 },
          color: '#555'
        },
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            family: "'Poppins', 'Roboto', sans-serif",
            size: 12,
            weight: '500'
          },
          color: '#666',
          padding: 10
        }
      },
      y: {
        stacked: stacked,
        title: {
          display: true,
          text: yLabel,
          font: {
            size: 15,
            family: "'Poppins', 'Roboto', sans-serif",
            weight: '600'
          },
          padding: { top: 15, bottom: 10 },
          color: '#555'
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            family: "'Poppins', 'Roboto', sans-serif",
            size: 12,
            weight: '500'
          },
          color: '#666',
          padding: 10,
          stepSize: 1
        },
        afterDataLimits: (scale) => {
          if (scale.max !== 0) {
            scale.max = scale.max * 1.5; // Increase max value by 30%
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      bar: {
        borderRadius: 8,
        borderSkipped: false,
        backgroundColor: function (context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return null;
          }

          const colorIndex = context.datasetIndex % colorPalette.length;
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, colorPalette[colorIndex].gradient[1]);
          gradient.addColorStop(1, colorPalette[colorIndex].gradient[0]);
          return gradient;
        }
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        hitRadius: 10
      }
    },
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };
};

const getModernDoughnutOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutCirc'
    },
    plugins: {
      legend: {
        position: "right",
        align: "center",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            family: "'Poppins', 'Roboto', sans-serif",
            weight: '500'
          },
          color: '#333',
          boxWidth: 12,
          boxHeight: 12
        }
      },
      title: {
        display: false,
        font: {
          size: 18,
          family: "'Poppins', 'Roboto', sans-serif",
          weight: '700'
        },
        padding: {
          top: 20,
          bottom: 20
        },
        color: '#333'
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        titleFont: {
          size: 14,
          family: "'Poppins', 'Roboto', sans-serif",
          weight: '700'
        },
        bodyFont: {
          size: 13,
          family: "'Poppins', 'Roboto', sans-serif"
        },
        padding: 15,
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        boxPadding: 5,
        usePointStyle: true,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percent = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percent}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: 'white',
        font: {
          weight: 'bold',
          size: 11,
          family: "'Poppins', 'Roboto', sans-serif",
        },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
          const percent = ((value / total) * 100).toFixed(1);
          return percent >= 5 ? `${percent}%` : '';
        }
      }
    },
    layout: {
      padding: 20
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: 'white',
        hoverBorderColor: 'white'
      }
    },
    cutout: '60%'
  };
};

const AlmDailyStatus = ({ headers }) => {
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

  // SIT Effectiveness
  const [recordSitEffectivenessTCData, setSitEffectivenessTCData] = useState([]); //using for daily TC 
  const [SitEffectivenessTTCFilter, setSitEffectivenessTTCFilter] = useState(''); // Filter for the cumulative TC table
  const [SitEffectivenessChartData, setSitEffectivenessChartData] = useState(null);

  // defect trend
  const [trendRecordDefectDailyTCData, setTrendRecordDefectDailyTCData] = useState([]); //using for daily TC 
  const [trendDefectDailyTCFilter, setTrendDefectDailyTCFilter] = useState(''); // Filter for the daily TC table
  const [trendDefectDailyChartData, setTrendDefectDailyChartData] = useState(null);

  // Add these new state variables
  const [defectOpenDaysData, setDefectOpenDaysData] = useState([]); 
  const [defectOpenDaysFilter, setDefectOpenDaysFilter] = useState('');
  const [defectOpenDaysChartData, setDefectOpenDaysChartData] = useState(null);

  // Add missing state variables for Application open defect
  const [applicationOpenDefectData, setApplicationOpenDefectData] = useState([]);
  const [applicationOpenDefectFilter, setApplicationOpenDefectFilter] = useState('');
  const [applicationOpenDefectChartData, setApplicationOpenDefectChartData] = useState(null);

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
    let apiCallCount = 0;
    setTrendRecordDailyTCData([]);
    setRecordData([]);
    setRecorddailyTCData([]);
    setTrendRecordDefectDailyTCData([]);
    setRecordCumalativeTCData([]);
    setCumalativeDefectSnSTCData([]);
    setSev_1_agingTCData([]);
    setDailyVarainceCreatedTCData([]);
    setSitEffectivenessTCData([]);
    setCumalativeDefectSeverityTCData([]);
    setDefectOpenDaysChartData([]);
    setApplicationOpenDefectChartData([]);
    setCycleData([]);
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
        });;
    };

    fetchData('Target Schedule Template.sql', setRecordData);
    fetchData('Application_defect.sql', setRecorddailyTCData);
    fetchData('Defect_trends.sql', setTrendRecordDefectDailyTCData);
    fetchData('Tester_Count.sql', setRecordCumalativeTCData);
    fetchData('Cycle.sql', setCycleData);
    fetchData('Trend Test Coverage Template.sql', setTrendRecordDailyTCData);
    fetchData('Daily_Closed_defect.sql', setCumalativeDefectSnSTCData);
    fetchData('Daily_Created_defect.sql', setCumalativeDefectSeverityTCData);
    fetchData('Sev 1 Aging Template.sql', setSev_1_agingTCData);
    fetchData('Defect_open_days.sql', setDefectOpenDaysData);
    fetchData('Application_open_defect.sql', setApplicationOpenDefectData);
    // fetchData('Daily Variance Created Or Closed Template.sql', setDailyVarainceCreatedTCData);
    // fetchData('Cumulative SIT Effectiveness Template.sql', setSitEffectivenessTCData);
  };

  const handleProjectChange = (selectedOption) => {
    const project = selectedOption ? selectedOption.value : '';
    setSelectedProject(project); // Update state with selected project
    // Fetch data from alm_project_schedule endpoint
    setLoading(true);
    setTrendRecordDailyTCData([]);
    setTrendRecordDefectDailyTCData([]);
    setRecordData([]);
    setRecorddailyTCData([]);
    setRecordCumalativeTCData([]);
    setCumalativeDefectSnSTCData([]);
    setSev_1_agingTCData([]);
    setDailyVarainceCreatedTCData([]);
    setSitEffectivenessTCData([]);
    setCumalativeDefectSeverityTCData([]);
    setDefectOpenDaysChartData([]);
    setApplicationOpenDefectChartData([]);
    setCycleData([]);
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
        });;
    };

    fetchData('Target Schedule Template.sql', setRecordData);
    fetchData('Application_defect.sql', setRecorddailyTCData);
    fetchData('Defect_trends.sql', setTrendRecordDefectDailyTCData);
    fetchData('Tester_Count.sql', setRecordCumalativeTCData);
    fetchData('Cycle.sql', setCycleData);
    fetchData('Trend Test Coverage Template.sql', setTrendRecordDailyTCData);
    fetchData('Daily_Closed_defect.sql', setCumalativeDefectSnSTCData);
    fetchData('Daily_Created_defect.sql', setCumalativeDefectSeverityTCData);
    fetchData('Sev 1 Aging Template.sql', setSev_1_agingTCData);
    fetchData('Defect_open_days.sql', setDefectOpenDaysData);
    fetchData('Application_open_defect.sql', setApplicationOpenDefectData);
    // fetchData('Daily Variance Created Or Closed Template.sql', setDailyVarainceCreatedTCData);
    // fetchData('Cumulative SIT Effectiveness Template.sql', setSitEffectivenessTCData);
  };

  const handleDomainChange = (event) => {
    const domain = event.target.value;
    setSelectedDomain(domain);

    if (domain === 'MLIDT') {
      setAlmProjectOptions(['Deposits_F24', 'Deposits_F25', 'Lending_F24', 
        'Lending_F25','Securitization_F25']);
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
      const datasets = statuses.map((status, index) => {
        const statusData = dates.map(date => {
          // Filter rows matching the current date and status
          const dateData = filteredData.filter(data => data.EXECION_DATE === date && data.Status === status);

          // Sum MANUAL and AUTOMATED counts for the date and status
          const manualSum = dateData.reduce((sum, data) => sum + parseInt(data.MANUAL || 0), 0);
          const automatedSum = dateData.reduce((sum, data) => sum + parseInt(data.AUTOMATED || 0), 0);

          return parseInt(manualSum) + parseInt(automatedSum);
        });

        let backgroundColor, borderColor;
        if (status === 'Passed') {
          backgroundColor = 'rgba(40, 231, 6, 0.6)';
          borderColor = 'rgb(24, 176, 93)';
        } else if (status === 'Failed') {
          backgroundColor = 'rgba(255, 0, 0, 0.6)';
          borderColor = 'rgba(255, 0, 0, 1)';
        } else if (status === 'Blocked') {
          backgroundColor = 'rgba(0, 0, 0, 0.6)';
          borderColor = 'rgba(0, 0, 0, 1)';
        } else {
          backgroundColor = colorPalette[index % colorPalette.length].bg;
          borderColor = colorPalette[index % colorPalette.length].border;
        }

        return {
          label: status,
          data: statusData,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: 'white',
          pointBorderColor: borderColor,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
          datalabels: {
            align: 'center',
            offset: 10,
            backgroundColor: 'white',
            borderRadius: 3,
            padding: 3
          }
        };
      });

      // Update chart data
      setTrendDailyChartData({ labels: dates, datasets });
    }
  }, [trendRecordDailyTCData, selectedCycle]);



useEffect(() => {
    if (trendRecordDefectDailyTCData && trendRecordDefectDailyTCData.length > 0) {
      let filteredData = trendRecordDefectDailyTCData;

      // Apply filter if a specific cycle is selected
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(trendRecordDefectDailyTCData, selectedCycle);
      }

      // Get unique dates
      const dates = [...new Set(filteredData.map(data => data.Date))];
      const statuses = ['Total Open Defect', 'New Defect', 'Closed Defect'];

      // Process data for each status
      const datasets = statuses.map((status, index) => {
        const statusData = dates.map(date => {
          const dateData = filteredData.find(data => data.Date === date);
          return parseInt(dateData[status] || 0);
        });

        let backgroundColor, borderColor;
        if (status === 'Total Open Defect') {
          backgroundColor = 'rgba(255, 99, 132, 0.8)';   
          borderColor = 'rgba(220, 50, 80, 1)';         
        } else if (status === 'New Defect') {
          backgroundColor = 'rgba(54, 162, 235, 0.8)';    
          borderColor = 'rgba(30, 120, 190, 1)';         
        } else if (status === 'Closed Defect') {
          backgroundColor = 'rgba(255, 206, 86, 0.8)';   
          borderColor = 'rgba(230, 180, 50, 1)';
        }

        return {
          label: status,
          data: statusData,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: 'white',
          pointBorderColor: borderColor,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
          datalabels: {
            align: 'top',
            offset: 10,
            backgroundColor: 'white',
            borderRadius: 2,
            padding: 2
          }
        };
      });

      // Update chart data
      setTrendDefectDailyChartData({ labels: dates, datasets });
    }
  }, [trendRecordDefectDailyTCData, selectedCycle]);

  useEffect(() => {
    if (recordDailyTCData && recordDailyTCData.length > 0) {
      let filteredData = recordDailyTCData;
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(recordDailyTCData, selectedCycle);
      }
      const cycles = [...new Set(filteredData.map(data => data.CYCLE))];

      const severities = [...new Set(filteredData.map(data => data.SEVERITY))];
      const applications = [...new Set(filteredData.map(data => data.APPLICATION))];

      const datasets = cycles.map(cycle => {
        const cycleData = filteredData.filter(data => data.CYCLE === cycle);
        return applications.map((application, appIndex) => {
          const applicationData = severities.map(severity => {
            const severityData = cycleData.filter(data => data.SEVERITY === severity && data.APPLICATION === application);
            return severityData.reduce((sum, data) => sum + parseInt(data.COUNT || 0), 0);
          });
          
          const colorIndex = appIndex % colorPalette.length;

          return {
            label: `${cycle} - ${application}`,
            data: applicationData,
            backgroundColor: colorPalette[colorIndex].bg,
            borderColor: colorPalette[colorIndex].border,
            borderWidth: 2,
            borderRadius: 6,
          };
        });
      }).flat();

      setDailyChartData({ labels: severities, datasets });
    }
  }, [recordDailyTCData, selectedCycle]);


  useEffect(() => {
    if (recordCumalativeTCData && recordCumalativeTCData.length > 0) {
      let filteredData = recordCumalativeTCData;
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(recordCumalativeTCData, selectedCycle);
      }
      const cycles = [...new Set(filteredData.map(data => data.CYCLE))];

      const severities = [...new Set(filteredData.map(data => data.TC_TESTER_NAME))];
      const applications = [...new Set(filteredData.map(data => data.TC_STATUS))];

      const datasets = cycles.map(cycle => {
        const cycleData = filteredData.filter(data => data.CYCLE === cycle);
        return applications.map((application, appIndex) => {
          const applicationData = severities.map(severity => {
            const severityData = cycleData.filter(data => data.TC_TESTER_NAME === severity && data.TC_STATUS === application);
            return severityData.reduce((sum, data) => sum + parseInt(data.COUNT || 0), 0);
          });

          let backgroundColor, borderColor;
          if (application === 'Passed') {
            backgroundColor = 'rgba(35, 151, 15, 0.7)';
            borderColor = 'rgba(24, 176, 93, 1)';
          } else if (application === 'Failed') {
            backgroundColor = 'rgba(255, 3, 3, 0.7)';
            borderColor = 'rgba(255, 0, 0, 1)';
          } else {
            backgroundColor = colorPalette[appIndex % colorPalette.length].bg;
            borderColor = colorPalette[appIndex % colorPalette.length].border;
          }

          return {
            label: `${cycle} - ${application}`,
            data: applicationData,
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            borderWidth: 2,
            borderRadius: 6,
          };
        });
      }).flat();

      setCumulativeChartData({ labels: severities, datasets });
    }
  }, [recordCumalativeTCData, selectedCycle]);

  useEffect(() => {
    if (recordCumalativeDefectSnSTCData && recordCumalativeDefectSnSTCData.length > 0) {
      let filteredData = recordCumalativeDefectSnSTCData;
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(recordCumalativeDefectSnSTCData, selectedCycle);
      }
      const cycles = [...new Set(filteredData.map(data => data.CYCLE))];

      const severities = [...new Set(filteredData.map(data => data.SEVERITY))];
      const applications = [...new Set(filteredData.map(data => data.ROOTCAUSE))];

      const datasets = cycles.map(cycle => {
        const cycleData = filteredData.filter(data => data.CYCLE === cycle);
        return applications.map((application, appIndex) => {
          const applicationData = severities.map(severity => {
            const severityData = cycleData.filter(data => data.SEVERITY === severity && data.ROOTCAUSE === application);
            return severityData.reduce((sum, data) => sum + parseInt(data.COUNT || 0), 0);
          });

          const colorIndex = appIndex % colorPalette.length;

          return {
            label: `${cycle} - ${application}`,
            data: applicationData,
            backgroundColor: colorPalette[colorIndex].bg,
            borderColor: colorPalette[colorIndex].border,
            borderWidth: 2,
            borderRadius: 6,
          };
        });
      }).flat();

      setcumalativeDefectSnSChartData({ labels: severities, datasets });
    }
  }, [recordCumalativeDefectSnSTCData, selectedCycle]);

useEffect(() => {
    if (defectOpenDaysData && defectOpenDaysData.length > 0) {
      let filteredData = defectOpenDaysData;
      
      // Modified filtering logic
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = defectOpenDaysData.filter(item => {
          // Check both uppercase and lowercase cycle field names
          const itemCycle = item.cycle || item.CYCLE;
          return itemCycle === selectedCycle;
        });
      }

      // Get unique cycles, removing any empty or malformed values
      const cycles = [...new Set(filteredData.map(data => {
        const cycle = data.cycle || data.CYCLE;
        return cycle ? cycle.trim() : null;
      }))].filter(Boolean);

      const dayCategories = ['0', '1 to 2', '3 to 5', '6 to 10', 'more than 10'];

      const datasets = cycles.map((cycle, index) => {
        // Modified cycle data filtering
        const cycleData = filteredData.filter(data => 
          (data.cycle === cycle || data.CYCLE === cycle)
        );
        
        const data = dayCategories.map(category => {
          const matchingData = cycleData.find(data => data.days === category);
          return matchingData ? parseInt(matchingData.defect_count) : 0;
        });

        return {
          label: cycle,
          data: data,
          backgroundColor: colorPalette[index % colorPalette.length].bg,
          borderColor: colorPalette[index % colorPalette.length].border,
          borderWidth: 2,
          borderRadius: 6,
        };
      });

      setDefectOpenDaysChartData({
        labels: dayCategories,
        datasets: datasets
      });
    }
  }, [defectOpenDaysData, selectedCycle]);

useEffect(() => {
  if (applicationOpenDefectData && applicationOpenDefectData.length > 0) {
    console.log("Raw data:", applicationOpenDefectData); // Debug raw data
    
    // Don't filter by cycle as requested
    const filteredData = applicationOpenDefectData;
    
    // Get unique application names (using the 'Application' column from the query)
    const applications = [...new Set(filteredData.map(data => data.Application))];
    
    // Create datasets for the three metrics we want to track
    const metrics = ['Closed Defects', 'Newly Opened Today', 'Total Open Defect'];
    
    const datasets = metrics.map((metric, metricIndex) => {
      // Map the column names to match exactly what's in the query results
      const metricProperty = 
        metric === 'Closed Defects' ? 'Closed Defects' :
        metric === 'Newly Opened Today' ? 'Newly Opened Today' :
        'Total Open Defec'; // Note the spelling matches the column name in query
      
      const applicationData = applications.map(app => {
        const appData = filteredData.find(data => data.Application === app);
        // Debug the mapping
        console.log(`Finding data for ${app}, metric: ${metric}, property: ${metricProperty}`);
        console.log("Found data:", appData);
        
        // Make sure we're converting to number properly
        const value = appData ? Number(appData[metricProperty] || 0) : 0;
        console.log(`Value extracted: ${value}`);
        return value;
      });
      
      // Choose appropriate colors for different metrics
      let backgroundColor, borderColor;
      if (metric === 'Closed Defects') {
        backgroundColor = 'rgba(75, 192, 192, 0.7)';  // Green
        borderColor = 'rgba(75, 192, 192, 1)';
      } else if (metric === 'Newly Opened Today') {
        backgroundColor = 'rgba(255, 159, 64, 0.7)';  // Orange
        borderColor = 'rgba(255, 159, 64, 1)';
      } else {
        backgroundColor = 'rgba(255, 99, 132, 0.7)';  // Red
        borderColor = 'rgba(255, 99, 132, 1)';
      }

      return {
        label: metric,
        data: applicationData,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth: 2,
        borderRadius: 6,
      };
    });

    // For debugging
    console.log("Applications:", applications);
    console.log("Dataset prepared:", datasets);
    
    setApplicationOpenDefectChartData({ 
      labels: applications, 
      datasets: datasets 
    });
  }
}, [applicationOpenDefectData]);


  useEffect(() => {
    if (recordCumalativeDefectSeverityTCData && recordCumalativeDefectSeverityTCData.length > 0) {
      let filteredData = recordCumalativeDefectSeverityTCData;
      if (selectedCycle && selectedCycle !== 'All') {
        filteredData = applyFilter(recordCumalativeDefectSeverityTCData, selectedCycle);
      }
      const cycles = [...new Set(filteredData.map(data => data.CYCLE))];

      const severities = [...new Set(filteredData.map(data => data.SEVERITY))];
      const applications = [...new Set(filteredData.map(data => data.ROOTCAUSE))];

      const datasets = cycles.map(cycle => {
        const cycleData = filteredData.filter(data => data.CYCLE === cycle);
        return applications.map((application, appIndex) => {
          const applicationData = severities.map(severity => {
            const severityData = cycleData.filter(data => data.SEVERITY === severity && data.ROOTCAUSE === application);
            return severityData.reduce((sum, data) => sum + parseInt(data.COUNT || 0), 0);
          });

          const colorIndex = appIndex % colorPalette.length;

          return {
            label: `${cycle} - ${application}`,
            data: applicationData,
            backgroundColor: colorPalette[colorIndex].bg,
            borderColor: colorPalette[colorIndex].border,
            borderWidth: 2,
            borderRadius: 6,
          };
        });
      }).flat();

      setcumalativeDefectSeverityChartData({ labels: severities, datasets });
    }
  }, [recordCumalativeDefectSeverityTCData, selectedCycle]);


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

      const backgroundColors = agingCategories.map((_, index) => 
        colorPalette[index % colorPalette.length].bg
      );
      
      const borderColors = agingCategories.map((_, index) => 
        colorPalette[index % colorPalette.length].border
      );

      const pieChartData = {
        labels: agingCategories,
        datasets: [
          {
            data: counts,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 2,
            hoverOffset: 25,
            offset: 8,
            spacing: 3,
            borderRadius: 8,
            hoverBorderWidth: 4,
          },
        ],
      };

      setSev_1_agingChartData(pieChartData);
    }
  }, [recordSev_1_agingTCData, selectedCycle]);


  const options = {
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'X Axis' // Default X axis label
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Y Axis' // Default Y axis label
        },
        ticks: {
          stepSize: 1, // Ensure y-axis shows only whole numbers
        },
      },
    },
  };

  const updateChartOptions = (xLabel, yLabel) => {
    return getModernChartOptions(xLabel, yLabel);
  };

  const doghnutOptions = getModernDoughnutOptions();

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
    setTrendRecordDefectDailyTCData([]);
    setDefectOpenDaysData([]);
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

    const handledefectOpenDaysFilter= (event) => {
    setDefectOpenDaysFilter(event.target.value);
  };

  // Add the missing handler function
  const handleApplicationOpenDefectFilterChange = (event) => {
    setApplicationOpenDefectFilter(event.target.value);
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
      const ganttContainer = document.getElementById("gantt_here");
      if (ganttContainer) {
        gantt.config.columns = [
          { name: "text", label: "Task name", width: "*", tree: true },
          { name: "start_date", label: "Start time", align: "center" },
          { name: "duration", label: "Duration", align: "center" }
        ];
        gantt.config.scale_unit = "week";
        gantt.config.scale_height = 50;
        gantt.init(ganttContainer);
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
    }
  }, [recordData, selectedCycle]);

  const renderTable = (data, filter, handleFilterChange, isTestCoverageTable = false, isDefectTable = false, istimeLine = false) => {
    if (!data || data.length === 0) {
      return <p>No data found!</p>;
    }

    let filteredData;
    if (selectedCycle === 'All' || !selectedCycle) {
      filteredData = data; 
    } else {
      if (istimeLine === true) {
        filteredData = data;
      }
      else {
        filteredData = applyFilter(data, selectedCycle); 
      }
    }

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
                  {index === 0 ? 'CYCLE' : key} {/* Add label for the first column */}
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


  return (
    <div className="form-page-record-view">
      <h1>ALM Project Daily Execution Details</h1>
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

      {!loading && selectedDomain && selectedAlmProject && selectedProject && (
        <>
          {trendRecordDailyTCData && trendRecordDailyTCData.length > 0 && (
            <div className="button-row-2 full-width-chart-container">
              <div className="form-column-alm-2 full-width-chart">
              <h4 className="chart-title_2">Daily TC's Execution Trends</h4>
                <div className="record-data chart-box-alm-2" style={{ height: '350px', width: '800px' }}>
                  {trendDailyChartData && <Line data={trendDailyChartData} options={updateChartOptions('Execution Date', '# of Test Cases')} />}
                </div>
              </div>
            </div>
          )}
          {trendRecordDailyTCData.length === 0 && loading === false && (
            <div className="button-row-2 full-width-chart-container">
              <div className="form-column-alm-2 full-width-chart">
                <div className="record-data chart-box-alm-2">
                  <h4>No data found for Execution Trend</h4>
                </div>
              </div>
            </div>
          )}
          <br />

          {trendRecordDefectDailyTCData && trendRecordDefectDailyTCData.length > 0 && (
            <div className="button-row-2 full-width-chart-container">
              <div className="form-column-alm-2 full-width-chart">
              <h4 className="chart-title_2" style={{textAlign: 'ceter'}}>Open defect Trends</h4>

                <div className="record-data chart-box-alm-2" style={{ height: '350px', width: '800px' }}>
                  {trendDefectDailyChartData && <Line data={trendDefectDailyChartData} options={updateChartOptions('Execution Date', '# of Defect')} />}
                </div>
              </div>
            </div>
          )}
          {trendRecordDefectDailyTCData.length === 0 && loading === false && (
            <div className="button-row-2 full-width-chart-container">
              <div className="form-column-alm-2 full-width-chart">
                <div className="record-data chart-box-alm-2">
                  <h4>No data found for Defect Trend</h4>
                </div>
              </div>
            </div>
          )}
          <br />

          {recordData && recordData.length > 0 && (
            <div className="button-row-2 form-column-alm">
              <div className="flex-item">
                <h4 className="chart-title">Testing Timeline</h4>
                {renderGanttChart()}
              </div>
            </div>
          )}
          {recordData.length === 0 && (
            <div className="button-row-6">
              <h4 className="form-column-alm-333">No Data found for Testing Timeline</h4>
            </div>
          )}
          <br />

          {applicationOpenDefectChartData && applicationOpenDefectChartData.datasets && applicationOpenDefectChartData.datasets.length > 0 && (
            <div className="button-row-2 full-width-chart-container">
              <div className="form-column-alm-2 full-width-chart">
                <h4 className="chart-title">Application Overall Defect Summary</h4>
                <div className="record-data chart-box-alm-2" style={{ height: '350px', width: '800px' }}>
                  <Bar 
                    data={applicationOpenDefectChartData} 
                    options={updateChartOptions('Applications', 'Number of Defects', true)} 
                  />
                </div>
              </div>
            </div>
          )}

          {(!applicationOpenDefectChartData || !applicationOpenDefectChartData.datasets || applicationOpenDefectChartData.datasets.length === 0) && (
            <div className="button-row-6">
              <h4 className="form-column-alm-333">No data found for Application with Defect Summary</h4>
            </div>
          )}
          <br />


          {(recordCumalativeDefectSnSTCData.length === 0 && recordCumalativeDefectSeverityTCData.length === 0) && (
            <div className="button-row-4">
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4>No Data for Defect Created Today</h4>
                </div>
              </div>
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4>No Data for Defect Closed Today</h4>
                </div>
              </div>
            </div>
          )}
          {(recordCumalativeDefectSnSTCData.length > 0 || recordCumalativeDefectSeverityTCData.length > 0) && (
            <div className="button-row-4">
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4 className="chart-title">Defect Created Today</h4>
                  {cumalativeDefectSeverityChartData && <Bar data={cumalativeDefectSeverityChartData} options={updateChartOptions('Severity', 'Number of Defects')} />}
                </div>
              </div>
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4 className="chart-title">Defect Closed Today</h4>
                  {cumalativeDefectSnSChartData && <Bar data={cumalativeDefectSnSChartData} options={updateChartOptions('Severity', 'Number of Defects')} />}
                </div>
              </div>
            </div>
          )}
          <br />

          {(defectOpenDaysData.length === 0 && defectOpenDaysData.length === 0) && (
            <div className="button-row-4">
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4>No Data for Defects by Days Open</h4>
                </div>
              </div>
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4>No Data for Daily Execution by Resource</h4>
                </div>
              </div>
            </div>
          )}
          {(defectOpenDaysData.length > 0 || defectOpenDaysData.length > 0) && (
            <div className="button-row-4">
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4 className="chart-title">Defects by Days Open</h4>
                  {defectOpenDaysChartData && <Bar data={defectOpenDaysChartData} options={updateChartOptions('Days', 'Number of Defects', false)} />}
                </div>
              </div>
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4 className="chart-title">Daily Execution by Resource</h4>
                  {cumulativeChartData && <Bar data={cumulativeChartData} options={updateChartOptions('TC Status', 'Test Case Count')} />}
                </div>
              </div>
            </div>
          )}
          <br />
          

          {(recordDailyTCData.length > 0 || recordSev_1_agingTCData.length > 0) && (
            <div className="button-row-4">
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4 className="chart-title">Open Defect on Application</h4>
                  {dailyChartData && <Bar data={dailyChartData} options={updateChartOptions('Severity', 'Defect Count')} />}
                </div>
              </div>
              <div className="form-column-alm">
                <h4 className="chart-title">Sev 1 Aging</h4>
                <div className="record-data chart-box" style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {Sev_1_agingChartData && <Doughnut data={Sev_1_agingChartData} options={doghnutOptions} />}
                </div>
              </div>
            </div>
          )}
          {(recordDailyTCData.length === 0 && recordSev_1_agingTCData.length === 0) && (
            <div className="button-row-4">
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4>No Data found for Defect on Application</h4>
                </div>
              </div>
              <div className="form-column-alm">
                <div className="record-data chart-box">
                  <h4>No data found for Sev 1 Aging</h4>
                </div>
              </div>
            </div>
          )}
          <br />
          
        </>
      )}

      <div className="button-row">
        <button onClick={handleGoBack} className="back-button">Back to Main Menu</button>
      </div>
    </div>
  );
};

AlmDailyStatus.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default AlmDailyStatus;