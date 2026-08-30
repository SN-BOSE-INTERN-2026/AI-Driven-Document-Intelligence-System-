import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { setCurrentDocument, setError, setLoading } from '../store/slices/documentSlice';
import { 
  FileText, 
  Download, 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Loader2, 
  FileCheck, 
  Tag, 
  Edit3, 
  Check, 
  X,
  FileQuestion,
  BookOpen,
  Sparkles,
  BrainCircuit,
  User,
  ChevronDown,
  Layers,
  AlertCircle
} from 'lucide-react';

export default function DocumentDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentDocument, loading, error } = useSelector((state) => state.documents);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('short');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState('');
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const [ocrExpanded, setOcrExpanded] = useState(false);
  const chatBottomRef = useRef(null);

  const fetchDocDetails = async () => {
    dispatch(setLoading(true));
    try {
      const res = await api.get(`/documents/${id}`);
      dispatch(setCurrentDocument(res.data.document));
      setEditTitle(res.data.document.title);
      setEditDesc(res.data.document.description || '');
      setEditCategory(res.data.document.category);
      setEditTags(res.data.document.tags?.join(', ') || '');
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Error loading document detail'));
    }
  };

  useEffect(() => { fetchDocDetails(); }, [id, dispatch]);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, sendingQuestion]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = editTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.put(`/documents/${id}`, { title: editTitle, description: editDesc, category: editCategory, tags: tagsArray });
      dispatch(setCurrentDocument(res.data.document));
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating document details');
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const queryText = question;
    setQuestion('');
    const userMsg = { role: 'user', text: queryText, timestamp: new Date() };
    setChatHistory((prev) => [...prev, userMsg]);
    setSendingQuestion(true);
    try {
      const res = await api.post('/documents/question-answer', { documentId: id, question: queryText });
      const { answer, sources } = res.data.query;
      setChatHistory((prev) => [...prev, { role: 'assistant', text: answer, sources: sources || [], timestamp: new Date() }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to generate answer.';
      setChatHistory((prev) => [...prev, { role: 'assistant', text: `Error: ${errMsg}`, isError: true }]);
    } finally {
      setSendingQuestion(false);
    }
  };

  if (loading && !currentDocument) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-glow-pulse">
            <BrainCircuit className="h-8 w-8 text-violet-400" />
          </div>
          <div className="absolute inset-0 rounded-2xl animate-ping border border-violet-500/20" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Analyzing document...</p>
          <p className="text-slate-500 text-sm mt-1">Loading AI indexes and semantic vectors</p>
        </div>
      </div>
    );
  }

  if (error || !currentDocument) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <X className="h-7 w-7 text-rose-400" />
        </div>
        <h3 className="font-bold text-white text-lg">Failed to Load Document</h3>
        <p className="text-slate-500 text-sm mt-1 mb-6">{error || 'The document index could not be retrieved.'}</p>
        <Link to="/" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const categories = ['Invoice', 'Resume', 'Legal', 'Medical', 'Financial', 'Academic', 'Other'];
  const tabs = [
    { key: 'short', label: 'Overview', icon: Sparkles },
    { key: 'detailed', label: 'Detailed', icon: BookOpen },
    { key: 'bullets', label: 'Key Points', icon: Layers },
  ];

  return (
    <div className="space-y-5">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-semibold group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Workspace
        </Link>

        <a 
          href={currentDocument.fileUrl} 
          download target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 transition-all"
        >
          <Download className="h-3.5 w-3.5" /> Download Original
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Document Properties */}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {isEditing ? (
              <form onSubmit={handleSaveDetails} className="space-y-4 relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <Edit3 className="h-4 w-4 text-violet-400" />
                  <h3 className="font-bold text-white text-sm">Edit Document Properties</h3>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Title</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className="input-field" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea rows="2" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="input-field resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="input-field">
                      {categories.map(cat => <option key={cat} value={cat} className="bg-slate-900">{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tags (comma-separated)</label>
                    <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="e.g. report, 2024" className="input-field" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost text-xs">Cancel</button>
                  <button type="submit" className="btn-primary text-xs px-4 py-2">
                    <Check className="h-3.5 w-3.5" /> Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-700/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white leading-tight">{currentDocument.title}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        by <span className="text-slate-400 font-medium">{currentDocument.uploadedBy?.fullName}</span>
                        <span className="text-slate-600"> · {currentDocument.uploadedBy?.email}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-slate-500 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 transition-all flex-shrink-0"
                    title="Edit Properties"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {currentDocument.description && (
                  <p className="text-sm text-slate-400 leading-relaxed bg-slate-800/20 p-3.5 rounded-xl border border-slate-800/50">
                    {currentDocument.description}
                  </p>
                )}

                {/* Properties grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'OCR Accuracy', value: `${currentDocument.ocrConfidence || 100}%`, icon: FileCheck, color: 'text-emerald-400' },
                    { label: 'Format', value: currentDocument.fileType?.toUpperCase(), icon: FileText, color: 'text-blue-400' },
                    { label: 'Category', value: currentDocument.category, icon: Tag, color: 'text-violet-400' },
                    { label: 'AI Chunks', value: currentDocument.chunks?.length || 0, icon: Layers, color: 'text-cyan-400' },
                  ].map(prop => (
                    <div key={prop.label} className="stat-card">
                      <span className="block text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1.5">{prop.label}</span>
                      <div className="flex items-center gap-1.5">
                        <prop.icon className={`h-3.5 w-3.5 ${prop.color} flex-shrink-0`} />
                        <span className="text-sm font-bold text-white truncate">{prop.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                {currentDocument.tags && currentDocument.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentDocument.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800/60 text-slate-400 border border-slate-700/50">
                        <Tag className="h-3 w-3 text-violet-400" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Summaries Panel */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center" style={{boxShadow: '0 4px 12px rgba(139,92,246,0.3)'}}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm leading-tight">AI-Generated Summary</h3>
                <p className="text-[10px] text-slate-600">Powered by Gemini Language Model</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="relative flex bg-slate-900/50 p-1 rounded-xl border border-slate-800/60">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all duration-200 ${
                    activeTab === tab.key 
                      ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  style={activeTab === tab.key ? {boxShadow: '0 4px 12px rgba(139,92,246,0.3)'} : {}}
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[120px] text-sm leading-relaxed text-slate-300 animate-fade-up" key={activeTab}>
              {activeTab === 'short' && (
                <blockquote className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/40 border-l-2 border-l-violet-500/50 italic text-white/90 text-sm leading-relaxed">
                  {currentDocument.summary?.short || 'AI summary generating — please check back shortly.'}
                </blockquote>
              )}
              {activeTab === 'detailed' && (
                <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/40 whitespace-pre-line text-slate-300 text-sm leading-relaxed">
                  {currentDocument.summary?.detailed || 'Detailed summary generating — please check back shortly.'}
                </div>
              )}
              {activeTab === 'bullets' && (
                <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/40">
                  <ul className="space-y-2">
                    {currentDocument.summary?.bulletPoints?.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                        </div>
                        <span className="text-slate-300 text-sm leading-relaxed">{pt}</span>
                      </li>
                    )) || (
                      <li className="text-slate-500 text-sm">Bullet points generating — please check back shortly.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* OCR Text Panel */}
          <div className="glass-panel rounded-3xl p-6">
            <button 
              className="w-full flex items-center justify-between group"
              onClick={() => setOcrExpanded(!ocrExpanded)}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center">
                  <FileQuestion className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-sm">Extracted OCR Text</h3>
                  <p className="text-[10px] text-slate-600">Raw document content</p>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${ocrExpanded ? 'rotate-180' : ''}`} />
            </button>

            {ocrExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-800/60 animate-fade-up">
                <div className="max-h-60 overflow-y-auto rounded-xl bg-slate-950/50 border border-slate-800/40 p-4">
                  <pre className="text-xs font-mono text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {currentDocument.extractedText || 'No text content available.'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: RAG Chat */}
        <div className="lg:col-span-5 h-[calc(100vh-200px)] flex flex-col">
          <div className="glass-panel rounded-3xl flex-1 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="px-5 py-4 border-b border-slate-800/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center flex-shrink-0" style={{boxShadow: '0 4px 16px rgba(139,92,246,0.3)'}}>
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Document AI Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">RAG · Vector Retrieval</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center animate-float">
                    <BrainCircuit className="h-7 w-7 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Ask your Document</h4>
                    <p className="text-xs text-slate-500 max-w-[200px] mt-1.5 leading-relaxed">
                      Your questions are answered using vector similarity search on this document's AI index.
                    </p>
                  </div>
                  {/* Suggested questions */}
                  <div className="w-full space-y-2 mt-2">
                    {['What is this document about?', 'Summarize the key findings', 'What are the main conclusions?'].map(q => (
                      <button 
                        key={q}
                        onClick={() => setQuestion(q)}
                        className="w-full text-left text-xs text-slate-400 hover:text-violet-300 px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-violet-500/10 border border-slate-700/50 hover:border-violet-500/20 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-up`}>
                    {/* Avatar */}
                    <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-br from-violet-600 to-purple-700' 
                          : 'bg-slate-800 border border-slate-700'
                      }`}>
                        {msg.role === 'user' 
                          ? <User className="h-3 w-3 text-white" />
                          : <BrainCircuit className="h-3 w-3 text-violet-400" />
                        }
                      </div>
                      
                      <div 
                        className={`px-4 py-3 text-sm leading-relaxed max-w-[85%] ${
                          msg.role === 'user' 
                            ? 'chat-bubble-user text-white' 
                            : msg.isError 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl' 
                              : 'chat-bubble-ai text-slate-100'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="px-8 text-[10px] text-slate-500 max-w-[90%] space-y-1.5 self-start">
                        <span className="font-bold text-violet-400 uppercase tracking-wider block">Sources:</span>
                        {msg.sources.map((src, sIdx) => (
                          <div key={sIdx} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50 leading-relaxed italic text-slate-400">
                            <strong className="text-slate-300 not-italic">Chunk {src.index}:</strong> {src.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {sendingQuestion && (
                <div className="flex items-end gap-2 animate-fade-up">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    <BrainCircuit className="h-3 w-3 text-violet-400" />
                  </div>
                  <div className="chat-bubble-ai px-4 py-3.5 flex items-center gap-1.5">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-3 border-t border-slate-800/60 flex-shrink-0">
              <form onSubmit={handleAskQuestion}>
                <div className="relative flex items-center gap-2">
                  <input 
                    type="text" 
                    disabled={sendingQuestion}
                    placeholder="Ask anything about this document..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="input-field pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button 
                    type="submit"
                    disabled={!question.trim() || sendingQuestion}
                    className="absolute right-2 w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white rounded-lg flex items-center justify-center transition-all hover:from-violet-500 hover:to-purple-600"
                    style={question.trim() && !sendingQuestion ? {boxShadow: '0 2px 8px rgba(139,92,246,0.4)'} : {}}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
