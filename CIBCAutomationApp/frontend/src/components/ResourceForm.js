import React from 'react';
import axios from 'axios';
import frontendconfig from '../frontendconfig';

const checkIsAdmin = async (userid, password) => {
  try {
    const response = await axios.post(`${frontendconfig.backendUrl}/validate-admin`, { userid, password });
    return response.data && response.data.role === 'admin';
  } catch (error) {
    return false;
  }
};

const ResourceForm = ({ resourceData, handleResourceChange, handleResourceSubmit }) => {
  const onResourceSubmit = async (e) => {
    e.preventDefault();
    const t_userid = localStorage.getItem('userid');
    const t_password = localStorage.getItem('password');

    const isAdmin = await checkIsAdmin(t_userid, t_password);
    if (!isAdmin) {
      alert('You must be an admin to add a resource.');
      return;
    }

    handleResourceSubmit(e);
  };

  return (
    <form onSubmit={onResourceSubmit} className="resource-form">
      <h2>Resource Form</h2>
      <div className="form-row">
        <div className="form-column">
          <label>*Name:</label>
          <input type="text" name="name" value={resourceData.name} onChange={handleResourceChange} required />
        </div>
        <div className="form-column">
          <label>*Resource Info:</label>
          <select name="info" value={resourceData.info} onChange={handleResourceChange} required>
            <option value="CIBC_FTE">CIBC_FTE</option>
            <option value="QC_QUAL_AS_TATA_Off">QC_QUAL_AS_TATA_Off</option>
            <option value="QC_T_COORD_TATA_Off">QC_T_COORD_TATA_Off</option>
            <option value="QC_Sr_T_COORD_TATA_On">QC_Sr_T_COORD_TATA_On</option>
            <option value="QC_T_CON_TATA_On">QC_T_CON_TATA_On</option>
            <option value="QC_T_COORD_TATA_On">QC_T_COORD_TATA_On</option>
            <option value="QC_QUAL_AS_CGI_Off">QC_QUAL_AS_CGI_Off</option>
            <option value="QC_SR_QUAL_AS_TATA_On">QC_SR_QUAL_AS_TATA_On</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-column">
          <label>*Location:</label>
          <select name="location" value={resourceData.location} onChange={handleResourceChange} required>
            <option value="Onshore">Onshore</option>
            <option value="Offshore">Offshore</option>
          </select>
        </div>
        <div className="form-column">
          <label>*Company Name:</label>
          <select name="company_name" value={resourceData.company_name} onChange={handleResourceChange} required>
            <option value="CIBC">CIBC</option>
            <option value="TCS">TCS</option>
            <option value="CGI">CGI</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-column">
          <label>Userid:</label>
          <input type="text" name="userid" value={resourceData.userid} onChange={handleResourceChange} />
        </div>
        <div className="form-column">
          <label>Password:</label>
          <input type="text" name="password" value={resourceData.password} onChange={handleResourceChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-column">
          <label>Title:</label>
          <select name="title" value={resourceData.title} onChange={handleResourceChange} required>
            <option value="sr_automation_lead">Sr. Automation Lead</option>
            <option value="director">Director</option>
            <option value="sr_automation_engineer">Sr. Automation Engineer</option>
            <option value="se_quality_lead">Sr. Quality Lead</option>
            <option value="sr_function_load">Sr. Functional Lead</option>
            <option value="fuctional_tester">Functional Tester</option>
            <option value="quality_engineer">Quality Engineer</option>
            <option value="developer">Developer</option>
            <option value="vp">VP</option>
            <option value="quality_analyst">Quality Analyst</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div className="form-column">
          <label>Role:</label>
          <select name="role" value={resourceData.role} onChange={handleResourceChange} required>
            <option value="admin">Admin</option>
            <option value="view">View</option>
            <option value="update">Add Record</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-column">
          <label>Skills:</label>
          <input type="text" name="skills" value={resourceData.skills} onChange={handleResourceChange} />
        </div>
        <div className="form-column">
          <label>Additional Info:</label>
          <input type="text" name="resource_additional_info" value={resourceData.resource_additional_info} onChange={handleResourceChange} />
        </div>
      </div>
      <button type="submit">Add Resource</button>
    </form>
  );
};

export default ResourceForm;