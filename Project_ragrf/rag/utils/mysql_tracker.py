import os
import hashlib
import datetime
from pathlib import Path
import mysql.connector


class MySQLDocTracker:
    """Track documents stored in vector database using MySQL (RAG module).

    Uses table `testing_vector_document_inventory` and auto-creates it if missing.
    """

    def __init__(self):
        self.db_config = {
            'host': '10.239.43.100',
            'port': 3306,
            'user': 'root',
            'password': 'root',
            'database': 'cbpt_bsa_document_utility',
        }
        self.table_name = 'testing_vector_document_inventory'
        self.connection = None
        self.cursor = None

    def connect(self) -> bool:
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            self.cursor = self.connection.cursor(dictionary=True)
            self._ensure_table()
            return True
        except mysql.connector.Error as err:
            print(f"Database connection failed: {err}")
            return False

    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.connection and self.connection.is_connected():
            self.connection.close()

    def _ensure_table(self):
        """Create the table if it doesn't exist."""
        ddl = f"""
        CREATE TABLE IF NOT EXISTS {self.table_name} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            document_id VARCHAR(64) NOT NULL UNIQUE,
            file_path TEXT,
            file_name VARCHAR(512),
            file_size BIGINT,
            last_modified DATETIME,
            vector_dir TEXT,
            chunk_count INT,
            last_indexed DATETIME,
            embedding_model VARCHAR(128),
            hash_value VARCHAR(64)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
        self.cursor.execute(ddl)
        self.connection.commit()

    def generate_doc_id(self, file_path: str) -> str:
        p = Path(file_path)
        filename = p.name
        try:
            mod_time = os.path.getmtime(p)
            file_size = os.path.getsize(p)
        except (FileNotFoundError, OSError):
            mod_time = 0
            file_size = 0
        return hashlib.md5(f"{filename}_{mod_time}_{file_size}".encode()).hexdigest()

    def register_document(self, file_path: str, vector_dir: str, chunk_count: int,
                          embedding_model: str, content_hash: str | None = None) -> bool:
        if not self.connect():
            return False
        try:
            p = Path(file_path)
            doc_id = self.generate_doc_id(str(p))
            file_name = p.name
            file_size = os.path.getsize(p) if os.path.exists(p) else 0
            last_modified = datetime.datetime.fromtimestamp(os.path.getmtime(p)) if os.path.exists(p) else datetime.datetime.now()

            # Upsert behavior
            self.cursor.execute(
                f"SELECT id FROM {self.table_name} WHERE document_id = %s",
                (doc_id,)
            )
            existing = self.cursor.fetchone()

            if existing:
                self.cursor.execute(
                    f"""
                    UPDATE {self.table_name}
                    SET file_path=%s, file_name=%s, file_size=%s, last_modified=%s,
                        vector_dir=%s, chunk_count=%s, last_indexed=%s, embedding_model=%s, hash_value=%s
                    WHERE document_id=%s
                    """,
                    (
                        str(p), file_name, file_size, last_modified,
                        vector_dir, chunk_count, datetime.datetime.now(),
                        embedding_model, content_hash or doc_id, doc_id,
                    ),
                )
            else:
                self.cursor.execute(
                    f"""
                    INSERT INTO {self.table_name}
                    (document_id, file_path, file_name, file_size, last_modified,
                     vector_dir, chunk_count, last_indexed, embedding_model, hash_value)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    """,
                    (
                        doc_id, str(p), file_name, file_size, last_modified,
                        vector_dir, chunk_count, datetime.datetime.now(),
                        embedding_model, content_hash or doc_id,
                    ),
                )

            self.connection.commit()
            return True
        except mysql.connector.Error as err:
            print(f"Database operation failed: {err}")
            self.connection.rollback()
            return False
        finally:
            self.close()
