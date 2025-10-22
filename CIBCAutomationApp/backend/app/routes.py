from flask import request, jsonify, current_app as app
from .models import db, UISchema
from flask_cors import CORS
import json
from decimal import Decimal
import os
from sqlalchemy import text
from flask import send_from_directory

#for latest news
from flask import Blueprint, jsonify

import datetime
import traceback
import pythoncom
# Custom JSON encoder to handle Decimal and datetime.date types
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime.date):
            return obj.isoformat()
        return super().default(obj)

app.json_encoder = CustomJSONEncoder

@app.route('/')
def index():
    return 'Hello, World!'

def preprocess_data(data):
    return {key: (value if value != "" else None) for key, value in data.items()}


@app.route('/keep_alive', methods=['GET'])
def keep_alive():
    return jsonify({'message': 'Server is alive'}), 200

@app.route('/tasks', methods=['GET'])
def get_tasks():
    result = db.session.execute('SELECT * FROM tasks')
    tasks = [dict(row) for row in result]
    return jsonify(tasks)

@app.route('/tasks', methods=['POST'])
def add_task():
    data =preprocess_data(request.get_json())
    db.session.execute(
        'INSERT INTO tasks (title, description, status) VALUES (:title, :description, :status)',
        {'title': data['title'], 'description': data.get('description'), 'status': data['status']}
    )
    db.session.commit()
    return jsonify({'message': 'Task added successfully'}), 201

@app.route('/tasks/<int:id>', methods=['PUT'])
def update_task(id):
    data = request.get_json()
    result = db.session.execute('SELECT * FROM tasks WHERE id = :id', {'id': id})
    task = result.fetchone()
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    db.session.execute(
        'UPDATE tasks SET title = :title, description = :description, status = :status WHERE id = :id',
        {'title': data['title'], 'description': data.get('description'), 'status': data['status'], 'id': id}
    )
    db.session.commit()
    return jsonify({'message': 'Task updated successfully'})

@app.route('/tasks/<int:id>', methods=['DELETE'])
def delete_task(id):
    result = db.session.execute('SELECT * FROM tasks WHERE id = :id', {'id': id})
    task = result.fetchone()
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    db.session.execute('DELETE FROM tasks WHERE id = :id', {'id': id})
    db.session.commit()
    return '', 204


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')
    
    
###### changes for table resources

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    userid = data.get('userid')
    password = data.get('password')
    result = db.session.execute("SELECT * FROM resources WHERE userid = :userid and password =:password", {'userid': userid, 'password': password})
    resource = result.fetchone()
    # print(resource)
    if resource:
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    # if user and user.verify_password(password):
    #     return jsonify({'success': True, 'message': 'Login successful'})
    # else:
    #     return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/validate-admin', methods=['POST'])
def validate_admin():
    data = request.json
    userid = data.get('userid')
    password = data.get('password')
    result = db.session.execute(
        "SELECT role FROM resources WHERE userid = :userid and password = :password",
        {'userid': userid, 'password': password}
    )
    resource = result.fetchone()
    if resource:
        return jsonify({'success': True, 'role': resource.role})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/resources', methods=['GET'])
def get_resources():
    result = db.session.execute('SELECT name, info, location,company_name, title,resource_additional_info,skills,userid FROM resources')
    resources = [dict(row) for row in result]
    return jsonify(resources)

