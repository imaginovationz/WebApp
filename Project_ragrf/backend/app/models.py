from . import db

class Task(db.Model):
    __tablename__ = 'tasks'  # Explicitly specify the table name
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status
        }


class Resource(db.Model):
    __tablename__ = 'resources'  # Explicitly specify the table name
    resource_id = db.Column(db.Integer, primary_key=True, nullable=False)
    name = db.Column(db.String(200), primary_key=False, nullable=False)
    info = db.Column(db.String(200), primary_key=False, nullable=False)
    location = db.Column(db.String(200), primary_key=False, nullable=False)
    company_name = db.Column(db.String(200), primary_key=False, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    resource_additional_info = db.Column(db.String(200), primary_key=False, nullable=False)
    skills = db.Column(db.String(200), nullable=False)
    userid =  db.Column(db.String(50), nullable=False) 
    password =db.Column(db.String(200), nullable=False)  
    role = db.Column(db.String(50), nullable=False)
    

    def to_dict(self):
        return {
            'resource_id': self.resource_id,
            'name': self.name,
            'info': self.info,
            'location': self.location,
            'company_name': self.company_name,
            'title': self.title,
            'additional_info': self.additional_info,
            'skills': self.skills,
            'userid': self.userid,
            'password': self.password,
            'role': self.role
        }
    
class Project(db.Model):
    __tablename__ = 'projects'  # Explicitly specify the table name
    intake_number = db.Column(db.String(200), primary_key=True, nullable=False)
    intake_entry_date = db.Column(db.Date, primary_key=False, nullable=False)
    intake_name = db.Column(db.String(200), primary_key=False, nullable=False)
    project_status = db.Column(db.String(200), primary_key=False, nullable=False)
    domain = db.Column(db.String(200), primary_key=False, nullable=False)
    release = db.Column(db.String(200), primary_key=False, nullable=False)
    change_type = db.Column(db.String(200), primary_key=False, nullable=False)
    application = db.Column(db.String(200), primary_key=False, nullable=False)
    automation_cost = db.Column(db.Integer, primary_key=False, nullable=False)
    functional_cost = db.Column(db.Integer, primary_key=False, nullable=False)
    project_additional_info = db.Column(db.String(200), primary_key=False, nullable=True)
    functional_qe_lead = db.Column(db.String(200), primary_key=False, nullable=True)
    automation_qe_lead = db.Column(db.String(200), primary_key=False, nullable=False)
    updated_by = db.Column(db.String(200), primary_key=False, nullable=False)
    timestamp = db.Column(db.DateTime, primary_key=False, nullable=False)

    def to_dict(self):
        return {
            'intake_number': self.intake_number,
            'intake_entry_date': self.intake_entry_date,
            'intake_name': self.intake_name,
            'project_status': self.project_status,
            'domain': self.domain,
            'release': self.release,
            'change_type': self.change_type,
            'application': self.application,
            'automation_cost': self.automation_cost,
            'functional_cost': self.functional_cost, 
            'project_additional_info': self.project_additional_info,
            'functional_qe_lead': self.functional_qe_lead,
            'automation_qe_lead': self.automation_qe_lead,
            'updated_by': self.updated_by,
            'timestamp':self.timestamp
        }
    
class Release(db.Model):
    __tablename__ = 'releases'  # Explicitly specify the table name
    release_name = db.Column(db.String(75), primary_key=True)
    def to_dict(self):
        return {
            'release_name': self.release_name
        }
    
class ProjectTimeline(db.Model):
    __tablename__ = 'projects_timeline'
    intake_number = db.Column(db.String(200), db.ForeignKey('projects.intake_number'), primary_key=True,nullable=False)
    sit1_date = db.Column(db.Date, nullable=True)
    sit1_planned_tc_count = db.Column(db.Integer, nullable=True)
    sit1_manual_executed_tc_count = db.Column(db.Integer, nullable=True)
    sit1_automated_executed_tc_count = db.Column(db.Integer, nullable=True)
    sit1_defect_count_by_manual_execution = db.Column(db.Integer, nullable=True)
    sit1_defect_count_by_automation_execution = db.Column(db.Integer, nullable=True)
    sit2_date = db.Column(db.Date, nullable=True)
    sit2_planned_tc_count = db.Column(db.Integer, nullable=True)
    sit2_manual_executed_tc_count = db.Column(db.Integer, nullable=True)
    sit2_automated_executed_tc_count = db.Column(db.Integer, nullable=True)
    sit2_defect_count_by_manual_execution = db.Column(db.Integer, nullable=True)
    sit2_defect_count_by_automation_execution = db.Column(db.Integer, nullable=True)
    uat_date = db.Column(db.Date, nullable=True)
    uat_planned_tc_count = db.Column(db.Integer, nullable=True)
    uat_manual_executed_tc_count = db.Column(db.Integer, nullable=True)
    uat_automated_executed_tc_count = db.Column(db.Integer, nullable=True)
    uat_automation_code_executed = db.Column(db.Integer, nullable=True)
    uat_defect_count_by_manual_execution = db.Column(db.Integer, nullable=True)
    uat_defect_count_by_automation_execution = db.Column(db.Integer, nullable=True)
    updated_by = db.Column(db.String(200), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    
    def to_dict(self):
        return{
            'intake_number': self.intake_number,
            'sit1_date': self.sit1_date,
            'sit1_planned_tc_count': self.sit1_planned_tc_count,
            'sit1_manual_executed_tc_count': self.sit1_manual_executed_tc_count,
            'sit1_automated_executed_tc_count': self.sit1_automated_executed_tc_count,
            'sit1_defect_count_by_manual_execution': self.sit1_defect_count_by_manual_execution,
            'sit1_defect_count_by_automation_execution': self.sit1_defect_count_by_automation_execution,
            'sit2_date': self.sit2_date,
            'sit2_planned_tc_count': self.sit2_planned_tc_count,
            'sit2_manual_executed_tc_count': self.sit2_manual_executed_tc_count,
            'sit2_automated_executed_tc_count': self.sit2_automated_executed_tc_count,
            'sit2_defect_count_by_manual_execution': self.sit2_defect_count_by_manual_execution,
            'sit2_defect_count_by_automation_execution': self.sit2_defect_count_by_automation_execution,
            'uat_date': self.uat_date,
            'uat_planned_tc_count': self.uat_planned_tc_count,
            'uat_manual_executed_tc_count': self.uat_manual_executed_tc_count,
            'uat_automated_executed_tc_count': self.uat_automated_executed_tc_count,
            'uat_automation_code_executed': self.uat_automation_code_executed,
            'uat_defect_count_by_manual_execution': self.uat_defect_count_by_manual_execution,
            'uat_defect_count_by_automation_execution': self.uat_defect_count_by_automation_execution,
            'updated_by': self.updated_by,
            'timestamp': self.timestamp
        }


class Application(db.Model):
    __tablename__ = 'application'
    application = db.Column(db.String, primary_key=True)
    domain = db.Column(db.String, nullable=False)
    application_manager = db.Column(db.String, nullable=False)
    application_additional_detail = db.Column(db.String, nullable=True)
    def to_dict(self):
        return {
                'application': self.application,
                'domain': self.domain,
                'application_manager': self.application_manager,
                'application_additional_detail': self.application_additional_detail
            }

class ResourceAllocation(db.Model):
    __tablename__ = 'resources_allocation'
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.resource_id'), primary_key=True, nullable=False)
    resource_name = db.Column(db.String, primary_key=False, nullable=False)
    resouce_location  = db.Column(db.String, primary_key=False, nullable=False)
    intake_number = db.Column(db.String, db.ForeignKey('projects.intake_number'),primary_key=True, nullable=False)
    project_percentage_allocation = db.Column(db.Integer, primary_key=False, nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    weekly_allocation_on_project = db.Column(db.Integer, nullable=False)
    updated_by = db.Column(db.String(200), primary_key=False, nullable=False)
    timestamp = db.Column(db.DateTime, primary_key=False, nullable=False)
    def to_dict(self):
        return {
            'resource_id': self.resource_id,
            'resource_name': self.resource_name,
            'resource_location': self.resource_location,
            'intake_number': self.intake_number,
            'project_percentage_allocation': self.project_percentage_allocation,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'weekly_allocation_on_project': self.weekly_allocation_on_project,
            'updated_by': self.updated_by,
            'timestamp': self.timestamp
        }

class StoredQuery(db.Model):
    __tablename__ = 'stored_queries'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(200), nullable=False)
    sql_query_name = db.Column(db.String(200), nullable=False)
    sql = db.Column(db.Text, nullable=False)
    insert_timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    update_timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'sql_query_name': self.sql_query_name,
            'sql': self.sql,
            'insert_timestamp': self.insert_timestamp,
            'update_timestamp': self.update_timestamp
        }

class TestCase(db.Model):
    __tablename__ = 'test_cases'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    repository_name = db.Column(db.String(255), nullable=False)
    branch_name = db.Column(db.String(255), nullable=False)
    robot_file_path = db.Column(db.String(500), nullable=False)
    test_case_name = db.Column(db.String(500), nullable=False)
    documentation = db.Column(db.Text, nullable=True)
    steps = db.Column(db.Text, nullable=True)  # JSON string of steps array
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    # Unique constraint to prevent duplicates
    __table_args__ = (
        db.UniqueConstraint('repository_name', 'branch_name', 'robot_file_path', 'test_case_name', 
                           name='_repository_branch_file_testcase_uc'),
    )

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'repository_name': self.repository_name,
            'branch_name': self.branch_name,
            'robot_file_path': self.robot_file_path,
            'test_case_name': self.test_case_name,
            'documentation': self.documentation,
            'steps': json.loads(self.steps) if self.steps else [],
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

# --- Dynamic UI / Schema generation support ---
class UISchema(db.Model):
    __tablename__ = 'ui_schemas'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    schema_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'name': self.name,
            'schema': json.loads(self.schema_json)
        }