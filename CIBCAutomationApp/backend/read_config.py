import os
import json

# Get the absolute path to the directory containing this script
config_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the absolute path to config.json
config_path = os.path.join(config_dir, 'config.json')

with open(config_path) as config_file:
    config = json.load(config_file)

port = config.get('port', 5000) # if port is no t passed use 5000
alm_port = config.get('alm_port', 5001) # if port is no t passed use 5000
mmtg_parser_port = config.get('mmtg_parser_port', 5002) # if port is no t passed use 5000
jenkins_port = config.get('jenkins_port', 5003) # if port is no t passed use 5000
alm_url = config.get('alm_url') 
mlidt_api_key = config.get('mlidt_api_key') 
mlidt_secret_key = config.get('mlidt_secret_key') 
rbss_api_key = config.get('rbss_api_key') 
rbss_secret_key = config.get('rbss_secret_key') 
debug = config.get('debug', False)
jenkins_token = config.get('jenkins_token')
jenkins_username = config.get('jenkins_username')