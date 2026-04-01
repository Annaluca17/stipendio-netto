import React, { useState } from 'react';
import { X, Upload, Globe, Database, AlertCircle, CheckCircle, FileText, FolderOpen, Info } from 'lucide-react';
import { CCNLData } from '../types';
import { CCNL_PDF_BASE_PATH } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (data: Record<string, CCNLData>) => void;
  onReset: () => void;
  currentCcnlDb: Record<string, CCNLData>;
}

export const DataManagementModal: React.FC<Props> = ({ isOpen, onClose, onDataLoaded, onReset, currentCcnlDb }) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; msg: string }>({ type: null, msg: '' });
  const [activeTab, setActiveTab] = useState<'db' | 'pdf'>('db');

  if (!isOpen) return null;

  const validateData = (data: any): boolean => {
    if (typeof data !== 'object' || data === null) return false;
    const keys = Object.keys(data);
    if (keys.length === 0) return false;
    const firstItem = data[keys[0]];
    return firstItem && typeof firstItem.id === 'string' && Array.isArray(firstItem.levels);
  };

  const handleUrlFetch = async () => {
    if (!url) return;
    setStatus({ type: 'loading', msg: 'Scaricamento in corso...' });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      if (validateData(data)) {
        onDataLoaded(data);
        setStatus({ type: 'success', msg: 'Database aggiornato da URL.' });
        setTimeout(onClose, 1500);
      } else throw new Error('Formato JSON non valido');
    } catch (e) { setStatus({ type: 'error', msg: 'Errore: ' + (e as Error).message }); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus({ type: 'loading', msg: 'Lettura file...' });
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (validateData(json)) {
          onDataLoaded(json);
          setStatus({ type: 'success', msg: 'Database caricato correttamente.' });
          setTimeout(onClose, 1500);
        } else throw new Error('Struttura JSON non valida');
      } catch (err) { setStatus({ type: 'error', msg: 'File non valido: ' + (err as Error).message }); }
    };
    reader.readAsText(file);
  };

  const ccnlEntries = Object.values(currentCcnlDb);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="bg-indigo-900 p-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-700 p-1.5 rounded-lg"><Database className="w-5 h-5 text-indigo-100" /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Pannello Backoffice</h3>
              <p className="text-xs text-indigo-300">Gestione database CCNL — accesso riservato</p>
            </div>
          </div>
          <button onClick={onClose} className="text-indigo-300 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50">
          {(['db', 'pdf'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab === 'db' ? <><Database size={15} /> Aggiorna Database</> : <><FileText size={15} /> Documenti PDF</>}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'db' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-500">Sostituisce il database CCNL attivo. Formato compatibile con struttura <code className="text-xs bg-slate-100 px-1 rounded">CCNLData</code>.</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Carica da URL remoto</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input type="url" className="w-full pl-9 border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 text-sm" placeholder="https://cdn.immedia.it/ccnl-db.json" value={url} onChange={e => setUrl(e.target.value)} />
                  </div>
                  <button onClick={handleUrlFetch} disabled={!url || status.type === 'loading'} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50">Carica</button>
                </div>
              </div>
              <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div><div className="relative flex justify-center text-xs"><span className="px-2 bg-white text-slate-400 uppercase">oppure</span></div></div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Carica File JSON locale</label>
                <label className="flex flex-col items-center px-4 py-5 bg-slate-50 text-indigo-500 rounded-lg border border-dashed border-indigo-200 cursor-pointer hover:bg-indigo-50">
                  <Upload className="w-7 h-7" />
                  <span className="mt-2 text-sm font-medium">Seleziona file .json</span>
                  <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                </label>
              </div>
              {status.msg && (
                <div className={`p-3 rounded-lg flex items-center text-sm ${status.type === 'error' ? 'bg-red-50 text-red-700' : status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                  {status.type === 'error' && <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />}
                  {status.type === 'success' && <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />}
                  {status.msg}
                </div>
              )}
              <div className="border-t border-slate-100 pt-4">
                <button onClick={() => { onReset(); onClose(); }} className="w-full text-center text-sm text-slate-400 hover:text-red-600 hover:underline">Ripristina database predefinito</button>
              </div>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                <div>
                  <p className="font-semibold mb-1">Procedura aggiornamento PDF</p>
                  <ol className="list-decimal ml-4 space-y-1 text-amber-700 text-xs">
                    <li>Copia il PDF in <code className="bg-amber-100 px-1 rounded font-mono">public/ccnl-docs/</code></li>
                    <li>Nome file = ID CCNL (es. <code className="bg-amber-100 px-1 rounded font-mono">commercio.pdf</code>)</li>
                    <li>Commit + push → Vercel rideploya</li>
                  </ol>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><FolderOpen size={15} className="text-slate-400" /> {ccnlEntries.length} CCNL attivi</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50"><tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">CCNL</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">File atteso</th>
                      <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Verifica</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {ccnlEntries.map(ccnl => {
                        const filename = ccnl.pdfFilename || `${ccnl.id}.pdf`;
                        return (
                          <tr key={ccnl.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3"><span className="font-medium text-slate-800">{ccnl.name}</span><span className="block text-xs text-slate-400 font-mono">id: {ccnl.id}</span></td>
                            <td className="px-4 py-3"><code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{filename}</code></td>
                            <td className="px-4 py-3 text-center"><a href={`${CCNL_PDF_BASE_PATH}${filename}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"><FileText size={13} /> Apri</a></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
