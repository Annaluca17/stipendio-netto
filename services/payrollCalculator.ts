import { UserInput, CalculationResult, CCNLData } from '../types';
import { REGIONS, MAX_DEDUCIBILE_FONDO_PENSIONE } from '../constants';

// ─── IRPEF 2024-2025 (art. 11 TUIR) ─────────────────────────────────────────
const calculateIrpef = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;
  if (taxableIncome <= 28000) return taxableIncome * 0.23;
  if (taxableIncome <= 50000) return 6440 + (taxableIncome - 28000) * 0.35;
  return 14140 + (taxableIncome - 50000) * 0.43;
};

// Aliquota marginale per calcolo beneficio deducibilità fondo
const getMarginalRate = (taxableIncome: number): number => {
  if (taxableIncome <= 28000) return 0.23;
  if (taxableIncome <= 50000) return 0.35;
  return 0.43;
};

// ─── DETRAZIONI LAVORO DIPENDENTE (art. 13 TUIR) ──────────────────────────
const calculateStandardWorkDeductions = (income: number): number => {
  if (income <= 0) return 1955;
  if (income <= 15000) return 1955;
  if (income <= 28000) return 1910 + 1190 * ((28000 - income) / 13000);
  if (income <= 50000) return Math.max(0, 1910 * ((50000 - income) / 22000));
  return 0;
};

// ─── DETRAZIONI FIGLI A CARICO (art. 12 c.1 lett. c TUIR) ────────────────
const calculateChildDeductions = (
  taxableIncome: number, numFigli: number, figliUnder3: number, figliDisabili: number
): number => {
  if (numFigli <= 0) return 0;
  const under3 = Math.min(figliUnder3, numFigli);
  const disabili = Math.min(figliDisabili, numFigli);
  const soglia = 95000 + 15000 * (numFigli - 1);
  const coefficiente = Math.max(0, (soglia - taxableIncome) / soglia);
  return (950 * numFigli + 200 * under3 + 400 * disabili) * coefficiente;
};

// ─── DETRAZIONI CONIUGE A CARICO (art. 12 c.1 lett. b TUIR) ────────────
const calculateSpouseDeduction = (taxableIncome: number, coniugeACarico: boolean): number => {
  if (!coniugeACarico) return 0;
  if (taxableIncome <= 15000) return 800;
  if (taxableIncome <= 40000) return 690 + 110 * ((40000 - taxableIncome) / 25000);
  if (taxableIncome <= 80000) return Math.max(0, 690 * ((80000 - taxableIncome) / 40000));
  return 0;
};

// ─── VALIDAZIONE INPUT ──────────────────────────────────────────────────
export const validateInput = (input: UserInput): string[] => {
  const errors: string[] = [];
  if (input.ralOverride !== undefined && input.ralOverride !== null) {
    if (input.ralOverride < 0) errors.push('La RAL non può essere negativa.');
    if (input.ralOverride > 500000) errors.push('La RAL inserita sembra eccessiva (max 500.000€).');
  }
  if (input.partTimePercentage < 1 || input.partTimePercentage > 100)
    errors.push('Percentuale part-time non valida (1-100).');
  if (input.childrenDependent < 0 || input.childrenDependent > 20)
    errors.push('Numero di figli non valido (0-20).');
  if ((input.figliUnder3 ?? 0) > input.childrenDependent)
    errors.push('Figli under 3 superiori al totale figli.');
  if ((input.figliDisabili ?? 0) > input.childrenDependent)
    errors.push('Figli disabili superiori al totale figli.');
  if (input.municipalityAddizionale < 0 || input.municipalityAddizionale > 1.2)
    errors.push('Addizionale comunale non valida (0-1.2%).');
  if (input.renewals < 0 || input.renewals > 10)
    errors.push('Numero rinnovi non valido (0-10).');
  if (input.contractType === 'apprendistato') {
    const anno = input.annoApprendistato ?? 1;
    if (anno < 1 || anno > 5) errors.push('Anno apprendistato non valido (1-5).');
  }
  if (input.superminimo < 0) errors.push('Superminimo non può essere negativo.');
  if (input.indennitaPersonali < 0) errors.push('Indennità personali non possono essere negative.');
  if (input.contributoFondoDipendente < 0 || input.contributoFondoDipendente > 10)
    errors.push('Contributo fondo dipendente non valido (0-10%).');
  if (input.contributoFondoDatore < 0 || input.contributoFondoDatore > 10)
    errors.push('Contributo fondo datore non valido (0-10%).');
  return errors;
};

