import { gradientColors } from './colors';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import frontendconfig from '../frontendconfig'; // Import the configuration
import '../styles/RecordUpdate.css';
import PropTypes from 'prop-types';

const LoginForm = ({ onSubmit }) => {
    const [userid, setUserid] = useState("");
    const [password, setPassword] = useState("");
    return (
        <div className="password-modal-overlay">
            <div className="password-modal">
                <label htmlFor="userid-input">Enter User ID:</label>
                <input
                    id="userid-input"
                    type="text"
                    value={userid}
                    onChange={e => setUserid(e.target.value)}
                    autoFocus
                />
                <label htmlFor="password-input">Enter Password:</label>
                <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button onClick={() => onSubmit(userid, password)}>Login</button>
            </div>
        </div>
    );
};


const RecordUpdate = ({ headers: initialHeaders }) => {
    const history = useNavigate();
    const [formType, setFormType] = useState('');
    const [recordData, setRecordData] = useState([]);
    const [viewType, setViewType] = useState('');
    const [filters, setFilters] = useState({});
    const [editedData, setEditedData] = useState({});
    const [updatedCells, setUpdatedCells] = useState({});
    const [originalData, setOriginalData] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [headers, setHeaders] = useState(initialHeaders);
    const [userid, setUserid] = useState(''); 
    const [resourceData, setResourceData] = useState({});
    
    // Project update states
    const [releases, setReleases] = useState([]);
    const [applications, setApplications] = useState([]);
    const [resources, setResources] = useState([]);

    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(null);
    const [focusedInput, setFocusedInput] = useState(null);

    const [showLoginForm, setShowLoginForm] = useState(false);
    const [pendingLogin, setPendingLogin] = useState(null); 
    const [loading, setLoading] = useState(false); // Add loading state

    console.log('viewType:', viewType); // Debugging: Check the value of viewType

    const handleResourceChange = (e) => {
        setResourceData({ ...resourceData, [e.target.name]: e.target.value });
    };

    const formTypeDisplayNames = {
        resources: "Resource",
        projects: "Project",
        projects_timeline: "Project TimeLine",
        resource_allocations: "Resource Allocation",
        resource_allocations_monthly: "Resource Monthly Allocation",
        intake_resource_allocations_weekly: "Resource Allocation On Intake"
    };

    useEffect(() => {
        const storedUserid = localStorage.getItem('userid');
        if (!storedUserid) {
            setShowLoginForm(true);
        } else {
            setPendingLogin({ userid: storedUserid });
            setShowLoginForm(true);
        }

        axios.get(`${frontendconfig.backendUrl}/applications`)
            .then(res => {
                setApplications(res.data);
            })
            .catch(() => setApplications([]));

        axios.get(`${frontendconfig.backendUrl}/resources`)
            .then(res => {
                // Always store the full resource objects for dropdown formatting
                setResources(Array.isArray(res.data) ? res.data : []);
            })
            .catch(() => setResources([]));

        axios.get(`${frontendconfig.backendUrl}/releases`)
            .then(response => {
                setReleases(
                    Array.isArray(response.data)
                        ? response.data.map(release =>
                            typeof release === 'string'
                                ? release
                                : (release.release_name || release.name || release.label || '')
                        ).filter(Boolean)
                        : []
                );
            })
            .catch(error => {
                console.error('Error fetching releases:', error);
                setReleases([]);
            });
    }, [history]);

    const handleLoginSubmit = (userid, password) => {
        setShowLoginForm(false);
        const validateCredentials = async () => {
            try {
                const response = await axios.post(`${frontendconfig.backendUrl}/login`, { userid, password });
                if (response.data.success) {
                    localStorage.setItem('userid', userid);
                } else {
                    alert('Invalid login credentials.');
                    localStorage.removeItem('userid');
                    history.push('/');
                }
            } catch (error) {
                alert('An error occurred during login. Check credentials too');
                localStorage.removeItem('userid');
                history.push('/');
            }
        };
        validateCredentials();
    };

    const handleFormTypeChange = (e) => {
        const selectedFormType = e.target.value;
        setFormType(selectedFormType);
        if (selectedFormType) {
            fetchRecordData(selectedFormType);
            if (selectedFormType === 'projects') {
                setViewType('projects');
            } else if (selectedFormType === 'intake_resource_allocations_weekly') {
                setViewType('intake_resource_allocations_weekly');
            } else {
                setViewType('');
            }
        } else {
            setRecordData([]);
            setOriginalData([]);
            setViewType('');
        }
    };

    const fetchRecordData = (type) => {
        setLoading(true); // Show loading spinner
        axios.get(`${frontendconfig.backendUrl}/${type}`)
            .then(response => {
                setRecordData(response.data);
                setOriginalData(response.data);
                if (response.data.length > 0) {
                    setHeaders(Object.keys(response.data[0]));
                }
                setLoading(false); // Hide loading spinner
            })
            .catch(error => {
                console.error(`Error fetching ${type} data:`, error);
                setLoading(false); // Hide loading spinner on error
            });
    };

    const handleFilterChange = (e, header) => {
        const value = e.target.value;
        setFilters({
            ...filters,
            [header]: value,
        });
    };

    const applyFilters = (data) => {
        return data.filter(record => {
            return Object.keys(filters).every(header => {
                if (!filters[header]) return true;
                return record[header]?.toString().toLowerCase().includes(filters[header].toLowerCase());
            });
        });
    };

    const handleInputChange = (e, originalIndex, header) => {
        const value = e.target.value;
        const regex = /^\d{0,1}(\.\d{0,2})?$/; // Regex to allow up to 1 digit before and up to 2 digits after the decimal point

        if (!regex.test(value)) {
            setErrorMessage('Number should be between 0-1. Only 2 digit is allowed after and decimal. Total lenght if of 3 digit only');
            return;
        }
        if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 1)) {
            setErrorMessage('');
            const updatedData = [...recordData];
            updatedData[originalIndex][header] = value;
            setRecordData(updatedData);

            setEditedData({
                ...editedData,
                [originalIndex]: {
                    ...editedData[originalIndex],
                    [header]: value,
                },
            });

            if (originalData[originalIndex] && value !== originalData[originalIndex][header]) {
                setUpdatedCells({
                    ...updatedCells,
                    [`${originalIndex}-${header}`]: true,
                });
            } else {
                const { [`${originalIndex}-${header}`]: removed, ...rest } = updatedCells;
                setUpdatedCells(rest);
            }
        } else {
            setErrorMessage('Value must be between 0 and 1');
        }
    };

    const saveChanges = async () => { // The function is declared as async
        console.log('Edited Data:', editedData);
        console.log('headers:', headers);
        let insertRecordHasErrorFlag = false;
        const t_userid = localStorage.getItem('userid');

        if (!headers || headers.length === 0) {
            console.error('Headers are not defined or empty');
            return;
        }
    
        const updatedRecords = recordData.map((record, index) => {
            if (editedData[index]) {
                // Include the first 4 columns details
                const firstFourColumns = headers.slice(0, 4).reduce((acc, header) => {
                    acc[header] = record[header];
                    return acc;
                }, {});
    
                return {
                    ...firstFourColumns,
                    ...editedData[index]
                };
            }
            return null;
        }).filter(record => record !== null);
    
        // Implement the logic to save the changes to the backend
        console.log('Edited Data:', updatedRecords);
        for (const record of updatedRecords) {
            if (record.name && record.company_name && record.location && record.intake_number) {
                console.log('Processing record:', record);
                // Print each element with name and value, ignoring 'company_name' and 'location'
                Object.entries(record).forEach(async ([name, value]) => { // Use async function inside forEach
                    if (name !== 'name' && name !== 'company_name' && name !== 'location' && name !== 'intake_number') {
                        console.log(`Name: ${name}, Value: ${value}`);
                        try {
                            const resource_response = await axios.get(`${frontendconfig.backendUrl}/resources/searchNameCompanyLocation?name=${encodeURIComponent(record.name)}&location=${encodeURIComponent(record.location)}&company_name=${encodeURIComponent(record.company_name)}`); 
                            console.log('Response:', resource_response.data.resource_id);
                            const resource_id = resource_response.data.resource_id;
                            
                            const delete_response = await axios.delete(`${frontendconfig.backendUrl}/resource_allocations`, {
                                    params: {
                                        resource_id: resource_id,
                                        intake_number: record.intake_number,
                                        start_date: convertWeekToDate(name)
                                }
                            });
                            console.log("resource_id:", resource_id, "intake_number:", record.intake_number, "week:", convertWeekToDate(name), "hours:", value*100);
                            const insert_response = await axios.post(`${frontendconfig.backendUrl}/resource_allocations`, {
                                resource_id: resource_id,
                                resource_name: record.name,
                                resource_location: record.location,
                                intake_number: record.intake_number,
                                project_percentage_allocation: "",
                                start_date: convertWeekToDate(name),
                                end_date: addDays(convertWeekToDate(name), 7),
                                weekly_allocation_on_project: value * 100,
                                updated_by: t_userid
                            });
                            console.log("resource_id:", resource_id,"resource_name:",record.name,"resource_location:",record.location,
                                         "intake_number:", record.intake_number,
                                         "project_percentage_allocation:","","start_date:", convertWeekToDate(name), "end_date", addDays(convertWeekToDate(name),7),
                                         "weekly_allocation_on_project:", value*100,"updated_by:",t_userid);
                    
                                      
                        } catch (error) {
                            insertRecordHasErrorFlag = true;
                        }
                    }
                });
            }
        }
        if (!insertRecordHasErrorFlag) {  
            alert('Resource allocation record added successfully');
        }   
    };
    const convertWeekToDate = (week) => {
        const date = new Date(week);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        const year = result.getFullYear();
        const month = String(result.getMonth() + 1).padStart(2, '0');
        const day = String(result.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleGoBack = () => {
        history.push('/');
    };

    useEffect(() => {
        document.title = "CBPT Automation Team Tracker"; // Update the title dynamically
    }, []);


    const renderTable = () => {
        if (!recordData || recordData.length === 0) {
            return <p>Table is empty!</p>;
        }

        const headers = Object.keys(recordData[0]);
        console.log('viewType:', viewType); // Debugging: Check the value of viewType
        const filteredData = applyFilters(recordData);

        // Define which columns to always show regardless of date filtering
        const alwaysShowColumns = ['intake_number', 'name', 'company_name', 'location','intake_number','intake_name', 'release','domain','project_status','functional_qe_lead','automation_qe_lead'];

        const filteredHeaders = headers.filter((header) => {
            if (alwaysShowColumns.includes(header)) return true;
            
            const headerDate = new Date(header);
            return !isNaN(headerDate) && 
                   (!startDate || headerDate >= new Date(startDate)) && 
                   (!endDate || headerDate <= new Date(endDate));
        });

        // Calculate column sums for numeric columns
        const columnSums = {};
        filteredHeaders.forEach(header => {
            let sum = 0;
            let isNumeric = false;
            filteredData.forEach(record => {
                const value = record[header];
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    sum += num;
                    isNumeric = true;
                }
            });
            columnSums[header] = isNumeric ? sum.toFixed(2) : '';
        });

        return (
            <div className="table-container">
                <table className={`table ${viewType === 'resource_allocations_monthly' ? 'freeze-columns' : viewType === 'intake_resource_allocations_weekly' ? 'freeze-columns-4' : ''}`}>
                    <thead >
                        <tr>
                            {filteredHeaders.map((header, index) => (
                                <th key={index}>
                                    {header}
                                    {viewType === 'projects' && (
                                        <input
                                            type="text"
                                            placeholder={`Filter ${header}`}
                                            value={filters[header] || ''}
                                            onChange={(e) => handleFilterChange(e, header)}
                                            style={inputSelectStyle}
                                        />
                                    )}
                                    {/* Existing filter for intake_resource_allocations_weekly */}
                                    {viewType === 'intake_resource_allocations_weekly' && index < 4 && (
                                        <input
                                            type="text"
                                            placeholder={`Filter ${header}`}
                                            value={filters[header] || ''}
                                            onChange={(e) => handleFilterChange(e, header)}
                                            style={inputSelectStyle}
                                        />
                                    )}
                                </th>
                            ))}
                            {viewType === 'projects' && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((record, index) => {
                            const originalIndex = recordData.findIndex(r => r === record);
                            return (
                                <tr key={index}>
                                    {filteredHeaders.map((header, idx) => (
                                        <td key={idx} className={
                                            viewType === 'resource_allocations_monthly' && record[header] === '1' ? 'highlight-cell-green' :
                                            viewType === 'resource_allocations_monthly' && record[header] > 1 ? 'highlight-cell-red' :
                                            viewType === 'intake_resource_allocations_weekly' && record[header] === '1' ? 'highlight-cell-green' :
                                            viewType === 'intake_resource_allocations_weekly' && record[header] > 1 ? 'highlight-cell-red' : ''
                                        }>
                                            {viewType === 'intake_resource_allocations_weekly' && idx >= 4 ? (
                                                <input
                                                    type="text"
                                                    value={record[header]}
                                                    onChange={(e) => handleInputChange(e, originalIndex, header)}
                                                    className={`editable-input ${updatedCells[`${originalIndex}-${header}`] ? 'updated-cell' : ''}`}
                                                    style={inputSelectStyle}
                                                />
                                            ) : (
                                                record[header]
                                            )}
                                        </td>
                                    ))}
                                    {/* Add Edit button for projects */}
                                    {viewType === 'projects' && (
                                        <td>
                                            <button onClick={() => handleEditProject(record)}>Edit</button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {/* Summation row */}
                        <tr className="summation-row">
                            {filteredHeaders.map((header, idx) => (
                                <td key={idx} style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                                    {idx < 4 ? '' : (columnSums[header] !== '' ? columnSums[header] : '')}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    // Add a modal form for updating project
    const ProjectUpdateModal = ({ show, project, onClose, onSave }) => {
        const [formData, setFormData] = useState(project || {});
        const [showAllApplications, setShowAllApplications] = useState({});
        const [showAllResources, setShowAllResources] = useState({});
        const [showAllReleases, setShowAllReleases] = useState(false);

        useEffect(() => {
            setFormData(project || {});
            setShowAllApplications({});
            setShowAllResources({});
            setShowAllReleases(false);
        }, [project]);

        if (!show) return null;

        const getDropdownOptions = (type, currentValue, allOptions, showAll) => {
            let options = [];
            if (!showAll) {
                if (currentValue && !allOptions.includes(currentValue)) {
                    options = [currentValue];
                } else if (currentValue) {
                    options = [currentValue];
                }
                options.push("__other__");
            } else {
                options = [...new Set([...(currentValue ? [currentValue] : []), ...allOptions])];
            }
            return options;
        };

        const projectStatusOptions = [
            { value: "", label: "" },
            { value: "Kick_Off", label: "Kick Off" },
            { value: "Discovery_SWAG", label: "Discovery / SWAG" },
            { value: "Seed_Phase", label: "Seed Phase" },
            { value: "Confirmed_Not_Started", label: "Confirmed - Not Started" },
            { value: "Active_In_Progress", label: "Active - In Progress" },
            { value: "On_Hold", label: "Project On Hold" },
            { value: "Completed_Closed", label: "Project Completed / Closed" },
            { value: "Cancelled", label: "Project Cancelled" },
            { value: "TBD", label: "TBD (Status not known)" }
        ];

        const allReleaseNames = (releases || []).filter(Boolean);
        const releaseOptions = getDropdownOptions(
            'release',
            formData.release || '',
            allReleaseNames,
            showAllReleases
        );

        const changeTypeOptions = [
            { value: "", label: "" },
            { value: "Project", label: "Project" },
            { value: "CR", label: "CR" },
            { value: "MOPS", label: "MOPS" },
            { value: "OR", label: "OR" },
            { value: "Incident", label: "Incident" },
            { value: "Problem_Record", label: "Problem Record" },
            { value: "CCR", label: "CCR" },
            { value: "SCM", label: "SCM" },
            { value: "Maintenance", label: "Maintenance" },
            { value: "Production_issue", label: "Production issue" },
            { value: "QETrans_Initiative", label: "QE Trans. Initiative" },
            { value: "Others", label: "Others" }
        ];

        const domainOptions = [
            { value: "", label: "" },
            { value: "Lending", label: "Lending" },
            { value: "Deposit", label: "Deposit" },
            { value: "Payment", label: "Payment" },
            { value: "Utility", label: "Utility" }
        ];

        const keys = project
            ? Object.keys(project).filter(
                key => key !== 'updated_by' && key !== 'timestamp' && key !== 'project_additional_info' && key !== 'intake_number'
            )
            : [];
        const fieldTriplets = [];
        for (let i = 0; i < keys.length; i += 3) {
            fieldTriplets.push(keys.slice(i, i + 3));
        }

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            // Remove fields before sending update
            const { updated_by, timestamp, intake_number, ...filteredData } = formData;
            onSave(filteredData);
        };

        return (
            <div className="password-modal-overlay">
                <div
                    className="password-modal"
                    style={{
                        minWidth: 600,
                        maxWidth: 900,
                        padding: 32,
                        borderRadius: 10,
                        background: '#fff',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.18)'
                    }}
                >
                    <h3 style={{ marginBottom: 24 }}>Update Project</h3>
                    <form onSubmit={handleSubmit}>
                        {fieldTriplets.map((triplet, rowIdx) => (
                            <div
                                key={rowIdx}
                                style={{
                                    display: 'flex',
                                    gap: 32, // Increased gap between fields
                                    marginBottom: 24 // Increased space between rows
                            }}
                            >
                                {triplet.map((key) => {
                                    // Application dropdown logic
                                    if (key === 'application') {
                                        const currentValue = formData[key] || '';
                                        const allAppNames = (applications || []).map(app =>
                                            typeof app === 'string'
                                                ? app
                                                : (app.application || app.name || app.label || '')
                                        ).filter(Boolean);
                                        const options = getDropdownOptions(
                                            'application',
                                            currentValue,
                                            allAppNames,
                                            showAllApplications[key]
                                        );
                                        return (
                                            <div key={key} style={{ flex: 1 }}>
                                                <label style={{ marginRight: 8 }}>
                                                    {fieldLabelMap[key] || key + ':'}
                                                </label>
                                                <select
                                                    name={key}
                                                    value={formData[key] || ''}
                                                    onChange={e => {
                                                        if (e.target.value === "__other__") {
                                                            setShowAllApplications(prev => ({ ...prev, [key]: true }));
                                                        } else {
                                                            setFormData({ ...formData, [key]: e.target.value });
                                                        }
                                                    }}
                                                    style={inputSelectStyle}
                                                >
                                                    <option value=""></option>
                                                    {options.map(opt =>
                                                        opt === "__other__"
                                                            ? <option key="__other__" value="__other__">Other...</option>
                                                            : <option key={opt} value={opt}>{opt}</option>
                                                    )}
                                                </select>
                                            </div>
                                        );
                                    }
                                    // Resource dropdown logic
                                    if (key === 'functional_qe_lead' || key === 'automation_qe_lead') {
                                        const currentValue = formData[key] || '';
                                        let options = [];
                                        if (showAllResources[key]) {
                                            // Show all resources with formatted label
                                            options = (resources || [])
                                                .map(res => {
                                                    if (!res || typeof res !== 'object') return null;
                                                    const name = res.name || '';
                                                    const additional = res.resource_additional_info || '';
                                                    const info = res.info || '';
                                                    let label = name;
                                                    if (additional || info) {
                                                        label = `${name}${additional ? ' - ' + additional : ''}${info ? ' (' + info + ')' : ''}`;
                                                    }
                                                    return name ? { value: name, label } : null;
                                                })
                                                .filter(opt => opt && opt.value);
                                        } else {
                                            // Only show current value and "Other..."
                                            if (currentValue) {
                                                const match = (resources || []).find(
                                                    res => res && res.name === currentValue
                                                );
                                                let label = currentValue;
                                                if (match) {
                                                    const additional = match.resource_additional_info || '';
                                                    const info = match.info || '';
                                                    if (additional || info) {
                                                        label = `${currentValue}${additional ? ' - ' + additional : ''}${info ? ' (' + info + ')' : ''}`;
                                                    }
                                                }
                                                options = [{ value: currentValue, label }];
                                            }
                                            options.push({ value: "__other__", label: "Other..." });
                                        }
                                        return (
                                            <div key={key} style={{ flex: 1 }}>
                                                <label style={{ marginRight: 8 }}>
                                                    {fieldLabelMap[key] || key + ':'}
                                                </label>
                                                <select
                                                    name={key}
                                                    value={formData[key] || ''}
                                                    onChange={e => {
                                                        if (e.target.value === "__other__") {
                                                            setShowAllResources(prev => ({ ...prev, [key]: true }));
                                                        } else {
                                                            setFormData({ ...formData, [key]: e.target.value });
                                                        }
                                                    }}
                                                    style={inputSelectStyle}
                                                >
                                                    <option value=""></option>
                                                    {options.map(opt =>
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    )}
                                                </select>
                                            </div>
                                        );
                                    }
                                    // Release dropdown logic
                                    if (key === 'release') {
                                        return (
                                            <div key={key} style={{ flex: 1 }}>
                                                <label style={{ marginRight: 8 }}>
                                                    {fieldLabelMap[key] || key + ':'}
                                                </label>
                                                <select
                                                    name={key}
                                                    value={formData[key] || ''}
                                                    onChange={e => {
                                                        if (e.target.value === "__other__") {
                                                            setShowAllReleases(true);
                                                        } else {
                                                            setFormData({ ...formData, [key]: e.target.value });
                                                        }
                                                    }}
                                                    style={inputSelectStyle}
                                                >
                                                    <option value=""></option>
                                                    {releaseOptions.map(opt =>
                                                        opt === "__other__"
                                                            ? <option key="__other__" value="__other__">Other...</option>
                                                            : <option key={opt} value={opt}>{opt}</option>
                                                    )}
                                                </select>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={key} style={{ flex: 1 }}>
                                            <label style={{ marginRight: 8 }}>
                                                {fieldLabelMap[key] || key + ':'}
                                            </label>
                                            {key === 'project_status' ? (
                                                <select
                                                    name={key}
                                                    value={formData[key] || ''}
                                                    onChange={handleChange}
                                                    style={inputSelectStyle}
                                                >
                                                    {projectStatusOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : key === 'release' ? (
                                                <select
                                                    name={key}
                                                    value={formData[key] || ''}
                                                    onChange={handleChange}
                                                    style={inputSelectStyle}
                                                >
                                                    {releaseOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : key === 'change_type' ? (
                                                <select
                                                    name={key}
                                                    value={formData[key] || ''}
                                                    onChange={handleChange}
                                                    style={inputSelectStyle}
                                                >
                                                    {changeTypeOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : key === 'domain' ? (
                                                <select
                                                    name={key}
                                                    value={formData[key] || ''}
                                                    onChange={handleChange}
                                                    style={inputSelectStyle}
                                                >
                                                    {domainOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name={key}
                                                    value={formData[key] || ''}
                                                    onChange={handleChange}
                                                    disabled={key === 'project_id'}
                                                    style={{ ...inputSelectStyle, width: '100%' }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        <div style={{ marginTop: 24 }}>
                            <button type="submit">Save</button>
                            <button type="button" onClick={onClose} style={{ marginLeft: 12 }}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const [showProjectUpdateModal, setShowProjectUpdateModal] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState(null);
    const handleEditProject = (project) => {
        setProjectToEdit({
            ...project,
            intake_number: project.intake_number || Object.values(project)[0] // fallback: first column value
        });
        setShowProjectUpdateModal(true);
    };

    const handleSaveProject = async (updatedProject) => {
        setShowProjectUpdateModal(false);
        try {
            const userid = localStorage.getItem('userid') || '';
            let intake_number = updatedProject.intake_number;
            if (!intake_number) {
                intake_number = projectToEdit?.intake_number || Object.values(projectToEdit || {})[0];
            }
            const { updated_by, timestamp, ...filteredData } = updatedProject;
            filteredData.updated_by = userid;
            if (!intake_number || typeof intake_number !== 'string' || intake_number.trim() === '') {
                setErrorMessage('Project Intake Number is missing or invalid.');
                return;
            }
            console.log('Filtered Data:', filteredData);
            await axios.put(`${frontendconfig.backendUrl}/projects/${intake_number}`, filteredData);
            fetchRecordData('projects');
            alert('Project updated successfully');
            setErrorMessage('');
        } catch (err) {
            setErrorMessage(
                err?.response?.data?.message ||
                err?.message ||
                'Failed to update project'
            );
        }
    };

    return (
        <div className="form-page-record-view" style={{ minHeight: '95vh', minWidth: '98vw', padding: 24 }}>
            {showLoginForm && <LoginForm onSubmit={handleLoginSubmit} />}
            {loading && <div className="loading-spinner"></div>}
            {errorMessage && (
                <div className="error-message" style={{
                    color: '#ffffff',
                    background: '#C41F3E',
                    // border: '1px solidrgb(255, 58, 91)',
                    borderRadius: 4,
                    padding: '10px 16px',
                    margin: '12px 0',
                    // fontWeight: 'bold'
                }}>
                    {errorMessage}
                </div>
            )}
            {!loading && (
            <>
            <h1>Record Update Page</h1>
            <div className="form-type-row">
                <label htmlFor="formType">Select Record Type to be updated:</label>
                <select id="formType" className="select-form-type-row" value={formType} onChange={handleFormTypeChange}>
                    <option value="">Select</option>
                    <option value="intake_resource_allocations_weekly">Resource Allocation On Intake</option>
                    <option value="projects">Project</option>
                </select>
            </div>
            {formType === 'intake_resource_allocations_weekly' && (
            <div className="button-row">
                <div className="form-row">
                    <div><label>Start Date:</label></div>
                    <div><input type="date" id="start_date" name="start_date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                </div>
                <div className="form-row">
                    <div><label>End Date:</label></div>
                    <div><input type="date" id="end_date" name="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                </div>            
            </div>
        )}
            {recordData && recordData.length > 0 && (
                <div className="record-data">
                    {formType && <h4>{formTypeDisplayNames[formType]} Data</h4>}
                    {renderTable()}
                </div>
            )}
            <div className="button-row">
                <button onClick={saveChanges} className="back-button">Save Changes</button>
                <button onClick={handleGoBack} className="back-button">Back to Main Menu</button>
            </div>
            </>
            )}
            {showProjectUpdateModal && (
                <ProjectUpdateModal
                    show={showProjectUpdateModal}
                    project={projectToEdit}
                    onClose={() => setShowProjectUpdateModal(false)}
                    onSave={handleSaveProject}
                />
            )}
        </div>
    );
};

RecordUpdate.propTypes = {
    headers: PropTypes.arrayOf(PropTypes.string).isRequired,
};

RecordUpdate.defaultProps = {
    headers: [], 
};

export default RecordUpdate;

// Update the style object for project modal inputs/selects to use a smaller font and height
const inputSelectStyle = {
    fontSize: '12px',
    fontFamily: 'Arial, sans-serif',
    height: '32px', // Increased height for larger box
    border: '1px solid #ced4da',
    // borderRadius: '4px',
    padding: '6px 10px', // Increased padding for larger box
    boxSizing: 'border-box'
};

const fieldLabelMap = {
    intake_entry_date: 'Intake Entry Date:',
    intake_name: 'Intake Name:',
    project_status: 'Project Status:',
    domain: 'Domain:',
    release: 'Release:',
    change_type: 'Change Type:',
    application: 'Application:',
    automation_cost: 'Automation Cost:',
    functional_cost: 'Functional Cost:',
    project_additional_info: 'Project Additional Info:',
    functional_qe_lead: 'Functional QE Lead:',
    automation_qe_lead: 'Automation QE Lead:',
};