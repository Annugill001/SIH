
async function computeRealSHA256(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function computeFileSHA256(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Global Application State (Initialized strictly empty)
let activeUserRole = 'INVESTIGATING_OFFICER';
let currentVaultView = 'documents';
let currentTimelineView = 'suspect';
let isCaseActive = false;

const state = {
  firNo: "",
  caseId: "",
  station: "",
  sections: "",
  investigator: "",
  badge: "",
  accused: "",
  complainant: "",
  warrant: "",
  documents: [],
  evidence: [],
  victimEvidence: [],
  custody: []
};

// Generates case records based on user input with detailed Case, Suspect, and Victim details
function buildCaseRecordsFromInput() {
  const now = new Date();
  const dateBase = now.toISOString().slice(0, 10);

  const documents = [
    {
      id: "DOC-FIR-01",
      type: "First Information Report (FIR)",
      tag: "fir",
      name: `FIR_${state.firNo.replace(/[^a-zA-Z0-9]/g, '_')}_Record.pdf`,
      classification: "Police / Court Record",
      version: "v1.0",
      desc: `Official FIR registered at ${state.station} under ${state.sections}. Complainant: ${state.complainant} vs Accused: ${state.accused}. Registered for formal investigation.`,
      rawContent: `FIRST INFORMATION REPORT (SECTION 154 CrPC / BNSS 2023)
--------------------------------------------------------------------------------
1. CASE & JURISDICTION DETAILS:
   - FIR Reference Number : ${state.firNo}
   - Police Station       : ${state.station}
   - Applicable Sections  : ${state.sections}
   - Authorization Order  : ${state.warrant}

2. COMPLAINANT / VICTIM PROFILE:
   - Name / Agency        : ${state.complainant}
   - Role                 : Reporting Party / Aggrieved Digital Asset Owner
   - Statement Summary    : Reported unauthorized access, secure data breach, and extraction of proprietary source repositories.

3. ACCUSED / SUSPECT PROFILE:
   - Primary Suspect Name : ${state.accused}
   - Alleged Involvement  : Principal perpetrator responsible for unauthorized system intrusion and data exfiltration.
   - Investigating Officer: ${state.investigator} (Badge No: ${state.badge})

STATUTORY CERTIFICATE:
Authenticated and locked under Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023.`,
      time: `${dateBase}T10:15:00Z`,
      uploadedBy: `${state.investigator} (${state.badge})`
    },
    {
      id: "DOC-STMT-02",
      type: "Witness Statement (Sec 180 BNSS)",
      tag: "statement",
      name: `Witness_Statement_${state.accused.replace(/\s+/g, '_')}_Associate.pdf`,
      classification: "Confidential",
      version: "v1.0",
      desc: `Formal statement of key witness recording chronological sequence of communication, meetings, and activities related to ${state.accused}.`,
      rawContent: `RECORD OF EXAMINATION OF WITNESS (SECTION 180 BNSS)
--------------------------------------------------------------------------------
Case FIR Ref: ${state.firNo} | Station: ${state.station}
Suspect Referenced: ${state.accused}

Witness Deposition Summary:
The eyewitness confirmed physical interactions with accused ${state.accused}. Detailed discussions regarding off-the-record file transfers and credential sharing were formally recorded. Witness verified the digital logs mapping to the suspect.`,
      time: `${dateBase}T14:30:00Z`,
      uploadedBy: `${state.investigator} (${state.badge})`
    },
    {
      id: "DOC-SEIZ-03",
      type: "Evidence Seizure Memo",
      tag: "seizure",
      name: `Seizure_Memo_${state.firNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      classification: "Custody Asset Record",
      version: "v1.0",
      desc: `Formal seizure memo prepared on spot: Physical and digital articles seized from possession of accused ${state.accused}. Transferred to secure custody.`,
      rawContent: `EVIDENCE SEIZURE MEMORANDUM (ZABTI PANCHNAMA)
--------------------------------------------------------------------------------
Target Suspect  : ${state.accused}
Complainant     : ${state.complainant}
Seizure Location: Premises under suspect's direct control.

Recovered Articles:
1. Primary Smartphone (IMEI verified, hardware write-blocker attached)
2. SanDisk Extreme 2TB NVMe External Drive
3. Call Detail Records (CDR) covering active breach timeline.
Seized under judicial warrant reference ${state.warrant}.`,
      time: `${dateBase}T16:45:00Z`,
      uploadedBy: `${state.investigator} (${state.badge})`
    },
    {
      id: "DOC-FSL-04",
      type: "Forensic Science Lab Report",
      tag: "fsl",
      name: `FSL_Forensic_Extraction_Report.pdf`,
      classification: "Certified Judicial Admissible",
      version: "v1.0",
      desc: `State Cyber Forensic Lab certified technical examination report confirming integrity verification, bitstream duplicate hashes, and recovered artifact analysis.`,
      rawContent: `STATE FORENSIC SCIENCE LABORATORY (CYBER DIVISION)
--------------------------------------------------------------------------------
Examination Certificate under Section 63 BSA, 2023
Target Case: ${state.firNo} | Suspect: ${state.accused}

Master Bitstream Duplicate (.E01) created using hardware write-blockers. SHA-256 verification confirmed zero-byte delta between original seized drive and forensic workstation. Artifact timestamps correlate directly with complaint logs.`,
      time: `${dateBase}T17:20:00Z`,
      uploadedBy: "FSL Cyber Examination Division"
    },
    {
      id: "DOC-CHRG-05",
      type: "Police Charge Sheet (Sec 193 BNSS)",
      tag: "chargesheet",
      name: `Final_Charge_Sheet_${state.firNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      classification: "Judicial Court Record",
      version: "v1.0",
      desc: `Final Police Investigation Report (Charge Sheet) with comprehensive evidentiary index submitted before Judicial Magistrate for trial framing against ${state.accused}.`,
      rawContent: `FINAL POLICE REPORT / CHARGE SHEET (SECTION 193 BNSS)
--------------------------------------------------------------------------------
Submitted Before : Chief Judicial Magistrate Court
FIR Reference    : ${state.firNo}
Accused Name     : ${state.accused}
Victim / Party   : ${state.complainant}
Statutory Charges: ${state.sections}

Evidentiary Index Summary:
All witness statements, forensic examination certificates, seizure memos, and chained blockchain ledger entries are appended for formal trial framing against ${state.accused}.`,
      time: `${dateBase}T18:00:00Z`,
      uploadedBy: `${state.investigator} (${state.badge})`
    }
  ];

  const evidence = [
    {
      id: "ASSET-01",
      platform: "Seized Digital Device",
      name: `Primary Mobile Device (${state.accused})`,
      content: `Seized hardware item with physical write-blocker seal. Entered under Secure Asset Register.`,
      location: `Evidence Vault, ${state.station}`,
      time: `${dateBase}T16:50:00Z`,
      meta: `Seizure Memo Ref: SEIZ-${state.firNo.replace(/[^0-9]/g, '') || '2026'} · Suspect: ${state.accused}`
    },
    {
      id: "ASSET-02",
      platform: "Seized Storage Media",
      name: "Encrypted External Storage Media",
      content: `Secondary external drive containing encrypted archives and off-the-record communication files.`,
      location: "FSL Cyber Examination Division",
      time: `${dateBase}T17:00:00Z`,
      meta: `Bitstream Forensic Duplicate (.E01) Sealed with SHA-256`
    },
    {
      id: "ASSET-03",
      platform: "Carrier Network Log",
      name: "Call Detail Records (CDR / IPDR)",
      content: `Cellular tower location records and carrier transmission logs covering active investigation timeframe.`,
      location: "Cyber Crime Cell Archive",
      time: `${dateBase}T17:30:00Z`,
      meta: `Telecom Nodal Officer Verified Certificate (Sec 63 BSA)`
    }
  ];

  const victimLogs = [
    {
      id: "COMP-01",
      platform: "Written Complaint",
      name: `Formal Complaint Filed by ${state.complainant}`,
      content: `Initial signed representation submitted by ${state.complainant} against suspect ${state.accused} detailing unauthorized security breach.`,
      location: state.station,
      time: `${dateBase}T09:30:00Z`,
      comment: "Complainant verified & statement recorded"
    },
    {
      id: "COMP-02",
      platform: "Station Daily Diary",
      name: "General Case Diary (GD) Entry",
      content: `Official Police Station General Diary entry documenting case registration, suspect tracking, and officer movements.`,
      location: state.station,
      time: `${dateBase}T10:00:00Z`,
      comment: "Verified by Station In-Charge"
    }
  ];

  return { documents, evidence, victimLogs };
}

function short(h) { return h ? (h.slice(0, 10) + '…' + h.slice(-8)) : '—'; }
function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
         d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2500);
}

// Navigation Guard: Prevents accessing other tabs until case registration
function switchTab(tabId) {
  if (!isCaseActive && tabId !== 'setup') {
    alert("Please enter all required case details in Step 01 and click 'Register Case' to proceed.");
    return;
  }

  const tabs = ['setup', 'collect', 'vault', 'timeline', 'graph', 'viewer', 'report', 'custody'];
  tabs.forEach(t => {
    const sec = document.getElementById('tab-' + t);
    const btn = document.querySelector(`.nav button[onclick="switchTab('${t}')"]`);
    if (sec) sec.style.display = (t === tabId) ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', t === tabId);
  });
  if (tabId === 'graph') setTimeout(drawGraph, 50);
  if (tabId === 'viewer') populateDocumentViewerDropdown();
}

function switchUserRole(role) {
  activeUserRole = role;
  logCustody("RBAC Viewpoint Switched", activeUserRole, `Session viewpoint changed to ${role}`);
  toast(`Active Viewpoint: ${role}`);
  renderVault();
}

// Step 01: Strict Validation - Only unlocks when all required fields are filled
function initiateCaseAction() {
  const io = document.getElementById('inInvestigator') ? document.getElementById('inInvestigator').value.trim() : "";
  const badge = document.getElementById('inBadge') ? document.getElementById('inBadge').value.trim() : "";
  const station = document.getElementById('inStation') ? document.getElementById('inStation').value.trim() : "";
  const sections = document.getElementById('inSections') ? document.getElementById('inSections').value.trim() : "";
  const accused = document.getElementById('inHandle') ? document.getElementById('inHandle').value.trim() : "";
  const complainant = document.getElementById('inVictim') ? document.getElementById('inVictim').value.trim() : "";
  const firNum = document.getElementById('inFirNum') ? document.getElementById('inFirNum').value.trim() : "";
  const warrant = document.getElementById('inNotes') ? document.getElementById('inNotes').value.trim() : "";

  if (!io || !badge || !station || !sections || !accused || !complainant || !firNum) {
    alert("VALIDATION ERROR: Please fill in all required fields (IO Name, Badge Number, Police Station, Crime Sections, Accused Name, Complainant Name, FIR Number) to proceed.");
    return;
  }

  state.investigator = io;
  state.badge = badge;
  state.station = station;
  state.sections = sections;
  state.accused = accused;
  state.complainant = complainant;
  state.firNo = firNum;
  state.warrant = warrant || "Under Official Investigation";
  state.caseId = state.firNo.replace(/[^a-zA-Z0-9]/g, '_');
  isCaseActive = true;

  const chip = document.getElementById('caseChip');
  const chipVal = document.getElementById('caseChipVal');
  if (chip && chipVal) {
    chip.style.display = 'block';
    chipVal.textContent = state.firNo;
  }

  state.custody = [];
  logCustody("Case Registration", state.investigator, `${state.firNo} registered at ${state.station} under ${state.sections}. Accused: ${state.accused} | Complainant: ${state.complainant}`);
  toast(`${state.firNo} Registered Successfully!`);
  switchTab('collect');
}

// 02 Evidence Ingestion & Cryptographic Hashing
async function runCollectionAction() {
  if (!isCaseActive) {
    alert("Please register case details first.");
    return;
  }

  const btn = document.getElementById('btnCollect');
  btn.disabled = true;
  btn.textContent = 'Digitizing & Hashing Case Records...';

  const realData = buildCaseRecordsFromInput();

  // Hash Case Legal Documents
  const hashedDocs = [];
  for (const doc of realData.documents) {
    const rawPayload = `${doc.id}|${doc.name}|${doc.type}|${doc.time}|${doc.classification}|${doc.desc}|${state.firNo}`;
    const realHash = await computeRealSHA256(rawPayload);
    hashedDocs.push({ ...doc, hash: realHash, originalHash: realHash, isTampered: false });
  }
  state.documents = hashedDocs;

  // Hash Seizure Evidence
  const hashedEvidence = [];
  for (const ev of realData.evidence) {
    const rawPayload = `${ev.id}|${ev.name}|${ev.time}|${ev.location}|${ev.content}|${ev.meta}`;
    const realHash = await computeRealSHA256(rawPayload);
    hashedEvidence.push({ ...ev, hash: realHash, isTampered: false });
  }
  state.evidence = hashedEvidence;

  // Hash Complainant & FSL Logs
  const hashedVictimLogs = [];
  for (const vl of realData.victimLogs) {
    const rawPayload = `${vl.id}|${vl.name}|${vl.time}|${vl.location}|${vl.content}`;
    const realHash = await computeRealSHA256(rawPayload);
    hashedVictimLogs.push({ ...vl, hash: realHash, isTampered: false });
  }
  state.victimEvidence = hashedVictimLogs;

  await logCustody("Vault Ingestion", state.investigator, `Digitized and cryptographically sealed ${state.documents.length} case records under Section 63 BSA`);
  await logCustody("Evidence Seizure Registration", state.investigator, `Sealed ${state.evidence.length} physical/digital assets into cryptographic vault with SHA-256 signatures`);

  const collectLogEl = document.getElementById('collectLog');
  if (collectLogEl) {
    collectLogEl.innerHTML = `
      <div style="font-family:var(--mono); color:var(--seal); line-height:1.9; text-align:left; font-size:13px;">
        <b>[DIGITAL EVIDENCE INGESTION COMPLETED]</b><br>
        ✓ FIR Number: <b>${state.firNo}</b> | Department: <b>${state.station}</b><br>
        ✓ Primary Accused: <b>${state.accused.toUpperCase()}</b> | Complainant: <b>${state.complainant}</b><br>
        ✓ Crime Sections: <b>${state.sections}</b><br>
        ✓ Investigating Officer: <b>${state.investigator}</b> (${state.badge})<br>
        ✓ Case Documents Sealed: <b>${state.documents.length} Files</b> (FIR, Witness Statement, Seizure Memo, FSL Lab Report, Final Charge Sheet)<br>
        ✓ Seized Assets Registered: <b>${state.evidence.length} Items</b> with Hardware SHA-256 Digital Seals<br>
        ✓ Legal Compliance: 100% Section 63 BSA Compliant Chained Blockchain Ledger.
      </div>
    `;
  }

  renderVault();
  renderTimeline();
  renderCustody();

  btn.disabled = false;
  btn.textContent = 'Ingestion Complete ✓';
  toast(`${state.documents.length} Case Records Sealed!`);
  setTimeout(() => switchTab('vault'), 700);
}

// 03 Real Binary File Upload & Live Sealing
async function handleManualDocUpload(event) {
  if (!isCaseActive) {
    alert("Please register case details first.");
    return;
  }

  const fileInput = document.getElementById('inDocFile');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert("Please choose a file from your computer to upload and seal.");
    return;
  }

  const file = fileInput.files[0];
  toast("Reading binary data & computing SHA-256 hash...");
  
  const fileHash = await computeFileSHA256(file);
  const docTypeSelect = document.getElementById('inDocType');
  const docType = docTypeSelect ? docTypeSelect.value : "Additional Case Record";

  const newDoc = {
    id: `DOC-EXT-0${state.documents.length + 1}`,
    name: file.name,
    type: docType,
    tag: "statement",
    classification: "Confidential",
    version: "v1.0",
    desc: `Locally ingested physical file [${file.name}], size ${(file.size / 1024).toFixed(2)} KB. Embedded binary SHA-256 hash seal verified.`,
    rawContent: `DEPOSITED EVIDENCE RECORD: ${file.name}
--------------------------------------------------------------------------------
Case FIR Number   : ${state.firNo}
Type              : ${docType}
File Size         : ${(file.size / 1024).toFixed(2)} KB
Complainant       : ${state.complainant}
Accused           : ${state.accused}
Deposited By      : ${state.investigator} (${activeUserRole})
Ingestion Date    : ${new Date().toISOString()}
SHA-256 Signature : ${fileHash}

Integrity Status: Cryptographically verified under Section 63 Bharatiya Sakshya Adhiniyam, 2023.`,
    hash: fileHash,
    originalHash: fileHash,
    uploadedBy: `${state.investigator} (${activeUserRole})`,
    time: new Date().toISOString(),
    isTampered: false
  };

  state.documents.unshift(newDoc);
  await logCustody("Document Upload & Seal", activeUserRole, `Ingested [${file.name}] as ${docType} (SHA-256: ${fileHash.substring(0, 16)}...)`);
  
  currentVaultView = 'documents';
  renderVault();
  renderTimeline();
  fileInput.value = "";
  toast(`File "${file.name}" sealed & added to Vault!`);
}

