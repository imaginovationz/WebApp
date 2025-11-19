
###### DB DEtails

import os
from numpy import str
import traceback
import sys
import json
import ast
import cx_Oracle



currentdir = os.path.dirname(os.path.realpath(__file__))
parentdir = os.path.dirname(currentdir)
sys.path.append(parentdir)
from Configuration import TestConfig
from Configuration.TestConfig import DB_HOST_NAME, DB_PORT_NUMBER, DB_SERVICE_NAME, DB_SCHEMA_DMRTL, DB_SCHEMA_CWL, DB_ADJ_APP, DB_SECURITY_REA, DB_Application, DB_Applicant, DB_USER_NAME, DB_PASSWORD,  \
    ORACLE_CLIENT_32_DEPENDECY, ORACLE_CLIENT_64_DEPENDECY, iMin



def create_db_connection(server, port, user, pasword, db_serv):
    """

        Create Database connection for provided server, port and schema. Returns connection cursor to execute queries

        Parameters:
        server (str): Database Server
        port (str): Database Port
        user (str): Database User Name
        pasword (str): Database Password
        db_serv (str): Database Service Name

        Returns:

        cursor : Connection cursor
    """
    try:
        print("Starting DB connection")
        print(server + ":" + str(port))
        import platform
        try:
            if (platform.architecture()[0] == "32bit"):
                cx_Oracle.init_oracle_client(lib_dir=ORACLE_CLIENT_32_DEPENDECY)
            else:
                cx_Oracle.init_oracle_client(lib_dir=ORACLE_CLIENT_64_DEPENDECY)
        except cx_Oracle.ProgrammingError as ox:
            pass
        orc_dsn = cx_Oracle.makedsn(server, port, service_name=db_serv)
        conn = cx_Oracle.connect(user=user, password=pasword, dsn=orc_dsn)
        cursor = conn.cursor()
        return cursor

    except Exception as ex:
        print("Exception in connect_DB")
        print(traceback.format_exc())
        print(sys.exc_info()[2])
        raise Exception(
            "Database_Exception in method create_db_connection for Databases service" + DB_SERVICE_NAME + ". " + str(
                ex))


def close_db_connection(cursor):
    """
           This function is for closing the Cursor object
    """
    try:
        print("Closing DB connection")
        cursor.close()

    except Exception as ex:
        print("Exception in fetch_db_data")
        print(traceback.format_exc())
        print(sys.exc_info()[2])
        raise Exception(
            "Database_Exception in method close_db_connection for Databases service" + DB_SERVICE_NAME + ". " + str(ex))


# def fetch_db_data(sqlquery):
#     """
#         This function fetches data for given sql query and returns rows as a list
# 
#         Parameters:
#         sqlquery (str) : query to execute
# 
#         Returns:
# 
#         table_row_lst : List of rows
#     """
#     try:
#         print("Making DB connection call")
#         cursor = ""
#         print(DB_HOST_NAME, DB_PORT_NUMBER, DB_USER_NAME, DB_PASSWORD, DB_SERVICE_NAME)
#         cursor = create_db_connection(DB_HOST_NAME, DB_PORT_NUMBER, DB_USER_NAME, DB_PASSWORD, DB_SERVICE_NAME)
#         table_row_lst = []
#         # sqlquery="select * from cwl_sit1.subject_property fetch first 2 rows only"
#         sqlquery = sqlquery.replace(";", "")
#         cursor.execute(sqlquery)
#         cursor.rowfactory = lambda *args: dict(zip([d[0] for d in cursor.description], args))
#         rowval = cursor.fetchone()
#         while rowval:
#             table_row_lst.append(rowval)
#             rowval = cursor.fetchone()
#         close_db_connection(cursor)
#         print(table_row_lst)
#         return table_row_lst
#     except Exception as ex:
#         print("Exception in fetch_db_data")
#         print(traceback.format_exc())
#         print(sys.exc_info()[2])
#         raise Exception(
#             "Database_Exception in method fetch_db_data for Databases service" + DB_SERVICE_NAME + ". " + str(ex))

def fetch_db_data(sqlquery):  
    try:
        print("Making DB connection call")
        cursor = create_db_connection(DB_HOST_NAME, DB_PORT_NUMBER,DB_USER_NAME, DB_PASSWORD, DB_SERVICE_NAME)
        table_row_lst=[]
        sqlquery = sqlquery.replace(";","")
        cursor.execute(sqlquery)
