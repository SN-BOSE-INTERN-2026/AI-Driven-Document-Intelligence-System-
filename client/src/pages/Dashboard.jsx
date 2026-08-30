import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import api from '../services/api';
import {
  setDocuments, addDocument, updateDocumentStatus, removeDocument, setError, setLoading
} from '../store/slices/documentSlice';
import {
  FileUp, FileText, Trash2, Download, Loader2, Search, Tag,
  AlertCircle, Clock, FileSpreadsheet, FileImage, CheckCircle2,
  Zap, BarChart3, X, Edit3, Check, FileCheck, Layers,
  BookOpen, MessageSquare, Send, FileQuestion, ChevronDown,
  BrainCircuit, User, Sparkles, CheckCheck
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────
const PIPELINE = [
  { key: 'uploading',      label: 'Upload',   desc: 'Saving file to storage',        color: 'text-sky-400',     bg: 'bg-sky-500/15'    },
  { key: 'ocr_processing', label: 'OCR',      desc: 'Extracting text content',       color: 'text-blue-400',    bg: 'bg-blue-500/15'   },
  { key: 'chunking',       label: 'Chunking', desc: 'Splitting into text segments',  color: 'text-amber-400',   bg: 'bg-amber-500/15'  },
  { key: 'indexing',       label: 'Pinecone', desc: 'Embedding vectors & indexing',  color: 'text-brand-400',   bg: 'bg-brand-500/15'  },
  { key: 'completed',      label: 'Complete', desc: 'Ready for AI queries',          color: 'text-emerald-400', bg: 'bg-emerald-500/15'},
];
const STAGE_IDX = Object.fromEntries(PIPELINE.map((s, i) => [s.key, i]));

const formatBytes = (b, d = 1) => {
  if (!b || b === 0) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'], i = Math.floor(Math.log(b)/Math.log(k));
  return parseFloat((b/Math.pow(k,i)).toFixed(d)) + ' ' + s[i];
};

const getFileCfg = (ft) => {
  const t = (ft||'').toLowerCase();
  if (['png','jpg','jpeg'].includes(t)) return { icon: FileImage,     color:'text-sky-400',  bg:'bg-sky-500/10',  border:'border-sky-500/20',  bar:'from-sky-400 to-blue-400'    };
  if (['doc','docx'].includes(t))       return { icon: FileText,       color:'text-blue-400', bg:'bg-blue-500/10', border:'border-blue-500/20', bar:'from-blue-400 to-sky-400'    };
  if (['pdf'].includes(t))              return { icon: FileSpreadsheet, color:'text-rose-400', bg:'bg-rose-500/10', border:'border-rose-500/20', bar:'from-rose-400 to-orange-400' };
  return                                       { icon: FileText,       color:'text-dark-400', bg:'bg-dark-500/10', border:'border-dark-500/20', bar:'from-dark-400 to-dark-500'   };
};

const renderStatus = (status, confidence, errMsg) => {
  const m = {
    uploading:      { label:'Uploading', cls:'badge-slate',   icon:Loader2,      spin:true  },
    ocr_processing: { label:'OCR',       cls:'badge-sage',    icon:Loader2,      spin:true  },
    chunking:       { label:'Chunking',  cls:'badge-amber',   icon:Loader2,      spin:true  },
    indexing:       { label:'Indexing',  cls:'badge-brand',   icon:Loader2,      spin:true  },
    completed:      { label:`${confidence}% Accuracy`, cls:'badge-emerald', icon:CheckCircle2, spin:false },
    failed:         { label:'Failed',    cls:'badge-rose',    icon:AlertCircle,  spin:false },
  };
  const s = m[status]; if (!s) return null;
  const Icon = s.icon;
  return (
    <span className={`badge ${s.cls}`} title={errMsg||''}>
      <Icon className={`h-2.5 w-2.5 ${s.spin?'animate-spin':''}`} /> {s.label}
    </span>
  );
};

// ─── Processing Pipeline ────────────────────────────────────────────────────
function ProcessingPipeline({ pipeline }) {
  const idx = STAGE_IDX[pipeline.currentStage] ?? 0;
  return (
    <div className="glass-card rounded-xl px-3 py-2.5 border border-brand-500/15 animate-fade-up flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-brand-400 animate-pulse" />
          <span className="text-[10px] font-bold text-dark-200 uppercase tracking-widest">Processing</span>
        </div>
        <span className="text-[9px] text-dark-500 truncate max-w-[100px]">{pipeline.docTitle}</span>
      </div>
      <div className="flex items-center gap-1">
        {PIPELINE.map((stage, i) => {
          const done = i < idx, active = i === idx, pending = i > idx;
          return (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  done   ? 'bg-emerald-500/20 border border-emerald-500/40' :
                  active ? `${stage.bg} border border-brand-500/40 animate-pulse` :
                           'bg-dark-800/60 border border-dark-700/40'
                }`}>
                  {done    ? <CheckCheck className="h-2.5 w-2.5 text-emerald-400" />
                  : active ? <Loader2    className={`h-2.5 w-2.5 ${stage.color} animate-spin`} />
                           : <div className="w-1 h-1 rounded-full bg-dark-700" />}
                </div>
                <span className={`text-[8px] font-bold text-center truncate w-full leading-none ${
                  done?'text-emerald-500':active?stage.color:'text-dark-700'
                }`}>{stage.label}</span>
              </div>
              {i < PIPELINE.length-1 && (
                <div className={`h-px w-3 mb-3.5 flex-shrink-0 ${done?'bg-emerald-500/40':'bg-dark-700/50'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-[9px] text-dark-600 text-center mt-1.5">{PIPELINE[idx]?.desc}</p>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { documents, loading } = useSelector(s => s.documents);

  // Upload
  const [file, setFile]               = useState(null);
  const [title, setTitle]             = useState('');
  const [uploading, setUploading]     = useState(false);
  const [uploadErr, setUploadErr]     = useState('');
  const [isDragging, setIsDragging]   = useState(false);

  // UI
  const [searchQ, setSearchQ]         = useState('');
  const [selectedDocId, setSelectedDocId] = useState(null);

  // Real-time pipelines
  const [pipelines, setPipelines]     = useState({});

  // Inline detail
  const [inlineDoc, setInlineDoc]     = useState(null);
  const [detailLoad, setDetailLoad]   = useState(false);
  const [activeTab, setActiveTab]     = useState('short');
  const [ocrOpen, setOcrOpen]         = useState(false);
  const [editing, setEditing]         = useState(false);
  const [eTitle, setETitle]           = useState('');
  const [eDesc, setEDesc]             = useState('');
  const [eCat, setECat]               = useState('');
  const [eTags, setETags]             = useState('');

  // Chat
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion]       = useState('');
  const [sending, setSending]         = useState(false);
  const chatRef = useRef(null);

  const categories = ['Invoice','Resume','Legal','Medical','Financial','Academic','Other'];

  // ── Fetch docs ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      dispatch(setLoading(true));
      try {
        const res = await api.get('/documents');
        dispatch(setDocuments(res.data.documents));
      } catch (err) {
        dispatch(setError(err.response?.data?.message || 'Error fetching'));
      }
    })();
  }, [dispatch]);

  // ── Auto-select first completed doc ──────────────────────────────────────
  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      const first = documents.find(d => d.status === 'completed') || documents[0];
      if (first) setSelectedDocId(first._id);
    }
  }, [documents]);

  // ── Socket real-time pipeline ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const socket = io(window.location.origin, { transports: ['websocket','polling'] });
    socket.on('connect', () => socket.emit('register', user.id));
    socket.on('document_status_update', (data) => {
      const { documentId, status } = data;
      dispatch(updateDocumentStatus(data));
      setPipelines(prev => {
        const doc = documents.find(d => d._id === documentId);
        const entry = prev[documentId] || { docTitle: doc?.title || 'Document', currentStage: status };
        if (status === 'completed' || status === 'failed') {
          setTimeout(() => setPipelines(p => { const n={...p}; delete n[documentId]; return n; }), 3500);
        }
        return { ...prev, [documentId]: { ...entry, currentStage: status } };
      });
      if (documentId === selectedDocId && status === 'completed') loadDetail(documentId, true);
    });
    return () => socket.disconnect();
  }, [user, dispatch, documents, selectedDocId]);

  // ── Load detail ──────────────────────────────────────────────────────────
  const loadDetail = async (docId, silent = false) => {
    if (!silent) { setDetailLoad(true); setInlineDoc(null); setChatHistory([]); setActiveTab('short'); setOcrOpen(false); setEditing(false); }
    try {
      const res = await api.get(`/documents/${docId}`);
      const d = res.data.document;
      setInlineDoc(d); setETitle(d.title); setEDesc(d.description||''); setECat(d.category); setETags(d.tags?.join(', ')||'');
    } catch (e) {}
    finally { setDetailLoad(false); }
  };

  useEffect(() => { if (selectedDocId) loadDetail(selectedDocId); }, [selectedDocId]);
  useEffect(() => { chatRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, sending]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const onFileChange = e => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^/.]+$/, '')); }
  };
  const onDrop = e => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^/.]+$/, '')); }
  };
  const handleUpload = async e => {
    e.preventDefault(); if (!file) return;
    setUploading(true); setUploadErr('');
    const fd = new FormData(); fd.append('file', file); fd.append('title', title);
    try {
      const res = await api.post('/documents/upload', fd);
      const nd = res.data.document;
      dispatch(addDocument(nd));
      setPipelines(prev => ({ ...prev, [nd._id]: { docTitle: nd.title, currentStage: 'uploading' } }));
      setFile(null); setTitle('');
      setSelectedDocId(nd._id);
    } catch (err) { setUploadErr(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };
  const handleDelete = async id => {
    if (!window.confirm('Delete this document and all its AI data?')) return;
    try {
      await api.delete(`/documents/${id}`);
      dispatch(removeDocument(id));
      if (selectedDocId === id) {
        const next = documents.find(d => d._id !== id && d.status === 'completed');
        setSelectedDocId(next?._id || null); setInlineDoc(null);
      }
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };
  const handleSaveEdit = async e => {
    e.preventDefault();
    try {
      const tags = eTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.put(`/documents/${selectedDocId}`, { title: eTitle, description: eDesc, category: eCat, tags });
      setInlineDoc(res.data.document); setEditing(false);
    } catch (e) { alert(e.response?.data?.message || 'Update failed'); }
  };
  const handleAsk = async e => {
    e.preventDefault();
    if (!question.trim() || !selectedDocId) return;
    const q = question; setQuestion('');
    setChatHistory(prev => [...prev, { role:'user', text:q }]);
    setSending(true);
    try {
      const res = await api.post('/documents/question-answer', { documentId: selectedDocId, question: q });
      const { answer, sources } = res.data.query;
      setChatHistory(prev => [...prev, { role:'assistant', text:answer, sources: sources||[] }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role:'assistant', text:`Error: ${e.response?.data?.message||'Failed'}`, isError:true }]);
    } finally { setSending(false); }
  };

  const filteredDocs = documents.filter(d => {
    const q = searchQ.toLowerCase();
    return d.title.toLowerCase().includes(q) || (d.description?.toLowerCase().includes(q)) || (d.tags?.some(t => t.toLowerCase().includes(q)));
  });

  const stats = [
    { label:'Total',      val: documents.length,                                           icon: BarChart3,    col:'text-brand-400'   },
    { label:'Ready',      val: documents.filter(d=>d.status==='completed').length,          icon: CheckCircle2, col:'text-emerald-400' },
    { label:'Processing', val: documents.filter(d=>!['completed','failed'].includes(d.status)).length, icon: Zap, col:'text-amber-400' },
  ];

  const tabs = [
    { key:'short',    label:'Overview',   icon:Sparkles },
    { key:'detailed', label:'Detailed',   icon:BookOpen },
    { key:'bullets',  label:'Key Points', icon:Layers   },
  ];

  const activePipelines = Object.entries(pipelines);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-3.5 pb-2.5">
        <div>
          <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-0.5">Document Workspace</p>
          <h1 className="text-xl font-black text-dark-100 leading-tight">
            Hello, <span className="text-gradient">{user?.fullName?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-dark-500 text-xs mt-0.5">Upload, process, and explore your AI-indexed documents.</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.map(s => (
            <div key={s.label} className="stat-card text-center px-3 py-2 min-w-[62px]">
              <s.icon className={`h-3.5 w-3.5 ${s.col} mx-auto mb-0.5`} />
              <div className="text-lg font-black text-dark-100 leading-none">{s.val}</div>
              <div className="text-[9px] text-dark-600 font-bold uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="gradient-divider mx-5 flex-shrink-0" />

      {/* ── Two-Column Body: 35% | 65% ────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex gap-3 px-5 pt-3 pb-4">

        {/* ════ LEFT 35% — Upload + Doc List + Inline Detail ═════════════ */}
        <div className="w-[35%] flex-shrink-0 flex flex-col gap-3 overflow-y-auto">

          {/* Upload Form */}
          <div className="glass-panel rounded-2xl p-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-brand-500/20 border border-brand-500/25 flex items-center justify-center">
                <FileUp className="h-3.5 w-3.5 text-brand-400" />
              </div>
              <p className="text-xs font-bold text-dark-200">Upload Document</p>
              <span className="text-[9px] text-dark-600 ml-auto">PDF, DOCX, TXT, PNG</span>
            </div>
            <form onSubmit={handleUpload} className="space-y-2.5">
              <div
                className={`upload-zone p-4 text-center cursor-pointer relative ${isDragging?'active':''}`}
                onDragOver={e=>{e.preventDefault();setIsDragging(true);}} onDragLeave={()=>setIsDragging(false)} onDrop={onDrop}
              >
                <input type="file" onChange={onFileChange} accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className={`w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center transition-all ${isDragging?'bg-brand-500/20 scale-110':'bg-dark-800/60'}`}>
                  <FileUp className={`h-4 w-4 ${isDragging?'text-brand-400':'text-dark-500'} transition-colors`} />
                </div>
                {file ? (
                  <div>
                    <p className="text-[11px] font-semibold text-brand-400 truncate max-w-[180px] mx-auto">{file.name}</p>
                    <p className="text-[10px] text-dark-600 mt-0.5">{formatBytes(file.size)}</p>
                    <button type="button" onClick={()=>{setFile(null);setTitle('');}}
                      className="mt-1.5 text-[10px] text-dark-600 hover:text-rose-400 flex items-center gap-0.5 mx-auto transition-colors">
                      <X className="h-2.5 w-2.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-dark-500">Drop file or <span className="text-brand-400 font-semibold">browse</span></p>
                )}
              </div>
              <input type="text" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} className="input-field text-xs py-2" />
              {uploadErr && (
                <div className="flex items-center gap-1.5 text-rose-400 text-[11px] bg-rose-500/8 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" /> {uploadErr}
                </div>
              )}
              <button type="submit" disabled={!file||uploading} className="btn-primary w-full py-2.5 text-xs">
                {uploading
                  ? <><div className="w-3.5 h-3.5 border-2 border-brand-100/30 border-t-brand-100 rounded-full animate-spin" />Uploading…</>
                  : <><Zap className="h-3.5 w-3.5" />Process with AI</>}
              </button>
            </form>
          </div>

          {/* Processing Pipelines */}
          {activePipelines.map(([docId, pipeline]) => (
            <ProcessingPipeline key={docId} pipeline={pipeline} />
          ))}

          {/* Document List */}
          <div className="glass-panel rounded-2xl flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{borderColor:'rgba(150,115,75,0.1)'}}>
              <p className="text-[10px] font-bold text-dark-500 uppercase tracking-widest">Documents ({filteredDocs.length})</p>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-dark-600 pointer-events-none" />
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search…"
                  className="input-field text-[11px] py-1 pl-6 pr-2 w-28 rounded-lg" />
              </div>
            </div>
            <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-5 gap-2">
                  <Loader2 className="h-4 w-4 text-brand-400 animate-spin" />
                  <span className="text-dark-500 text-xs">Loading…</span>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center py-5 gap-2">
                  <FileText className="h-5 w-5 text-dark-700" />
                  <p className="text-dark-600 text-xs text-center">Upload your first document above.</p>
                </div>
              ) : filteredDocs.map(doc => {
                const cfg = getFileCfg(doc.fileType); const Icon = cfg.icon;
                const isSel = selectedDocId === doc._id;
                return (
                  <div key={doc._id} onClick={()=>setSelectedDocId(doc._id)}
                    className={`glass-card rounded-xl p-2.5 cursor-pointer relative overflow-hidden ${isSel?'border-brand-500/30 bg-brand-500/5':''}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b ${cfg.bar} rounded-r`} />
                    <div className="flex items-center gap-2 pl-1">
                      <div className={`w-7 h-7 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-dark-200 truncate">{doc.title}</p>
                        <p className="text-[9px] text-dark-600 font-mono">{doc.fileType?.toUpperCase()} · {formatBytes(doc.fileSize)}</p>
                      </div>
                      <button onClick={e=>{e.stopPropagation();handleDelete(doc._id);}}
                        className="p-1 text-dark-600 hover:text-rose-400 rounded transition-colors flex-shrink-0">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 pl-1">
                      <span className="text-[9px] text-dark-600 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(doc.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                      </span>
                      {renderStatus(doc.status, doc.ocrConfidence, doc.errorMessage)}
                    </div>
                    {isSel && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Inline Document Detail (when selected) ────────────────── */}
          {selectedDocId && (
            <div className="flex-shrink-0">
              {detailLoad ? (
                <div className="glass-panel rounded-2xl p-8 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center animate-glow-pulse">
                    <BrainCircuit className="h-5 w-5 text-brand-400" />
                  </div>
                  <p className="text-dark-400 text-xs">Loading document…</p>
                </div>
              ) : inlineDoc && (
                <div className="glass-panel rounded-2xl overflow-hidden animate-fade-up">
                  {/* Doc header */}
                  {(() => { const cfg=getFileCfg(inlineDoc.fileType); const Icon=cfg.icon; return (
                    <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:'rgba(150,115,75,0.12)'}}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-dark-100 text-sm truncate">{inlineDoc.title}</p>
                          <p className="text-[9px] text-dark-600 font-mono uppercase">{inlineDoc.fileType} · {formatBytes(inlineDoc.fileSize)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <a href={inlineDoc.fileUrl} download target="_blank" rel="noreferrer"
                          className="btn-ghost py-1 px-2.5 text-[11px] gap-1"><Download className="h-3 w-3"/>Download</a>
                        <button onClick={()=>setEditing(v=>!v)}
                          className="p-1.5 text-dark-500 hover:text-dark-200 border border-dark-700/50 rounded-lg hover:bg-dark-800/40 transition-all">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );})()}

                  <div className="p-4 space-y-4">
                    {/* Edit form */}
                    {editing ? (
                      <form onSubmit={handleSaveEdit} className="space-y-2.5">
                        <input value={eTitle} onChange={e=>setETitle(e.target.value)} required className="input-field text-sm py-2" placeholder="Title" />
                        <textarea rows={2} value={eDesc} onChange={e=>setEDesc(e.target.value)} className="input-field text-sm py-2 resize-none" placeholder="Description" />
                        <div className="grid grid-cols-2 gap-2">
                          <select value={eCat} onChange={e=>setECat(e.target.value)} className="input-field text-sm py-2">
                            {categories.map(c=><option key={c} value={c} className="bg-dark-900">{c}</option>)}
                          </select>
                          <input value={eTags} onChange={e=>setETags(e.target.value)} className="input-field text-sm py-2" placeholder="Tags, comma sep." />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={()=>setEditing(false)} className="btn-ghost text-xs py-1.5 flex-1">Cancel</button>
                          <button type="submit" className="btn-primary text-xs py-1.5 flex-1"><Check className="h-3 w-3"/>Save</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {inlineDoc.description && (
                          <p className="text-xs text-dark-400 leading-relaxed bg-dark-800/30 px-3 py-2 rounded-xl border border-dark-700/30 italic">
                            {inlineDoc.description}
                          </p>
                        )}
                        {/* Properties grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {label:'OCR Accuracy', value:`${inlineDoc.ocrConfidence||100}%`, icon:FileCheck, color:'text-emerald-400'},
                            {label:'Format',        value:inlineDoc.fileType?.toUpperCase(), icon:FileText,  color:'text-sky-400'   },
                            {label:'Category',      value:inlineDoc.category,                icon:Tag,       color:'text-brand-400' },
                            {label:'AI Chunks',     value:inlineDoc.chunks?.length||0,       icon:Layers,    color:'text-rose-400'  },
                          ].map(p=>(
                            <div key={p.label} className="stat-card p-2.5">
                              <p className="text-[9px] font-bold text-dark-600 uppercase tracking-widest mb-1">{p.label}</p>
                              <div className="flex items-center gap-1.5">
                                <p.icon className={`h-3.5 w-3.5 ${p.color} flex-shrink-0`} />
                                <span className="text-sm font-bold text-dark-100 truncate">{p.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Tags */}
                        {inlineDoc.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {inlineDoc.tags.map((t,i)=>(
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-dark-800/60 text-dark-400 border border-dark-700/40">
                                <Tag className="h-2.5 w-2.5 text-brand-400"/>{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <div className="gradient-divider" />

                    {/* AI Summary */}
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-5 h-5 rounded-md bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
                          <Sparkles className="h-3 w-3 text-brand-400" />
                        </div>
                        <p className="text-xs font-bold text-dark-100">AI-Generated Summary</p>
                      </div>
                      {/* Tab bar */}
                      <div className="flex bg-dark-900/50 p-1 rounded-xl border border-dark-700/40 mb-3">
                        {tabs.map(tab=>(
                          <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                              activeTab===tab.key?'bg-gradient-to-r from-brand-600 to-brand-500 text-brand-50 shadow':'text-dark-500 hover:text-dark-300'
                            }`}>
                            <tab.icon className="h-2.5 w-2.5"/>{tab.label}
                          </button>
                        ))}
                      </div>
                      {/* Content */}
                      <div key={activeTab} className="animate-fade-up">
                        {activeTab==='short' && (
                          <div className="bg-dark-900/40 p-3 rounded-xl border border-dark-700/40 border-l-2 border-l-brand-500/50 text-dark-300 text-xs leading-relaxed italic">
                            {inlineDoc.summary?.short||'Summary generating…'}
                          </div>
                        )}
                        {activeTab==='detailed' && (
                          <div className="bg-dark-900/40 p-3 rounded-xl border border-dark-700/40 text-dark-300 text-xs leading-relaxed whitespace-pre-line">
                            {inlineDoc.summary?.detailed||'Detailed summary generating…'}
                          </div>
                        )}
                        {activeTab==='bullets' && (
                          <div className="bg-dark-900/40 p-3 rounded-xl border border-dark-700/40 space-y-2">
                            {inlineDoc.summary?.bulletPoints?.length ? inlineDoc.summary.bulletPoints.map((pt,i)=>(
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <div className="w-1 h-1 rounded-full bg-brand-400"/>
                                </div>
                                <span className="text-dark-300 text-xs leading-relaxed">{pt}</span>
                              </div>
                            )):<p className="text-dark-600 text-xs">Key points generating…</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* OCR collapsible */}
                    <div className="glass-card rounded-xl overflow-hidden">
                      <button onClick={()=>setOcrOpen(v=>!v)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-dark-400 hover:text-dark-200 transition-colors">
                        <div className="flex items-center gap-2"><FileQuestion className="h-3.5 w-3.5 text-dark-600"/>Extracted OCR Text</div>
                        <ChevronDown className={`h-3.5 w-3.5 text-dark-600 transition-transform ${ocrOpen?'rotate-180':''}`}/>
                      </button>
                      {ocrOpen && (
                        <div className="px-3 pb-3 border-t border-dark-700/40 animate-fade-up">
                          <div className="mt-2.5 max-h-36 overflow-y-auto rounded-lg bg-dark-950/60 border border-dark-700/30 p-2.5">
                            <pre className="text-[10px] font-mono text-dark-400 leading-relaxed whitespace-pre-wrap">
                              {inlineDoc.extractedText||'No text content available.'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>{/* end left 35% */}

        {/* ════ RIGHT 65% — AI Chat ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden">
          {/* Chat header */}
          <div className="px-5 py-3.5 border-b flex-shrink-0 flex items-center gap-3" style={{borderColor:'rgba(150,115,75,0.12)'}}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600/30 to-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <MessageSquare className="h-4.5 w-4.5 text-brand-400" />
            </div>
            <div>
              <p className="font-bold text-dark-100 text-base">AI Assistant</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${selectedDocId&&inlineDoc?'bg-emerald-400 animate-pulse':'bg-dark-600'}`}/>
                <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">RAG · Vector Retrieval · {selectedDocId&&inlineDoc?'Live':'Offline'}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {!selectedDocId || !inlineDoc ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-dark-800/50 border border-dark-700/40 flex items-center justify-center">
                  <BrainCircuit className="h-8 w-8 text-dark-600" />
                </div>
                <div>
                  <p className="font-semibold text-dark-400 text-base">Select a document</p>
                  <p className="text-dark-600 text-sm mt-1">Upload or pick a document from the list to start chatting.</p>
                </div>
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/15 flex items-center justify-center animate-float">
                  <BrainCircuit className="h-8 w-8 text-brand-400" />
                </div>
                <div>
                  <p className="font-bold text-dark-100 text-lg">Ask the Document</p>
                  <p className="text-dark-500 text-sm mt-2 max-w-xs leading-relaxed">
                    Get cited answers using AI vector search on this document.
                  </p>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  {['What is this document about?','What are the key findings?','Summarize the main conclusions'].map(q=>(
                    <button key={q} onClick={()=>setQuestion(q)}
                      className="w-full text-left text-sm text-dark-400 hover:text-brand-300 px-4 py-2.5 rounded-xl bg-dark-800/40 hover:bg-brand-500/8 border border-dark-700/40 hover:border-brand-500/20 transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg,i) => (
                <div key={i} className={`flex flex-col gap-2 ${msg.role==='user'?'items-end':'items-start'} animate-fade-up`}>
                  <div className={`flex items-end gap-2 ${msg.role==='user'?'flex-row-reverse':''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role==='user'?'bg-gradient-to-br from-brand-600 to-brand-700':'bg-dark-800 border border-dark-700'
                    }`}>
                      {msg.role==='user'?<User className="h-3.5 w-3.5 text-brand-50"/>:<BrainCircuit className="h-3.5 w-3.5 text-brand-400"/>}
                    </div>
                    <div className={`px-4 py-3 text-sm leading-relaxed max-w-[78%] ${
                      msg.role==='user'?'chat-bubble-user':msg.isError?'bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl':'chat-bubble-ai'
                    }`}>{msg.text}</div>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex items-end gap-2 animate-fade-up">
                <div className="w-7 h-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center flex-shrink-0">
                  <BrainCircuit className="h-3.5 w-3.5 text-brand-400"/>
                </div>
                <div className="chat-bubble-ai px-4 py-3 flex gap-1.5 items-center">
                  <div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/>
                </div>
              </div>
            )}
            <div ref={chatRef}/>
          </div>

          {/* Chat input */}
          <div className="px-5 pb-4 pt-3 border-t flex-shrink-0" style={{borderColor:'rgba(150,115,75,0.1)'}}>
            <form onSubmit={handleAsk} className="relative flex items-center">
              <input
                type="text"
                disabled={sending||!selectedDocId||!inlineDoc}
                placeholder={selectedDocId&&inlineDoc?'Ask anything about this document…':'Select a document first…'}
                value={question}
                onChange={e=>setQuestion(e.target.value)}
                className="input-field pr-12 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <button type="submit"
                disabled={!question.trim()||sending||!selectedDocId||!inlineDoc}
                className="absolute right-2.5 w-8 h-8 flex items-center justify-center rounded-lg bg-brand-600 disabled:bg-dark-800 disabled:text-dark-600 text-brand-50 transition-all hover:bg-brand-500"
                style={question.trim()&&selectedDocId&&!sending?{boxShadow:'0 2px 10px rgba(217,119,6,0.4)'}:{}}>
                <Send className="h-3.5 w-3.5"/>
              </button>
            </form>
          </div>
        </div>{/* end right 65% */}

      </div>{/* end 2-col body */}
    </div>
  );
}
