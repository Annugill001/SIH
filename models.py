from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class CaseRecord(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    fir_no = Column(String, unique=True, index=True)
    station = Column(String)
    sections = Column(String)
    investigator = Column(String)
    badge = Column(String)
    accused = Column(String)
    complainant = Column(String)
    warrant_ref = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class VaultDocument(Base):
    __tablename__ = "vault_documents"
    id = Column(Integer, primary_key=True, index=True)
    fir_no = Column(String, index=True)
    doc_id = Column(String)
    name = Column(String)
    doc_type = Column(String)
    classification = Column(String)
    sha256_hash = Column(String)
    uploaded_by = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    file_path = Column(String, nullable=True)

class CustodyBlock(Base):
    __tablename__ = "custody_ledger"
    id = Column(Integer, primary_key=True, index=True)
    fir_no = Column(String, index=True)
    actor = Column(String)
    action = Column(String)
    detail = Column(Text)
    previous_hash = Column(String)
    current_hash = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)