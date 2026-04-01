import React, { useMemo } from 'react';
import { CalculationResult, UserInput } from '../types';
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  result: CalculationResult;
  input: UserInput;
  ccnlName: string;
}

interface Insight {
  type: 'info' | 'warning' | 'success' | 'tip';
  title: string;
  body: string;
}

function generateInsights(result: CalculationResult, input: UserInput): Insight[] {
  const insights: Insight[] = [];
  const fmt = (n: number) => `€${Math.round(n).toLocaleString('it-IT')}`;

  const netPercent = Math.round((result.netSalaryYearly / result.ral) * 100);
  insights.push({
    type: netPercent >= 72 ? 'success' : netPercent >= 65 ? 'info' : 'warning',
    title: 'Rapporto Netto / Lordo',
    body: `Ricevi il ${netPercent}% della RAL come netto (${fmt(result.netSalaryMonthly)}/mese). ${
      netPercent >= 72 ? 'Ottimo risultato grazie alle detrazioni applicate.' :
      netPercent >= 65 ? 'Nella media per il tuo scaglione IRPEF.' :
      'La pressione fiscale è elevata per questa fascia di reddito.'
    }`,
  });

  // Scatti anzianità
  if (result.scattoMensileCorrente > 0) {
    insights.push({
      type: 'success',
      title: 'Scatto di Anzianità Attivo',
      body: `Hai maturato ${fmt(result.scattoMensileCorrente)}/mese di scatto anzianità (${fmt(result.scattoMensileCorrente * 12)}/anno).${result.anniAlProssimoScatto != null ? ` Il prossimo scatto (+${fmt(result.prossimoScattoImporto)}/mese) scatterà tra circa ${result.anniAlProssimoScatto} ann${result.anniAlProssimoScatto === 1 ? 'o' : 'i'}.` : ' Hai raggiunto il massimo scatto previsto dal CCNL.'}`,
    });
  } else if (result.anniAlProssimoScatto != null) {
    insights.push({
      type: 'info',
      title: 'Prossimo Scatto di Anzianità',
      body: `Nessuno scatto ancora maturato. Il primo scatto (+${fmt(result.prossimoScattoImporto)}/mese) sarà disponibile tra ${result.anniAlProssimoScatto} ann${result.anniAlProssimoScatto === 1 ? 'o' : 'i'}.`,
    });
  }

  // Superminimo / indennità
  if (input.superminimo > 0 || input.indennitaPersonali > 0) {
    const extra = (input.superminimo + input.indennitaPersonali) * 12;
    insights.push({
      type: 'tip',
      title: 'Voci Aggiuntive in Retribuzione',
      body: `Superminimo e indennità personali contribuiscono per ${fmt(extra)}/anno alla RAL, aumentando sia il netto che la base contributiva per INPS e TFR.`,
    });
  }

  if (result.trattamentoIntegrativoRenzi > 0) {
    insights.push({
      type: 'success',
      title: 'Bonus Trattamento Integrativo',
      body: `Hai diritto al bonus ex-Renzi di ${fmt(result.trattamentoIntegrativoRenzi)}/anno (${fmt(result.trattamentoIntegrativoRenzi / 12)}/mese).`,
    });
  }

  if (result.ulterioreDetrazione2025 > 0 || result.bonusCuneo2025 > 0) {
    const total = result.ulterioreDetrazione2025 + result.bonusCuneo2025;
    insights.push({
      type: 'success',
      title: 'Cuneo Fiscale 2025',
      body: `Benefici del taglio cuneo fiscale 2025 per ${fmt(total)}/anno. Riduce direttamente le trattenute mensili.`,
    });
  }

  // Previdenza complementare
  if (input.tfrDestination === 'fondo') {
    if (result.beneficioFiscaleFondoAnnuo > 0) {
      insights.push({
        type: 'tip',
        title: 'Fondo Pensione — Beneficio Fiscale',
        body: `Il contributo al fondo genera un risparmio IRPEF di ${fmt(result.beneficioFiscaleFondoAnnuo)}/anno (+${fmt(result.nettoAggiuntivoDaFondo)}/mese netto). Considera di aumentare il contributo fino al massimo deducibile (€5.164,57/anno) per massimizzare il vantaggio.`,
      });
    }
  } else {
    insights.push({
      type: 'tip',
      title: 'Accantonamento TFR',
      body: `Maturate ${fmt(result.tfrAnnualAccrual / 12)}/mese di TFR (${fmt(result.tfrAnnualAccrual)}/anno). Valuta il conferimento a un fondo pensione: i contributi sono deducibili fino a €5.164,57/anno con tassazione agevolata all'erogazione (15%, ridotto fino al 9%).`,
    });
  }

  insights.push({
    type: 'info',
    title: "Costo Totale per l'Azienda",
    body: `Il costo annuo totale del contratto è ${fmt(result.companyCost)}, includendo contributi previdenziali, TFR${input.tfrDestination === 'fondo' ? ' e contributo datore al fondo' : ''}.`,
  });

  if (input.partTimePercentage < 100) {
    insights.push({
      type: 'warning',
      title: 'Impatto Part-Time',
      body: `Con il ${input.partTimePercentage}% part-time, un full-time equivalente varrebbe circa ${fmt(result.netSalaryYearly / (input.partTimePercentage / 100))} netti/anno.`,
    });
  }

  if (input.contractType === 'determinato') {
    insights.push({
      type: 'warning',
      title: 'Contratto a Tempo Determinato',
      body: `Addizionale NASpI 1,4%${input.renewals > 0 ? ` + 0,5% × ${input.renewals} rinnov${input.renewals > 1 ? 'i' : 'o'}` : ''} a carico dell'azienda.`,
    });
  }

  if (input.contractType === 'apprendistato') {
    insights.push({
      type: 'tip',
      title: 'Agevolazioni Apprendistato',
      body: `Aliquote INPS ridotte (${(result.aliquotaInpsEmployee * 100).toFixed(2)}% dipendente), abbassando il costo del lavoro rispetto a un contratto ordinario.`,
    });
  }

  return insights;
}

const iconMap = {
  info:    <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />,
  success: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />,
  tip:     <TrendingUp className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />,
};
const bgMap    = { info: 'bg-blue-50 border-blue-100', warning: 'bg-amber-50 border-amber-100', success: 'bg-emerald-50 border-emerald-100', tip: 'bg-indigo-50 border-indigo-100' };
const titleMap = { info: 'text-blue-800', warning: 'text-amber-800', success: 'text-emerald-800', tip: 'text-indigo-800' };

export const AIInsights: React.FC<Props> = ({ result, input, ccnlName }) => {
  const insights = useMemo(() => generateInsights(result, input), [result, input]);
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100 mt-6 animate-fade-in">
      <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
        <Lightbulb className="w-5 h-5 mr-2 text-indigo-600" />
        Analisi della Busta Paga
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((ins, i) => (
          <div key={i} className={`flex gap-3 p-4 rounded-xl border ${bgMap[ins.type]}`}>
            {iconMap[ins.type]}
            <div>
              <p className={`text-sm font-bold mb-1 ${titleMap[ins.type]}`}>{ins.title}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{ins.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
