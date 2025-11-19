import os
import sys
import logging
import json
import argparse
from waitress import serve
import traceback

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
try:
    from backend.read_config import config
except ImportError:
    # Fallback to local config if backend.read_config is not available
    config = {
        "rag_port": 3013
    }

# Make current directory importable for direct script execution
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import the Flask app directly
from rag_routes import app as rag_app

# Default port
DEFAULT_PORT = 3013

def load_config():
    """Load configuration from config.json or use defaults"""
    try:
        # Get port from config or use default
        rag_port = config.get('rag_port', DEFAULT_PORT)
        return rag_port
    except Exception as e:
        logging.error(f"Error loading configuration: {str(e)}")
        return DEFAULT_PORT

def create_app():
    """Create and configure the Flask app"""
    # Register the RAG routes
    return rag_app

def setup_logging():
    """Set up logging configuration"""
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    log_file = os.path.join(log_dir, 'rag_server.log')
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='RAG Test Case Generator Server')
    parser.add_argument('--port', type=int, help='Port to run the server on')
    return parser.parse_args()

if __name__ == '__main__':
    # Parse command line arguments
    args = parse_arguments()
    
    # Set up logging
    setup_logging()
    logger = logging.getLogger('rag_server')
    
    # Load configuration
    port = args.port if args.port else load_config()
    
    # Create the application
    app = create_app()
    
    # Log startup information
    logger.info(f"Starting RAG Test Case Generator server on port {port}")
    
    try:
        # Run the application with Waitress
        serve(app, host="0.0.0.0", port=port)
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")
        logger.error(traceback.format_exc())
