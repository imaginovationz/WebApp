import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DateRange } from 'react-date-range';
import Select from 'react-select';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file
import functionalfrontendconfig from './functionalfrontendconfig'; // Import the configuration


const ResourceAllocationForm = ({ resourceAllocationData, handleResourceAllocationChange, handleResourceAllocationSubmit, handleDateRangeChange, handleWeeklyAllocationChange, dateRange, resources, weeks,
  weeklyAllocations, setWeeklyAllocations, setWeeks, errorMessage }) => {

  const [selectedResource, setSelectedResource] = useState(null);
  const [error, setError] = useState(''); // to handle error from this js
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    setLoading(true); // Set loading to true before API call
    // Fetch the projects values from the backend
    axios.get(`${functionalfrontendconfig.backendUrl}/projects`)
      .then(response => {
        console.log('Fetched projects:', response.data); // Log the fetched data
        setIntakes(response.data.map(intake_detail => `${intake_detail.intake_number} (${intake_detail.domain} => ${intake_detail.intake_name})`));
        setLoading(false); // Set loading to false after data is fetched
      })
      .catch(error => {
        console.error('Error fetching projects:', error);
        setLoading(false); // Set loading to false in case of error
      });
  }, []);

useEffect(() => {
  if (resourceAllocationData.resource_name) {
    // Extract resourceName (before first '-') and resourceInfo (inside last parenthesis)
    const nameMatch = resourceAllocationData.resource_name.match(/^([^-\n\r]*)-/);
    const infoMatch = resourceAllocationData.resource_name.match(/\(([^)]+)\)$/);

    if (nameMatch && infoMatch) {
      const resourceName = nameMatch[1].trim();
      const resourceInfo = infoMatch[1].trim();
      setLoading(true); // Set loading to true before API call
      axios.get(`${functionalfrontendconfig.backendUrl}/resources/searchNameInfo?name=${encodeURIComponent(resourceName)}&info=${encodeURIComponent(resourceInfo)}`)
        .then(response => {
          const resource = response.data;
          setSelectedResource(resource);
          handleResourceAllocationChange({
            target: {
              name: 'resource_id',
              value: resource.resource_id
            }
          });
          handleResourceAllocationChange({
            target: {
              name: 'resource_location',
              value: resource.location
            }
          });
          setError('');
          setLoading(false); // Set loading to false after data is fetched
        })
        .catch(error => {
          console.error('Error fetching resource details:', error);
          setLoading(false); // Set loading to false in case of error
        });
    }
  }
}, [resourceAllocationData.resource_name]);

  const handleIntakeChange = (e) => {
    const { name, value } = e.target;
    const intakeNumber = value.split(' ')[0]; // Extract the intake number
    handleResourceAllocationChange({
      target: {
        name,
        value: intakeNumber
      }
    });
  };
  const handleResourceNameChange = (e) => {
    const { name, value } = e.target;
    const match = value.match(/(.*)\(/);
    const resourceName = match ? match[1].trim() : value;
    handleResourceAllocationChange({
      target: {
        name,
        value: resourceName
      }
    });
  };
  const intakeOptions = intakes.map((intake) => ({
  value: intake.split(' ')[0],
  label: intake,
}));
const resourceOptions = resources.map((resource) => ({
  value: resource,
  label: resource,
}));
  const generateWeeks = () => {
    const { start_date, end_date } = resourceAllocationData;
    if (!start_date || !end_date) return;

    let startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Adjust startDate to the nearest Monday
    const dayOfWeek = startDate.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    startDate.setDate(startDate.getDate() + diffToMonday);

    const weeksArray = [];

    while (startDate <= endDate) {
      weeksArray.push({
        start: formatDate(startDate), // Start of the week
        end: formatDate(new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)) // End of the week (6 days after the start)
      });
      startDate.setDate(startDate.getDate() + 7);
    }

    setWeeks(weeksArray);
    setWeeklyAllocations(new Array(weeksArray.length).fill(''));
  };

  const formatDate = (date) => {
    const options = { day: '2-digit', month: 'short', year: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

    const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: 'black',
      color: 'black',
      fontSize: '12px', // smaller font size
      borderRadius: 0, // square corners
      boxShadow: 'none',
      borderWidth: '1px', // minimal border thickness
      minHeight: '32px',
      '&:hover': { borderColor: 'black' },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'black',
      fontSize: '12px', // smaller font size
    }),
    input: (provided) => ({
      ...provided,
      color: 'black',
      fontSize: '12px', // smaller font size
    }),
    option: (provided, state) => ({
      ...provided,
      color: 'black',
      fontSize: '12px', // smaller font size
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'black',
      fontSize: '12px', // smaller font size
    })
  };

  return (
    <form onSubmit={handleResourceAllocationSubmit} className="resource-allocation-form">
      <h2>Resource Allocation Form</h2>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading-spinner"></div>} {/* Add loading spinner */}
      {!loading && (
        <>
          <div className="form-row">
            <div className="form-column">
              <label>*Resource Name:</label>
              <Select
                name="resource_name"
                value={resourceOptions.find(option => option.value === resourceAllocationData.resource_name) || null}
                onChange={option => handleResourceAllocationChange({
                  target: {
                    name: 'resource_name',
                    value: option ? option.value : ''
                  }
                })}
                options={resourceOptions}
                isClearable
                placeholder="Select or search resource..."
                required
                styles={customSelectStyles}
              />
            </div>
            <div className="form-column">
              <label>*Resource Location:</label>
              <input type="text" name="resource_location" value={resourceAllocationData.resource_location} onChange={handleResourceAllocationChange} required readOnly />
            </div>
          </div>
          <div >
            <div className="form-column">
              <label>*Intake Number:</label>
              {/* <select name="intake_number" 
              value={resourceAllocationData.intake_number} onChange={handleIntakeChange} required>
                <option value=""></option>
                {intakes.map((intake, index) => (
                  <option key={index} value={intake.split(' ')[0]}>{intake}</option>
                ))}
              </select> */}
              <Select
                name="intake_number" 
                value={intakeOptions.find(option => option.value === resourceAllocationData.intake_number) || null}
                onChange={option => handleResourceAllocationChange({
                  target: {
                    name: 'intake_number',
                    value: option ? option.value : ''
                  }
                })}
                options={intakeOptions}
                isClearable
                placeholder="Select or search intake..."
                required
                styles={customSelectStyles}
              />
            </div>
            {/* <div className="form-column">
              <label>Project Percentage Allocation:</label>
              <input type="number" name="project_percentage_allocation" value={resourceAllocationData.project_percentage_allocation} onChange={handleResourceAllocationChange} />
            </div> */}
          </div>
          <div className="form-row">
            <div className="form-column">
              <label>*Start Date:</label>
              <input type="date" id="start_date" name="start_date" value={resourceAllocationData.start_date} onChange={handleResourceAllocationChange} required />
            </div>
            <div className="form-column">
              <label>*End Date:</label>
              <input type="date" id="end_date" name="end_date" value={resourceAllocationData.end_date} onChange={handleResourceAllocationChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-column">
              <button type="button" onClick={generateWeeks}>Generate Weekly Allocation Field</button>
            </div>
          </div>
          {weeks.length > 0 && resourceAllocationData.start_date && resourceAllocationData.end_date && (
            <div>
              <h5>Weekly Allocations for Date Range: {resourceAllocationData.start_date} to {resourceAllocationData.end_date}</h5>
              <div style={{ overflowX: 'auto' }}>
                <table border="1" style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      {weeks.map((week, index) => (
                        <th key={index}>{week.start}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {weeks.map((week, index) => (
                        <td key={index}>
                          <input
                            type="text"
                            value={weeklyAllocations[index]?.value || ''}
                            onChange={(e) => handleWeeklyAllocationChange(index, e.target.value, week.start, week.end)}
                            required
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <br></br>
          <div>
            <button type="submit" position="relative">Submit Record</button>
            <div className="form-column"></div>
          </div>
        </>
      )}
    </form>
  );
};

export default ResourceAllocationForm;