@app.route('/resources/searchNameInfo', methods=['GET'])
def get_resources_name_info():
# this method can be overloaded but I am avoiding to have confusion and create multiple api
    try:
        name = request.args.get('name')
        info = request.args.get('info')
        if name and info:
            result = db.session.execute(
                'SELECT * FROM resources WHERE name = :name AND info = :info',
                {'name': name, 'info': info}
            )
            # print(name,"---",info)
            resource = result.fetchone()
            if resource:
                resource_data = {
                    'resource_id': resource.resource_id,
                    'name': resource.name,
                    'info': resource.info,
                    'location': resource.location,
                    'company_name': resource.company_name,
                    'title': resource.title,
                    'resource_additional_info': resource.resource_additional_info,
                    'skills': resource.skills,
                    'userid': resource.userid,
                    'password': resource.password,
                    'role': resource.role
                }
                return jsonify(resource_data)
            else:
                return jsonify({'message': 'Resource not found'}), 404
        else:
            return jsonify({'message': 'Name and info parameters are required'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

@app.route('/resources/searchNameCompanyLocation', methods=['GET'])
def get_resources_on_name_company_location():
    # this method can be overloaded but I am avoiding to have confusion
    try:
        name = request.args.get('name')
        location = request.args.get('location')
        company_name = request.args.get('company_name')

        if name and location and company_name:
            result = db.session.execute(
                text('SELECT * FROM resources WHERE name = :name AND location = :location and company_name = :company_name'), 
                {'name': name, 'location': location, 'company_name': company_name}  
            )
            # print(name,"---",info)
            resource = result.fetchone()
            if resource:
                resource_data = {
                    'resource_id': resource.resource_id,
                    'name': resource.name,
                    'info': resource.info,
                    'location': resource.location,
                    'company_name': resource.company_name,
                    'title': resource.title,
                    'resource_additional_info': resource.resource_additional_info,
                    'skills': resource.skills,
                    'userid': resource.userid,
                    'password': resource.password,
                    'role': resource.role
                }
                return jsonify(resource_data)
            else:
                return jsonify({'message': 'Resource not found'}), 404
        else:
            return jsonify({'message': 'Name and info parameters are required'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400
    
@app.route('/resources', methods=['POST'])
def add_resources():
    data = request.get_json()
    # print(data)
    db.session.execute(
        'INSERT INTO resources (name,info,location,company_name,title,resource_additional_info,skills,userid,password,role) VALUES ( :name, :info, :location, :company_name, :title, :resource_additional_info, :skills,:userid,:password,:role)',
        { 'name': data.get('name'),
          'info': data['info'],'location': data['location'],
          'company_name': data['company_name'],'title': data['title'],
         'resource_additional_info': data['resource_additional_info'],
         'skills': data['skills'],
         'userid': data['userid'],
         'password': data['password'],  
         'role': data['role']}
    )
    db.session.commit()
    return jsonify({'message': 'Resource added successfully'}), 201

@app.route('/resources/<int:resource_id>', methods=['PUT'])
def update_resources(resource_id):
    data = request.get_json()
    result = db.session.execute('SELECT * FROM resources WHERE resource_id = :resource_id', {'resource_id': resource_id})
    resources = result.fetchone()
    if not resources:
        return jsonify({'error': 'Resource not found'}), 404
    db.session.execute(
        'UPDATE resources SET name = :name, info = :info, location = :location, company_name = :company_name,title = :title, resource_additional_info = :resource_additional_info,skills = :skills,userid =:userid,password =:password,role =:role WHERE resource_id = :resource_id',
         {'resource_id': data['resource_id'], 'name': data.get('name'),
          'info': data['info'],'location': data['location'],
          'company_name': data['company_name'],'title': data['title'],
         'resource_additional_info': data['resource_additional_info'],
         'skills': data['skills'], 'resource_id': resource_id,
         'userid': data['userid'],'password': data['password'],
         'role': data['role']}
    )
    db.session.commit()
    return jsonify({'message': 'Resource updated successfully'})

@app.route('/resources/<int:resource_id>', methods=['DELETE'])
def delete_resources(resource_id):
    result = db.session.execute('SELECT * FROM resources WHERE resource_id = :resource_id', {'resource_id': resource_id})
    resources = result.fetchone()
    if not resources:
        return jsonify({'error': 'Resources not found'}), 404
    db.session.execute('DELETE FROM resource WHERE resource_id = :resource_id', {'resource_id': resource_id})
    db.session.commit()
    return '', 204

###### changes for table projects
@app.route('/projects', methods=['GET'])
def get_projects():
    result = db.session.execute('SELECT * FROM projects')
    projects = [dict(row) for row in result]
    return jsonify(projects)

@app.route('/projects', methods=['POST'])
def add_project():
    try:
        
        data =  preprocess_data(request.get_json())
        db.session.execute(
            'INSERT INTO projects (intake_number, intake_entry_date,intake_name,project_status,domain, `release`,change_type,application,automation_cost,functional_cost,project_additional_info, functional_qe_lead,automation_qe_lead,updated_by) VALUES (:intake_number, :intake_entry_date,:intake_name,:project_status,:domain, :release,:change_type,:application,:automation_cost,:functional_cost,:project_additional_info, :functional_qe_lead,:automation_qe_lead,:updated_by)',
            {
                'intake_number': data['intake_number'],
                'intake_entry_date': data['intake_entry_date'],
                'intake_name': data['intake_name'],
                'project_status': data['project_status'],
                'domain': data['domain'],
                'release': data['release'],
                'change_type': data['change_type'],
                'application': data['application'],
                'automation_cost': data['automation_cost'],
                'functional_cost': data['functional_cost'],
                'project_additional_info': data['project_additional_info'],
                'functional_qe_lead': data['functional_qe_lead'],
                'automation_qe_lead': data['automation_qe_lead'],
                'updated_by': data['updated_by']
            }
        )
        db.session.commit()
        return jsonify({'message': 'Project added successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400
@app.route('/projects/<string:intake_number>', methods=['PUT'])
def update_project(intake_number):
    data = request.get_json()
    db.session.execute(
        'UPDATE projects SET intake_entry_date   = :intake_entry_date,intake_name =:intake_name,project_status =:project_status, domain = :domain,`release` = :release, change_type =:change_type,application =:application,automation_cost =:automation_cost,functional_cost =:functional_cost,project_additional_info = :project_additional_info, functional_qe_lead = :functional_qe_lead,automation_qe_lead = :automation_qe_lead,updated_by =:updated_by WHERE intake_number = :intake_number',
        {
            'intake_entry_date': data['intake_entry_date'],
            'intake_name': data['intake_name'],
            'project_status': data['project_status'],
            'domain': data['domain'],
            'release': data['release'],
            'change_type': data['change_type'],
            'application': data['application'],
            'automation_cost': data['automation_cost'],
            'functional_cost': data['functional_cost'],
            'project_additional_info': data['project_additional_info'],
            'functional_qe_lead': data['functional_qe_lead'],
            'automation_qe_lead': data['automation_qe_lead'],
            'updated_by': data['updated_by'],
            'intake_number': intake_number
        }
    )
    db.session.commit()
    return jsonify({'message': 'Project updated successfully'}), 200

@app.route('/projects/<string:intake_number>', methods=['DELETE'])
def delete_project(intake_number):
    db.session.execute('DELETE FROM projects WHERE intake_number = :intake_number', {'intake_number': intake_number})
    db.session.commit()
    return '', 204

###### changes for table releases
@app.route('/releases', methods=['GET'])
def get_release():
    result = db.session.execute('SELECT * FROM releases')
    releases = [dict(row) for row in result]
    return jsonify(releases)

###### changes for project timelines
@app.route('/projects_timeline', methods=['GET'])
def get_projects_timeline():
    result = db.session.execute('SELECT * FROM projects_timeline')
    project_timeline = [dict(row) for row in result]
    return jsonify(project_timeline)

@app.route('/projects_timeline/<intake_number>', methods=['GET'])
def get_project_timeline(intake_number):
    try:
        intake_number = intake_number.split(' ')[0]
        result = db.session.execute('SELECT * FROM projects_timeline WHERE intake_number = :intake_number', {'intake_number': intake_number})
        project_timeline = result.fetchone()
        if project_timeline:
            return jsonify(dict(project_timeline))
        else:
            return jsonify(None)
    except Exception as e:
        return jsonify({'message': str(e)}), 400


@app.route('/projects_timeline', methods=['POST'])
def create_projects_timeline():
    try:
        data = preprocess_data(request.get_json())
        intake_number = data['intake_number'].split(' ')[0]  # Extract the substring before the first space
        db.session.execute(
            '''
            INSERT INTO projects_timeline (
                intake_number, sit1_date, sit1_planned_tc_count, sit1_manual_executed_tc_count,
                sit1_automated_executed_tc_count, sit1_defect_count_by_manual_execution,
                sit1_defect_count_by_automation_execution, sit2_date, sit2_planned_tc_count,
                sit2_manual_executed_tc_count, sit2_automated_executed_tc_count,
                sit2_defect_count_by_manual_execution, sit2_defect_count_by_automation_execution,
                uat_date, uat_planned_tc_count, uat_manual_executed_tc_count,
                uat_automated_executed_tc_count, uat_automation_code_executed,
                uat_defect_count_by_manual_execution, uat_defect_count_by_automation_execution,
                updated_by
            ) VALUES (
                :intake_number, :sit1_date, :sit1_planned_tc_count, :sit1_manual_executed_tc_count,
                :sit1_automated_executed_tc_count, :sit1_defect_count_by_manual_execution,
                :sit1_defect_count_by_automation_execution, :sit2_date, :sit2_planned_tc_count,
                :sit2_manual_executed_tc_count, :sit2_automated_executed_tc_count,
                :sit2_defect_count_by_manual_execution, :sit2_defect_count_by_automation_execution,
                :uat_date, :uat_planned_tc_count, :uat_manual_executed_tc_count,
                :uat_automated_executed_tc_count, :uat_automation_code_executed,
                :uat_defect_count_by_manual_execution, :uat_defect_count_by_automation_execution,
                :updated_by
            )
            ''',
            {
                'intake_number': intake_number,
                'sit1_date': data['sit1_date'],
                'sit1_planned_tc_count': data['sit1_planned_tc_count'],
                'sit1_manual_executed_tc_count': data['sit1_manual_executed_tc_count'],
                'sit1_automated_executed_tc_count': data['sit1_automated_executed_tc_count'],
                'sit1_defect_count_by_manual_execution': data['sit1_defect_count_by_manual_execution'],
                'sit1_defect_count_by_automation_execution': data['sit1_defect_count_by_automation_execution'],
                'sit2_date': data['sit2_date'],
                'sit2_planned_tc_count': data['sit2_planned_tc_count'],
                'sit2_manual_executed_tc_count': data['sit2_manual_executed_tc_count'],
                'sit2_automated_executed_tc_count': data['sit2_automated_executed_tc_count'],
                'sit2_defect_count_by_manual_execution': data['sit2_defect_count_by_manual_execution'],
                'sit2_defect_count_by_automation_execution': data['sit2_defect_count_by_automation_execution'],
                'uat_date': data['uat_date'],
                'uat_planned_tc_count': data['uat_planned_tc_count'],
                'uat_manual_executed_tc_count': data['uat_manual_executed_tc_count'],
                'uat_automated_executed_tc_count': data['uat_automated_executed_tc_count'],
                'uat_automation_code_executed': data['uat_automation_code_executed'],
                'uat_defect_count_by_manual_execution': data['uat_defect_count_by_manual_execution'],
                'uat_defect_count_by_automation_execution': data['uat_defect_count_by_automation_execution'],
                'updated_by': data['updated_by']
            }
        )
        db.session.commit()
        return jsonify({'message': 'Project timeline created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400
    
@app.route('/projects_timeline/<string:intake_number>', methods=['PUT'])
def update_projects_timeline(intake_number):
    data = request.get_json()
    db.session.execute(
        '''
        UPDATE projects_timeline SET
            sit1_date = :sit1_date, sit1_planned_tc_count = :sit1_planned_tc_count,
            sit1_manual_executed_tc_count = :sit1_manual_executed_tc_count, sit1_automated_executed_tc_count = :sit1_automated_executed_tc_count,
            sit1_defect_count_by_manual_execution = :sit1_defect_count_by_manual_execution, sit1_defect_count_by_automation_execution = :sit1_defect_count_by_automation_execution,
            sit2_date = :sit2_date, sit2_planned_tc_count = :sit2_planned_tc_count, sit2_manual_executed_tc_count = :sit2_manual_executed_tc_count,
            sit2_automated_executed_tc_count = :sit2_automated_executed_tc_count, sit2_defect_count_by_manual_execution = :sit2_defect_count_by_manual_execution,
            sit2_defect_count_by_automation_execution = :sit2_defect_count_by_automation_execution, uat_date = :uat_date, uat_planned_tc_count = :uat_planned_tc_count,
            uat_manual_executed_tc_count = :uat_manual_executed_tc_count, uat_automated_executed_tc_count = :uat_automated_executed_tc_count,
            uat_automation_code_executed = :uat_automation_code_executed, uat_defect_count_by_manual_execution = :uat_defect_count_by_manual_execution,
            uat_defect_count_by_automation_execution = :uat_defect_count_by_automation_execution, updated_by = :updated_by
        WHERE intake_number = :intake_number
        ''',
        {**data, 'intake_number': intake_number}
    )
    db.session.commit()
    return jsonify({'message': 'Project timeline updated successfully'})

@app.route('/projects_timeline/<string:intake_number>', methods=['DELETE'])
def delete_projects_timeline(intake_number):
    result = db.session.execute('SELECT * FROM projects_timeline WHERE intake_number = :intake_number', {'intake_number': intake_number})
    timeline = result.fetchone()
    if not timeline:
        return jsonify({'error': 'Project timeline not found'}), 404
    db.session.execute('DELETE FROM projects_timeline WHERE intake_number = :intake_number', {'intake_number': intake_number})
    db.session.commit()
    return '', 204

######## changes for application table
@app.route('/applications', methods=['GET'])
def get_applications():
    result = db.session.execute('SELECT * FROM application')
    applications = []
    for row in result:
        app_data = {
            'application': row['application'],
            'domain': row['domain'],
            'application_manager': row['application_manager'],
            'application_additional_detail': row['application_additional_detail']
        }
        applications.append(app_data)
    return jsonify(applications)

@app.route('/applications', methods=['POST'])
def add_application():
    data = preprocess_data(request.get_json())
    db.session.execute(
        'INSERT INTO application (application, domain, application_manager, application_additional_detail) VALUES (:application, :domain, :application_manager, :application_additional_detail)',
        {
            'application': data['application'],
            'domain': data['domain'],
            'application_manager': data['application_manager'],
            'application_additional_detail': data.get('application_additional_detail')
        }
    )
    db.session.commit()
    return jsonify({'message': 'Application added successfully'}), 201

@app.route('/applications/<string:application>', methods=['PUT'])
def update_application(application):
    data = request.get_json()
    db.session.execute(
        'UPDATE application SET domain = :domain, application_manager = :application_manager, application_additional_detail = :application_additional_detail WHERE application = :application',
        {
            'domain': data.get('domain'),
            'application_manager': data.get('application_manager'),
            'application_additional_detail': data.get('application_additional_detail')
        }
    )
    db.session.commit()
    return jsonify({'message': 'Application updated successfully'})

@app.route('/applications/<string:application>', methods=['DELETE'])
def delete_application(application):
    db.session.execute('DELETE FROM application WHERE application = :application', {'application': application})
    db.session.commit()
    return jsonify({'message': 'Application deleted successfully'})


######## changes for resource allocation table

@app.route('/resource_allocations', methods=['GET'])
def get_resource_allocations():
    try:
        
        result = db.session.execute('SELECT * FROM resources_allocation')
        allocations = []
        for row in result:
            allocation = {
                'resource_id': row['resource_id'],
                'resource_name': row['resource_name'],
                'resource_location': row['resource_location'],
                'intake_number': row['intake_number'],
                'project_percentage_allocation': row['project_percentage_allocation'],
                'start_date': row['start_date'],
                'end_date': row['end_date'],
                'weekly_allocation_on_project': row['weekly_allocation_on_project'],
                'updated_by': row['updated_by'],
                'timestamp': row['timestamp']
            }
            allocations.append(allocation)
        return jsonify(allocations)
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400
    
@app.route('/resource_allocations', methods=['POST'])
def add_resource_allocation():
    try:
        data = preprocess_data(request.get_json())
        db.session.execute(
            'INSERT INTO resources_allocation (resource_id, resource_name, resource_location, intake_number, project_percentage_allocation,start_date,end_date,weekly_allocation_on_project,updated_by) VALUES (:resource_id, :resource_name, :resource_location, :intake_number, :project_percentage_allocation,:start_date,:end_date,:weekly_allocation_on_project,:updated_by)',
            {
                'resource_id': data['resource_id'],
                'resource_name': data['resource_name'],
                'resource_location': data['resource_location'],
                'intake_number': data['intake_number'],
                'project_percentage_allocation': data['project_percentage_allocation'],
                'start_date': data['start_date'],
                'end_date': data['end_date'],
                'weekly_allocation_on_project': data['weekly_allocation_on_project'],
                'updated_by': data['updated_by']     
                }
        )
        db.session.commit()
        return jsonify({'message': 'Resource allocation added successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

@app.route('/resource_allocations/<int:resource_id>', methods=['PUT'])
def update_resource_allocation(resource_id):
    data = request.get_json()
    db.session.execute(
        'UPDATE resources_allocation SET resource_name = :resource_name, resource_location = :resource_location,intake_number = :intake_number, project_percentage_allocation =:project_percentage_allocation,start_date =:start_date,end_date =:end_date,weekly_allocation_on_project =:weekly_allocation_on_project,updated_by =:updated_by WHERE resource_id = :resource_id ',
        {
            'resource_name': data.get('resource_name'),
            'resource_location': data.get('resource_location'),
            'intake_number':  data.get('intake_number'),
            'project_percentage_allocation': data.get('project_percentage_allocation'),
            'start_date': data.get('start_date'),
            'end_date': data.get('end_date'),
            'weekly_allocation_on_project': data.get('weekly_allocation_on_project'),
            'updated_by': data.get('updated_by')

        }
    )
    db.session.commit()
    return jsonify({'message': 'Resource allocation updated successfully'})

@app.route('/resource_allocations/<int:resource_id>', methods=['DELETE'])
def delete_resource_allocation(resource_id):
    db.session.execute('DELETE FROM resources_allocation WHERE resource_id = :resource_id', {'resource_id': resource_id})
    db.session.commit()
    return jsonify({'message': 'Resource allocation deleted successfully'})


@app.route('/resource_allocations', methods=['DELETE'])
def delete_resource_allocation_on_weekly():
    resource_id = request.args.get('resource_id')
    intake_number = request.args.get('intake_number')
    start_date = request.args.get('start_date')
    print(resource_id,"---",intake_number,"---",start_date)
    db.session.execute('DELETE FROM resources_allocation WHERE resource_id = :resource_id and intake_number =:intake_number and start_date =:start_date ', {'resource_id': resource_id,'intake_number': intake_number,'start_date': start_date})
    db.session.commit()
    return jsonify({'message': 'Resource allocation deleted successfully'})


####  get resource allocation by projects
@app.route('/resource_allocations_on_project', methods=['GET'])
def get_resource_allocations_on_project():
    try:
        
        result = db.session.execute('with cte_1 as (select resources_allocation.intake_number,resource_id,resource_name,start_date, end_date, weekly_allocation_on_project from projects left join resources_allocation on resources_allocation.intake_number = projects.intake_number where start_date is not null and end_date is not null)select intake_number,resource_id, resource_name, start_date, end_date,sum(weekly_allocation_on_project) as weekly_allocation_on_project from cte_1 group by intake_number,resource_id, resource_name, start_date, end_date')
        allocations = []
        for row in result:
            allocation = {
                'intake_number': row['intake_number'],
                'resource_id': row['resource_id'],
                'resource_name': row['resource_name'],
                'start_date': row['start_date'],
                'end_date': row['end_date'],
                'weekly_allocation_on_project': row['weekly_allocation_on_project']
            }
            allocations.append(allocation)
        #print(allocation)
        return jsonify(allocations)
    except Exception as e:
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({'message': str(e)}), 400
    
####  get resource monthly capacity by projects
@app.route('/resource_allocations_monthly', methods=['GET'])
def get_resource_allocations_monthly():
    try:
        with open('./app/sql/resourceAllocationMonthly.sql', 'r') as file:
            sql_query = file.read()
        result = db.session.execute(sql_query)
        rows = result.fetchall()
        data = [dict(row) for row in rows]
        return jsonify(data)
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400
    
@app.route('/intake_resource_allocations_monthly', methods=['GET'])
def get_intake_resource_allocations_monthly():
    try:
        with open('./app/sql/intakeResourceMonthly.sql', 'r') as file:
            sql_query = file.read()
        result = db.session.execute(sql_query)
        rows = result.fetchall()
        data = [dict(row) for row in rows]
        return jsonify(data)
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400
    
@app.route('/intake_resource_allocations_weekly', methods=['GET'])
def get_intake_resource_allocations_weekly():
    try:
        with open('./app/sql/resourceWeekly.sql', 'r') as file:
            sql_query = file.read()
        result = db.session.execute(sql_query)
        rows = result.fetchall()
        data = [dict(row) for row in rows]
        return jsonify(data)
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400
    
@app.route('/class_tdm', methods=['GET'])
def get_class_tdm():
    try:
        result = db.session.execute("select * from CLASS_TDM")
        rows = result.fetchall()
        data = [dict(row) for row in rows]
        return jsonify(data)
    
    except Exception as e:
        return jsonify({'message': str(e)}), 400

# @app.route('/ecif_deal', methods=['GET'])
# def get_ecif_deal():
#     try:
#         from .automation_sqlite import get_ecif_deal_data
#         rows, columns = get_ecif_deal_data()
#         if rows is not None and columns is not None:
#             response = [dict(zip(columns, row)) for row in rows]
#             return jsonify(response)
#         else:
#             return jsonify({'error': 'Failed to fetch ecif_deal data from the database'}), 500
#     except Exception as e:
#         return jsonify({'message': str(e)}), 400

    
# @app.route('/alm_database', methods=['GET'])
# def get_alm_database():
#     try:
#         domain = request.args.get('domain')
#         project = request.args.get('project')
#         if not domain or not project:
#             return jsonify({'error': 'Missing domain or project parameter'}), 400
#         from .alm import get_alm_database
#         temp = get_alm_database(domain,project)
#         if temp is not None:
#             return temp
#         else:
#             return jsonify({'error': 'Failed to fetch alm_database data from the database'}), 500
#     except Exception as e:
#         return jsonify({'message': str(e)}), 400
    
# @app.route('/alm_only_release', methods=['GET'])
# def get_alm_only_release():
#     try:
#         domain = request.args.get('domain')
#         project = request.args.get('project')
#         if not domain or not project:
#             return jsonify({'error': 'Missing domain or project parameter'}), 400
#         from .alm import get_alm_database,run_dql
#         temp = get_alm_database(domain,project)
#         if temp is not None:
#             tmp_data = json.loads(temp.get_data(as_text=True))
#             db_name = ""
#             for item in tmp_data:
#                 db_name = item.get("DB_NAME")
#             if db_name:
#                 pythoncom.CoInitialize()
#                 query = f"SELECT REL_NAME FROM {db_name}.dbo.RELEASES ORDER BY REL_NAME"
#                 pythoncom.CoUninitialize()
#                 release_det = run_dql(domain,project,query)
#                 #print(release_det)
#                 if release_det is not None:
#                     return release_det
#             else:
#                 return jsonify({'error': 'Failed to fetch alm_database data from the database'}), 500
#         else:
#             return jsonify({'error': 'Failed to fetch alm_only_release data from the database'}), 500
#     except Exception as e:
#         return jsonify({'message': str(e)}), 400


# @app.route('/alm_run_dql', methods=['GET'])
# def get_alm_daily_coverage():
#     try:
#         domain = request.args.get('domain')
#         project = request.args.get('project')
#         release = request.args.get('release')
#         dql_name = request.args.get('dql_name')

#         #print(F"domain is {domain} and project is {project} and release is {release} and dql_name is {dql_name}")

#         if not domain or not project:
#             return jsonify({'error': 'Missing domain or project parameter'}), 400
#         from .alm import get_alm_database,run_dql
#         temp = get_alm_database(domain,project)
#         if temp is not None:
#             tmp_data = json.loads(temp.get_data(as_text=True))
#             db_name = ""
#             rel_id = ""
#             for item in tmp_data:
#                 db_name = item.get("DB_NAME")
#             if db_name:
#                 pythoncom.CoInitialize()
#                 query = f"SELECT REL_ID FROM {db_name}.dbo.RELEASES WHERE REL_NAME = '{release}'  fetch one"
#                 pythoncom.CoUninitialize()
#                 release_det = run_dql(domain,project,query)
#                 #rint(release_det)
#                 if release_det is not None:
#                     release_det =json.loads(release_det.get_data(as_text=True))
#                     for item in release_det:
#                         #print(item.get("REL_ID"))
#                         rel_id = item.get("REL_ID")
#                     with open(f'./app/dql/{dql_name}', 'r') as file:
#                         sql_query = file.read()
#                     query = sql_query.replace("<DB_NAME>",db_name).replace("<SelectedReleaseID>",rel_id)
#                     release_det = run_dql(domain,project,query)
#                     if release_det is not None:
#                         return release_det
#             else:
#                 return jsonify({'error': 'Failed to fetch alm_database data from the database'}), 500
#         else:
#             return jsonify({'error': 'Failed to fetch alm_only_release data from the database'}), 500
#     except Exception as e:
#         return jsonify({'message': str(e)}), 400

# @app.route('/alm_run_sql', methods=['GET'])
# def get_alm_run_sql():
#     try:
#         domain = request.args.get('domain')
#         project = request.args.get('project')
#         query = request.args.get('query')
#         #print(F"domain is {domain} and project is {project} and query is {query}")
#         if not domain or not project or not query:
#             return jsonify({'error': 'Missing domain, project, or query parameter'}), 400
#         from .alm import run_dql
#         pythoncom.CoInitialize()
#         sql_response = run_dql(domain, project, query)
#         pythoncom.CoUninitialize()
#         if sql_response is not None:
#             return sql_response
#         else:
#             return jsonify({'error': 'Failed to fetch alm_database data from the database'}), 500        
#     except Exception as e:
#         return jsonify({'message': str(e)}), 400

# @app.route('/alm_query_user', methods=['GET'])
# def get_alm_query_user():
#     result = db.session.execute('SELECT distinct username FROM stored_queries')
#     project_timeline = [dict(row) for row in result]
#     return jsonify(project_timeline)

# @app.route('/alm_query_stored_query/<username>', methods=['GET'])
# def get_alm_query_stored_query(username):
#     try:
#         print(username)
#         result = db.session.execute('SELECT sql_query_name FROM stored_queries WHERE username = :username', {'username': username})
#         project_timeline = [dict(row) for row in result]
#         return jsonify(project_timeline)
#     except Exception as e:
#         return jsonify({'message': str(e)}), 400
    
# @app.route('/alm_get_store_query/<sql_query_name>', methods=['GET'])
# def get_alm_get_store_query(sql_query_name):
#     try:
#         print(sql_query_name)
#         result = db.session.execute('SELECT sql_query FROM stored_queries WHERE sql_query_name = :sql_query_name', {'sql_query_name': sql_query_name})
#         project_timeline = [dict(row) for row in result]
#         return jsonify(project_timeline)
#     except Exception as e:
#         return jsonify({'message': str(e)}), 400
        
# @app.route('/store_sql_query', methods=['POST'])
# def store_sql_query():
#     try:
#         data = request.get_json()
#         # Validate required fields
#         if not data.get('username') or not data.get('sql_query_name') or not data.get('sql_query'):
#             return jsonify({'error': 'Missing username, sql_query_name, or sql_query parameter'}), 400

#         # Insert the new query into the database
#         db.session.execute(
#             'INSERT INTO stored_queries (username, sql_query_name, sql_query) VALUES (:username, :sql_query_name, :sql_query)',
#             {
#                 'username': data.get('username'),
#                 'sql_query_name': data.get('sql_query_name'),
#                 'sql_query': data.get('sql_query')
#             }
#         )
#         db.session.commit()
#         return jsonify({'message': 'SQL query stored successfully'}), 201
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'message': str(e)}), 400

###### changes for project timelines
@app.route('/alm_stored_query', methods=['GET'])
def get_alm_stored_query():
    result = db.session.execute('SELECT username,sql_query_name , sql_query, insert_timestamp FROM stored_queries')
    sql_data = [dict(row) for row in result]
    return jsonify(sql_data)


###### changes for project timelines
@app.route('/jenkins_logs', methods=['GET'])
def get_jenkins_logs():
    result = db.session.execute('SELECT * FROM jenkins_job_logs')
    sql_data = [dict(row) for row in result]
    return jsonify(sql_data)

@app.route('/user_role', methods=['GET'])
def get_user_role():
    userid = request.args.get('userid')
    password = request.args.get('password')
    result = db.session.execute(
    
        text("SELECT title FROM resources WHERE userid = :userid AND password = :password"),
        {'userid': userid, 'password': password}
    )
    user = result.fetchone()
    if user:
        return jsonify({'userid': userid, 'role': user.title}), 200
    else:
        return jsonify({'error': 'User not found or invalid credentials'}), 404


###### changes for project timelines
@app.route('/test_cases', methods=['GET'])
def get_test_cases_detail():
    result = db.session.execute('SELECT repository_name,branch_name,robot_file_path,test_case_name,documentation,steps FROM test_cases')
    sql_data = [dict(row) for row in result]
    return jsonify(sql_data)

#for latest news
@app.route('/latestnews', methods=['GET'])
def latest_news():
    result = db.session.execute('SELECT headline FROM latestnews ORDER BY created_at DESC')    
    headline = [row[0] for row in result.fetchall()]    
    return jsonify({'latestnews':[{'headline':h} for h in headline]})

# ---------------- Dynamic UI Generation APIs ----------------
@app.route('/ui/schemas', methods=['GET'])
def list_ui_schemas():
    rows = UISchema.query.all()
    return jsonify([r.to_dict() for r in rows])

@app.route('/ui/schemas/<string:name>', methods=['GET'])
def get_ui_schema(name):
    row = UISchema.query.filter_by(name=name).first()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(row.to_dict())

@app.route('/ui/schemas', methods=['POST'])
def create_ui_schema():
    data = request.get_json() or {}
    name = data.get('name')
    schema = data.get('schema')
    if not name or not schema:
        return jsonify({'error': 'name and schema are required'}), 400
    import json
    existing = UISchema.query.filter_by(name=name).first()
    if existing:
        return jsonify({'error': 'Schema with that name already exists'}), 409
    row = UISchema(name=name, schema_json=json.dumps(schema))
    db.session.add(row)
    db.session.commit()
    return jsonify(row.to_dict()), 201

@app.route('/ui/schemas/<string:name>', methods=['PUT'])
def update_ui_schema(name):
    data = request.get_json() or {}
    schema = data.get('schema')
    if schema is None:
        return jsonify({'error': 'schema required'}), 400
    import json
    row = UISchema.query.filter_by(name=name).first()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    row.schema_json = json.dumps(schema)
    db.session.commit()
    return jsonify(row.to_dict())

@app.route('/ui/schemas/<string:name>', methods=['DELETE'])
def delete_ui_schema(name):
    row = UISchema.query.filter_by(name=name).first()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    # Best-effort drop of dynamically created table (if schema was published)
    import re
    from sqlalchemy import inspect, text
    table_name = re.sub(r'[^a-zA-Z0-9_]', '_', row.name.lower())
    try:
        insp = inspect(db.engine)
        if insp.has_table(table_name):
            # Remove from in-memory cache first (if present)
            try:
                dynamic_models.pop(table_name, None)  # type: ignore  # dynamic_models defined below
            except Exception:
                pass
            with db.engine.begin() as conn:
                # Use quoted identifier to be safe; fallback silently on failure
                try:
                    conn.execute(text(f'DROP TABLE "{table_name}"'))
                except Exception:
                    pass
    except Exception:
        # Swallow any inspector / drop issues so schema delete still succeeds
        pass
    db.session.delete(row)
    db.session.commit()
    return '', 204

@app.route('/ui/generate_backend/<string:name>', methods=['POST'])
def generate_backend_for_schema(name):
    """Generate a simple CRUD backend for the given schema.
    Request JSON may include options: { tableName?: str }
    Schema format example:
    { "fields": [ {"label": "Title", "name": "title", "type": "string", "required": true}, ... ] }
    """
    row = UISchema.query.filter_by(name=name).first()
    if not row:
        return jsonify({'error': 'Schema not found'}), 404
    import json, re
    schema = json.loads(row.schema_json)
    fields = schema.get('fields', [])
    body = request.get_json(silent=True) or {}
    table_name = body.get('tableName') or re.sub(r'[^a-zA-Z0-9_]', '_', name.lower())
    # Build SQLAlchemy model code snippet
    columns = ["    id = db.Column(db.Integer, primary_key=True, autoincrement=True)"]
    for f in fields:
        fname = f.get('name')
        ftype = f.get('type', 'string')
        required = f.get('required', False)
        nullable = 'False' if required else 'True'
        if ftype in ('string','text'):
            coltype = 'db.String(255)' if ftype=='string' else 'db.Text'
        elif ftype in ('int','integer','number'):
            coltype = 'db.Integer'
        elif ftype in ('float','double','decimal'):
            coltype = 'db.Float'
        elif ftype in ('date',):
            coltype = 'db.Date'
        elif ftype in ('datetime',):
            coltype = 'db.DateTime'
        elif ftype in ('bool','boolean'):
            coltype = 'db.Boolean'
        else:
            coltype = 'db.String(255)'
        columns.append(f"    {fname} = db.Column({coltype}, nullable={nullable})")
    model_code = [f"class {table_name.title().replace('_','')} (db.Model):", f"    __tablename__ = '{table_name}'"] + columns + ["", "    def to_dict(self):", "        return {" ]
    for f in ['id'] + [f.get('name') for f in fields if f.get('name')]:
        model_code.append(f"            '{f}': self.{f},")
    model_code.append("        }")
    model_code_str = '\n'.join(model_code)
    # Return code snippet for now (future: write to file & auto-register)
    return jsonify({'model_snippet': model_code_str, 'message': 'Model code generated (not yet written to file).'}), 200

# ---------------- Publishing & Dynamic CRUD ----------------
dynamic_models = {}

def _camel(name: str):
    return ''.join(p.capitalize() for p in name.split('_'))

def ensure_dynamic_model(schema_row: UISchema):
    import json, re, datetime
    schema = json.loads(schema_row.schema_json)
    table_name = re.sub(r'[^a-zA-Z0-9_]', '_', schema_row.name.lower())
    if table_name in dynamic_models:
        return dynamic_models[table_name]
    fields = schema.get('fields', [])
    # Build SQLAlchemy model dynamically
    type_map = {
        'string': db.String(255), 'text': db.Text,
        'int': db.Integer, 'integer': db.Integer, 'number': db.Integer,
        'float': db.Float, 'double': db.Float, 'decimal': db.Float,
        'date': db.Date, 'datetime': db.DateTime,
        'bool': db.Boolean, 'boolean': db.Boolean
    }
    attrs = {'__tablename__': table_name,
             'id': db.Column(db.Integer, primary_key=True, autoincrement=True)}
    for f in fields:
        fname = f.get('name')
        if not fname:
            continue
        ftype = f.get('type', 'string').lower()
        required = f.get('required', False)
        coltype = type_map.get(ftype, db.String(255))
        attrs[fname] = db.Column(coltype, nullable=not required)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
    attrs['to_dict'] = to_dict
    ModelClass = type(_camel(table_name), (db.Model,), attrs)
    # Create table if not exists
    with db.engine.begin() as conn:
        ModelClass.__table__.create(bind=conn, checkfirst=True)
    dynamic_models[table_name] = ModelClass
    return ModelClass

@app.route('/ui/publish/<string:name>', methods=['POST'])
def publish_schema(name):
    row = UISchema.query.filter_by(name=name).first()
    if not row:
        return jsonify({'error': 'Schema not found'}), 404
    model_cls = ensure_dynamic_model(row)
    return jsonify({'message': 'Published', 'schema': row.name, 'table': model_cls.__tablename__, 'data_url': f'/ui/data/{row.name}', 'page_url': f'/schema/{row.name}'})

def _get_model(schema_name):
    row = UISchema.query.filter_by(name=schema_name).first()
    if not row:
        return None, jsonify({'error': 'Schema not found'}), 404
    return ensure_dynamic_model(row), row, None

def _coerce_field(ftype, value):
    import datetime
    if value is None:
        return None
    # Normalize empty string to None (let DB store NULL) for all non-required fields
    if isinstance(value, str) and value.strip() == '':
        return None
    try:
        if ftype == 'date':
            # Accept ISO (YYYY-MM-DD) or common variants (DD-MM-YYYY / MM-DD-YYYY)
            for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%m-%d-%Y', '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y'):
                try:
                    return datetime.datetime.strptime(value, fmt).date()
                except ValueError:
                    continue
            raise ValueError('Invalid date format. Use YYYY-MM-DD or DD-MM-YYYY.')
        if ftype == 'datetime':
            # Try multiple datetime formats
            value_clean = value.replace('T',' ').replace('Z','')
            for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%d-%m-%Y %H:%M:%S', '%d-%m-%Y %H:%M'):
                try:
                    return datetime.datetime.strptime(value_clean, fmt)
                except ValueError:
                    continue
            # Fallback to ISO parser
            return datetime.datetime.fromisoformat(value_clean)
        if ftype in ('int','integer','number'):
            return int(value)
        if ftype in ('float','double','decimal'):
            return float(value)
        if ftype in ('bool','boolean'):
            return bool(value)
    except Exception:
        return value
    return value

@app.route('/ui/data/<string:schema_name>', methods=['GET'])
def list_schema_data(schema_name):
    model, row, err = _get_model(schema_name)
    if err:
        return row, err  # row carries response, err is status
    records = model.query.all()
    return jsonify([r.to_dict() for r in records])

@app.route('/ui/data/<string:schema_name>', methods=['POST'])
def create_schema_record(schema_name):
    model, row, err = _get_model(schema_name)
    if err:
        return row, err
    import json as _json, traceback
    try:
        schema_def = _json.loads(row.schema_json)
        field_defs = {f['name']: f for f in schema_def.get('fields', []) if f.get('name')}
        payload = request.get_json() or {}
        data = {}
        for fname, fdef in field_defs.items():
            val = payload.get(fname)
            if fdef.get('required') and (val is None or (isinstance(val, str) and val.strip() == '')):
                return jsonify({'error': f'Missing required field {fname}'}), 400
            coerced = _coerce_field(fdef.get('type','string').lower(), val)
            # If required and coerced None now (e.g., invalid format), flag error
            if fdef.get('required') and coerced is None:
                return jsonify({'error': f'Invalid or missing value for required field {fname}'}), 400
            data[fname] = coerced
        obj = model(**data)
        db.session.add(obj)
        db.session.commit()
        return jsonify(obj.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error('Dynamic record create failed: %s\n%s', e, traceback.format_exc())
        return jsonify({'error': 'Insert failed', 'detail': str(e)}), 500

@app.route('/ui/data/<string:schema_name>/<int:record_id>', methods=['PUT'])
def update_schema_record(schema_name, record_id):
    model, row, err = _get_model(schema_name)
    if err:
        return row, err
    obj = model.query.get(record_id)
    if not obj:
        return jsonify({'error': 'Record not found'}), 404
    import json as _json
    field_defs = {f['name']: f for f in _json.loads(row.schema_json).get('fields', []) if f.get('name')}
    payload = request.get_json() or {}
    for fname, fdef in field_defs.items():
        if fname in payload:
            val = payload.get(fname)
            if fdef.get('required') and (val is None or (isinstance(val,str) and val.strip()=='')):
                return jsonify({'error': f'Missing required field {fname}'}), 400
            coerced = _coerce_field(fdef.get('type','string').lower(), val)
            if fdef.get('required') and coerced is None:
                return jsonify({'error': f'Invalid value for required field {fname}'}), 400
            setattr(obj, fname, coerced)
    db.session.commit()
    return jsonify(obj.to_dict())

@app.route('/ui/data/<string:schema_name>/<int:record_id>', methods=['DELETE'])
def delete_schema_record(schema_name, record_id):
    model, row, err = _get_model(schema_name)
    if err:
        return row, err
    obj = model.query.get(record_id)
    if not obj:
        return jsonify({'error': 'Record not found'}), 404
    db.session.delete(obj)
    db.session.commit()
    return '', 204