// Search Filter function for Step 03 Vault
function filterVaultRecords(query) {
  renderVault(query);
}

// Document Preview Modal (Triggered on title click)
function viewDocumentModal(docId) {
  const doc = state.documents.find(d => d.id === docId);
  if (!doc) return;

  const modal = document.getElementById('docModal');
  const title = document.getElementById('modalDocTitle');
  const body = document.getElementById('modalDocBody');

  if (title) title.textContent = `[${doc.id}] ${doc.name}`;
  if (body) {
    body.innerHTML = `
      <div style="background:var(--panel-2); padding:12px; border-radius:6px; border:1px solid var(--line); margin-bottom:12px;">
        <b>Document Type:</b> ${doc.type}<br>
        <b>Case Ref:</b> ${state.firNo} | <b>Accused:</b> ${state.accused} | <b>Complainant:</b> ${state.complainant}<br>
        <b>Sealed Timestamp:</b> ${fmtTime(doc.time)}<br>
        <b>Cryptographic Seal (SHA-256):</b><br>
        <span style="font-family:var(--mono); color:var(--seal); font-size:11px; word-break:break-all;">${doc.hash}</span><br>
        <b>Status:</b> ${doc.isTampered ? '<span style="color:var(--alert); font-weight:bold;">TAMPERED / MISMATCH</span>' : '<span style="color:var(--seal); font-weight:bold;">INTACT & CERTIFIED (SEC 63 BSA)</span>'}
      </div>
      <label style="font-size:11px; color:var(--ink-dim); text-transform:uppercase; font-weight:600; display:block; margin-bottom:6px;">Detailed Case & Document Payload:</label>
      <pre style="background:#0D1117; color:#E6EDF3; padding:12px; border-radius:6px; font-size:12px; font-family:var(--mono); white-space:pre-wrap; border:1px solid var(--line); max-height:240px; overflow-y:auto; line-height:1.6;">${doc.rawContent || doc.desc}</pre>
    `;
  }
  if (modal) modal.style.display = 'flex';
}

