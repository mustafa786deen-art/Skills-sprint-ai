import React, { useState, useRef } from 'react';
import type { Document, DocumentCategory } from '../../types';
import { Modal } from '../common/Modal';
import { Upload, FileText, CheckCircle2, ShieldCheck, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { uploadDocument } from '../../services/api';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadDocument: (newDoc: Document) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadDocument
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [companyId] = useState('COMP-001');
  const [docId, setDocId] = useState('SOP-10');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('SOP');
  const [version, setVersion] = useState('v1.0');
  const [effectiveDate, setEffectiveDate] = useState('2026-09-25');
  const [expiryDate] = useState('2027-09-25');
  const [department, setDepartment] = useState('Operations');
  const [precedenceOrder, setPrecedenceOrder] = useState(2);
  const [securityStatus, setSecurityStatus] = useState<'Clean' | 'Potential Prompt Injection Detected'>('Clean');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select or drop a PDF or DOCX file to upload.');
      return;
    }

    const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : '';
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'txt') {
      setUploadError('Only PDF (.pdf) and Word (.docx) files are supported.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await uploadDocument({
        company_id: companyId,
        document_name: title || file.name.replace(/\.[^/.]+$/, ""),
        category,
        version,
        effective_date: effectiveDate,
        doc_id: docId,
        department,
        precedence_order: precedenceOrder,
        security_status: securityStatus,
        file
      });

      setUploadSuccess(res.message || `Document '${file.name}' successfully uploaded.`);

      const newDoc: Document = {
        id: `DOC-${Date.now()}`,
        documentId: res.doc_id || docId,
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        category,
        version,
        effectiveDate,
        expiryDate,
        department,
        precedenceOrder,
        chunksCount: res.chunks_stored || 1,
        securityStatus,
        status: 'Active',
        fileFormat: ext === 'docx' ? 'docx' : 'pdf'
      };

      onUploadDocument(newDoc);

      setTimeout(() => {
        setIsUploading(false);
        setUploadSuccess(null);
        setFile(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document. Please check server status.');
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Enterprise Policy Document"
      subtitle="Ingest PDF / DOCX documents into the Dual-Pipeline Knowledge Base"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.docx,.txt"
          className="hidden"
        />
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-950/60 transition-colors cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          {file ? (
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-400">
              <FileText className="w-4 h-4" /> {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Drag and drop policy file here, or <span className="text-indigo-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports PDF (.pdf) and Word (.docx) files up to 50MB</p>
            </div>
          )}
        </div>

        {/* Metadata Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Document ID Code</label>
            <input
              type="text"
              required
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              placeholder="e.g. SOP-07, POL-12"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Document Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="SOP">SOP (Standard Operating Procedure)</option>
              <option value="HR Policy">HR Policy</option>
              <option value="Compliance">Compliance & SOX</option>
              <option value="Security Policy">Security Policy</option>
              <option value="Technical Spec">Technical Spec</option>
              <option value="FAQ">FAQ / Guidelines</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">Document Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Data Protection & GDPR Incident Response Manual"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Version Number</label>
            <input
              type="text"
              required
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. v2.1"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Owning Department</label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Cybersecurity, HR"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Effective Date</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Precedence Priority Order (1=Highest)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={precedenceOrder}
              onChange={(e) => setPrecedenceOrder(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Security Scan Simulator Selection */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-300">Simulate Security Ingestion Gate:</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSecurityStatus('Clean')}
              className={`flex-1 p-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                securityStatus === 'Clean'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Clean Document
            </button>
            <button
              type="button"
              onClick={() => setSecurityStatus('Potential Prompt Injection Detected')}
              className={`flex-1 p-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                securityStatus === 'Potential Prompt Injection Detected'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Flag Prompt Injection
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Ingesting File...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Ingest & Vectorize Document
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
