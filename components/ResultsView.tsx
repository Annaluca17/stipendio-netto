import React, { useState } from 'react';
import { CalculationResult, UserInput, CCNLData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  Wallet, TrendingUp, PiggyBank, Info, ChevronDown, ChevronUp,
  Zap, ShieldCheck, CheckCircle2, Gift, Calendar, Clock, Baby,
  Stethoscope, ShieldAlert, Award, ArrowRight
} from 'lucide-react';

interface Props {
  result: CalculationResult;
  input: UserInput;
  ccnlDb: Record<string, CCNLData>;
  comparisonResult?: CalculationResult | null;
  onPinScenario?: () => void;
  onClearPin?: () => void;
}

const fmt = (val: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const delta = (curr: number, prev: number) => {
  const d = curr - prev;
  return { value: d, pct: prev !== 0 ? Math.round((d / Math.abs(prev)) * 100) : 0 };
};

export const ResultsView: React.FC<Props> = ({
  result, input, ccnlDb, comparisonResult, onPinScenario, onClearPin
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showWelfare, setShowWelfare] = useState(false);
  const currentCcnl = ccnlDb[input.ccnl];

  const pieData = [
    { name: 'Netto', value: Math.round(result.netSalaryYearly) },
    { name: 'IRPEF', value: Math.round(result.irpefNet) },
    { name: 'INPS', value: Math.round(result.inpsEmployee) },
    { name: 'Addizionali', value: Math.round(result.addizionali) },
  ];
  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Scenario comparison banner ──────────────────────────── */}
      {comparisonResult && (
        <div className="bg-indigo-900 text-white rounded-2xl p-4 flex flex-wrap items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-wide text-indigo-300">Confronto scenario pin</span>
          {[
            { label: 'Netto mensile', curr: result.netSalaryMonthly, prev: comparisonResult.netSalaryMonthly },
            { label: 'Costo aziendale', curr: result.companyCost, prev: comparisonResult.companyCost },
            { label: 'IRPEF', curr: result.irpefNet, prev: comparisonResult.irpefNet },
          ].map(({ label, curr, prev }) => {
            const d = delta(curr, prev);
            return (
              <div key={label} className="flex items-center gap-2 text-sm">
                <span className="text-indigo-300">{label}:</span>
                <span className="font-bold">{fmt(curr)}</span>
                <span className={`text-xs font-bold ${d.value > 0 ? 'text-emerald-400' : d.value < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {d.value > 0 ? '+' : ''}{fmt(d.value)} ({d.pct > 0 ? '+' : ''}{d.pct}%)
                </span>
              </div>
            );
          })}
          <button onClick={onClearPin} className="ml-auto text-xs text-indigo-300 hover:text-white underline">Rimuovi pin</button>
        </div>
      )}

      {/* ── KPI ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Netto Mensile</p>
          <h3 className="text-2xl font-black text-emerald-600">{fmt(result.netSalaryMonthly)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Stima {currentCcnl.mensilita} mensilità</p>
          {result.scattoMensileCorrente > 0 && (
            <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">incl. scatto +{fmt(result.scattoMensileCorrente * (input.partTimePercentage / 100))}/mese</p>
          )}
          <div className="absolute -right-2 -bottom-2 opacity-10 text-emerald-500"><Wallet size={64} /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cuneo Fiscale 2025</p>
          {result.bonusCuneo2025 > 0 ? (
            <><h3 className="text-2xl font-black text-indigo-600">+{fmt(result.bonusCuneo2025 / 12)}</h3><span className="text-[10px] text-indigo-400 font-bold uppercase">Bonus Netto (8.5-20k)</span></>
          ) : result.ulterioreDetrazione2025 > 0 ? (
            <><h3 className="text-2xl font-black text-blue-600">+{fmt(result.ulterioreDetrazione2025 / 12)}</h3><span className="text-[10px] text-blue-400 font-bold uppercase">Ulteriore Detrazione</span></>
          ) : (
            <><h3 className="text-2xl font-black text-slate-300">Nessuna</h3><span className="text-[10px] text-slate-400 uppercase">RAL oltre 40k</span></>
          )}
          <div className="absolute -right-2 -bottom-2 opacity-10 text-indigo-500"><Zap size={64} /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            {input.tfrDestination === 'fondo' ? 'Fondo Pensione' : 'Ex Bonus Renzi'}
          </p>
          {input.tfrDestination === 'fondo' ? (
            <>
              <h3 className="text-2xl font-black text-violet-600">+{fmt(result.nettoAggiuntivoDaFondo)}</h3>
              <p className="text-[10px] text-violet-400 font-bold uppercase">Beneficio fiscale /mese</p>
            </>
          ) : (
            <>
              <h3 className={`text-2xl font-black ${result.trattamentoIntegrativoRenzi > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                {result.trattamentoIntegrativoRenzi > 0 ? fmt(result.trattamentoIntegrativoRenzi / 12) : 'Inattivo'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Trattamento Integrativo</p>
            </>
          )}
          <div className="absolute -right-2 -bottom-2 opacity-10 text-amber-500"><Gift size={64} /></div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl shadow-lg flex flex-col justify-center text-white">
          <p className="text-[10px] font-bold uppercase opacity-80 text-indigo-400">RAL</p>
          <h3 className="text-2xl font-black">{fmt(result.ral)}</h3>
          <div className="mt-1 text-[10px] opacity-60">Imponibile: {fmt(result.taxableIncome)}</div>
          {(input.superminimo > 0 || input.indennitaPersonali > 0) && (
            <div className="mt-1 text-[10px] text-indigo-300">
              incl. extra {fmt((input.superminimo + input.indennitaPersonali) * 12)}/anno
            </div>
          )}
        </div>
      </div>

      {/* Pin scenario button */}
      {!comparisonResult && onPinScenario && (
        <div className="flex justify-end">
          <button
            onClick={onPinScenario}
            className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
          >
            <Award size={13} /> Pin scenario corrente per confronto
          </button>
        </div>
      )}

      {/* ── Charts + Agevolazioni ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
            <PiggyBank className="w-4 h-4 mr-2 text-indigo-500" /> Suddivisione RAL Annua
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" /> Agevolazioni Attive
          </h4>
          <div className="space-y-2.5">
            {[
              { label: 'Trattamento Integrativo (Ex Renzi)', value: result.trattamentoIntegrativoRenzi, color: 'amber', icon: <Gift size={14} /> },
              { label: 'Bonus Cuneo 2025 (8.5k-20k)', value: result.bonusCuneo2025, color: 'indigo', icon: <Zap size={14} /> },
              { label: 'Ulteriore Detrazione (20k-40k)', value: result.ulterioreDetrazione2025, color: 'blue', icon: <ShieldCheck size={14} /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className={`p-3 rounded-xl border ${value > 0 ? `bg-${color}-50 border-${color}-200` : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">{icon}{label}</div>
                  {value > 0 && <CheckCircle2 className={`text-${color}-500 w-4 h-4`} />}
                </div>
                <div className={`mt-1 text-sm font-black text-${color}-700`}>
                  {value > 0 ? fmt(value) : 'Non spettante'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TFR & Previdenza Complementare ─────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-bold text-slate-700">TFR & Previdenza Complementare</span>
          <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${input.tfrDestination === 'fondo' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>
            {input.tfrDestination === 'fondo' ? 'Fondo Pensione' : 'TFR in Azienda'}
          </span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase">TFR annuo maturato</p>
            <p className="text-xl font-black text-slate-800 mt-1">{fmt(result.tfrAnnualAccrual)}</p>
            <p className="text-[10px] text-slate-500 mt-1">{fmt(result.tfrAnnualAccrual / 12)}/mese</p>
          </div>
          {input.tfrDestination === 'fondo' ? (
            <>
              <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                <p className="text-[10px] font-bold text-violet-400 uppercase">Contributo annuo al fondo</p>
                <p className="text-xl font-black text-violet-800 mt-1">{fmt(result.contributoFondoDipendenteEuro)}</p>
                <p className="text-[10px] text-violet-500 mt-1">Dip. {input.contributoFondoDipendente}% + Dat. {fmt(result.contributoFondoDatoreEuro)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-[10px] font-bold text-emerald-400 uppercase">Risparmio IRPEF annuo</p>
                <p className="text-xl font-black text-emerald-800 mt-1">{fmt(result.beneficioFiscaleFondoAnnuo)}</p>
                <p className="text-[10px] text-emerald-600 mt-1">+{fmt(result.nettoAggiuntivoDaFondo)}/mese netto</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">TFR stimato accumulato</p>
                <p className="text-xl font-black text-slate-800 mt-1">{fmt(result.tfrTotalEstimated)}</p>
                <p className="text-[10px] text-slate-500 mt-1">{Math.round(result.yearsOfService * 10) / 10} anni servizio</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1"><ArrowRight size={10} /> Converti al fondo?</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">Contributi deducibili fino a €5.164/anno. Tassazione all'erogazione ridotta al 15% (fino al 9% con anzianità).</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Welfare & Diritti ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button onClick={() => setShowWelfare(!showWelfare)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <span className="text-sm font-bold text-slate-700 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-indigo-500" />
            Diritti & Welfare — {currentCcnl.name}
          </span>
          {showWelfare ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>
        {showWelfare && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/20 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <Calendar className="w-5 h-5 text-indigo-500 mt-1" />, label: 'Ferie Annuali', value: `${currentCcnl.ferieAnnuali} giorni / anno` },
                { icon: <Clock className="w-5 h-5 text-indigo-500 mt-1" />, label: 'Permessi (ROL)', value: `${currentCcnl.rolAnnuali} ore / anno` },
                { icon: <Baby className="w-5 h-5 text-pink-500 mt-1" />, label: 'Maternità Obbligatoria', value: currentCcnl.maternitaObbligatoria },
                { icon: <Gift className="w-5 h-5 text-pink-400 mt-1" />, label: 'Maternità Facoltativa', value: currentCcnl.maternitaFacoltativa },
                { icon: <Stethoscope className="w-5 h-5 text-emerald-500 mt-1" />, label: 'Integrazione Malattia', value: currentCcnl.integrazioneMalattia },
                { icon: <ShieldAlert className="w-5 h-5 text-amber-500 mt-1" />, label: 'Periodo di Comporto', value: currentCcnl.periodoComporto },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  {icon}
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p><p className="text-sm font-bold text-slate-700">{value}</p></div>
                </div>
              ))}
            </div>

            {/* Scatti di anzianità */}
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1 mb-3">
                <Award size={13} /> Scatti di Anzianità — {Math.round(result.yearsOfService * 10) / 10} anni servizio
              </p>
              <div className="flex flex-wrap gap-2">
                {currentCcnl.scattiAnzianita.map((s, i) => {
                  const maturato = s.anni <= result.yearsOfService;
                  return (
                    <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${maturato ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-500 border-slate-200'}`}>
                      {s.anni}a: +{fmt(s.incremento)}/m
                    </div>
                  );
                })}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-indigo-600 font-bold">Totale corrente: +{fmt(result.scattoMensileCorrente * (input.partTimePercentage / 100))}/mese lordo</span>
                {result.anniAlProssimoScatto != null && (
                  <span className="text-slate-500">Prossimo scatto (+{fmt(result.prossimoScattoImporto)}/m) tra {result.anniAlProssimoScatto} ann{result.anniAlProssimoScatto === 1 ? 'o' : 'i'}</span>
                )}
              </div>
              <p className="text-[10px] text-indigo-400 mt-2">* Importi indicativi per livello medio del CCNL. I valori esatti variano per livello contrattuale.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Dettaglio calcolo ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button onClick={() => setShowDetails(!showDetails)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <span className="text-sm font-bold text-slate-700 flex items-center">
            <Info className="w-4 h-4 mr-2 text-indigo-500" /> Esplodi voci di calcolo (Annuo)
          </span>
          {showDetails ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>
        {showDetails && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/20 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-2">
              <h5 className="text-[11px] uppercase font-black text-slate-400 mb-4 tracking-widest">Dettaglio Dipendente</h5>
              {[
                { label: 'RAL (comprensiva scatti/extra)', val: fmt(result.ral), color: '' },
                { label: `INPS ${(result.aliquotaInpsEmployee * 100).toFixed(2)}%`, val: `-${fmt(result.inpsEmployee)}`, color: 'text-red-600' },
                ...(input.tfrDestination === 'fondo' && result.contributoFondoDipendenteEuro > 0
                  ? [{ label: 'Contributo fondo (deducibile)', val: `-${fmt(result.contributoFondoDipendenteEuro)}`, color: 'text-violet-600' }]
                  : []),
                { label: 'Imponibile IRPEF', val: fmt(result.taxableIncome), color: 'font-bold' },
                { label: 'IRPEF Lorda', val: `-${fmt(result.irpefGross)}`, color: '' },
                { label: 'Detrazioni Lavoro', val: `+${fmt(result.detrazioniLavoro)}`, color: 'text-emerald-600' },
                ...(result.ulterioreDetrazione2025 > 0
                  ? [{ label: 'Detrazione Cuneo 2025', val: `+${fmt(result.ulterioreDetrazione2025)}`, color: 'text-blue-600' }]
                  : []),
                { label: 'Addizionali Locali', val: `-${fmt(result.addizionali)}`, color: 'text-red-500' },
                ...(result.trattamentoIntegrativoRenzi > 0
                  ? [{ label: 'Tratt. Integrativo (Renzi)', val: `+${fmt(result.trattamentoIntegrativoRenzi)}`, color: 'text-amber-600 font-black' }]
                  : []),
                ...(result.bonusCuneo2025 > 0
                  ? [{ label: 'Bonus Cuneo 2025', val: `+${fmt(result.bonusCuneo2025)}`, color: 'text-indigo-600 font-black' }]
                  : []),
              ].map(({ label, val, color }) => (
                <div key={label} className={`flex justify-between text-sm py-1 border-b border-slate-100 ${color}`}>
                  <span>{label}</span><span className="font-bold">{val}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h5 className="text-[11px] uppercase font-black text-slate-400 mb-4 tracking-widest">Azienda & Costi</h5>
              <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                <span>INPS Azienda (Base)</span><span className="font-bold">+{fmt(result.inpsEmployer - result.addizionaleDeterminato)}</span>
              </div>
              {result.addizionaleDeterminato > 0 && (
                <div className="flex justify-between text-sm py-1 border-b border-slate-100 text-amber-700">
                  <span>Addiz. NASpI (Determinato)</span><span className="font-bold">+{fmt(result.addizionaleDeterminato)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                <span>Accantonamento TFR</span><span className="font-bold">+{fmt(result.tfrAnnualAccrual)}</span>
              </div>
              {result.contributoFondoDatoreEuro > 0 && (
                <div className="flex justify-between text-sm py-1 border-b border-slate-100 text-violet-700">
                  <span>Contributo Datore al Fondo</span><span className="font-bold">+{fmt(result.contributoFondoDatoreEuro)}</span>
                </div>
              )}
              <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl shadow-lg">
                <div className="text-xs opacity-70 mb-1 font-bold uppercase">Costo Aziendale Totale</div>
                <div className="text-xl font-black text-indigo-400">{fmt(result.companyCost)}</div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg mt-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-slate-100 rounded-md mr-3 text-slate-400"><TrendingUp size={16} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">TFR Totale Stimato</p>
                    <p className="text-sm font-black text-slate-800">{fmt(result.tfrTotalEstimated)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
