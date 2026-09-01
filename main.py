from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import hashlib, os, shutil
from datetime import datetime

from database import engine, Base, get_db
import models

Base.metadata.create_all(bind=engine)
os.makedirs("./uploads", exist_ok=True)

app = FastAPI(title="PRAMAAN Legal DMS Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/cases/register")
def register_case(
    fir_no: str = Form(...),
    station: str = Form(...),
    sections: str = Form(...),
    investigator: str = Form(...),
    badge: str = Form(...),
    accused: str = Form(...),
    complainant: str = Form(...),
    warrant_ref: str = Form(""),
    db: Session = Depends(get_db)
):
    existing = db.query(models.CaseRecord).filter(models.CaseRecord.fir_no == fir_no).first()
    if existing:
        return {"status": "EXISTS", "message": "Case already registered", "fir_no": fir_no}
    
    new_case = models.CaseRecord(
        fir_no=fir_no,
        station=station,
        sections=sections,
        investigator=investigator,
        badge=badge,
        accused=accused,
        complainant=complainant,
        warrant_ref=warrant_ref
    )
    db.add(new_case)
    db.commit()

    # Create Genesis Block for Case
    genesis_payload = f"0000000000000000|{datetime.utcnow().isoformat()}|{investigator}|Case Registered|{fir_no}"
    genesis_hash = hashlib.sha256(genesis_payload.encode()).hexdigest()
    
    genesis_block = models.CustodyBlock(
        fir_no=fir_no,
        actor=investigator,
        action="Case Registered & Initialized",
        detail=f"Registered under {sections} at {station}",
        previous_hash="0" * 64,
        current_hash=genesis_hash
    )
    db.add(genesis_block)
    db.commit()

    return {"status": "SUCCESS", "fir_no": fir_no}

@app.post("/api/vault/upload")
async def upload_document(
    fir_no: str = Form(...),
    doc_type: str = Form(...),
    classification: str = Form("Confidential"),
    actor: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    sha256_hash = hashlib.sha256(contents).hexdigest()
    
    file_path = f"./uploads/{fir_no.replace('/', '_')}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(contents)

    count = db.query(models.VaultDocument).filter(models.VaultDocument.fir_no == fir_no).count()
    doc_id = f"DOC-EXT-0{count + 1}"

    new_doc = models.VaultDocument(
        fir_no=fir_no,
        doc_id=doc_id,
        name=file.filename,
        doc_type=doc_type,
        classification=classification,
        sha256_hash=sha256_hash,
        uploaded_by=actor,
        file_path=file_path
    )
    db.add(new_doc)

    # Chained Audit Block
    last_block = db.query(models.CustodyBlock).filter(models.CustodyBlock.fir_no == fir_no).order_by(models.CustodyBlock.id.desc()).first()
    prev_hash = last_block.current_hash if last_block else "0" * 64
    
    block_payload = f"{prev_hash}|{datetime.utcnow().isoformat()}|{actor}|Document Upload|{file.filename}|{sha256_hash}"
    current_hash = hashlib.sha256(block_payload.encode()).hexdigest()

    block = models.CustodyBlock(
        fir_no=fir_no,
        actor=actor,
        action="Document Deposited & Sealed",
        detail=f"File [{file.filename}] locked with SHA-256 seal",
        previous_hash=prev_hash,
        current_hash=current_hash
    )
    db.add(block)
    db.commit()

    return {
        "status": "SUCCESS",
        "doc_id": doc_id,
        "name": file.filename,
        "hash": sha256_hash,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/cases/{fir_no}/records")
def get_case_records(fir_no: str, db: Session = Depends(get_db)):
    case = db.query(models.CaseRecord).filter(models.CaseRecord.fir_no == fir_no).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    docs = db.query(models.VaultDocument).filter(models.VaultDocument.fir_no == fir_no).all()
    custody = db.query(models.CustodyBlock).filter(models.CustodyBlock.fir_no == fir_no).all()

    return {"case": case, "documents": docs, "custody": custody}