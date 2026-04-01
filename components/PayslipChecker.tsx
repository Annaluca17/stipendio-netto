import React, { useState, useRef } from 'react';
import { CalculationResult, UserInput } from '../types';
import { Upload, FileText, AlertTriangle, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface Props {
  result: CalculationResult;
  input: UserInput;
  ccnlName: string;
}

interface Anomalia {
  campo: string;
  valoreCedolino: string;
  valoreAtteso: string;
  gravita: 'alta' | 'media' | 'bassa';
  nota: string;
}

interface AnalysisResult {
  vociEstrate: Record<string, string>;
  anomalie: Anomalia[];
  raccomandazioni: string[];
  punteggioCorrettezza: number; // 0-100
  sommario: string;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const GRAVITA_STYLE: Record<string, string> = {
  alta:   'bg-red-50 border-red-200 text-red-800',
  media:  'bg-amber-50 border-amber-200 text-amber-800',
  bassa:  'bg-blue-50 border-blue-200 text-blue-800',
};

export const PayslipChecker: React.FC<Props> = ({ result, input, ccnlName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const API_KEY = (import.meta as any).env?.VITE_ANTHROPIC_API_KEY as string | undefined;

  const buildContext = () => ({
    ccnl: ccnlName,
    livello: input.level,
    tipologiaContratto: input.contractType,
    partTime: `${input.partTimePercentage}%`,
    ralAnnua: formatCurrency(result.ral),
    lordoMensile: formatCurrency(result.monthlyGross),
    nettoMensile: formatCurrency(result.netSalaryMonthly),
    inpsEmployee: formatCurrency(result.inpsEmployee),
    aliquotaInps: `${(result.aliquotaInpsEmployee * 100).toFixed(2)}%`,
    imponibileIrpef: formatCurrency(result.taxableIncome),
    irpefLorda: formatCurrency(result.irpefGross),
    irpefNetta: formatCurrency(result.irpefNet),
    detrazioniLavoro: formatCurrency(result.detrazioniLavoro),
    tfrMensile: formatCurrency(result.tfrAnnualAccrual / 12),
    addizionali: formatCurrency(result.addizionali),
    trattamentoIntegrativo: formatCurrency(result.trattamentoIntegrativoRenzi),
    bonusCuneo: formatCurrency(result.bonusCuneo2025 + result.ulterioreDetrazione2025),
  });

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setError('Formato non supportato. Carica un\'immagine (JPG, PNG) o un PDF.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File troppo grande. Massimo 5MB.');
      return;
    }
    setFile(f);
    setAnalysis(null);
    setError(null);
  };

  const analyzePayslip = async () => {
    if (!file || !API_KEY) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const isImage = file.type.startsWith('image/');
      const mediaType = isImage ? file.type as 'image/jpeg' | 'image/png' | 'image/webp' : 'application/pdf';
      const contentBlock = isImage
        ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }
        : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } };

      const simContext = buildContext();
      const prompt = `Sei un esperto di buste paga italiane. Analizza questo cedolino e confrontalo con i valori di simulazione forniti.

DATI SIMULAZIONE DI RIFERIMENTO:
${Object.entries(simContext).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

ISTRUZIONI:
1. Estrai dal cedolino tutte le voci rilevanti (lordo, INPS, IRPEF, netto, TFR, detrazioni, ecc.)
2. Confronta ogni voce con i valori di simulazione
3. Identifica anomalie significative (differenze >5% o errori evidenti)
4. Fornisci raccomandazioni concrete

Rispondi ESCLUSIVAMENTE in JSON valido con questa struttura (nessun testo prima o dopo):
{
  "vociEstrate": { "nomeCampo": "valore estratto dal cedolino" },
  "anomalie": [
    {
      "campo": "nome campo",
      "valoreCedolino": "valore nel cedolino",
      "valoreAtteso": "valore simulazione",
      "gravita": "alta|media|bassa",
      "nota": "spiegazione breve"
    }
  ],
  "raccomandazioni": ["stringa raccomandazione"],
  "punteggioCorrettezza": 85,
  "sommario": "testo riassuntivo breve"
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [contentBlock, { type: 'text', text: prompt }],
          }],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: AnalysisResult = JSON.parse(clean);
      setAnalysis(parsed);
    } catch (e) {
      setError('Errore analisi: ' + (e as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-500" />
          Analisi Cedolino
          <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
        </span>
        {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-6 border-t border-slate-100 space-y-5">

          {!API_KEY && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold">Configurazione API Key richiesta</p>
                <p className="text-xs mt-1 text-amber-700">
                  Imposta la variabile d'ambiente <code className="bg-amber-100 px-1 rounded font-mono">VITE_ANTHROPIC_API_KEY</code> nelle impostazioni Vercel del progetto per abilitare questa funzionalità.
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Carica il tuo cedolino (immagine JPG/PNG o PDF). L'analisi AI confronterà le voci con la simulazione corrente e segnalerà eventuali anomalie.
          </p>

          {/* Upload area */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${file ? 'border-violet-300 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/30'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-6 h-6 text-violet-500" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-violet-700">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null); setAnalysis(null); }}
                  className="ml-2 text-slate-400 hover:text-red-500"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">Trascina qui il cedolino o clicca per selezionarlo</p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF — max 5MB</p>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle size={15} className="flex-shrink-0" />{error}
            </div>
          )}

          {file && API_KEY && !isAnalyzing && (
            <button
              onClick={analyzePayslip}
              className="w-full bg-violet-600 text-white font-semibold py-3 rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={16} /> Analizza Cedolino
            </button>
          )}

          {isAnalyzing && (
            <div className="flex items-center justify-center gap-3 py-6 text-violet-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Analisi in corso...</span>
            </div>
          )}

          {/* Results */}
          {analysis && (
            <div className="space-y-4 animate-fade-in">

              {/* Score + sommario */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-center min-w-[64px]">
                  <span className={`text-3xl font-black ${scoreColor(analysis.punteggioCorrettezza)}`}>
                    {analysis.punteggioCorrettezza}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">/ 100</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-0.5">Punteggio correttezza cedolino</p>
                  <p className="text-xs text-slate-500">{analysis.sommario}</p>
                </div>
              </div>

              {/* Anomalie */}
              {analysis.anomalie.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Anomalie rilevate ({analysis.anomalie.length})
                  </h5>
                  <div className="space-y-2">
                    {analysis.anomalie.map((a, i) => (
                      <div key={i} className={`p-3 rounded-lg border text-sm ${GRAVITA_STYLE[a.gravita]}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold">{a.campo}</p>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            a.gravita === 'alta' ? 'bg-red-200 text-red-800' :
                            a.gravita === 'media' ? 'bg-amber-200 text-amber-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>{a.gravita}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                          <div><span className="opacity-70">Cedolino: </span><span className="font-semibold">{a.valoreCedolino}</span></div>
                          <div><span className="opacity-70">Atteso: </span><span className="font-semibold">{a.valoreAtteso}</span></div>
                        </div>
                        {a.nota && <p className="text-xs mt-1.5 opacity-80">{a.nota}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.anomalie.length === 0 && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
                  <CheckCircle size={18} className="flex-shrink-0 text-emerald-500" />
                  Nessuna anomalia rilevante rilevata. Il cedolino appare conforme alla simulazione.
                </div>
              )}

              {/* Raccomandazioni */}
              {analysis.raccomandazioni.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Raccomandazioni</h5>
                  <ul className="space-y-1.5">
                    {analysis.raccomandazioni.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="mt-0.5 text-violet-400 flex-shrink-0">▸</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Voci estratte */}
              {Object.keys(analysis.vociEstrate).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-slate-400 hover:text-slate-600 font-medium">Voci estratte dal cedolino</summary>
                  <div className="mt-2 grid grid-cols-2 gap-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {Object.entries(analysis.vociEstrate).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-slate-500">{k}:</span>
                        <span className="font-semibold text-slate-700">{v}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
