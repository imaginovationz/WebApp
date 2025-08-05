Introduction
A Flask- React project with SQLite as database that lets user retrieve values form SQLite database, allows users to update the details through UI and updates the database
# WebApp
	•  `app.py`: The main backend application that defines API endpoints for interacting with the database.
	•  `populate_db.py`: A script to initialize and populate the SQLite database with sample data.
	•  `database.db`: The SQLite database file where the data is stored.
	
	
2. Functionality

a. `app.py`

This file contains the main logic for the backend API. It provides endpoints for interacting with the options table in the SQLite database. Key functions include:

	1. `get_db_connection()`:
	2. Establishes a connection to the SQLite database and returns the connection object.
	3. `get_options()`:
	4. HTTP GET endpoint at /api/options.
	5. Fetches all rows from the options table and returns them as a JSON response.
	6. `get_option_details(option_id)`:
	7. HTTP GET endpoint at /api/details/<int:option_id>.
	8. Fetches details of a specific option by its id and returns it as a JSON response.
	9. `update_option()`:
	10. HTTP POST endpoint at /api/update.
	11. Updates the value of an option in the database based on the provided id, old_value, and new_value.



b. `populate_db.py`

This script is used to initialize and populate the database with default data. It performs the following tasks:

	1. Creates the options table if it does not already exist.
	2. Clears any existing data in the options table.
	3. Inserts predefined options (Option A, Option B, Option C) into the table.
	
	
	
3. Database

The SQLite database (database.db) contains a single table named options with the following schema:

	•  id (INTEGER PRIMARY KEY): A unique identifier for each option.
	•  name (TEXT): The name of the option.
	
	
4. Workflow

	1. Database Initialization:
	2. Run populate_db.py to create the database and populate it with default options.
	3. API Interaction:
	4. Use the endpoints in app.py to interact with the database:
		•  Fetch all options (/api/options).
		•  Fetch details of a specific option (/api/details/<id>).
		•  Update an option (/api/update).

	5. Use Case:
	6. This project could be used in scenarios where a web application needs to manage and update a list of options dynamically, such as a dropdown menu or a configuration list.	