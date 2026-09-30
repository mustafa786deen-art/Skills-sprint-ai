"""
SkillSprint AI - Shared Document Storage Module
Migrated from volatile in-memory global list to SQLite persistence.

Why SQLite?
1. Eliminates state desynchronization between app.py, setup.py, and worker threads.
2. Persists extracted PDF/DOCX chunks across Flask dev-server restarts and hot-reloads.
3. Enforces structured traceability metadata (doc_id, page_number, section, heading).
"""

import os
import sqlite3
from typing import List, Dict, Any, Set

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "documents.db")

def get_connection() -> sqlite3.Connection:
    """Creates a thread-safe connection to the SQLite documents database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    """Initializes tables for documents and document chunks if they do not exist."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                doc_id TEXT PRIMARY KEY,
                filename TEXT,
                file_format TEXT,
                title TEXT,
                category TEXT,
                version TEXT,
                department TEXT,
                effective_date TEXT,
                precedence_order INTEGER DEFAULT 1,
                security_status TEXT DEFAULT 'Clean',
                status TEXT DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        for col_def in [
            "title TEXT", "category TEXT", "version TEXT", "department TEXT",
            "effective_date TEXT", "precedence_order INTEGER DEFAULT 1",
            "security_status TEXT DEFAULT 'Clean'", "status TEXT DEFAULT 'Active'"
        ]:
            try:
                cursor.execute(f"ALTER TABLE documents ADD COLUMN {col_def}")
            except sqlite3.OperationalError:
                pass

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id TEXT NOT NULL,
                text TEXT NOT NULL,
                page_number INTEGER,
                section TEXT,
                heading TEXT,
                filename TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (doc_id) REFERENCES documents (doc_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_requirements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id TEXT NOT NULL,
                requirement_id TEXT,
                requirement_text TEXT NOT NULL,
                mandatory INTEGER DEFAULT 1,
                requirement_type TEXT DEFAULT 'Policy Standard',
                source_reference TEXT,
                competency TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS role_requirements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_id TEXT NOT NULL,
                requirement_id TEXT,
                requirement TEXT NOT NULL,
                mandatory INTEGER DEFAULT 1,
                relevance TEXT DEFAULT 'High',
                competency TEXT DEFAULT 'Policy Compliance',
                procedure TEXT DEFAULT 'Standard Verification',
                prerequisite TEXT DEFAULT 'None',
                source_reference TEXT,
                doc_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

# Automatically ensure database schema exists upon module import
init_db()

def add_document(
    doc_id: str,
    filename: str = "",
    file_format: str = "",
    title: str = "",
    category: str = "SOP",
    version: str = "v1.0",
    department: str = "General",
    effective_date: str = "",
    precedence_order: int = 1,
    security_status: str = "Clean",
    status: str = "Active"
) -> None:
    """Registers or updates a document in the documents table."""
    clean_doc_id = doc_id.strip().upper()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents (
                doc_id, filename, file_format, title, category, version,
                department, effective_date, precedence_order, security_status, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(doc_id) DO UPDATE SET
                filename = excluded.filename,
                file_format = excluded.file_format,
                title = COALESCE(NULLIF(excluded.title, ''), documents.title),
                category = COALESCE(NULLIF(excluded.category, ''), documents.category),
                version = COALESCE(NULLIF(excluded.version, ''), documents.version),
                department = COALESCE(NULLIF(excluded.department, ''), documents.department),
                effective_date = COALESCE(NULLIF(excluded.effective_date, ''), documents.effective_date),
                precedence_order = excluded.precedence_order,
                security_status = excluded.security_status,
                status = excluded.status
        """, (
            clean_doc_id, filename, file_format, title or filename,
            category, version, department, effective_date, precedence_order,
            security_status, status
        ))
        conn.commit()

def add_chunk(
    doc_id: str,
    text: str,
    page_number: int = None,
    section: str = None,
    heading: str = None,
    filename: str = None,
    file_format: str = None
) -> None:
    """Stores an extracted text chunk with full traceability metadata."""
    clean_doc_id = doc_id.strip().upper()
    add_document(clean_doc_id, filename or "", file_format or "")
    
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO document_chunks (doc_id, text, page_number, section, heading, filename)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            clean_doc_id,
            text.strip(),
            page_number,
            section or (f"Page {page_number}" if page_number else "General"),
            heading or "General",
            filename or ""
        ))
        conn.commit()

def get_all_chunks() -> List[Dict[str, Any]]:
    """Retrieves all stored document chunks as dictionaries."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, doc_id, text, page_number, section, heading, filename, created_at
            FROM document_chunks
            ORDER BY id ASC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_all_doc_ids() -> Set[str]:
    """Returns the set of unique document IDs currently stored."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT doc_id FROM document_chunks")
        rows = cursor.fetchall()
        return {row["doc_id"] for row in rows}

def find_chunks(keyword: str) -> List[Dict[str, Any]]:
    """Simple keyword-based RAG search across stored chunk contents."""
    if not keyword:
        return get_all_chunks()

    pattern = f"%{keyword.strip().lower()}%"
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, doc_id, text, page_number, section, heading, filename, created_at
            FROM document_chunks
            WHERE LOWER(text) LIKE ? OR LOWER(heading) LIKE ? OR LOWER(doc_id) LIKE ?
            ORDER BY id ASC
        """, (pattern, pattern, pattern))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def count_chunks() -> int:
    """Returns the total number of document chunks in storage."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM document_chunks")
        row = cursor.fetchone()
        return row["cnt"] if row else 0

def clear_storage() -> None:
    """Clears all stored documents and chunks. Used for testing and resets."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM document_chunks")
        cursor.execute("DELETE FROM documents")
        conn.commit()

