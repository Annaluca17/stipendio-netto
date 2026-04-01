export type CCNLType = string;

export interface CCNLLevel {
  level: string;
  minimoTabellare: number;
}

export interface ScattoAnzianita {
  /** Anni di servizio necessari per maturare questo scatto */
  anni: number;
  /** Importo mensile lordo aggiuntivo (incrementale, non cumulativo) */
  incremento: number;
}

export interface CCNLData {
  id: string;
  name: string;
  mensilita: 13 | 14;
  ferieAnnuali: number;
  rolAnnuali: number;
  oreSettimanaliFullTime: number;
  maternitaObbligatoria: string;
  maternitaFacoltativa: string;
  integrazioneMalattia: string;
  periodoComporto: string;
  levels: CCNLLevel[];
  /**
   * Scatti di anzianità per scadenza (incrementali). Valori indicativi per livello medio.
   * Il totale maturato = somma degli incrementi dove anni <= anzianità attuale.
   */
  scattiAnzianita: ScattoAnzianita[];
  /**
   * Nome del file PDF depositato in /public/ccnl-docs/.
   * Se valorizzato, mostra link "Testo CCNL" nel selettore.
   */
  pdfFilename?: string;
}

export interface UserInput {
  ccnl: CCNLType;
  level: string;
  contractType: 'indeterminato' | 'determinato' | 'apprendistato';
  renewals: number;
  partTimePercentage: number;
  region: string;
  municipalityAddizionale: number;
  childrenDependent: number;
  figliUnder3?: number;
  figliDisabili?: number;
  coniugeACarico?: boolean;
  startDate: string;
  companySize: 'under15' | 'over15';
  ralOverride?: number;
  applyTrattamentoIntegrativo: boolean;
  applyUlterioreDetrazione: boolean;
  annoApprendistato?: number;
  /** Superminimo individuale mensile lordo (€/mese, pensionabile) */
  superminimo: number;
  /** Altre indennità personali mensili lorde (es. indennità di funzione, turno, ecc.) */
  indennitaPersonali: number;
  /** Destinazione TFR */
  tfrDestination: 'azienda' | 'fondo';
  /** Contributo dipendente a fondo pensione complementare (% RAL annua) */
  contributoFondoDipendente: number;
  /** Contributo datore a fondo pensione complementare (% RAL annua) */
  contributoFondoDatore: number;
}

export interface CalculationResult {
  ral: number;
  monthlyGross: number;
  inpsEmployee: number;
  aliquotaInpsEmployee: number;
  taxableIncome: number;
  irpefGross: number;
  detrazioniLavoro: number;
  familyDeductions: number;
  spouseDeduction: number;
  ulterioreDetrazione2025: number;
  bonusCuneo2025: number;
  trattamentoIntegrativoRenzi: number;
  addizionali: number;
  regionalTax: number;
  muniTax: number;
  isFirstYear: boolean;
  irpefNet: number;
  netSalaryYearly: number;
  netSalaryMonthly: number;
  tfrAnnualAccrual: number;
  tfrTotalEstimated: number;
  vacationDaysAccrued: number;
  rolHoursAccrued: number;
  companyCost: number;
  inpsEmployer: number;
  addizionaleDeterminato: number;
  /** Scatto mensile corrente maturato (somma incrementi) */
  scattoMensileCorrente: number;
  /** Anni mancanti al prossimo scatto (null se al massimo) */
  anniAlProssimoScatto: number | null;
  /** Importo del prossimo scatto (0 se al massimo) */
  prossimoScattoImporto: number;
  /** Anni di servizio calcolati dalla data inizio */
  yearsOfService: number;
  /** Contributo annuo dipendente al fondo (€) */
  contributoFondoDipendenteEuro: number;
  /** Contributo annuo datore al fondo (€) */
  contributoFondoDatoreEuro: number;
  /** Risparmio IRPEF annuo per contributi deducibili al fondo */
  beneficioFiscaleFondoAnnuo: number;
  /** Netto aggiuntivo mensile grazie all'effetto leva fiscale del fondo */
  nettoAggiuntivoDaFondo: number;
}

export interface SavedProfile {
  id: string;
  name: string;
  createdAt: string;
  data: UserInput;
}

export interface User {
  email: string;
  profiles: SavedProfile[];
}