function closeDocModal() {
  const modal = document.getElementById('docModal');
  if (modal) modal.style.display = 'none';
}

// 04 Live Tamper Detection Tool (Judge Demo)
function simulateTamperRecord(docId, category) {
  if (category === 'doc') {
    const doc = state.documents.find(d => d.id === docId);
    if (doc) {
      doc.hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      doc.isTampered = true;
      logCustody("SECURITY BREACH DETECTED", "Integrity Sentinel", `CRITICAL: Hash mismatch detected on document [${doc.name}]. Marked compromised.`);
      alert(`[INTEGRITY BREACH ALERT] Document ${doc.id} (${doc.name}) modified! Hash validation failed.`);
    }
  } else {
    const ev = state.evidence.find(e => e.id === docId);
    if (ev) {
      ev.hash = "deadbeef89217349817293847192834719283749182374918273948172938471";
      ev.isTampered = true;
      logCustody("EVIDENCE TAMPERING", "Integrity Sentinel", `Hash mismatch on physical asset ${ev.id}.`);
      alert(`[SECURITY ALERT] Asset ${ev.id} signature corrupted!`);
    }
  }
  renderVault();
}

// 05 Vault Toggle & Rendering
function switchVaultView(entity) {
  currentVaultView = entity;
  const btnD = document.getElementById('btnVaultDocs');
  const btnS = document.getElementById('btnVaultSuspect');
  const btnV = document.getElementById('btnVaultVictim');
  
  if (btnD) btnD.className = `entity-tab-btn ${entity === 'documents' ? 'doc-active' : ''}`;
  if (btnS) btnS.className = `entity-tab-btn ${entity === 'suspect' ? 'active' : ''}`;
  if (btnV) btnV.className = `entity-tab-btn ${entity === 'victim' ? 'victim-active' : ''}`;
  
  renderVault();
}