// ─── CALCOLO BUSTA PAGA PRINCIPALE ───────────────────────────────────────
export const calculatePayroll = (input: UserInput, ccnlDb: Record<string, CCNLData>): CalculationResult => {
  const ccnl = ccnlDb[input.ccnl];
  if (!ccnl) throw new Error(`CCNL non trovato: ${input.ccnl}`);

  const validationErrors = validateInput(input);
  if (validationErrors.length > 0)
    throw new Error(`Dati non validi:\n${validationErrors.join('\n')}`);

  // ── ANZIANITÀ ──────────────────────────────────────────────────────────
  const startDate = new Date(input.startDate);
  const diffMs = Math.abs(Date.now() - startDate.getTime());
  const yearsOfService = diffMs / (1000 * 60 * 60 * 24 * 365.25);

  // Scatti maturati (somma incrementi dove anni <= yearsOfService)
  const scattiMaturati = ccnl.scattiAnzianita.filter(s => s.anni <= yearsOfService);
  const scattoMensileCorrente = scattiMaturati.reduce((sum, s) => sum + s.incremento, 0);

  // Prossimo scatto
  const prossimoScattoEntry = ccnl.scattiAnzianita.find(s => s.anni > yearsOfService);
  const anniAlProssimoScatto = prossimoScattoEntry
    ? Math.ceil(prossimoScattoEntry.anni - yearsOfService)
    : null;
  const prossimoScattoImporto = prossimoScattoEntry?.incremento ?? 0;

  // ── BASE RETRIBUTIVA ───────────────────────────────────────────────────
  const levelData = ccnl.levels.find(l => l.level === input.level) ?? ccnl.levels[0];
  let monthlyBase = levelData.minimoTabellare;

  // Apprendistato (art. 42 D.Lgs. 81/2015)
  if (input.contractType === 'apprendistato') {
    const annoApp = Math.min(5, Math.max(1, input.annoApprendistato ?? 1));
    const riduzione = annoApp === 1 ? 0.70 : annoApp === 2 ? 0.80 : 0.90;
    monthlyBase *= riduzione;
  }

  if (input.partTimePercentage < 100) {
    monthlyBase *= (input.partTimePercentage / 100);
  }

  // Scatti, superminimo, indennità (proporzionali al part-time per scatti; fissi per superminimo/indennità)
  const scattoProportional = scattoMensileCorrente * (input.partTimePercentage / 100);
  const monthlyGrossTotal = monthlyBase + scattoProportional + input.superminimo + input.indennitaPersonali;

  // RAL
  let ral = input.ralOverride && input.ralOverride > 0
    ? input.ralOverride
    : monthlyGrossTotal * ccnl.mensilita;

  // ── INPS DIPENDENTE ────────────────────────────────────────────────────
  let aliquotaInpsEmployee = 0.0919;
  if (input.contractType === 'apprendistato') {
    const annoApp = Math.min(5, Math.max(1, input.annoApprendistato ?? 1));
    aliquotaInpsEmployee = annoApp <= 2 ? 0.0584 : 0.0784;
  }
  const inpsEmployee = ral * aliquotaInpsEmployee;

  // ── PREVIDENZA COMPLEMENTARE — riduzione imponibile IRPEF ─────────────
  // Contributo dipendente deducibile fino a MAX_DEDUCIBILE_FONDO_PENSIONE
  const contributoFondoDipendenteEuro = input.tfrDestination === 'fondo'
    ? ral * (input.contributoFondoDipendente / 100)
    : 0;
  const contributoFondoDatoreEuro = input.tfrDestination === 'fondo'
    ? ral * (input.contributoFondoDatore / 100)
    : 0;
  const deduzioneEffettivaFondo = Math.min(contributoFondoDipendenteEuro, MAX_DEDUCIBILE_FONDO_PENSIONE);

  // ── IMPONIBILE IRPEF (al netto di INPS e deducibilità fondo) ──────────
  const taxableIncome = Math.max(0, ral - inpsEmployee - deduzioneEffettivaFondo);

  // ── IRPEF LORDA ────────────────────────────────────────────────────────
  const irpefGross = calculateIrpef(taxableIncome);

  // ── DETRAZIONI ─────────────────────────────────────────────────────────
  const detrazioniLavoro = calculateStandardWorkDeductions(taxableIncome);
  const familyDeductions = calculateChildDeductions(
    taxableIncome, input.childrenDependent, input.figliUnder3 ?? 0, input.figliDisabili ?? 0
  );
  const spouseDeduction = calculateSpouseDeduction(taxableIncome, input.coniugeACarico ?? false);

  // ── TRATTAMENTO INTEGRATIVO (ex Renzi) ─────────────────────────────────
  let trattamentoIntegrativoRenzi = 0;
  if (input.applyTrattamentoIntegrativo && taxableIncome > 8174 && irpefGross > 0) {
    if (taxableIncome <= 15000) trattamentoIntegrativoRenzi = 1200;
    else if (taxableIncome <= 28000) trattamentoIntegrativoRenzi = 1200 * ((28000 - taxableIncome) / 13000);
    trattamentoIntegrativoRenzi = Math.min(trattamentoIntegrativoRenzi, irpefGross);
  }

  // ── CUNEO FISCALE 2025 (D.Lgs. 108/2024) ──────────────────────────────
  let bonusCuneo2025 = 0;
  let ulterioreDetrazione2025 = 0;
  if (input.applyUlterioreDetrazione) {
    if (ral > 8500 && ral <= 20000) bonusCuneo2025 = 1000;
    else if (ral > 20000 && ral <= 32000) ulterioreDetrazione2025 = 1000;
    else if (ral > 32000 && ral <= 40000) ulterioreDetrazione2025 = 1000 * ((40000 - ral) / 8000);
  }

  // ── ADDIZIONALI ────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const isFirstYear = startDate.getFullYear() >= currentYear;
  const regionRate = (REGIONS.find(r => r.name === input.region)?.rate ?? 1.50) / 100;
  const regionalTax = isFirstYear ? 0 : taxableIncome * regionRate;
  const muniTax = isFirstYear ? 0 : taxableIncome * (input.municipalityAddizionale / 100);
  const totalAddizionali = regionalTax + muniTax;

  // ── IRPEF NETTA ────────────────────────────────────────────────────────
  const irpefNet = Math.max(0,
    irpefGross - detrazioniLavoro - familyDeductions - spouseDeduction - ulterioreDetrazione2025
  );

  // ── NETTO FINALE ───────────────────────────────────────────────────────
  // Nota: contributo fondo dipendente riduce il netto (esce dalla busta paga)
  const netSalaryYearly =
    taxableIncome
    - irpefNet
    - totalAddizionali
    + trattamentoIntegrativoRenzi
    + bonusCuneo2025
    - contributoFondoDipendenteEuro; // il versamento al fondo riduce il netto
  const netSalaryMonthly = netSalaryYearly / ccnl.mensilita;

  // ── BENEFICIO FISCALE FONDO ────────────────────────────────────────────
  // Risparmio IRPEF = deducibile × aliquota marginale
  const beneficioFiscaleFondoAnnuo = input.tfrDestination === 'fondo'
    ? deduzioneEffettivaFondo * getMarginalRate(taxableIncome + deduzioneEffettivaFondo)
    : 0;
  // Netto aggiuntivo mensile netto-netto grazie al fondo
  const nettoAggiuntivoDaFondo = beneficioFiscaleFondoAnnuo / ccnl.mensilita;

  // ── TFR ────────────────────────────────────────────────────────────────
  const tfrAnnualAccrual = (ral / 13.5) - (ral * 0.005);
  const tfrTotalEstimated = tfrAnnualAccrual * yearsOfService;

  // ── COSTI AZIENDALI ────────────────────────────────────────────────────
  let baseEmployerRate: number;
  if (input.contractType === 'apprendistato') {
    baseEmployerRate = 0.1150;
  } else {
    baseEmployerRate = input.companySize === 'under15' ? 0.28 : 0.30;
  }
  let addizionaleDeterminato = 0;
  if (input.contractType === 'determinato') {
    addizionaleDeterminato = ral * (0.014 + input.renewals * 0.005);
  }
  const inpsEmployer = ral * baseEmployerRate + addizionaleDeterminato;
  // Se TFR a fondo: il TFR non si accumula in azienda (il costo aziendale include comunque il contributo datore al fondo)
  const companyCost = ral + inpsEmployer + tfrAnnualAccrual + contributoFondoDatoreEuro;

  return {
    ral,
    monthlyGross: ral / ccnl.mensilita,
    inpsEmployee,
    aliquotaInpsEmployee,
    taxableIncome,
    irpefGross,
    detrazioniLavoro,
    familyDeductions,
    spouseDeduction,
    ulterioreDetrazione2025,
    bonusCuneo2025,
    trattamentoIntegrativoRenzi,
    addizionali: totalAddizionali,
    regionalTax,
    muniTax,
    isFirstYear,
    irpefNet,
    netSalaryYearly,
    netSalaryMonthly,
    tfrAnnualAccrual,
    tfrTotalEstimated,
    vacationDaysAccrued: ccnl.ferieAnnuali,
    rolHoursAccrued: ccnl.rolAnnuali * (input.partTimePercentage / 100),
    companyCost,
    inpsEmployer,
    addizionaleDeterminato,
    scattoMensileCorrente,
    anniAlProssimoScatto,
    prossimoScattoImporto,
    yearsOfService,
    contributoFondoDipendenteEuro,
    contributoFondoDatoreEuro,
    beneficioFiscaleFondoAnnuo,
    nettoAggiuntivoDaFondo,
  };
};
