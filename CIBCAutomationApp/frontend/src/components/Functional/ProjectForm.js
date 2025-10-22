import React from 'react';
import Select from 'react-select';

const ProjectForm = ({ projectData, handleProjectChange, handleProjectSubmit, releases, applications, resources, managerResources,errorMessage }) => {
  // Prepare options for react-select
  const resourceOptions = resources.map(resource => ({
    value: resource,
    label: resource
  }));

  const managerResourceOptions = managerResources.map(resource => ({
    value: resource,
    label: resource
  }));

  const applicationOptions = applications.map(application => ({
    value: application,
    label: application
  }));

   const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderWidth: '1px',
    borderColor: '#ccc',
    borderStyle: 'solid',
    borderRadius: '4px',
    minHeight: '34px', // Match input field height
    boxShadow: state.isFocused ? '0 0 0 1px #007bff' : 'none',
    '&:hover': {
      borderColor: '#007bff'
    }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'black',
    fontSize: '12px',
  }),
  input: (provided) => ({
    ...provided,
    color: 'black',
    fontSize: '12px',
  }),
  option: (provided, state) => ({
    ...provided,
    color: 'black',
    fontSize: '12px',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#999',
    fontSize: '12px',
  })
};

  return (
    <form onSubmit={handleProjectSubmit} className="project-form">
      <h2>Project Form</h2>
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="form-row">
        <div className="form-column">
          <label>*Intake Number:</label>
          <input type="text" name="intake_number" value={projectData.intake_number} onChange={handleProjectChange} required />
        </div>
        <div className="form-column">
          <label>*Intake Entry Date:</label>
          <input 
            type="date" 
            name="intake_entry_date" 
            value={projectData.intake_entry_date || new Date().toISOString().split('T')[0]} 
            onChange={handleProjectChange} 
            required 
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-column">
          <label>*Intake Name:</label>
          <input type="text" name="intake_name" value={projectData.intake_name} onChange={handleProjectChange} required />
        </div>
        <div className="form-column">
          <label>Project Status:</label>
          <select type="text" name="project_status" value={projectData.project_status} onChange={handleProjectChange} >
            <option value=""></option>
            <option value="Kick_Off">Kick Off</option>
            <option value="Discovery_SWAG">Discovery / SWAG</option>
            <option value="Seed_Phase">Seed Phase</option>
            <option value="Confirmed_Not_Started">Confirmed - Not Started</option>
            <option value="Active_In_Progress">Active - In Progress</option>
            <option value="On_Hold">Project On Hold</option>
            <option value="Completed_Closed">Project Completed / Closed</option>
            <option value="Cancelled">Project Cancelled</option>
            <option value="TBD">TBD (Status not known)</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-column">
          <label>*Release:</label>
          <select name="release" value={projectData.release} onChange={handleProjectChange} required>
            <option value=""></option>
            {releases.map((release, index) => (
              <option key={index} value={release}>{release}</option>
            ))}
          </select>
        </div>
        <div className="form-column">
          <label>*Domain:</label>
          <select name="domain" value={projectData.domain} onChange={handleProjectChange} required>
            <option value=""></option>
            <option value="Lending">Lending</option>
            <option value="Deposit">Deposit</option>
            <option value="Payment">Payment</option>
            <option value="Utility">Utility</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-column">
          <label>Change Type:</label>
          <select type="text" name="change_type" value={projectData.change_type} onChange={handleProjectChange} >
            <option value=""></option>
            <option value="Project">Project</option>
            <option value="CR">CR</option>
            <option value="MOPS">MOPS</option>
            <option value="OR">OR</option>
            <option value="Incident">Incident</option>
            <option value="Problem_Record">Problem Record</option>
            <option value="CCR">CCR</option>
            <option value="SCM">SCM</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Production_issue">Production issue</option>
            <option value="QETrans_Initiative">QE Trans. Initiative</option>
            <option value="Others">Others</option>
          </select>
        </div>
        <div className="form-column">
          <label>Application:</label>
          <Select
            name="application"
            value={applicationOptions.find(option => option.value === projectData.application) || null}
            onChange={option =>
              handleProjectChange({
                target: {
                  name: 'application',
                  value: option ? option.value : ''
                }
              })
            }
            options={applicationOptions}
            isClearable
            placeholder="Select or search application..."
            styles={customSelectStyles}
            //required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-column">
          <label>Automation Cost:</label>
          <input type="number" name="automation_cost" value={projectData.automation_cost} onChange={handleProjectChange} />
        </div>
        <div className="form-column">
          <label>Functional Cost:</label>
          <input type="number" name="functional_cost" value={projectData.functional_cost} onChange={handleProjectChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-column">
          <label>Functional QE Lead:</label>
          <Select
            name="functional_qe_lead"
            value={resourceOptions.find(option => option.value === projectData.functional_qe_lead) || null}
            onChange={option =>
              handleProjectChange({
                target: {
                  name: 'functional_qe_lead',
                  value: option ? option.value : ''
                }
              })
            }
            options={resourceOptions}
            isClearable
            placeholder="Select or search resource..."
            styles={customSelectStyles}
          />
        </div>
        <div className="form-column">
          <label>Automation QE Lead:</label>
          <Select
            name="automation_qe_lead"
            value={resourceOptions.find(option => option.value === projectData.automation_qe_lead) || null}
            onChange={option =>
              handleProjectChange({
                target: {
                  name: 'automation_qe_lead',
                  value: option ? option.value : ''
                }
              })
            }
            options={resourceOptions}
            isClearable
            placeholder="Select or search resource..."
            styles={customSelectStyles}
           // required
          />
        </div>
      </div>
      <br></br>
          <div className="form-row">
              <div className="form-column">
                  <label>SME/Consultant:</label>
                  <Select
                      name="sme_consultant"
                      value={resourceOptions.find(option => option.value === projectData.sme_consultant) || null}
                      onChange={option =>
                          handleProjectChange({
                              target: {
                                  name: 'sme_consultant',
                                  value: option ? option.value : ''
                              }
                          })
                      }
                      options={resourceOptions}
                      isClearable
                      placeholder="Select or search resource..."
                      styles={customSelectStyles}
                  />
              </div>
              <div className="form-column">
                  <label>QA Manager:</label>
                  <Select
                      name="qa_manager"
                      value={managerResourceOptions.find(option => option.value === projectData.qa_manager) || null}
                      onChange={option =>
                          handleProjectChange({
                              target: {
                                  name: 'qa_manager',
                                  value: option ? option.value : ''
                              }
                          })
                      }
                      options={managerResourceOptions}
                      isClearable
                      placeholder="Select or search resource..."
                      styles={customSelectStyles}
                      //required
                  />
              </div>

          </div>


      <button type="submit">Add Project</button>
    </form>
  );
};

export default ProjectForm;