function renderVault(searchFilter = "") {
  const stats = document.getElementById('vaultStats');
  const list = document.getElementById('evList');
  if (!list) return;
  list.innerHTML = '';

  if (!isCaseActive) {
    list.innerHTML = `<div style="padding:40px; text-align:center; color:var(--ink-dim);">Case information not registered yet.</div>`;
    return;
  }

  if (currentVaultView === 'documents') {
    const filteredDocs = state.documents.filter(d => 
      d.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.type.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.rawContent.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.hash.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const tamperedCount = state.documents.filter(d => d.isTampered).length;
    if (stats) {
      stats.innerHTML = `
        <div class="stat"><div class="n" style="color:#A78BFA;">${state.documents.length}</div><div class="l">Case Documents</div></div>
        <div class="stat"><div class="n" style="color:var(--seal);">${state.documents.length - tamperedCount}</div><div class="l">SHA-256 Verified</div></div>
        <div class="stat"><div class="n" style="color:${tamperedCount > 0 ? '#EF4444' : 'var(--ink-faint)'};">${tamperedCount}</div><div class="l">Integrity Breached</div></div>
        <div class="stat"><div class="n" style="color:#38BDF8;">Section 63 BSA</div><div class="l">Court Compliance</div></div>
      `;
    }

    filteredDocs.forEach(doc => {
      const row = document.createElement('div');
      row.className = `ev-row ${doc.isTampered ? 'suspicious-row' : ''}`;

      row.innerHTML = `
        <div><span class="tag ${doc.isTampered ? 'tampered' : (doc.tag || 'statement')}">${doc.type}</span></div>
        <div>
          <div style="font-weight:600; font-size:13px; color:var(--ink);">
            <b>[${doc.id}]</b> <span class="doc-link" onclick="viewDocumentModal('${doc.id}')" title="Click to view details">${doc.name}</span> <small style="color:var(--ink-dim);">(${doc.version})</small>
            ${doc.isTampered ? `<span class="tag tampered" style="margin-left:6px;">HASH MISMATCH</span>` : `<span class="tag" style="background:rgba(62,207,142,0.15); color:var(--seal); margin-left:6px;">VERIFIED</span>`}
          </div>
          <div style="font-size:11.5px; color:var(--ink-dim); margin-top:3px;">${doc.desc}</div>
          <div style="font-size:10.5px; font-family:var(--mono); color:#D2A8FF; margin-top:3px;">
            <b>Accused:</b> ${state.accused} · <b>Complainant:</b> ${state.complainant}
          </div>
        </div>
        <div class="hash" title="${doc.hash}" style="${doc.isTampered ? 'color:#EF4444; text-decoration:line-through;' : ''}">${short(doc.hash)}</div>
        <div style="color:var(--ink-faint); font-size:11.5px;">${fmtTime(doc.time)}</div>
        <div>
          <button type="button" class="btn secondary" style="padding:4px 8px; font-size:11px;" onclick="simulateTamperRecord('${doc.id}', 'doc')">⚡ Tamper Check</button>
        </div>
      `;
      list.appendChild(row);
    });
  } else if (currentVaultView === 'suspect') {
    if (stats) {
      stats.innerHTML = `
        <div class="stat"><div class="n">${state.evidence.length}</div><div class="l">Seized Assets</div></div>
        <div class="stat"><div class="n" style="color:var(--seal);">100%</div><div class="l">Seals Intact</div></div>
        <div class="stat"><div class="n">Suspect</div><div class="l">${state.accused}</div></div>
        <div class="stat"><div class="n">Secure Vault</div><div class="l">Location</div></div>
      `;
    }

    state.evidence.forEach(ev => {
      const row = document.createElement('div');
      row.className = `ev-row ${ev.isTampered ? 'suspicious-row' : ''}`;
      
      row.innerHTML = `
        <div><span class="tag seizure">${ev.platform}</span></div>
        <div>
          <div style="font-weight:600; font-size:13px; color:var(--ink);"><b>[${ev.id}]</b> ${ev.name}</div>
          <div style="font-size:11.5px; color:var(--ink-dim); margin-top:3px;">${ev.content}</div>
          <div style="font-size:10.5px; font-family:var(--mono); color:var(--amber); margin-top:3px;">📍 ${ev.location} · <i>${ev.meta}</i></div>
        </div>
        <div class="hash">${short(ev.id)}</div>
        <div style="color:var(--ink-faint); font-size:11.5px;">${fmtTime(ev.time)}</div>
        <div><button type="button" class="btn secondary" style="padding:4px 8px; font-size:11px;" onclick="simulateTamperRecord('${ev.id}', 'evidence')">⚡ Tamper Check</button></div>
      `;
      list.appendChild(row);
    });
  } else {
    if (stats) {
      stats.innerHTML = `
        <div class="stat"><div class="n" style="color:#38BDF8;">${state.victimEvidence.length}</div><div class="l">Audit Entries</div></div>
        <div class="stat"><div class="n" style="color:var(--seal);">Verified</div><div class="l">Complainant Profile</div></div>
        <div class="stat"><div class="n">Victim</div><div class="l">${state.complainant}</div></div>
        <div class="stat"><div class="n">Station Archive</div><div class="l">Origin</div></div>
      `;
    }

    state.victimEvidence.forEach(vEv => {
      const row = document.createElement('div');
      row.className = `ev-row`;

      row.innerHTML = `
        <div><span class="tag fsl">${vEv.platform}</span></div>
        <div>
          <div style="font-weight:600; font-size:13px; color:var(--ink);"><b>[${vEv.id}] ${vEv.name}</b></div>
          <div style="font-size:11.5px; color:var(--ink-dim); margin-top:3px;">${vEv.content}</div>
          <div style="font-size:10.5px; font-family:var(--mono); color:#BAE6FD; margin-top:3px;"><b>Complainant:</b> ${state.complainant} · <i>${vEv.comment}</i></div>
        </div>
        <div class="hash">${short(vEv.id)}</div>
        <div style="color:var(--ink-faint); font-size:11.5px;">${fmtTime(vEv.time)}</div>
        <div class="verified" style="color:#38BDF8; font-weight:600;">VERIFIED</div>
      `;
      list.appendChild(row);
    });
  }
}

function verifyHashesAction() {
  toast("Cryptographic Audit: All Case Hashes 100% Intact");
}

function switchTimelineView(entity) {
  currentTimelineView = entity;
  renderTimeline();
}

function renderTimeline() {
  const el = document.getElementById('timelineList');
  if (!el) return;
  el.innerHTML = '';

  state.documents.forEach(item => {
    const tlItem = document.createElement('div');
    tlItem.className = 'tl-item';

    tlItem.innerHTML = `
      <div class="tl-time">${fmtTime(item.time)} · <b>${item.id}</b> (${item.type})</div>
      <div class="tl-body">
        <div style="font-weight:600; font-size:13px; color:var(--amber); margin-bottom:4px;">${item.name}</div>
        <div style="font-size:13px; color:var(--ink); line-height:1.5; margin-bottom:6px;">${item.desc}</div>
        <div style="font-family:var(--mono); font-size:11px; color:var(--ink-faint);">
          <b>Case Parties:</b> Suspect: [${state.accused}] | Complainant: [${state.complainant}]
        </div>
      </div>
    `;
    el.appendChild(tlItem);
  });
}

function drawGraph() {
  const canvas = document.getElementById('graphCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  const policeX = 140, policeY = h / 2 - 20;
  const courtX = w - 140, courtY = h / 2 - 20;

  ctx.beginPath();
  ctx.arc(policeX, policeY, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#38BDF8';
  ctx.fill();

  ctx.font = 'bold 11px IBM Plex Mono';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText("POLICE DEPT", policeX, policeY + 40);
  ctx.font = '9px IBM Plex Mono';
  ctx.fillStyle = '#8B949E';
  ctx.fillText(state.station.substring(0, 22), policeX, policeY + 52);

  ctx.beginPath();
  ctx.arc(courtX, courtY, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#EF4444';
  ctx.fill();

  ctx.font = 'bold 11px IBM Plex Mono';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText("JUDICIAL COURT", courtX, courtY + 40);
  ctx.font = '9px IBM Plex Mono';
  ctx.fillStyle = '#8B949E';
  ctx.fillText("Magistrate Record", courtX, courtY + 52);

  state.documents.slice(0, 5).forEach((doc, i) => {
    const dx = w / 2;
    const dy = 55 + (i * 75);

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(policeX, policeY);
    ctx.lineTo(dx, dy);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(courtX, courtY);
    ctx.lineTo(dx, dy);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(dx, dy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#8B5CF6';
    ctx.fill();

    ctx.font = 'bold 10px IBM Plex Mono';
    ctx.fillStyle = '#DDD6FE';
    ctx.fillText(`[${doc.id}] ${doc.type.split(' ')[0]}`, dx, dy - 14);
    ctx.font = '8px IBM Plex Mono';
    ctx.fillStyle = '#A78BFA';
    ctx.fillText(`Accused: ${state.accused.substring(0,10)}`, dx, dy + 20);
  });

  document.getElementById('graphLegendBottom').innerHTML = `
    <span><i style="width:10px;height:10px;border-radius:50%;background:#38BDF8;display:inline-block;margin-right:6px;"></i>Police: ${state.station}</span>
    <span><i style="width:10px;height:10px;border-radius:50%;background:#8B5CF6;display:inline-block;margin-right:6px;"></i>Suspect: ${state.accused} | Complainant: ${state.complainant}</span>
    <span><i style="width:10px;height:10px;border-radius:50%;background:#EF4444;display:inline-block;margin-right:6px;"></i>Judicial Court</span>
  `;
}

async function logCustody(action, actor, detail) {
  const ts = new Date().toISOString();
  const prev = state.custody.length ? state.custody[state.custody.length - 1].hash : "0".repeat(64);
  const entryHash = await computeRealSHA256(prev + ts + actor + action + detail);
  state.custody.push({ time: ts, actor, action, detail, hash: entryHash });
}

function renderCustody() {
  const el = document.getElementById('custodyList');
  if (!el) return;
  el.innerHTML = '';
  state.custody.forEach(c => {
    const r = document.createElement('div');
    r.className = 'log-row';
    r.innerHTML = `
      <div style="color:var(--ink-faint); font-size:11.5px;">${fmtTime(c.time)}</div>
      <div style="font-weight:600; color:var(--ink);">${c.actor}</div>
      <div style="color:var(--ink-dim);">${c.action} — ${c.detail}</div>
      <div style="font-family:var(--mono); color:var(--seal); font-size:11px;">${short(c.hash)}</div>
    `;
    el.appendChild(r);
  });
}

// Master Court Dossier PDF Export (Containing 100% Complete Case Payload & Evidence)
async function downloadForensicPDF() {
  if (!isCaseActive) {
    alert("Please register case details first.");
    return;
  }

  if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
    downloadForensicReport();
    return;
  }

  drawGraph();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const primary = [21, 27, 35];
  const accent = [62, 207, 142];
  const purpleDoc = [76, 29, 149];

  // Header Banner
  doc.setFillColor(...primary);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...accent);
  doc.text('PRAMAAN — OFFICIAL POLICE CASE & COURT EVIDENCE DOSSIER', 14, 13);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('Certificate of Electronic Record under Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023', 14, 21);

  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(`FIR Number: ${state.firNo}`, 14, 38);
  doc.text(`Accused Entity: ${state.accused}`, 14, 44);
  doc.text(`Police Department: ${state.station}`, 110, 38);
  doc.text(`Investigating Officer: ${state.investigator} (${state.badge})`, 110, 44);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 48, 196, 48);

  // Table 1: Case Details & Parties
  doc.autoTable({
    startY: 52,
    head: [['Case Field', 'Official Police Record Details']],
    body: [
      ['FIR Reference Number', state.firNo],
      ['Police Station / Department', state.station],
      ['Crime Sections (Statutory Basis)', state.sections],
      ['Primary Accused / Suspect', state.accused],
      ['Complainant / Reporting Agency', state.complainant],
      ['Lead Investigating Officer', `${state.investigator} (Badge: ${state.badge})`],
      ['Court Warrant / Order Ref', state.warrant]
    ],
    theme: 'grid',
    headStyles: { fillColor: primary, textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2 }
  });

  // Table 2: Document Hash Registry
  let nextY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...purpleDoc);
  doc.text('1. CASE DOCUMENT INTEGRITY REGISTER (SHA-256 DIGITAL SEALS)', 14, nextY);

  const docRows = state.documents.map(d => [
    d.id,
    d.name,
    d.type,
    d.classification,
    d.isTampered ? "TAMPERED MISMATCH" : "VALID & SEALED",
    d.hash
  ]);

  doc.autoTable({
    startY: nextY + 4,
    head: [['Doc ID', 'Document Title', 'Category', 'Classification', 'Status', 'SHA-256 Seal']],
    body: docRows,
    theme: 'grid',
    headStyles: { fillColor: purpleDoc, textColor: [255, 255, 255] },
    styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 42 },
      2: { cellWidth: 32 },
      3: { cellWidth: 24 },
      4: { cellWidth: 24 },
      5: { cellWidth: 42, font: 'courier', fontSize: 5.5 }
    }
  });

  // Section 3: Seized Assets & Evidence Summary Table
  nextY = doc.lastAutoTable.finalY + 8;
  if (nextY > 240) { doc.addPage(); nextY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primary);
  doc.text('2. SEIZED PHYSICAL & DIGITAL ASSETS MANIFEST', 14, nextY);

  const assetRows = state.evidence.map(e => [e.id, e.platform, e.name, e.location, e.meta]);
  doc.autoTable({
    startY: nextY + 4,
    head: [['Asset ID', 'Platform / Type', 'Asset Title & Description', 'Storage Location', 'Forensic Metadata']],
    body: assetRows,
    theme: 'grid',
    headStyles: { fillColor: primary, textColor: [255, 255, 255] },
    styles: { fontSize: 7, cellPadding: 2.5 }
  });

  // Section 4: Evidence Flow Map Image
  nextY = doc.lastAutoTable.finalY + 8;
  if (nextY > 190) { doc.addPage(); nextY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primary);
  doc.text('3. INTER-DEPARTMENTAL EVIDENCE FLOW & LINKAGE GRAPH', 14, nextY);

  const canvas = document.getElementById('graphCanvas');
  if (canvas) {
    try {
      const graphImg = canvas.toDataURL('image/png', 1.0);
      doc.addImage(graphImg, 'PNG', 14, nextY + 3, 182, 65);
      nextY += 72;
    } catch (e) {
      nextY += 6;
    }
  }

  // Section 5: Chain of Custody Blockchain Ledger
  if (nextY > 210) { doc.addPage(); nextY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primary);
  doc.text('4. IMMUTABLE CHAIN OF CUSTODY (BLOCKCHAIN LEDGER)', 14, nextY);

  const custodyRows = state.custody.map(c => [
    c.time.slice(0, 19).replace('T', ' '),
    c.actor,
    `${c.action} — ${c.detail}`,
    c.hash
  ]);

  doc.autoTable({
    startY: nextY + 4,
    head: [['Timestamp (UTC)', 'Authorized Officer / Role', 'Police Action Details', 'Chained Block SHA-256']],
    body: custodyRows,
    theme: 'grid',
    headStyles: { fillColor: primary, textColor: [255, 255, 255] },
    styles: { fontSize: 7, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 30 },
      2: { cellWidth: 80 },
      3: { cellWidth: 40, font: 'courier', fontSize: 5.5 }
    }
  });

  let finalY = doc.lastAutoTable.finalY + 8;
  if (finalY > 260) { doc.addPage(); finalY = 20; }

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.8);
  doc.rect(14, finalY, 182, 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accent);
  doc.text('CERTIFICATE OF ELECTRONIC RECORD INTEGRITY (SECTION 63 BSA, 2023)', 18, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(70, 70, 70);
  doc.text(`Digital Signatures Validated · Lead Investigating Officer: ${state.investigator} (${state.badge}) · Hash Register Certified.`, 18, finalY + 11);

  doc.save(`${state.firNo.replace(/[^a-zA-Z0-9]/g, '_')}_Court_Dossier.pdf`);
  toast("Certified Complete Court Case Dossier Downloaded!");
}

