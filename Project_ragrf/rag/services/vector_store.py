"""
Vector store service for managing FAISS vector database with inventory management
"""
import os
import json
import logging
import shutil
from typing import List, Optional, Dict, Any
from datetime import datetime
import pandas as pd
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from utils.mysql_tracker import MySQLDocTracker

logger = logging.getLogger(__name__)

# Ensure tiktoken uses offline cache early; also avoid its usage by forcing character length
try:
    _enc_cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "encoding_cache")
    os.makedirs(_enc_cache_dir, exist_ok=True)
    os.environ.setdefault('TIKTOKEN_CACHE_DIR', _enc_cache_dir)
except Exception:
    pass

class VectorStoreService:
    """Service for managing the FAISS vector store with inventory management"""
    
    def __init__(self, embeddings, config):
        """Initialize with embeddings and config"""
        self.embeddings = embeddings
        self.config = config
        self.vector_store = None
        self.logger = logging.getLogger(__name__)
        self.storage_dir = config["vectorstore"]["storage_dir"]
        self.inventory_file = os.path.join(self.storage_dir, "test_case_inventory.json")
        # Force a character-based splitter to prevent tiktoken usage
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=config["processing"]["chunk_size"],
            chunk_overlap=config["processing"]["chunk_overlap"],
            length_function=len,
        )
        
        # Ensure storage directory exists
        os.makedirs(self.storage_dir, exist_ok=True)
    
    def _load_inventory(self) -> Dict[str, Any]:
        """Load test case inventory from file"""
        try:
            if os.path.exists(self.inventory_file):
                with open(self.inventory_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {"uploads": [], "total_test_cases": 0, "last_updated": None}
        except Exception as e:
            self.logger.error(f"Error loading inventory: {str(e)}")
            return {"uploads": [], "total_test_cases": 0, "last_updated": None}
    
    def _save_inventory(self, inventory: Dict[str, Any]) -> bool:
        """Save test case inventory to file"""
        try:
            with open(self.inventory_file, 'w', encoding='utf-8') as f:
                json.dump(inventory, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            self.logger.error(f"Error saving inventory: {str(e)}")
            return False
    
    def add_to_inventory(self, file_info: Dict[str, Any]) -> bool:
        """Add uploaded file info to inventory"""
        try:
            inventory = self._load_inventory()
            
            upload_entry = {
                "id": f"upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "filename": file_info["filename"],
                "upload_date": datetime.now().isoformat(),
                "file_size": file_info.get("file_size", 0),
                "test_case_count": file_info.get("test_case_count", 0),
                "file_type": file_info.get("file_type", ""),
                "description": file_info.get("description", ""),
                "tags": file_info.get("tags", []),
                "source": file_info.get("source", "manual_upload")
            }
            
            inventory["uploads"].append(upload_entry)
            inventory["total_test_cases"] += file_info.get("test_case_count", 0)
            inventory["last_updated"] = datetime.now().isoformat()
            
            return self._save_inventory(inventory)
        except Exception as e:
            self.logger.error(f"Error adding to inventory: {str(e)}")
            return False
    
    def get_inventory(self) -> Dict[str, Any]:
        """Get current inventory"""
        return self._load_inventory()
    
    def search_inventory(self, query: str = "", file_type: str = "", tags: List[str] = None) -> List[Dict[str, Any]]:
        """Search inventory with filters"""
        try:
            inventory = self._load_inventory()
            uploads = inventory.get("uploads", [])
            
            if not query and not file_type and not tags:
                return uploads
            
            filtered_uploads = []
            query_lower = query.lower() if query else ""
            
            for upload in uploads:
                # Text search in filename and description
                if query_lower:
                    searchable_text = f"{upload.get('filename', '')} {upload.get('description', '')}".lower()
                    if query_lower not in searchable_text:
                        continue
                
                # File type filter
                if file_type and upload.get("file_type", "").lower() != file_type.lower():
                    continue
                
                # Tags filter
                if tags:
                    upload_tags = upload.get("tags", [])
                    if not any(tag in upload_tags for tag in tags):
                        continue
                
                filtered_uploads.append(upload)
            
            return filtered_uploads
        except Exception as e:
            self.logger.error(f"Error searching inventory: {str(e)}")
            return []
    
    def create_vector_store(self, documents: List[Document], file_info: Dict[str, Any] = None) -> bool:
        """Create a vector store from documents and update inventory"""
        try:
            # If this is the first upload, clean existing vector store
            inventory = self._load_inventory()
            if not inventory.get("uploads"):
                if os.path.exists(self.storage_dir):
                    # Only remove vector store files, keep inventory
                    for file in os.listdir(self.storage_dir):
                        if file != "test_case_inventory.json":
                            file_path = os.path.join(self.storage_dir, file)
                            if os.path.isfile(file_path):
                                os.remove(file_path)
                            elif os.path.isdir(file_path):
                                shutil.rmtree(file_path)
                
                # Split documents into chunks
                splits = self.text_splitter.split_documents(documents)
                
                if not splits:
                    self.logger.error("No document splits generated")
                    return False
                    
                # Create the vector store
                self.vector_store = FAISS.from_documents(splits, self.embeddings)
            else:
                # Add to existing vector store
                splits = self.text_splitter.split_documents(documents)
                
                if not splits:
                    self.logger.error("No document splits generated")
                    return False
                
                # Load existing vector store
                if not self.load_vector_store():
                    self.logger.error("Failed to load existing vector store")
                    return False
                
                # Add new documents
                self.vector_store.add_documents(splits)
            
            # Save the vector store
            self.vector_store.save_local(self.storage_dir)
            
            # Update inventory if file info provided
            if file_info:
                self.add_to_inventory(file_info)
            
            # Register document in MySQL tracking table if file info available
            try:
                if file_info and file_info.get("filename"):
                    tracker = MySQLDocTracker()
                    source_path = file_info.get("source_path") or file_info.get("source") or file_info.get("filename")
                    # Build absolute path if only filename was provided
                    if source_path and not os.path.isabs(source_path):
                        # uploads folder is one level up from rag module
                        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
                        source_path = os.path.join(uploads_dir, os.path.basename(source_path))
                    embedding_model = self.config["openai"]["embedding_deployment"]
                    tracker.register_document(
                        file_path=source_path,
                        vector_dir=self.storage_dir,
                        chunk_count=len(splits),
                        embedding_model=embedding_model,
                    )
            except Exception as e:
                self.logger.warning(f"MySQL tracking skipped due to error: {e}")

            self.logger.info(f"Vector store updated with {len(splits)} chunks")
            return True
            
        except Exception as e:
            self.logger.error(f"Error creating/updating vector store: {str(e)}")
            return False
    
    def load_vector_store(self) -> bool:
        """Load the vector store from disk"""
        try:
            if not os.path.exists(self.storage_dir):
                self.logger.warning("Vector store directory does not exist")
                return False
            
            # Check if vector store files exist
            faiss_files = [f for f in os.listdir(self.storage_dir) if f.endswith(('.faiss', '.pkl'))]
            if not faiss_files:
                self.logger.warning("No vector store files found")
                return False
                
            # Load the vector store
            self.vector_store = FAISS.load_local(
                self.storage_dir, 
                self.embeddings,
                allow_dangerous_deserialization=True  # Add this for newer versions
            )
            
            self.logger.info("Vector store loaded successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Error loading vector store: {str(e)}")
            return False
    
    def search_test_cases(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search test cases in vector store"""
        try:
            if not self.vector_store:
                if not self.load_vector_store():
                    self.logger.error("Failed to load vector store for search")
                    return []
            
            # Perform similarity search
            results = self.vector_store.similarity_search_with_score(query, k=k)
            
            search_results = []
            for doc, score in results:
                result = {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "similarity_score": float(score),
                    "source": doc.metadata.get("source", "unknown")
                }
                
                # Extract test case ID if available in content
                content_lines = doc.page_content.split('\n')
                for line in content_lines:
                    if line.strip().startswith('TEST CASE ID:'):
                        result["test_case_id"] = line.replace('TEST CASE ID:', '').strip()
                        break
                
                search_results.append(result)
            
            return search_results
            
        except Exception as e:
            self.logger.error(f"Error searching test cases: {str(e)}")
            return []
    
    def get_vector_store_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        try:
            if not self.vector_store:
                if not self.load_vector_store():
                    return {"document_count": 0, "is_ready": False}
            
            # Get document count (approximate)
            try:
                # FAISS doesn't directly provide document count, so we estimate
                index_size = self.vector_store.index.ntotal if hasattr(self.vector_store, 'index') else 0
            except:
                index_size = 0
            
            inventory = self._load_inventory()
            
            return {
                "document_count": index_size,
                "is_ready": True,
                "total_uploads": len(inventory.get("uploads", [])),
                "total_test_cases": inventory.get("total_test_cases", 0),
                "last_updated": inventory.get("last_updated")
            }
            
        except Exception as e:
            self.logger.error(f"Error getting vector store stats: {str(e)}")
            return {"document_count": 0, "is_ready": False}
    
    def delete_from_inventory(self, upload_id: str) -> bool:
        """Delete an upload from inventory (note: doesn't remove from vector store)"""
        try:
            inventory = self._load_inventory()
            uploads = inventory.get("uploads", [])
            
            # Find and remove the upload
            updated_uploads = [upload for upload in uploads if upload.get("id") != upload_id]
            
            if len(updated_uploads) == len(uploads):
                self.logger.warning(f"Upload with ID {upload_id} not found")
                return False
            
            # Update inventory
            removed_upload = next((upload for upload in uploads if upload.get("id") == upload_id), None)
            if removed_upload:
                inventory["total_test_cases"] -= removed_upload.get("test_case_count", 0)
            
            inventory["uploads"] = updated_uploads
            inventory["last_updated"] = datetime.now().isoformat()
            
            return self._save_inventory(inventory)
            
        except Exception as e:
            self.logger.error(f"Error deleting from inventory: {str(e)}")
            return False
    
    def get_retriever(self):
        """Get the retriever for the vector store"""
        if not self.vector_store:
            if not self.load_vector_store():
                self.logger.error("Failed to get retriever - vector store not loaded")
                return None
                
        return self.vector_store.as_retriever(
            search_kwargs={"k": self.config["vectorstore"]["k_results"]}
        )
