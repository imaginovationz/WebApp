import React from 'react';
import '../styles/RecordEntry.css';

const ProjectTimelineForm = ({ timelineData, handleProjectTimelineChange, handleProjectTimelineSubmit, errorMessage, intakes, handleIntakeNumberChange }) => {
console.log(intakes)
console.log('Arvind')

return (
<form onSubmit={handleProjectTimelineSubmit} className="timeline-form">
      <h2>Project Timeline Form</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <div className="form-row">
          <div className="form-type-row">
            <label >Intake Number:</label>

            <select name="intake_number" className="select-form-type-row" value={timelineData.intake_number} onChange={handleIntakeNumberChange} required>
              <option value=""></option>
                {intakes.map((intake, index) => (
                  <option key={index} value={intake.split(' ')[0] }>{intake}</option>
                ))}
              </select>
          </div>
        </div>
        <div className="section sit1-section">
        <h3>SIT1 Details</h3>
        <div className="form-row">
          <div className="form-column">
            <label>*SIT1 Date:</label>
            <input type="date" name="sit1_date" value={timelineData.sit1_date} onChange={handleProjectTimelineChange} required/>
          </div>
          <div className="form-column">
            <label>SIT1 Planned TC Count:</label>
            <input type="number" name="sit1_planned_tc_count" value={timelineData.sit1_planned_tc_count} onChange={handleProjectTimelineChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-column">
            <label>SIT1 Manual Executed TC Count:</label>
            <input type="number" name="sit1_manual_executed_tc_count" value={timelineData.sit1_manual_executed_tc_count} onChange={handleProjectTimelineChange} />
          </div>
          <div className="form-column">
            <label>SIT1 Automated Executed TC Count:</label>
            <input type="number" name="sit1_automated_executed_tc_count" value={timelineData.sit1_automated_executed_tc_count} onChange={handleProjectTimelineChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-column">
            <label>SIT1 Defect Count by Manual Execution:</label>
            <input type="number" name="sit1_defect_count_by_manual_execution" value={timelineData.sit1_defect_count_by_manual_execution} onChange={handleProjectTimelineChange} />
          </div>
          <div className="form-column">
            <label>SIT1 Defect Count by Automation Execution:</label>
            <input type="number" name="sit1_defect_count_by_automation_execution" value={timelineData.sit1_defect_count_by_automation_execution} onChange={handleProjectTimelineChange} />
          </div>
        </div>
        </div>
        <div className="section sit2-section">
        <h3>SIT2 Details</h3>
        <div className="form-row">
          <div className="form-column">
            <label>*SIT2 Date:</label>
            <input type="date" name="sit2_date" value={timelineData.sit2_date} onChange={handleProjectTimelineChange} required/>
          </div>
          <div className="form-column">
            <label>SIT2 Planned TC Count:</label>
            <input type="number" name="sit2_planned_tc_count" value={timelineData.sit2_planned_tc_count} onChange={handleProjectTimelineChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-column">
            <label>SIT2 Manual Executed TC Count:</label>
            <input type="number" name="sit2_manual_executed_tc_count" value={timelineData.sit2_manual_executed_tc_count} onChange={handleProjectTimelineChange} />
          </div>
          <div className="form-column">
            <label>SIT2 Automated Executed TC Count:</label>
            <input type="number" name="sit2_automated_executed_tc_count" value={timelineData.sit2_automated_executed_tc_count} onChange={handleProjectTimelineChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-column">
            <label>SIT2 Defect Count by Manual Execution:</label>
            <input type="number" name="sit2_defect_count_by_manual_execution" value={timelineData.sit2_defect_count_by_manual_execution} onChange={handleProjectTimelineChange} />
          </div>
          <div className="form-column">
            <label>SIT2 Defect Count by Automation Execution:</label>
            <input type="number" name="sit2_defect_count_by_automation_execution" value={timelineData.sit2_defect_count_by_automation_execution} onChange={handleProjectTimelineChange} />
          </div>
        </div>
        </div>
        <div className="section uat-section">
        <h3>UAT Details</h3>
        <div className="form-row">
          <div className="form-column">
            <label>*UAT Date:</label>
            <input type="date" name="uat_date" value={timelineData.uat_date} onChange={handleProjectTimelineChange} required/>
          </div>
          <div className="form-column">
            <label>UAT Planned TC Count:</label>
            <input type="number" name="uat_planned_tc_count" value={timelineData.uat_planned_tc_count} onChange={handleProjectTimelineChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-column">
            <label>UAT Manual Executed TC Count:</label>
            <input type="number" name="uat_manual_executed_tc_count" value={timelineData.uat_manual_executed_tc_count} onChange={handleProjectTimelineChange} />
          </div>
          <div className="form-column">
            <label>UAT Automated Executed TC Count:</label>
            <input type="number" name="uat_automated_executed_tc_count" value={timelineData.uat_automated_executed_tc_count} onChange={handleProjectTimelineChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-column">
            <label>UAT Defect Count by Manual Execution:</label>
            <input type="number" name="uat_defect_count_by_manual_execution" value={timelineData.uat_defect_count_by_manual_execution} onChange={handleProjectTimelineChange} />
          </div>
          <div className="form-column">
            <label>UAT Defect Count by Automation Execution:</label>
            <input type="number" name="uat_defect_count_by_automation_execution" value={timelineData.uat_defect_count_by_automation_execution} onChange={handleProjectTimelineChange} />
          </div>
        </div>
        </div>
        <button type="submit">Add Project Timeline</button>
      </form>
  );
};

export default ProjectTimelineForm;