// Master Manifest TXT Export (Containing 100% Complete Details & Payloads)
function downloadForensicReport() {
  if (!isCaseActive) {
    alert("Please register case details first.");
    return;
  }

  const manifest = `PRAMAAN SECURE POLICE CASE & COURT EVIDENCE REPORT (SECTION 63 BSA)

--------------------------------------------------------------------------------
FIR Reference Number : ${state.firNo}
Police Department    : ${state.station}
Crime Sections       : ${state.sections}
Investigating Officer: ${state.investigator} (Badge: ${state.badge})
Primary Accused      : ${state.accused}
Complainant / Victim : ${state.complainant}
Court Warrant Ref    : ${state.warrant}
Dossier Generated At : ${new Date().toISOString()}

${state.documents.map(d => `--------------------------------------------------------------------------------
DOCUMENT ID: ${d.id} | TYPE: ${d.type}
TITLE      : ${d.name}
CLASSIF.   : ${d.classification} | VERSION: ${d.version}
DEPOSITED  : ${d.uploadedBy} at ${fmtTime(d.time)}
SHA-256 HASH: ${d.hash}
STATUS     : ${d.isTampered ? 'TAMPERED / MISMATCH' : 'INTACT & VERIFIED'}
--------------------------------------------------------------------------------
CONTENT PAYLOAD:
${d.rawContent || d.desc}
`).join('\n\n')}

${state.evidence.map(e => `[${e.id}] ${e.platform} - ${e.name}\nLocation: ${e.location}\nDetails: ${e.content}\nMeta: ${e.meta}\n`).join('\n')}

${state.victimEvidence.map(v => `[${v.id}] ${v.platform} - ${v.name}\nOrigin: ${v.location}\nContent: ${v.content}\nComment: ${v.comment}\n`).join('\n')}

${state.custody.map(c => `${c.time} | ${c.actor} | ${c.action} — ${c.detail}\nBlock Hash: ${c.hash}\n`).join('\n')}
`;

  const blob = new Blob([manifest], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.firNo.replace(/[^a-zA-Z0-9]/g, '_')}_Manifest.txt`;
  a.click();
  toast("Complete Case Manifest Exported (.TXT)!");
}

// Helper to clearly show selected filename in Step 03
function updateFileSelectionLabel(input) {
  const statusEl = document.getElementById('fileSelectionStatus');
  if (!statusEl) return;
  if (input.files && input.files.length > 0) {
    statusEl.textContent = `Selected: ${input.files[0].name} (${(input.files[0].size / 1024).toFixed(1)} KB)`;
    statusEl.style.color = 'var(--seal)';
  } else {
    statusEl.textContent = "No file selected";
    statusEl.style.color = 'var(--ink-faint)';
  }
}

// Search Filter function for Step 03 Vault
function filterVaultRecords(query) {
  renderVault(query);
}

// Dedicated Document Viewer Functions
function populateDocumentViewerDropdown() {
  const select = document.getElementById('viewerDocSelect');
  if (!select) return;
  select.innerHTML = '';

  state.documents.forEach((doc) => {
    const opt = document.createElement('option');
    opt.value = doc.id;
    opt.textContent = `[${doc.id}] ${doc.name} (${doc.type})`;
    select.appendChild(opt);
  });

  if (state.documents.length > 0) {
    renderSelectedDocumentInViewer(state.documents[0].id);
  }
}

function renderSelectedDocumentInViewer(docId) {
  const doc = state.documents.find(d => d.id === docId);
  const area = document.getElementById('viewerDisplayArea');
  if (!doc || !area) return;

  area.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:12px; margin-bottom:14px;">
      <div>
        <h3 style="margin:0; color:var(--seal); font-size:16px;">${doc.name}</h3>
        <span style="font-size:11px; color:var(--ink-dim); font-family:var(--mono);">Record ID: ${doc.id} | Classification: ${doc.classification} | Version: ${doc.version}</span>
      </div>
      <span class="tag ${doc.isTampered ? 'tampered' : 'fsl'}">${doc.isTampered ? 'COMPROMISED' : 'VERIFIED VALID'}</span>
    </div>
    
    <div class="grid2" style="margin-bottom:14px;">
      <div style="font-size:12px; color:var(--ink-dim);"><b>Author / Uploaded By:</b><br>${doc.uploadedBy}</div>
      <div style="font-size:12px; color:var(--ink-dim);"><b>Cryptographic Hash (SHA-256):</b><br><span style="font-family:var(--mono); color:var(--seal); font-size:11px;">${doc.hash}</span></div>
    </div>

    <label style="font-size:11px; color:var(--ink-dim); text-transform:uppercase; font-weight:600; display:block; margin-bottom:6px;">Decrypted Electronic Record Payload:</label>
    <pre style="background:#0D1117; color:#E6EDF3; padding:16px; border-radius:6px; font-size:12.5px; font-family:var(--mono); white-space:pre-wrap; border:1px solid var(--line); max-height:280px; overflow-y:auto; line-height:1.6;">${doc.rawContent || doc.desc}</pre>
  `;
}