def get_documents_summary() -> List[Dict[str, Any]]:
    """Returns a summary of each stored document with metadata and chunk count."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.doc_id, d.filename, d.file_format, d.title, d.category, d.version,
                   d.department, d.effective_date, d.precedence_order, d.security_status,
                   d.status, d.created_at, COUNT(c.id) as chunk_count
            FROM documents d
            LEFT JOIN document_chunks c ON d.doc_id = c.doc_id
            GROUP BY d.doc_id, d.filename, d.file_format, d.title, d.category, d.version,
                     d.department, d.effective_date, d.precedence_order, d.security_status, d.status, d.created_at
            ORDER BY d.created_at DESC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def add_document_requirement(
    doc_id: str,
    requirement_text: str,
    requirement_id: str = None,
    mandatory: bool = True,
    requirement_type: str = "Policy Standard",
    source_reference: str = "General",
    competency: str = "Compliance"
) -> None:
    """Stores extracted requirement for a document."""
    clean_doc_id = doc_id.strip().upper()
    req_code = requirement_id or f"REQ-{clean_doc_id}-001"
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO document_requirements (
                doc_id, requirement_id, requirement_text, mandatory, requirement_type, source_reference, competency
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (clean_doc_id, req_code, requirement_text, 1 if mandatory else 0, requirement_type, source_reference, competency))
        conn.commit()


def get_document_requirements(doc_id: str) -> List[Dict[str, Any]]:
    """Retrieves all requirements extracted for a document."""
    clean_doc_id = doc_id.strip().upper()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, doc_id, requirement_id, requirement_text, mandatory, requirement_type, source_reference, competency, created_at
            FROM document_requirements
            WHERE UPPER(doc_id) = ?
            ORDER BY id ASC
        """, (clean_doc_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def add_role_requirement(
    role_id: str,
    requirement: str,
    requirement_id: str = None,
    mandatory: bool = True,
    relevance: str = "High",
    competency: str = "Policy Compliance",
    procedure: str = "Standard Verification",
    prerequisite: str = "None",
    source_reference: str = "SOP-07 §1.0",
    doc_id: str = "SOP-07"
) -> None:
    """Registers a requirement mapping in the role matrix."""
    clean_role_id = role_id.strip()
    req_code = requirement_id or f"R001"
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO role_requirements (
                role_id, requirement_id, requirement, mandatory, relevance, competency, procedure, prerequisite, source_reference, doc_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (clean_role_id, req_code, requirement, 1 if mandatory else 0, relevance, competency, procedure, prerequisite, source_reference, doc_id))
        conn.commit()


def get_role_requirements(role_id: str) -> List[Dict[str, Any]]:
    """Retrieves all requirements mapped to a specific role ID."""
    clean_role_id = role_id.strip().lower()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, role_id, requirement_id, requirement, mandatory, relevance, competency, procedure, prerequisite, source_reference, doc_id, created_at
            FROM role_requirements
            WHERE LOWER(role_id) = ? OR LOWER(role_id) = ?
            ORDER BY id ASC
        """, (clean_role_id, clean_role_id.replace(" ", "-")))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
