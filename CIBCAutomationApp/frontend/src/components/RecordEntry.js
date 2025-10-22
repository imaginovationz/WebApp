import React, { useState ,useEffect} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/RecordEntry.css';
import ResourceForm from './ResourceForm';
import ProjectForm from './ProjectForm';
import ProjectTimelineForm from './ProjectTimelineForm';
import ResourceAllocationForm from './ResourceAllocationForm';
import frontendconfig from '../frontendconfig'; // Import the configuration
import { tr } from 'date-fns/locale';

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

const RecordEntry = () => {
  const history = useNavigate();
  const [formType, setFormType] = useState('');
  const [showModal, setShowModal] = useState(true); // Add this state
  const [userid, setUserid] = useState(''); // Add this state
  const [password, setPassword] = useState(''); // Add this state
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(null); 

  const [resourceData, setResourceData] = useState({
    name: '',
    info: 'CIBC_FTE',
    location: 'Onshore',
    company_name: 'CIBC',
    title: 'se_quality_lead',
    resource_additional_info: '',
    skills: '',
    userid: '',
    password: '',
    role:'view'
  });

  const [projectData, setProjectData] = useState({
    intake_number: '',
    intake_entry_date :'',
    intake_name: '',
    project_status:'',
    domain: '',
    release:'',
    change_type:'',
    application:'',
    automation_cost:'',
    functional_cost:'',
    project_additional_info: '',
    functional_qe_lead: '',
    automation_qe_lead: '',
    updated_by:'',
  });


  const [timelineData, setTimelineData] = useState({
    intake_number: '',
    sit1_date: '',
    sit1_planned_tc_count: '',
    sit1_manual_executed_tc_count: '',
    sit1_automated_executed_tc_count: '',
    sit1_defect_count_by_manual_execution: '',
    sit1_defect_count_by_automation_execution: '',
    sit2_date: '',
    sit2_planned_tc_count: '',
    sit2_manual_executed_tc_count: '',
    sit2_automated_executed_tc_count: '',
    sit2_defect_count_by_manual_execution: '',
    sit2_defect_count_by_automation_execution: '',
    uat_date: '',
    uat_planned_tc_count: '',
    uat_manual_executed_tc_count: '',
    uat_automated_executed_tc_count: '',
    uat_automation_code_executed: '',
    uat_defect_count_by_manual_execution: '',
    uat_defect_count_by_automation_execution: '',
    updated_by:'',
    });
  

  const [resourceAllocationData, setResourceAllocationData] = useState({
        resource_id: '',
        resource_name: '',
        resource_location: '',
        intake_number: '',
        project_percentage_allocation: '',
        start_date: '',
        end_date: '',
        weekly_allocation_on_project: '',
        updated_by:'',
      });

  // Set the current date as the default value for intake_entry_date
  const currentDate = new Date().toISOString().split('T')[0];

  const [errorMessage, setErrorMessage] = useState('');

  //fetching release data from release table
  const [releases, setReleases] = useState([]);
  useEffect(() => {
    // Fetch the release values from the backend frontendconfig
    axios.get(`${frontendconfig.backendUrl}/releases`)
      .then(response => {
        // console.log('Fetched releases:', response.data); // Log the fetched data
        setReleases(response.data.map(release => release.release_name));
      })
      .catch(error => {
        console.error('Error fetching releases:', error);
      });
  }, []);

      useEffect(() => {
        const storedUserid = localStorage.getItem('userid');
        if (!storedUserid) {
            setShowLoginForm(true);
        } else {
            setPendingLogin({ userid: storedUserid });
            setShowLoginForm(true);
        }
    }, [history]);

    const handleLoginSubmit = (userid, password) => {
        setShowLoginForm(false);
        const validateCredentials = async () => {
            try {
                const response = await axios.post(`${frontendconfig.backendUrl}/login`, { userid, password });
                if (response.data.success) {
                    localStorage.setItem('userid', userid);
                    localStorage.setItem('password', password);

                  } else {
                    alert('Invalid login credentials.');
                    localStorage.removeItem('userid');
                    localStorage.removeItem('password');

                    history.push('/');
                }
            } catch (error) {
                alert('An error occurred during login. Check credentials too');
                localStorage.removeItem('userid');
                localStorage.removeItem('password');
                history.push('/');
            }
        };
        validateCredentials();
    };
  
  const [resources, setResources] = useState([]);
  useEffect(() => {
    // Fetch the resources values from the backend
    axios.get(`${frontendconfig.backendUrl}/resources`)
      .then(response => {
        console.log('Fetched resources:', response.data); // Log the fetched data
        // setResources(response.data.map(resources => resources.name));
        setResources(response.data.map(resource => `${resource.name} -  ${resource.resource_additional_info} (${resource.info})`));
  
      })
      .catch(error => {
        console.error('Error fetching resources:', error);
      });
  }, []);

  const [applications, setapplications] = useState([]);
  useEffect(() => {
    axios.get(`${frontendconfig.backendUrl}/applications`)
      .then(response => {
        setapplications(response.data.map(application => application.application));
      })
      .catch(error => {
        console.error('Error fetching applications:', error);
      });
  }, []);

  const [intakes, setIntakes  ] = useState([]);
  useEffect(() => {
    // Fetch the projects values from the backend
    axios.get(`${frontendconfig.backendUrl}/projects`)
      .then(response => {
        console.log('Fetched projects:', response.data); // Log the fetched data
        // setResources(response.data.map(resources => resources.name));
        setIntakes(response.data.map(intake_detail => {
          // Add null check for functional_qe_lead
          const functionalQeLeadRaw = intake_detail.functional_qe_lead || '';
          const match = functionalQeLeadRaw.match(/(.*)\(/);
          const functionalQeLead = match ? match[1].trim() : functionalQeLeadRaw;
          return `${intake_detail.intake_number} (${intake_detail.domain} => ${intake_detail.intake_name}) - ${functionalQeLead}`;
        }));
          // `${intake_detail.intake_number} (${intake_detail.intake_name}-${intake_detail.functional_qe_lead})`));
        console.log(intakes)
      })
      .catch(error => {
        console.error('Error fetching projects:', error);
      });
  }, []);


  const handleFormTypeChange = (e) => {
    setFormType(e.target.value);
  };

  const handleResourceChange = (e) => {
    setResourceData({ ...resourceData, [e.target.name]: e.target.value });
  };


  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setProjectData((prevData) => ({
      ...prevData,
      [name]: value,
      updated_by: localStorage.getItem('userid')
    }));
  };


  const handleProjectTimelineChange = (e) => {
    setTimelineData({ ...timelineData, [e.target.name]: e.target.value },);
  };

  // const handleResourceAllocationChange = (e) => {
  //   console.log(e.target.name)
  //   console.log("aaaaaaaaaaaaaaaaaaaaaa")
  //   const { name, value } = e.target;
  //   setResourceAllocationData((prevData) => ({
  //     ...prevData,
  //     [name]: value,
  //   }));
  // };
  const handleResourceAllocationChange = (e) => {
    setResourceAllocationData({ ...resourceAllocationData, [e.target.name]: e.target.value });
  };
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const handleDateRangeChange = (ranges) => {
    const { selection } = ranges;
    setDateRange([selection]);
    setResourceAllocationData(prevData => ({
      ...prevData,
      start_date: selection.startDate.toISOString().split('T')[0],
      end_date: selection.endDate.toISOString().split('T')[0]
    }));
  };

  const handleResourceSubmit = (e) => {
    e.preventDefault();
    console.log(resourceData);
    axios.post(`${frontendconfig.backendUrl}/resources`, resourceData)
      .then(response => {
        alert('Resource added successfully');
        setResourceData({
          name: '',
          info: 'CIBC_FTE',
          location: 'Onshore',
          company_name: 'CIBC',
          title: 'se_quality_lead',
          resource_additional_info: '',
          skills: '',
          userid: '',
          password: '',
          role:'view'
        });
        setErrorMessage('');
      })
      .catch(error => {
        console.error('There was an error adding the resource!', error);
      });
  };

  const handleProjectSubmit = (e) => {
    e.preventDefault();
    try {
      const t_userid = localStorage.getItem('userid');
      const { intake_number } = projectData;

      // Validate intake_number to ensure it contains hyphens and no spaces
      
      setProjectData({ ...projectData, updated_by: t_userid });

      console.log(projectData);
      const intakeNumberPattern = /^[a-zA-Z0-9-]+$/;
      if (!intake_number || !intakeNumberPattern.test(intake_number) || intake_number.includes(' ')) {
        alert('Intake number is in the wrong format. It should contain hyphens and no spaces (XXXXXX-NNNNNNN).');
        return;
      }


    axios.post(`${frontendconfig.backendUrl}/projects`, projectData)
      .then(response => {
        alert('Project added successfully');
        setProjectData({
          intake_number: '',
          intake_entry_date :'',
          intake_name: '',
          project_status:'',
          domain: '',
          release:'',
          change_type:'',
          application:'',
          automation_cost:'',
          functional_cost:'',
          project_additional_info: '',
          functional_qe_lead: '',
          automation_qe_lead: '',
          updated_by :''
        });
        setErrorMessage('');
      })
      .catch(error => {
        console.error('There was an error adding the project!', error);
        if (error.response && error.response.data) {
          setErrorMessage(error.response.data.message || 'An error occurred while adding the project.');
        } else {
          setErrorMessage('An error occurred while adding the project.');
        }
      });
    } catch (error) {
      setErrorMessage(`An error occurred while adding the project.'${error.message}`);

    }
  };

  const handleProjectTimelineSubmit = (e) => {
    e.preventDefault();

    const t_userid = localStorage.getItem('userid'); // Ensure t_userid is defined
    const updatedTimelineData = { ...timelineData, updated_by: t_userid }; // Correctly update the state

    console.log(updatedTimelineData)
    axios.post(`${frontendconfig.backendUrl}/projects_timeline`, updatedTimelineData)
      .then(response => {
        alert('Project timeline added successfully');
        setTimelineData({
          project_id: '',
          intake_number: '',
          sit1_date: '',
          sit1_planned_tc_count: '',
          sit1_manual_executed_tc_count: '',
          sit1_automated_executed_tc_count: '',
          sit1_defect_count_by_manual_execution: '',
          sit1_defect_count_by_automation_execution: '',
          sit2_date: '',
          sit2_planned_tc_count: '',
          sit2_manual_executed_tc_count: '',
          sit2_automated_executed_tc_count: '',
          sit2_defect_count_by_manual_execution: '',
          sit2_defect_count_by_automation_execution: '',
          uat_date: '',
          uat_planned_tc_count: '',
          uat_manual_executed_tc_count: '',
          uat_automated_executed_tc_count: '',
          uat_automation_code_executed: '',
          uat_defect_count_by_manual_execution: '',
          uat_defect_count_by_automation_execution: '',
          updated_by:''
        });
        setErrorMessage(''); // Clear any previous error messages
      })
      .catch(error => {
        console.error('There was an error adding the project timeline!', error);
        if (error.response && error.response.data) {
          setErrorMessage(error.response.data.message || 'An error occurred while adding the project timeline.');
        } else {
          setErrorMessage('An error occurred while adding the project timeline.');
        }
      });
  };
  const handleIntakeNumberChange = (e) => {
    const selectedIntake = e.target.value;
    setTimelineData({ ...timelineData, intake_number: selectedIntake });

    // Fetch the project timeline details based on the selected intake number
    axios.get(`${frontendconfig.backendUrl}/projects_timeline/${selectedIntake.split(' ')[0]}`)
      .then(response => {
        if (response.data) {
          console.log('Fetched project timeline:', response.data);
          setTimelineData(response.data);
          // setTimelineData({
          //   ...response.data,
          //   intake_number: timelineData.intake_number 
          // });
        } else {
          setTimelineData({
            intake_number: selectedIntake,
            sit1_date: '',
            sit1_planned_tc_count: '',
            sit1_manual_executed_tc_count: '',
            sit1_automated_executed_tc_count: '',
            sit1_defect_count_by_manual_execution: '',
            sit1_defect_count_by_automation_execution: '',
            sit2_date: '',
            sit2_planned_tc_count: '',
            sit2_manual_executed_tc_count: '',
            sit2_automated_executed_tc_count: '',
            sit2_defect_count_by_manual_execution: '',
            sit2_defect_count_by_automation_execution: '',
            uat_date: '',
            uat_planned_tc_count: '',
            uat_manual_executed_tc_count: '',
            uat_automated_executed_tc_count: '',
            uat_automation_code_executed: '',
            uat_defect_count_by_manual_execution: '',
            uat_defect_count_by_automation_execution: ''
          });
          setErrorMessage('');
        }
      })
      .catch(error => {
        console.error('Error fetching project timeline:', error);
        setErrorMessage('An error occurred while fetching the project timeline.');
      });
  };
  const formatDateToYYYYMMDD = (dateStr) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [weeks, setWeeks] = useState([]);
  const [weeklyAllocations, setWeeklyAllocations] = useState([]);
  const handleWeeklyAllocationChange = (index, value,startDate, endDate) => {
    // Check if the value is a number and within the range 1 to 8
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 1) {
      const newAllocations = [...weeklyAllocations];
      newAllocations[index] = {
        value,
        start_date: startDate,
        end_date: endDate
      };
      setWeeklyAllocations(newAllocations);
      // setErrorMessage(''); // Clear error message if input is valid
    } else {
      alert(`Invalid input for week ${weeks[index]}: Weekly allocation must be in percentage 0-1.`);
    }
  };

  const handleResourceAllocationSubmit = async (e) => {  // major change here
    e.preventDefault();
    console.log("om Ganeshay")
    console.log(resourceAllocationData)
    const t_userid = localStorage.getItem('userid'); // Ensure t_userid is defined


    if (new Date(resourceAllocationData.end_date) <= new Date(resourceAllocationData.start_date)) {
      setErrorMessage('End date must be later than start date.');
      return;
    }
    const { project_percentage_allocation, weekly_allocation_on_project } = resourceAllocationData;

    if (
      project_percentage_allocation < 0 || project_percentage_allocation > 100 ||
      weekly_allocation_on_project < 0 || weekly_allocation_on_project > 100
    ) {
      setErrorMessage('Values for Project Percentage Allocation and Weekly Allocation on Project must be between 0 and 100.');
      return;
    }
    let insertRecordHasErrorFlag = false;
    try {
      //const match = resourceAllocationData.resource_name.match(/(.*)\((.*)\)/);
      const resourceNameRaw = resourceAllocationData.resource_name || '';
      const match = resourceNameRaw.match(/^(.*?)\s*-\s*.*\((.*?)\)/);


      if (match) {
            // const resourceName = match[1].trim();
            // const resourceInfo = match[2].trim();
            const resourceName = match ? match[1].trim() : '';
            const resourceInfo = match ? match[2].trim() : '';
            console.log('resourceName:', resourceName, 'resourceInfo:', resourceInfo); 
            const response = await axios.get(`${frontendconfig.backendUrl}/resources/searchNameInfo?name=${encodeURIComponent(resourceName)}&info=${encodeURIComponent(resourceInfo)}`);
            const resource = response.data;
            const  t_resource_id = resource.resource_id;
            const  t_resource_location = resource.location;
            const  t_resource_name = resource.name;
            console.log(t_resource_id,"--111--",t_resource_location,"--222--",t_resource_name);

            if (!t_resource_id || !t_resource_name || !t_resource_location) {
              setErrorMessage('Error getting rerource details!');
              insertRecordHasErrorFlag = true;
              return;
            }
            const records = weeks.map((week, index) => ({
              ...resourceAllocationData,
              resource_name: t_resource_name,
              start_date: formatDateToYYYYMMDD(week.start),
              end_date: formatDateToYYYYMMDD(week.end),
              weekly_allocation_on_project: (weeklyAllocations[index]?.value || '')*100,
              resource_id: t_resource_id,
              resource_location: t_resource_location,
              updated_by: t_userid
            }));
            
            for (const record of records) {
              console.log(record);
              await axios.post(`${frontendconfig.backendUrl}/resource_allocations`, record)
              .then(response => { 
              setErrorMessage(''); // Clear any previous error messages
              })
              .catch(error => {
                console.error('There was an error adding the resource allocation!', error);
                if (error.response && error.response.data) {
                  setErrorMessage(error.response.data.message || 'An error occurred while adding the resource allocation.');
                } else {
                  setErrorMessage('An error occurred while adding the resource allocation.');
                }
                insertRecordHasErrorFlag = true;
              });                
            }
            if (!insertRecordHasErrorFlag) {  
              alert('Resource allocation record added successfully');
              setResourceAllocationData({
                resource_id: '',
                resource_name: '',
                resource_location: '',
                intake_number: '',
                project_percentage_allocation: '',
                start_date: '',
                end_date: '',
                weekly_allocation_on_project: '',
                updated_by: ''
              }); 
              setWeeks([]);
              setWeeklyAllocations([]);
            }
          }
          else
          {
            insertRecordHasErrorFlag = true;
            setErrorMessage('An error occurred while finding the resource details.');
            return;
          }
    }
    catch (error) {
      setErrorMessage(`An error occurred while adding the project.'${error.message}`);
    }
  };
  

  const handleGoBack = () => {
    history.push('/');
  };
  useEffect(() => {
    document.title = "CBPT Automation Team Tracker"; // Update the title dynamically
  }, []);
  return (
    
    <div className="form-page">
      <h1>Record Entry Page</h1>
      {showLoginForm && <LoginForm onSubmit={handleLoginSubmit} />}
      <div className="form-type-row">
        <label htmlFor="formType" >Select Record Type to be updated:</label>
        <select id="formType" className="select-form-type-row"  value={formType} onChange={handleFormTypeChange}>
          <option value="">--Select--</option>
          <option value="resource">Resource</option>
          <option value="project">Project</option>
          <option value="projectTimeLine">Project TimeLine</option>
          <option value="resourceAllocation">Resource Allocation</option>
        </select>
      </div>

      {formType === 'resource' && (
         <ResourceForm
         resourceData={resourceData}
         handleResourceChange={handleResourceChange}
         handleResourceSubmit={handleResourceSubmit}
       />
      )}

      {formType === 'project' && (
        <ProjectForm
        projectData={projectData}
        handleProjectChange={handleProjectChange}
        handleProjectSubmit={handleProjectSubmit}
        releases={releases}
        applications={applications}
        resources={resources}
        errorMessage={errorMessage}
      />
      )}

      {formType === 'projectTimeLine' && (
               <ProjectTimelineForm
               timelineData={timelineData}
               handleProjectTimelineChange={handleProjectTimelineChange}
               handleProjectTimelineSubmit={handleProjectTimelineSubmit}
               errorMessage={errorMessage}
               intakes = {intakes}
               handleIntakeNumberChange ={handleIntakeNumberChange }
             />
      )}

    {formType === 'resourceAllocation' && (
            <ResourceAllocationForm
            resourceAllocationData={resourceAllocationData}
            handleResourceAllocationChange={handleResourceAllocationChange}
            handleResourceAllocationSubmit={handleResourceAllocationSubmit}
            handleDateRangeChange={handleDateRangeChange}
            handleWeeklyAllocationChange={handleWeeklyAllocationChange}
            dateRange={dateRange}
            resources={resources}
            intakes = {intakes}
            weeks={weeks}
            weeklyAllocations={weeklyAllocations}
            setWeeklyAllocations={setWeeklyAllocations}
            setWeeks={setWeeks}
            errorMessage={errorMessage}
          />
          )}

      <button onClick={handleGoBack} className="back-button">Back to Main Menu</button>

    </div>
  );
};

export default RecordEntry;