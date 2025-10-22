import React, { useEffect, useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import axios from "axios";
import '../../styles/DashboardResourceAllocation.css';
import { useNavigate } from 'react-router-dom';
import functionalfrontendconfig from './functionalfrontendconfig';
import DatePicker from 'react-datepicker';
import HeatMap from "react-heatmap-grid";
import { gradientColors } from '../../components/colors';

const ResourceUtilizationChart = ({ chartType, data }) => {
    const [chartData, setChartData] = useState(null);
    const [maxYAxis, setMaxYAxis] = useState(0);
    const formatDateToYYYYMMDD = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (data) {
            const labels = [...new Set(data.flatMap((item) => {
                const startDate = new Date(item.start_date);
                const endDate = new Date(item.end_date);
                const weeks = [];
                while (startDate <= endDate) {
                    weeks.push(formatDateToYYYYMMDD(new Date(startDate)));
                    startDate.setDate(startDate.getDate() + 7);
                }
                return weeks;
            }))].sort();

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

            const backgroundColors = colorPalette.map(color => color.bg);
            const borderColors = colorPalette.map(color => color.border);
            const gradientColors = colorPalette.map(color => color.gradient);


            const datasets = data.reduce((acc, item, index) => {
                const label = `${item.resource_name}`;
                const colorIndex = Object.keys(acc).length % colorPalette.length;

                if (!acc[label]) {
                    acc[label] = {
                        label,
                        data: Array(labels.length).fill(0),
                        borderColor: colorPalette[colorIndex].border,
                        backgroundColor: colorPalette[colorIndex].bg,
                        borderWidth: 2,
                        lineTension: 0.4,
                        fill: chartType === 'Line' ? true : undefined,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: colorPalette[colorIndex].border,
                        pointHoverBackgroundColor: '#fff',
                        pointBorderColor: '#fff',
                        pointHoverBorderColor: colorPalette[colorIndex].border,
                        pointBorderWidth: 2,
                        pointHoverBorderWidth: 3,
                        intakeNumbers: Array(labels.length).fill(''),
                    };
                }
                labels.forEach((week, index) => {
                    const weekDate = new Date(week);
                    const startDate = new Date(item.start_date);
                    const endDate = new Date(item.end_date);
                    if (weekDate >= startDate && weekDate <= endDate) {
                        acc[label].data[index] += item.weekly_allocation_on_project;
                        const tmp = `${item.intake_number}->${(item.weekly_allocation_on_project ?? 0).toString()},`;
                        acc[label].intakeNumbers[index] += tmp;
                    }
                });

                return acc;
            }, {});

            const max_yaxis = Math.max(...Object.values(datasets).flatMap(dataset => dataset.data)) * 1.1;
            setMaxYAxis(max_yaxis);

            const pieColors = colorPalette.map(color => color.bg);
            const pieBorderColors = colorPalette.map(color => color.border);
            const datasetLabels = Object.keys(datasets);

            const pieData = {
                labels: datasetLabels,
                datasets: [{
                    data: datasetLabels.map(label => datasets[label].data.reduce((a, b) => a + b, 0)),
                    backgroundColor: datasetLabels.map((_, i) => pieColors[i % pieColors.length]),
                    borderColor: datasetLabels.map((_, i) => pieBorderColors[i % pieBorderColors.length]),
                    borderWidth: 2,
                    intakeNumbers: datasetLabels.map(label => datasets[label].intakeNumbers.join(', ')),
                    hoverOffset: 25,
                    cutout: '60%',
                    offset: 8,
                    spacing: 3,
                    borderRadius: 8,
                    hoverBorderWidth: 4,
                }]
            };

            setChartData({ labels, datasets: Object.values(datasets), pieData });
        }
    }, [data]);

    if (!chartData) {
        return (
            <div className="chart-loading-container">
                <div className="loading-spinner-small"></div>
                <p>Loading chart data...</p>
            </div>
        );
    }
    const chartOptions = {
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
                display: true,
                //text: "Weekly Resource Utilization",
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
                        const dataset = context.dataset;
                        const index = context.dataIndex;
                        const intakeNumber = dataset.intakeNumbers[index];
                        const value = context.raw;
                        return `${dataset.label}: ${value}\nIntake: ${intakeNumber.replace(/,/g, '\n')}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Weeks",
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
                    padding: 10,
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                title: {
                    display: true,
                    text: "Weekly Allocation",
                    font: {
                        size: 15,
                        family: "'Poppins', 'Roboto', sans-serif",
                        weight: '600'
                    },
                    padding: { top: 15, bottom: 10 },
                    color: '#555'
                },
                beginAtZero: true,
                min: 0,
                max: Math.round(maxYAxis),
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
                    stepSize: Math.max(1, Math.round(maxYAxis / 5))
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

                    const colorIndex = context.datasetIndex % gradientColors.length;
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, gradientColors[colorIndex][1]);
                    gradient.addColorStop(1, gradientColors[colorIndex][0]);
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


    const renderChart = () => {
        switch (chartType) {
            case 'Line':
                return <Line data={chartData} options={chartOptions} />;
            case 'Bar':
                return <Bar data={chartData} options={chartOptions} />;
            case 'Pie':
                return <Pie
                    data={chartData.pieData}
                    options={pieChartOptions}
                    width={200}
                    height={200}
                />;
            default:
                return <Line data={chartData} options={chartOptions} />;
        }
    };

    const pieChartOptions = {
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
                display: true,
                text: "Resource Utilization Distribution",
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
                        return `${label}: ${percent}% (${value})`;
                    }
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
        cutoutPercentage: 60
    };

    return renderChart();
};
const DashboardResourceCapacity = () => {
    const [intakeData, setIntakeData] = useState([]);
    const [selectedIntake, setSelectedIntake] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    // const [startDate, setStartDate] = useState(null);
    // const [endDate, setEndDate] = useState(null);
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    });
    const [loading, setLoading] = useState(false); // Add loading state
    const [selectedResources, setSelectedResources] = useState([]);

    useEffect(() => {
        setLoading(true); // Set loading to true before API call
        // Fetch intake data
        axios.get(`${functionalfrontendconfig.backendUrl}/resource_allocations_on_project`)
            .then((response) => {
                setIntakeData(response.data);
                setLoading(false); // Set loading to false after data is fetched
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setLoading(false); // Set loading to false in case of error
            });
    }, []);
    useEffect(() => {
        document.title = "CBPT Automation Team Tracker";
    }, []);
    useEffect(() => {
        if (selectedIntake) {
            const filtered = intakeData.filter(item => item.resource_name === selectedIntake);
            setFilteredData(filtered);
        } else {
            setFilteredData(intakeData);
        }
    }, [selectedIntake, intakeData]);

    const handleIntakeChange = (e) => {
        setSelectedIntake(e.target.value);
    };
    const handleStartDateChange = (e) => {
        setStartDate(e.target.value);
    };

    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
    };
    const handleDateChange = (dates) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
    };

    const filterDataByDateRange = (data) => {
        if (!startDate || !endDate) return data;
        return data.filter(item => {
            const itemDate = new Date(item.start_date);
            return itemDate >= startDate && itemDate <= endDate;
        });
    };
    useEffect(() => {
        let filtered = intakeData;
        if (selectedIntake) {
            filtered = filtered.filter(item => item.resource_name === selectedIntake);
        }
        if (startDate) {
            filtered = filtered.filter(item => new Date(item.start_date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(item => new Date(item.end_date) <= new Date(endDate));
        }
        setFilteredData(filtered);
    }, [selectedIntake, startDate, endDate, intakeData]);


    useEffect(() => {
        let filtered = intakeData;
        if (selectedResources.length > 0 && !selectedResources.includes("")) {
            filtered = filtered.filter(item => selectedResources.includes(item.resource_name));
        }
        if (startDate) {
            filtered = filtered.filter(item => new Date(item.start_date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(item => new Date(item.end_date) <= new Date(endDate));
        }
        setFilteredData(filtered);
    }, [selectedResources, startDate, endDate, intakeData]);


    const history = useNavigate();
    const handleGoBack = () => {
        history.push('/');
    };

    const generateHeatmapData = () => {
        const labels = [...new Set(filteredData.flatMap((item) => {
            const startDate = new Date(item.start_date);
            const endDate = new Date(item.end_date);
            const weeks = [];
            while (startDate <= endDate) {
                weeks.push(startDate.toISOString().split('T')[0]);
                startDate.setDate(startDate.getDate() + 7);
            }
            return weeks;
        }))].sort();

        const resources = [...new Set(filteredData.map(item => item.resource_name))];

        const heatmapData = resources.map(resource => {
            return labels.map(label => {
                const allocation = filteredData
                    .filter(item => item.resource_name === resource && new Date(label) >= new Date(item.start_date) && new Date(label) <= new Date(item.end_date))
                    .reduce((sum, item) => sum + item.weekly_allocation_on_project, 0);
                return allocation;
            });
        });

        return { labels, resources, heatmapData };
    };

    const { labels, resources, heatmapData } = generateHeatmapData();

    return (
        <div className="dashboard-resource-allocation">
            <h1>Resource Capacity Dashboard</h1>
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading dashboard data...</p>
                </div>
            ) : (
                <div className="charts-container">
                    <div className="chart-column">
                        <div className="form-type-row">
                            <div><label>Start Date:</label></div>
                            <div>
                                <input type="date" className="select-form-type-row" id="start_date" name="start_date" value={startDate} onChange={handleStartDateChange} /></div>
                            <div><label>End Range:</label></div>
                            <div><input type="date" className="select-form-type-row" id="end_date" name="end_date" value={endDate} onChange={handleEndDateChange} /></div>
                            <div>  <label htmlFor="intake">Select Resource: </label> </div>
                            <div>
                                <select
                                    id="intake"
                                    multiple
                                    value={selectedResources}
                                    onChange={e => {
                                        const options = Array.from(e.target.selectedOptions, option => option.value);
                                        setSelectedResources(options);
                                    }}
                                    style={{ minWidth: "150px", minHeight: "80px" }}
                                >
                                    <option value="">All</option>
                                    {[...new Set(intakeData.map(item => item.resource_name))].map(intake => (
                                        <option key={intake} value={intake}>{intake}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <h5>Resource Level Chart</h5>
                        <div className="chart-box">
                            <ResourceUtilizationChart chartType="Line" data={filteredData} />
                        </div>
                        <h5></h5>
                        <div className="chart-box">
                            <ResourceUtilizationChart chartType="Bar" data={filteredData} />
                        </div>
                        <h5></h5>
                        <div className="chart-box">
                            <ResourceUtilizationChart chartType="Pie" data={filteredData} />
                        </div>
                    </div>

                    <div className="chart-column">
                        <div className="form-type-row">
                            <button onClick={handleGoBack} className="select-form-type-row">Back to Main Menu</button>
                        </div>
                        <h5>Resource Allocation Heatmap</h5>
                        <div className="heatmap-box">
                            <HeatMap
                                xLabels={labels}
                                yLabels={resources}
                                data={heatmapData}
                                xLabelWidth={60}
                                yLabelWidth={150}
                                cellRender={(value) => value && `${value}`}
                                cellStyle={(background, value, x, y) => {
                                    const maxValue = Math.max(...heatmapData.flat());
                                    let backgroundColor;
                                    if (value === 100) {
                                        backgroundColor = 'rgba(75, 192, 192, 0.9)';
                                    } else if (value > 0) {
                                        const intensity = value / maxValue;
                                        backgroundColor = value > 75 ? `rgba(54, 162, 235, ${intensity})` :
                                            value > 50 ? `rgba(153, 102, 255, ${intensity})` :
                                                `rgba(255, 159, 64, ${intensity})`;
                                    } else {
                                        backgroundColor = '#f8f9fa';
                                    }

                                    return {
                                        background: backgroundColor,
                                        width: '50px',
                                        height: '50px',
                                        margin: '2px',
                                        textAlign: 'center',
                                        color: value > maxValue / 2 ? '#ffffff' : '#333333',
                                        fontSize: '13px',
                                        fontWeight: value ? 'bold' : 'normal',
                                        borderRadius: '4px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        border: value ? 'none' : '1px dashed #e0e0e0'
                                    };
                                }}
                                xLabelsLocation={"top"}
                                xLabelsStyle={(index) => ({
                                    color: '#555',
                                    fontSize: '11px',
                                    padding: '5px',
                                    fontWeight: 'bold',
                                    transform: 'rotate(-45deg)',
                                    transformOrigin: 'left top',
                                    textAlign: 'left',
                                    width: '120px',
                                    height: '80px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'visible',
                                })}
                                yLabelsStyle={() => ({
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: '#333',
                                    textAlign: 'right',
                                    paddingRight: '10px',
                                })}
                                onClick={(x, y) => console.log(`Clicked ${x}, ${y}`)}
                                className="heatmap-grid"
                            />
                        </div>
                        {/* <div className="chart-box">
              <ResourceUtilizationChart chartType="Line" data={intakeData}  />
            </div>
            <h5></h5>
            <div className="chart-box">
              <ResourceUtilizationChart chartType="Bar" data={intakeData} />
            </div>
            <h5></h5>
            <div className="chart-box pie-chart-box">
              <ResourceUtilizationChart chartType="Pie" data={intakeData}  />
            </div> */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardResourceCapacity;