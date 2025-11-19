from flask import Flask, request, jsonify, send_from_directory
import os
import sys
import tempfile
import pandas as pd
from werkzeug.utils import secure_filename
import traceback
import time
import threading
import logging
from flask_cors import CORS

# Ensure current directory is in path for absolute imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
# Import the service directly
from service import RAGTestCaseGenerator

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize RAG service
rag_service = None
rag_lock = threading.Lock()

def get_rag_service():
    """Get or create RAG service singleton"""
    global rag_service
    with rag_lock:
        if rag_service is None:
            try:
                # First try local config.json in rag directory
                local_config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
                # Then try backend config.json
                backend_config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend', 'config.json')
                
                if os.path.exists(local_config_path):
                    logger.info(f"Using local config: {local_config_path}")
                    rag_service = RAGTestCaseGenerator(local_config_path)
                elif os.path.exists(backend_config_path):
                    logger.info(f"Using backend config: {backend_config_path}")
                    rag_service = RAGTestCaseGenerator(backend_config_path)
                else:
                    logger.info("Using default config")
                    rag_service = RAGTestCaseGenerator()
                logger.info("RAG service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize RAG service: {str(e)}")
                logger.error(traceback.format_exc())
                raise
        return rag_service

# Create necessary directories
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads'), exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'generated'), exist_ok=True)

# Set up allowed file extensions
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.xlsx', '.txt', '.xls', '.xlsm'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/rag/corpus/upload', methods=['POST'])
def upload_corpus():
    """Upload test case corpus for training the RAG model"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        if not allowed_file(file.filename):
            return jsonify({"error": f"File type not allowed. Supported types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
        filename = secure_filename(file.filename)
        file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads', filename)
        file.save(file_path)
        
        # Get additional metadata from request
        description = request.form.get('description', f'Auto-uploaded from {filename}')
        tags = request.form.get('tags', '').split(',') if request.form.get('tags') else []
        tags = [tag.strip() for tag in tags if tag.strip()]
        
        # Prepare file info
        file_info = {
            "filename": filename,
            "file_size": os.path.getsize(file_path),
            "file_type": os.path.splitext(filename)[1].lower(),
            "description": description,
            "tags": tags,
            "source": "manual_upload"
        }
        
        # Process the corpus
        start_time = time.time()
        service = get_rag_service()
        documents, file_info = service.load_corpus(file_path, file_info)
        vector_store = service.create_vector_store(documents, file_info)
        processing_time = time.time() - start_time
        
        return jsonify({
            "message": "Corpus uploaded and processed successfully",
            "filename": filename,
            "document_count": len(documents),
            "test_case_count": file_info.get("test_case_count", 0),
            "processing_time": f"{processing_time:.2f} seconds"
        }), 200
    except Exception as e:
        app.logger.error(f"Error uploading corpus: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/inventory', methods=['GET'])
def get_inventory():
    """Get test case inventory"""
    try:
        service = get_rag_service()
        inventory = service.get_inventory()
        stats = service.get_vector_store_stats()
        
        return jsonify({
            "inventory": inventory,
            "stats": stats
        }), 200
    except Exception as e:
        app.logger.error(f"Error getting inventory: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/inventory/search', methods=['POST'])
def search_inventory():
    """Search inventory with filters"""
    try:
        data = request.get_json() or {}
        query = data.get('query', '')
        file_type = data.get('file_type', '')
        tags = data.get('tags', [])
        
        service = get_rag_service()
        results = service.search_inventory(query, file_type, tags)
        
        return jsonify({
            "results": results,
            "count": len(results)
        }), 200
    except Exception as e:
        app.logger.error(f"Error searching inventory: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/testcases/search', methods=['POST'])
def search_test_cases():
    """Search test cases in vector store"""
    try:
        data = request.get_json() or {}
        query = data.get('query', '')
        k = data.get('k', 5)
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        service = get_rag_service()
        results = service.search_test_cases(query, k)
        
        return jsonify({
            "results": results,
            "count": len(results),
            "query": query
        }), 200
    except Exception as e:
        app.logger.error(f"Error searching test cases: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/inventory/<upload_id>', methods=['DELETE'])
def delete_from_inventory(upload_id):
    """Delete upload from inventory"""
    try:
        service = get_rag_service()
        success = service.delete_from_inventory(upload_id)
        
        if success:
            return jsonify({"message": "Upload deleted from inventory successfully"}), 200
        else:
            return jsonify({"error": "Upload not found or could not be deleted"}), 404
    except Exception as e:
        app.logger.error(f"Error deleting from inventory: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/requirements/upload', methods=['POST'])
def upload_requirements():
    """Upload requirements document to generate test cases"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        if not allowed_file(file.filename):
            return jsonify({"error": f"File type not allowed. Supported types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
        filename = secure_filename(file.filename)
        file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads', filename)
        file.save(file_path)
        
        # Get vector reference parameters
        vector_reference = request.form.get('vector_reference', 'whole')
        specific_query = request.form.get('specific_query', '')
        selected_results = request.form.get('selected_results', '')
        
        # Parse selected results if provided
        selected_test_cases = []
        if vector_reference == 'specific' and selected_results:
            try:
                import json
                selected_test_cases = json.loads(selected_results)
            except json.JSONDecodeError:
                logger.warning("Failed to parse selected_results JSON")
        
        # Check if RAG model is needed and available
        service = get_rag_service()
        if vector_reference != 'none' and not service.load_vector_store():
            return jsonify({"error": "No trained RAG model found. Please upload corpus first or select 'No Vector Database Reference'."}), 400
        
        # Process the requirement and generate test cases
        start_time = time.time()
        output_path = service.process_requirement_file(
            file_path, 
            vector_reference=vector_reference,
            specific_query=specific_query,
            selected_test_cases=selected_test_cases
        )
        processing_time = time.time() - start_time
        
        # Get relative path for download
        output_filename = os.path.basename(output_path)
        
        return jsonify({
            "message": "Test cases generated successfully",
            "input_filename": filename,
            "output_filename": output_filename,
            "processing_time": f"{processing_time:.2f} seconds",
            "download_url": f"/api/rag/download/{output_filename}",
            "vector_reference": vector_reference,
            "selected_test_cases_count": len(selected_test_cases) if selected_test_cases else 0
        }), 200
    except Exception as e:
        app.logger.error(f"Error generating test cases: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download generated test cases file"""
    try:
        directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'generated')
        return send_from_directory(directory, filename, as_attachment=True)
    except Exception as e:
        app.logger.error(f"Error downloading file: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/status', methods=['GET'])
def rag_status():
    """Check RAG service status"""
    try:
        service = get_rag_service()
        has_vector_store = service.load_vector_store()
        
        return jsonify({
            "status": "ready" if has_vector_store else "not_trained",
            "message": "RAG service is ready" if has_vector_store else "RAG service needs training data"
        }), 200
    except Exception as e:
        app.logger.error(f"Error checking RAG status: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500
