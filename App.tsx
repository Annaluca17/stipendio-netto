import React, { useState, useEffect, useMemo } from 'react';
import { UserInput, CalculationResult, CCNLType, User, SavedProfile, CCNLData } from './types';
import { calculatePayroll } from './services/payrollCalculator';
import { authService } from './services/auth';
import { CCNL_DB, REGIONS, ADMIN_EMAIL, CCNL_PDF_BASE_PATH } from './constants';
import { ResultsView } from './components/ResultsView';
import { AuthModal } from './components/AuthModal';
import { DataManagementModal } from './components/DataManagementModal';
import { AIInsights } from './components/AIInsights';
import { PayslipChecker } from './components/PayslipChecker';
import {
  Calculator, Settings2, User as UserIcon, Building, LogIn, LogOut,
  Save, FolderOpen, Trash2, Database, LayoutList, Hash, PlusCircle,
  ShieldCheck, Repeat, FileText, Euro, Briefcase
} from 'lucide-react';

const DEFAULT_INPUT: UserInput = {
  ccnl: Object.keys(CCNL_DB)[0],
  level: CCNL_DB[Object.keys(CCNL_DB)[0]].levels[0].level,
  contractType: 'indeterminato',
  renewals: 0,
  partTimePercentage: 100,
  region: 'Lombardia',
  municipalityAddizionale: 0.8,
  annoApprendistato: 1,
  childrenDependent: 0,
  startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
  companySize: 'over15',
  ralOverride: undefined,
  applyTrattamentoIntegrativo: true,
  applyUlterioreDetrazione: true,
  coniugeACarico: false,
  figliUnder3: 0,
  figliDisabili: 0,
  superminimo: 0,
  indennitaPersonali: 0,
  tfrDestination: 'azienda',
  contributoFondoDipendente: 1.5,
  contributoFondoDatore: 0,
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [ccnlDb, setCcnlDb] = useState<Record<string, CCNLData>>(CCNL_DB);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [calcMode, setCalcMode] = useState<'ccnl' | 'ral'>('ccnl');
  const [input, setInput] = useState<UserInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<CalculationResult | null>(null);
  const [profileName, setProfileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) setUser(currentUser);
  }, []);

  useEffect(() => {
    if (calcMode === 'ccnl') handleInputChange('ralOverride', undefined);
  }, [calcMode]);

  useEffect(() => {
    if (ccnlDb[input.ccnl]) {
      try { setResult(calculatePayroll(input, ccnlDb)); }
      catch (e) { console.error('Calculation error', e); setResult(null); }
    }
  }, [input, ccnlDb]);

  const handleInputChange = (field: keyof UserInput, value: any) =>
    setInput(prev => ({ ...prev, [field]: value }));

  const handleLogout = () => { authService.logout(); setUser(null); };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profileName.trim()) return;
    setUser(authService.saveProfile(user.email, profileName, input));
    setProfileName(''); setIsSaving(false);
  };

  const handleLoadProfile = (profile: SavedProfile) => {
    setInput(profile.data);
    setCalcMode(profile.data.ralOverride && profile.data.ralOverride > 0 ? 'ral' : 'ccnl');
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !confirm('Eliminare questo salvataggio?')) return;
    setUser(authService.deleteProfile(user.email, id));
  };

  const handleDataLoaded = (newData: Record<string, CCNLData>) => {
    setCcnlDb(newData);
    const firstKey = Object.keys(newData)[0];
    if (firstKey) setInput(prev => ({ ...prev, ccnl: firstKey, level: newData[firstKey].levels[0].level }));
  };

  const currentLevels = useMemo(() => ccnlDb[input.ccnl]?.levels || [], [input.ccnl, ccnlDb]);

  useEffect(() => {
    const ccnl = ccnlDb[input.ccnl];
    if (ccnl && !ccnl.levels.find(l => l.level === input.level))
      handleInputChange('level', ccnl.levels[0].level);
  }, [input.ccnl, ccnlDb]);

  const currentFullTimeHours = ccnlDb[input.ccnl]?.oreSettimanaliFullTime || 40;
  const currentWeeklyHours = ((input.partTimePercentage / 100) * currentFullTimeHours).toFixed(1);
  const currentCcnlPdf = ccnlDb[input.ccnl]?.pdfFilename
    ? `${CCNL_PDF_BASE_PATH}${ccnlDb[input.ccnl].pdfFilename}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={setUser} />
      {isAdmin && (
        <DataManagementModal
          isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)}
          onDataLoaded={handleDataLoaded}
          onReset={() => { setCcnlDb(CCNL_DB); setInput(prev => ({ ...prev, ccnl: 'commercio' })); }}
          currentCcnlDb={ccnlDb}
        />
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg"><Calculator className="text-white w-6 h-6" /></div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payroll<span className="text-indigo-600">Italia</span> Pro</h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {isAdmin && (
              <button onClick={() => setIsDataModalOpen(true)} title="Pannello Backoffice"
                className="relative p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors">
                <Database size={20} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white" />
              </button>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-semibold text-slate-800">{user.email.split('@')[0]}</span>
                  <span className="text-xs text-slate-500">{isAdmin ? 'Amministratore' : 'Utente Pro'}</span>
                </div>
                <button onClick={handleLogout} className="flex items-center space-x-2 text-sm text-slate-600 hover:text-red-600 transition-colors bg-slate-100 hover:bg-red-50 px-3 py-2 rounded-lg">
                  <LogOut size={16} /><span className="hidden sm:inline">Esci</span>
                </button>
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                <LogIn size={16} /><span>Accedi</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* ── LEFT COLUMN ────────────────────────────────────── */}
          <div className="xl:col-span-4 space-y-6">

            {/* Saved profiles */}
            {user && (
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-500 mb-4 flex items-center">
                  <FolderOpen className="w-4 h-4 mr-2" /> Le tue Simulazioni
                </h2>
                {user.profiles.length > 0 ? (
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                    {user.profiles.map(p => (
                      <div key={p.id} onClick={() => handleLoadProfile(p)}
                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-white border border-transparent hover:border-indigo-100 cursor-pointer transition-all">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700 text-sm group-hover:text-indigo-700">{p.name}</span>
                          <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button onClick={e => handleDeleteProfile(p.id, e)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400 italic mb-4">Nessuna simulazione salvata.</p>}
                {isSaving ? (
                  <form onSubmit={handleSaveProfile} className="flex space-x-2">
                    <input type="text" autoFocus placeholder="Nome simulazione..." className="flex-1 text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={profileName} onChange={e => setProfileName(e.target.value)} />
                    <button type="submit" className="bg-indigo-600 text-white px-3 py-1 rounded-md text-xs font-bold">OK</button>
                    <button type="button" onClick={() => setIsSaving(false)} className="text-slate-400 hover:text-slate-600 px-2">X</button>
                  </form>
                ) : (
                  <button onClick={() => setIsSaving(true)} className="w-full flex items-center justify-center space-x-2 border border-dashed border-indigo-300 text-indigo-600 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium">
                    <Save size={16} /><span>Salva configurazione corrente</span>
                  </button>
                )}
              </div>
            )}

            {/* ── Dati Contrattuali ─────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold flex items-center text-slate-800 mb-6">
                <Settings2 className="w-5 h-5 mr-2 text-indigo-500" /> Dati Contrattuali
              </h2>

              {/* Mode toggle */}
              <div className="bg-slate-100 p-1 rounded-lg flex mb-6">
                {(['ccnl', 'ral'] as const).map(mode => (
                  <button key={mode} onClick={() => setCalcMode(mode)}
                    className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${calcMode === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {mode === 'ccnl' ? <><LayoutList className="w-4 h-4 mr-2" />CCNL</> : <><Hash className="w-4 h-4 mr-2" />RAL</>}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {/* CCNL select + PDF link */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">{calcMode === 'ccnl' ? 'CCNL' : 'CCNL Rif.'}</label>
                    {currentCcnlPdf && (
                      <a href={currentCcnlPdf} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium" title="Testo ufficiale CCNL">
                        <FileText size={13} /> Testo CCNL
                      </a>
                    )}
                  </div>
                  <select className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2" value={input.ccnl} onChange={e => handleInputChange('ccnl', e.target.value as CCNLType)}>
                    {Object.values(ccnlDb).map((ccnl: CCNLData) => <option key={ccnl.id} value={ccnl.id}>{ccnl.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {calcMode === 'ccnl' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Livello</label>
                      <select className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2" value={input.level} onChange={e => handleInputChange('level', e.target.value)}>
                        {currentLevels.map(lvl => <option key={lvl.level} value={lvl.level}>Liv. {lvl.level}</option>)}
                      </select>
                    </div>
                  )}
                  <div className={calcMode === 'ral' ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipologia</label>
                    <select className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2" value={input.contractType} onChange={e => handleInputChange('contractType', e.target.value)}>
                      <option value="indeterminato">Indeterminato</option>
                      <option value="determinato">Determinato</option>
                      <option value="apprendistato">Apprendistato</option>
                    </select>
                  </div>
                </div>

                {input.contractType === 'determinato' && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <label className="block text-sm font-bold text-amber-800 mb-2 flex items-center"><Repeat className="w-4 h-4 mr-2" /> Numero di Rinnovi</label>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => handleInputChange('renewals', Math.max(0, input.renewals - 1))} className="px-3 py-1 bg-white border border-amber-200 rounded shadow-sm text-amber-700 hover:bg-amber-100">-</button>
                      <span className="font-bold w-10 text-center text-amber-900">{input.renewals}</span>
                      <button onClick={() => handleInputChange('renewals', input.renewals + 1)} className="px-3 py-1 bg-white border border-amber-200 rounded shadow-sm text-amber-700 hover:bg-amber-100">+</button>
                    </div>
                    <p className="text-[10px] text-amber-600 mt-2 italic">+0.5% NASpI per ogni rinnovo</p>
                  </div>
                )}

                {input.contractType === 'apprendistato' && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <label className="block text-sm font-bold text-blue-800 mb-2">Anno di Apprendistato</label>
                    <input type="number" min={1} max={3} className="w-20 border-blue-300 rounded-lg shadow-sm text-center text-lg font-semibold" value={input.annoApprendistato ?? 1} onChange={e => handleInputChange('annoApprendistato', Math.min(3, Math.max(1, parseInt(e.target.value) || 1)))} />
                    <p className="text-[10px] text-blue-600 mt-2 italic">Durata contratto: max 3 anni</p>
                  </div>
                )}

                {calcMode === 'ral' && (
                  <div>
                    <label className="block text-sm font-bold text-indigo-700 mb-1">RAL Desiderata</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-slate-500 sm:text-lg">€</span></div>
                      <input type="number" placeholder="Es: 35000" className="w-full pl-8 border-indigo-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg py-3 font-semibold bg-indigo-50/50" value={input.ralOverride || ''} onChange={e => handleInputChange('ralOverride', e.target.value ? parseFloat(e.target.value) : undefined)} />
                    </div>
                  </div>
                )}

                {/* Part-time */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-end">
                    <label className="block text-xs font-black uppercase text-slate-500">Part-Time ({input.partTimePercentage}%)</label>
                    <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                      <input type="number" step="0.5" min="1" max={currentFullTimeHours} className="w-14 text-right border-none p-0 text-sm font-bold text-indigo-600 focus:ring-0 bg-transparent" value={currentWeeklyHours}
                        onChange={e => {
                          const hours = parseFloat(e.target.value) || 0;
                          handleInputChange('partTimePercentage', Math.min(100, Math.max(1, Math.round((hours / currentFullTimeHours) * 100))));
                        }} />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Ore/Sett</span>
                    </div>
                  </div>
                  <input type="range" min="1" max="100" step="1" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={input.partTimePercentage} onChange={e => handleInputChange('partTimePercentage', parseInt(e.target.value))} />
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>10% ({Math.round(currentFullTimeHours * 0.1)}h)</span>
                    <span>Full-time: {currentFullTimeHours}h</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Data inizio */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Inizio</label>
                  <input type="date" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2" value={input.startDate} onChange={e => handleInputChange('startDate', e.target.value)} />
                  <p className="text-[10px] text-slate-400 mt-1">Determina scatti anzianità maturati e addizionali del primo anno.</p>
                </div>
              </div>
            </div>

            {/* ── Compensazione Individuale ─────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold flex items-center text-slate-800 mb-4">
                <Briefcase className="w-5 h-5 mr-2 text-teal-500" /> Compensazione Individuale
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Superminimo individuale
                    <span className="ml-1 text-[10px] text-slate-400 normal-case font-normal">€/mese lordo</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Euro size={14} className="text-slate-400" /></div>
                    <input type="number" min={0} step={10} className="w-full pl-8 border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm py-2" placeholder="0" value={input.superminimo || ''} onChange={e => handleInputChange('superminimo', parseFloat(e.target.value) || 0)} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Pensionabile, incluso nella base INPS e TFR.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Altre indennità personali
                    <span className="ml-1 text-[10px] text-slate-400 normal-case font-normal">€/mese lordo</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Euro size={14} className="text-slate-400" /></div>
                    <input type="number" min={0} step={10} className="w-full pl-8 border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm py-2" placeholder="0" value={input.indennitaPersonali || ''} onChange={e => handleInputChange('indennitaPersonali', parseFloat(e.target.value) || 0)} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Es. indennità di funzione, turno, reperibilità.</p>
                </div>
              </div>
            </div>

            {/* ── Previdenza Complementare ──────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold flex items-center text-slate-800 mb-4">
                <ShieldCheck className="w-5 h-5 mr-2 text-violet-500" /> Previdenza Complementare
              </h2>
              <div className="space-y-4">
                {/* Toggle TFR */}
                <div className="bg-slate-100 p-1 rounded-lg flex">
                  {(['azienda', 'fondo'] as const).map(dest => (
                    <button key={dest} onClick={() => handleInputChange('tfrDestination', dest)}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${input.tfrDestination === dest ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {dest === 'azienda' ? 'TFR in Azienda' : 'Fondo Pensione'}
                    </button>
                  ))}
                </div>

                {input.tfrDestination === 'fondo' && (
                  <div className="space-y-3 p-4 bg-violet-50 rounded-xl border border-violet-100">
                    <div>
                      <label className="block text-sm font-medium text-violet-700 mb-1">
                        Contributo dipendente <span className="font-normal text-violet-500">% RAL</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input type="range" min={0} max={10} step={0.5} className="flex-1 accent-violet-600" value={input.contributoFondoDipendente} onChange={e => handleInputChange('contributoFondoDipendente', parseFloat(e.target.value))} />
                        <span className="text-sm font-bold text-violet-700 w-12 text-right">{input.contributoFondoDipendente}%</span>
                      </div>
                      <p className="text-[10px] text-violet-400 mt-1">Deducibile fino a €5.164,57/anno (D.Lgs. 252/2005)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-violet-700 mb-1">
                        Contributo datore <span className="font-normal text-violet-500">% RAL</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input type="range" min={0} max={5} step={0.5} className="flex-1 accent-violet-600" value={input.contributoFondoDatore} onChange={e => handleInputChange('contributoFondoDatore', parseFloat(e.target.value))} />
                        <span className="text-sm font-bold text-violet-700 w-12 text-right">{input.contributoFondoDatore}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Parametri Fiscali ─────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-800">
                <UserIcon className="w-5 h-5 mr-2 text-emerald-500" /> Parametri Fiscali
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Regione</label>
                  <select className="w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2" value={input.region} onChange={e => handleInputChange('region', e.target.value)}>
                    {REGIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
                </div>

                {/* Addizionale comunale — era assente nell'originale! */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Addizionale Comunale IRPEF <span className="text-slate-400 font-normal">%</span>
                  </label>
                  <input type="number" min={0} max={1.2} step={0.1} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2" value={input.municipalityAddizionale} onChange={e => handleInputChange('municipalityAddizionale', parseFloat(e.target.value) || 0)} />
                  <p className="text-[10px] text-slate-400 mt-1">Aliquota deliberata dal proprio Comune (0-1.2%). Verifica sul sito del tuo Comune.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Figli a carico</label>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => handleInputChange('childrenDependent', Math.max(0, input.childrenDependent - 1))} className="px-3 py-1 bg-slate-100 rounded">-</button>
                    <span className="font-semibold w-6 text-center">{input.childrenDependent}</span>
                    <button onClick={() => handleInputChange('childrenDependent', input.childrenDependent + 1)} className="px-3 py-1 bg-slate-100 rounded">+</button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={input.coniugeACarico ?? false} onChange={e => handleInputChange('coniugeACarico', e.target.checked)} />
                    Coniuge a carico
                  </label>
                  <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>Reddito annuo &lt; €2.840,51</small>
                </div>

                {(input.childrenDependent ?? 0) > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">di cui under 3 anni</label>
                      <input id="figliUnder3" type="number" min={0} max={input.childrenDependent} value={input.figliUnder3 ?? 0} onChange={e => handleInputChange('figliUnder3', Math.min(Number(e.target.value), input.childrenDependent))} className="w-20 border-slate-300 rounded-lg shadow-sm text-center text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        di cui con disabilità <span title="Art. 12 co.1-bis TUIR" style={{ cursor: 'help' }}>ⓘ</span>
                      </label>
                      <input id="figliDisabili" type="number" min={0} max={input.childrenDependent} value={input.figliDisabili ?? 0} onChange={e => handleInputChange('figliDisabili', Math.min(Number(e.target.value), input.childrenDependent))} className="w-20 border-slate-300 rounded-lg shadow-sm text-center text-sm" />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="flex items-start cursor-pointer group">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded" checked={input.applyTrattamentoIntegrativo} onChange={e => handleInputChange('applyTrattamentoIntegrativo', e.target.checked)} />
                    <div className="ml-3">
                      <span className="block text-sm font-bold text-slate-700 flex items-center"><PlusCircle className="w-4 h-4 mr-1 text-indigo-500" /> Trattamento Integrativo</span>
                      <span className="block text-xs text-slate-500">Ex Bonus Renzi (15-28k)</span>
                    </div>
                  </label>
                  <label className="flex items-start cursor-pointer group">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded" checked={input.applyUlterioreDetrazione} onChange={e => handleInputChange('applyUlterioreDetrazione', e.target.checked)} />
                    <div className="ml-3">
                      <span className="block text-sm font-bold text-slate-700 flex items-center"><ShieldCheck className="w-4 h-4 mr-1 text-blue-500" /> Ulteriore Detrazione 2025</span>
                      <span className="block text-xs text-slate-500">Cuneo Fiscale (20-40k)</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* ── Azienda ───────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-800">
                <Building className="w-5 h-5 mr-2 text-orange-500" /> Azienda
              </h2>
              <div className="flex space-x-4">
                {(['under15', 'over15'] as const).map(size => (
                  <label key={size} className="flex items-center">
                    <input type="radio" checked={input.companySize === size} onChange={() => handleInputChange('companySize', size)} />
                    <span className="ml-2 text-sm">{size === 'under15' ? '< 15 Dip.' : '> 15 Dip.'}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN ───────────────────────────────────── */}
          <div className="xl:col-span-8">
            {result && (
              <>
                <ResultsView
                  result={result} input={input} ccnlDb={ccnlDb}
                  comparisonResult={comparisonResult}
                  onPinScenario={() => { if (result) setComparisonResult({ ...result }); }}
                  onClearPin={() => setComparisonResult(null)}
                />
                <AIInsights result={result} input={input} ccnlName={ccnlDb[input.ccnl]?.name || input.ccnl} />
                <PayslipChecker result={result} input={input} ccnlName={ccnlDb[input.ccnl]?.name || input.ccnl} />
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