#         cursor.rowfactory = lambda *args: dict(zip([d[0] for d in cursor.description], args))
        rowval = cursor.fetchone()
        if rowval: 
            print (rowval [0])
        close_db_connection(cursor)
        return  rowval[0]
#         print(table_row_lst)
#         return  table_row_lst
    except Exception as ex:
        print("Exception in fetch_db_data")
        print(traceback.format_exc())
        print(sys.exc_info()[2])
        raise   Exception("Database_Exception in method fetch_db_data for Databases service" +  DB_SERVICE_NAME+ ". "+str(ex))



def validate_data_from_db(expected_value, column_to_be_verified, sql_qry):
    """
        Fetches Database results and compares with the expected value dict. If Matches return True otherwise False

        Parameters:
        expected_value (str): value to compare with respective column value
        Column_to_be_verified (str):  column names in the select query
        sql_qry (str): SQL Query to execute and fetch details


        Returns:

        comparision_result : True /False
    """
    comparision_result = False
    expected_result = json.dumps([{column_to_be_verified:expected_value}])
    print("expected_result:" ,expected_result)
    comparision_result = fn_SSI_run_custom_sql_query(sql_qry, expected_result)
    if (comparision_result != True):
        return False
    return comparision_result


def generate_sql_query(column_to_be_verified,schema_name, tableName, condition_column, condition_value, order_by=None, limit=1):
    """
        Generates Select Query with column name, schema_name.tablename and where condition. Returns sql query to execute

        Parameters:
        Column_to_be_verified (str):  column names in the select query
        schema_name (str): Database Schema Name
        tableName (str): Database table Name
        condition_column (str) : column to use in where condition
        condition_value (str) :  value to use in where condition
        order_by (str): orderby column name
        limit :  no. of rows to fetch

        Returns:

        sql_query : select query to execute
        """
    sql_qry = f"SELECT {column_to_be_verified} FROM {schema_name}.{tableName} WHERE {condition_column} = '{condition_value}'"

    if order_by:
        sql_qry += f" ORDER BY {order_by} DESC"
    if limit:
        sql_qry += f" FETCH FIRST {limit} ROWS ONLY"

    print("sql_query:",sql_qry)
    return sql_qry


def generate_sqlJoin_query(columns, tables, joins=None, conditions=None, order_by=None, limit=1):
    """
        Generates Select Query with column list, table list and where condition. Returns sql query to execute
        This function is written to execute query after opening Toad Oracle - for Screenshot

        Parameters:
        Columns (list):  list of column names in the select query
        tables (list): list of table Name
        joins (list of tuples) : column to use in where condition
        conditions (dict) :  value to use in where condition
        order_by=None (str): orderby column name, By default None
        limit=1 :  no. of rows to fetch, By default first row

        Returns:
        sql_query : select query to execute
        """

    columns_str = ",".join(columns)
    tables_str = ",".join(tables)
    sql_qry = f"SELECT {columns_str}{{ENTER}}FROM {tables_str}"
    joins_str = ""
    # WHERE {condition_column} = '{condition_value}'"

    # Handling Joins
    if joins:
        for t1, t2, col1, col2 in joins:
            joins_str += f"  {t1}.{col1} = {t2}.{col2} AND"
    sql_qry += f"{{ENTER}}WHERE{joins_str}{{ENTER}}"
    # Handling Joins
    if conditions is not None:
        sql_qry += " AND ".join([f"{col} = '{val}'" for col, val in conditions.items()])
    if order_by:
        sql_qry += f"{{ENTER}}ORDER BY {order_by} DESC"
    if limit:
        sql_qry += f" FETCH FIRST {limit} ROWS ONLY"

    print("sql_query:", sql_qry)
    return sql_qry

def generate_sqlJoin_query_for(columns, tables, joins=None, conditions=None, order_by=None, limit=1, conditions_gt=None):
    """
        Generates Select Query with column list, table list and where condition. Returns sql query to execute

        Parameters:
        Columns (list):  list of column names in the select query
        tables (list): list of table Name
        joins (list of tuples) : column to use in where condition
        conditions (dict) :  value to use in where condition
        conditions_gt (dict) :  value to use in where condition for comparing greater than
        order_by=None (str): orderby column name, By default None
        limit=1 :  no. of rows to fetch, By default first row

        Returns:
        sql_query : select query to execute
        """

    columns_str = ",".join(columns)
    tables_str = ",".join(tables)
    sql_qry = f"SELECT {columns_str} FROM {tables_str}"
    joins_str = ""
    # WHERE {condition_column} = '{condition_value}'"

    # Handling Joins
    if joins:
        for t1, t2, col1, col2 in joins:
            joins_str += f"  {t1}.{col1} = {t2}.{col2} AND "
    sql_qry += f" WHERE {joins_str}"
    # Handling Joins
    if conditions is not None:
        sql_qry += " AND ".join([f"{col} = '{val}'" for col, val in conditions.items()])
    if conditions_gt is not None:
        sql_qry += " AND ".join([f"{col} > '{val}'" for col, val in conditions_gt.items()])
    if order_by:
        sql_qry += f" ORDER BY {order_by} DESC"
    if limit:
        sql_qry += f" FETCH FIRST {limit} ROWS ONLY"

    print("sql_query:", sql_qry)
    return sql_qry

