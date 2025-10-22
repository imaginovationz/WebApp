from flask import Flask, request, g
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import event
from sqlalchemy.engine import Engine
import socket
import os
import logging
from logging.handlers import RotatingFileHandler
from filelock import FileLock
import time

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config['JSON_SORT_KEYS'] = False
    CORS(app)
    # Update the SQLALCHEMY_DATABASE_URI to use MySQL
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:root@10.239.43.100:3306/cbpt_automation_db?charset=utf8mb4&autocommit=true'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_POOL_RECYCLE'] = 3600
    
    # SQLAlchemy engine options for MySQL 9.x compatibility
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'connect_args': {
            'charset': 'utf8mb4',
            'autocommit': True,
            'sql_mode': 'TRADITIONAL',
        }
    }

    instance_id = "automation_portal" 

    app.config["LOGGER_NAME"] = ' '.join([app.name, socket.gethostname(), instance_id])

    # Configure logging
    if not os.path.exists('logs'):
        os.mkdir('logs')
    log_file = 'logs/automation_portal.log'
    lock_file = log_file + '.lock'
    file_handler = RotatingFileHandler(log_file, maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)

    # Wrap the file handler with a file lock
    class LockedRotatingFileHandler(RotatingFileHandler):
        def emit(self, record):
            with FileLock(lock_file):
                super().emit(record)

    app.logger.addHandler(LockedRotatingFileHandler(log_file, maxBytes=10240, backupCount=10))
    app.logger.setLevel(logging.INFO)
    app.logger.info('Automation Portal startup')

    db.init_app(app)

    # Remove SQLite-specific pragma setting
    # @event.listens_for(Engine, "connect")
    # def set_sqlite_pragma(dbapi_connection, connection_record):
    #     cursor = dbapi_connection.cursor()
    #     cursor.execute("PRAGMA foreign_keys=ON")
    #     cursor.close()

    @app.before_request
    def before_request():
        g.start_time = time.time()

    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            elapsed_time = time.time() - g.start_time
            app.logger.info(f'Request {request.method} {request.path} took {elapsed_time:.2f} seconds')
        return response

    @app.teardown_request
    def teardown_request(exception=None):
        db.session.remove()
        app.logger.info(f'Session closed for request: {request.method} {request.path}')
        if exception and db.session.is_active:
            app.logger.error(f'Exception during request teardown: {exception}')
            db.session.rollback()

    with app.app_context():
        from . import routes
        db.create_all()
    return app