def load_to_json(json_string):
    """
    It will convert given String into Json
    Parameters:
                input string in json format
    Returns: json
    """
    if (type(json_string) is list):
        json_string = str(json_string)

    try:
        _inp_json = ast.literal_eval(json_string)
        return _inp_json
    except Exception as e:
        print(traceback.format_exc())
        print(sys.exc_info()[2])
        print("Trying to convert into json with Option 2")
        try:
            _inp_json = json.loads(json_string)
            return _inp_json
        except:
            print(traceback.format_exc())
            print(sys.exc_info()[2])


def compare_db_result(sql_query_op, expected_op):
    """
    It will compare the result of sql query with the passed the parameter.Both the value should be in json
    Parameters:
                sql_query_op
                expected_op - should be in a list
    Returns: true/false
    """
    _sql_query_json = load_to_json(sql_query_op)
    print("SQL QUERY OP:" + str(_sql_query_json))
    # If ask is to check if record is null, then it will iterate over all db record and check if all have value as null. If any record have some data then it will fail
    if (isStringNullEmpty(expected_op)):
        for tmp_record in _sql_query_json:
            for key, value in tmp_record.items():
                if (isStringNullEmpty(value) == False):
                    return False
        return True
    # other part needs to be worked
    else:
        _expected_op_json = load_to_json(expected_op)
        _record_match = False
        for tmp_record in _expected_op_json:  # iterate each record of user input
            for key, value in tmp_record.items():
                __user_value = str(value)
                __user_key = str(key)

                if (str(__user_value) not in ["NA", "na",
                                              "[Don't Care]"]):  # checks for value only if expected output is not NA. Given input should be NA if query gives no output i.e:[]
                    print("Checking for value:" + str(__user_value))

                    for tmp_record in _sql_query_json:  # iterate each record from sql query to match record
                        for key, value in tmp_record.items():
                            if (__user_value.strip() == str(value).strip()):
                                print("Columns:{0} & Value:{1} is matched with sql query output".format(__user_key,
                                                                                                        __user_value))
                                _record_match = True
                                break
                        else:
                            _record_match = False
                            print("Columns:{0} & Value:{1} NOT matched with sql query output".format(__user_key,
                                                                                                     __user_value))
                            continue
                        break  # break the outer loop for sql query
                else:
                    _record_match = True
                    break
                if (_record_match == False):
                    return _record_match
        return _record_match

def fn_SSI_run_custom_sql_query(sql_query, expected_result):
    """
        Generic function to validate db records for SSI fields.
    """
    print(sql_query)
    sql_qry_op = fetch_db_data(sql_query)
    print(sql_qry_op)
    _sql_query_json = load_to_json(sql_qry_op)
    print("SQL QUERY OP:" + str(_sql_query_json))
    print(expected_result)
    _comparision_result = compare_db_result(sql_qry_op, expected_result)
    print(_comparision_result)
    return _comparision_result



def isStringNullEmpty(user_string):
    """
    True if String is empty/None
    False if String is not empty or having some text
    """
    if user_string and user_string.strip():
        if len(user_string.strip()) == 0:
            return True
        return False
    # return True


def get_clob_data_custom_sql_query(sql_query, key):
    """
        Generic function to extract and read clob data from a dictionary result.
    """
    print(sql_query)
    sql_qry_clob_data = fetch_db_data(sql_query)
    print(sql_qry_clob_data)
    if sql_qry_clob_data and isinstance(sql_qry_clob_data, list):
        first_row = sql_qry_clob_data[0]
        if key in first_row:
            clob_obj = first_row[key]
            if hasattr(clob_obj, 'read'):
                return clob_obj.read()
            else:
                return "Error: Retrieved value is not a CLOB object"

    return None