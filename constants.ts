import { CCNLData } from './types';

/**
 * ─── CONFIGURAZIONE BACKOFFICE ───────────────────────────────────────────────
 * Email admin — unico account con accesso al pannello di gestione CCNL.
 * Modificare prima del deploy.
 */
export const ADMIN_EMAIL = 'admin@immedia.it';

/** Percorso base PDF CCNL serviti staticamente da Vercel */
export const CCNL_PDF_BASE_PATH = '/ccnl-docs/';

/** Deducibilità massima contributi previdenza complementare (art. 10 TUIR + D.Lgs. 252/2005) */
export const MAX_DEDUCIBILE_FONDO_PENSIONE = 5164.57;

// Aliquote addizionali regionali IRPEF 2024
export const REGIONS = [
  { name: 'Abruzzo', rate: 1.73 },
  { name: 'Basilicata', rate: 1.23 },
  { name: 'Calabria', rate: 2.03 },
  { name: 'Campania', rate: 2.03 },
  { name: 'Emilia-Romagna', rate: 1.33 },
  { name: 'Friuli-Venezia Giulia', rate: 0.70 },
  { name: 'Lazio', rate: 3.33 },
  { name: 'Liguria', rate: 1.23 },
  { name: 'Lombardia', rate: 1.23 },
  { name: 'Marche', rate: 1.53 },
  { name: 'Molise', rate: 2.03 },
  { name: 'Piemonte', rate: 1.62 },
  { name: 'Puglia', rate: 1.23 },
  { name: 'Sardegna', rate: 1.23 },
  { name: 'Sicilia', rate: 1.23 },
  { name: 'Toscana', rate: 1.42 },
  { name: 'Trentino-Alto Adige', rate: 1.23 },
  { name: 'Umbria', rate: 1.63 },
  { name: "Valle d'Aosta", rate: 0.70 },
  { name: 'Veneto', rate: 1.23 },
  { name: 'Altro (Media Nazionale)', rate: 1.50 },
];

export const CCNL_DB: Record<string, CCNLData> = {

  // ─── COMMERCIO E TERZIARIO ──────────────────────────────────────────────
  commercio: {
    id: 'commercio',
    name: 'Commercio e Terziario (Rinnovo 2024)',
    mensilita: 14,
    ferieAnnuali: 26,
    rolAnnuali: 72,
    oreSettimanaliFullTime: 40,
    maternitaObbligatoria: '80% INPS + 20% integrazione ditta',
    maternitaFacoltativa: '30% della retribuzione',
    integrazioneMalattia: '100% per i primi 3 gg, poi 75% fino al 20° gg',
    periodoComporto: '180 giorni per anno solare',
    pdfFilename: 'commercio.pdf',
    // 7 scatti biennali — importi indicativi per livello 4 (Rinnovo 2024)
    scattiAnzianita: [
      { anni: 2,  incremento: 10.73 },
      { anni: 4,  incremento: 10.73 },
      { anni: 6,  incremento: 10.73 },
      { anni: 8,  incremento: 10.73 },
      { anni: 10, incremento: 10.73 },
      { anni: 12, incremento: 10.73 },
      { anni: 14, incremento: 10.73 },
    ],
    levels: [
      { level: 'Q',  minimoTabellare: 2883.05 },
      { level: '1',  minimoTabellare: 2427.50 },
      { level: '2',  minimoTabellare: 2172.08 },
      { level: '3',  minimoTabellare: 1935.77 },
      { level: '4',  minimoTabellare: 1747.56 },
      { level: '5',  minimoTabellare: 1630.05 },
      { level: '6',  minimoTabellare: 1519.53 },
      { level: '7',  minimoTabellare: 1406.46 },
    ],
  },

  // ─── METALMECCANICA INDUSTRIA ───────────────────────────────────────────
  metalmeccanica: {
    id: 'metalmeccanica',
    name: 'Metalmeccanica Industria (Giugno 2024)',
    mensilita: 13,
    ferieAnnuali: 20,
    rolAnnuali: 72,
    oreSettimanaliFullTime: 40,
    maternitaObbligatoria: '80% INPS + integrazione totale ditta',
    maternitaFacoltativa: '30% della retribuzione',
    integrazioneMalattia: '100% per i primi 3 gg (carenza)',
    periodoComporto: 'Fino a 270 gg per anzianità > 6 anni',
    pdfFilename: 'metalmeccanica.pdf',
    // 5 scatti biennali — importi indicativi per livello C2
    scattiAnzianita: [
      { anni: 2,  incremento: 17.16 },
      { anni: 4,  incremento: 17.16 },
      { anni: 6,  incremento: 17.16 },
      { anni: 8,  incremento: 17.16 },
      { anni: 10, incremento: 17.16 },
    ],
    levels: [
      { level: 'A1 (ex 8Q)', minimoTabellare: 2724.89 },
      { level: 'B3 (ex 7)',  minimoTabellare: 2664.12 },
      { level: 'B2 (ex 6)',  minimoTabellare: 2364.96 },
      { level: 'B1 (ex 5S)', minimoTabellare: 2205.34 },
      { level: 'C3 (ex 5)',  minimoTabellare: 2069.82 },
      { level: 'C2 (ex 4)',  minimoTabellare: 1845.06 },
      { level: 'C1 (ex 3)',  minimoTabellare: 1812.65 },
      { level: 'D2 (ex 2)',  minimoTabellare: 1633.28 },
      { level: 'D1 (ex 1)',  minimoTabellare: 1479.07 },
    ],
  },

  // ─── TURISMO E PUBBLICI ESERCIZI ────────────────────────────────────────
  turismo: {
    id: 'turismo',
    name: 'Turismo - Pubblici Esercizi (2024)',
    mensilita: 14,
    ferieAnnuali: 26,
    rolAnnuali: 104,
    oreSettimanaliFullTime: 40,
    maternitaObbligatoria: '80% INPS + 20% ditta',
    maternitaFacoltativa: '30% fino a 12 anni di età',
    integrazioneMalattia: 'Integrazione al 100% dal 4° al 180° gg',
    periodoComporto: '180 giorni in un anno',
    pdfFilename: 'turismo.pdf',
    // 6 scatti biennali — importi indicativi per livello 3
    scattiAnzianita: [
      { anni: 2,  incremento: 11.22 },
      { anni: 4,  incremento: 11.22 },
      { anni: 6,  incremento: 11.22 },
      { anni: 8,  incremento: 11.22 },
      { anni: 10, incremento: 11.22 },
      { anni: 12, incremento: 11.22 },
    ],
    levels: [
      { level: 'QA', minimoTabellare: 2465.00 },
      { level: 'QB', minimoTabellare: 2297.00 },
      { level: '1',  minimoTabellare: 2146.00 },
      { level: '2',  minimoTabellare: 1960.00 },
      { level: '3',  minimoTabellare: 1832.00 },
      { level: '4',  minimoTabellare: 1708.00 },
      { level: '5',  minimoTabellare: 1584.00 },
      { level: '6S', minimoTabellare: 1528.00 },
      { level: '6',  minimoTabellare: 1478.00 },
      { level: '7',  minimoTabellare: 1372.00 },
    ],
  },

  // ─── MULTISERVIZI / PULIZIE ───────────────────────────────────────────────
  multiservizi: {
    id: 'multiservizi',
    name: 'Multiservizi / Pulizie (2024)',
    mensilita: 13,
    ferieAnnuali: 22,
    rolAnnuali: 40,
    oreSettimanaliFullTime: 40,
    maternitaObbligatoria: '80% INPS',
    maternitaFacoltativa: '30% della retribuzione',
    integrazioneMalattia: '100% per i primi 3 gg, poi 75%',
    periodoComporto: '180 giorni',
    pdfFilename: 'multiservizi.pdf',
    // 5 scatti triennali — importi indicativi per livello 3
    scattiAnzianita: [
      { anni: 3,  incremento: 8.20 },
      { anni: 6,  incremento: 8.20 },
      { anni: 9,  incremento: 8.20 },
      { anni: 12, incremento: 8.20 },
      { anni: 15, incremento: 8.20 },
    ],
    levels: [
      { level: 'Q', minimoTabellare: 2300.50 },
      { level: '1', minimoTabellare: 1950.20 },
      { level: '2', minimoTabellare: 1780.40 },
      { level: '3', minimoTabellare: 1620.80 },
      { level: '4', minimoTabellare: 1510.50 },
      { level: '5', minimoTabellare: 1420.30 },
      { level: '6', minimoTabellare: 1350.10 },
    ],
  },

  // ─── SANITÀ PRIVATA (AIOP/ARIS) ─────────────────────────────────────────
  sanita_privata: {
    id: 'sanita_privata',
    name: 'Sanità Privata AIOP/ARIS (2024)',
    mensilita: 13,
    ferieAnnuali: 28,
    rolAnnuali: 56,
    oreSettimanaliFullTime: 38,
    maternitaObbligatoria: '80% INPS + integrazione ditta al 100%',
    maternitaFacoltativa: '30% della retribuzione',
    integrazioneMalattia: '100% per i primi 6 mesi; 50% per i successivi 6',
    periodoComporto: '18 mesi cumulabili nei 36 mesi precedenti',
    pdfFilename: 'sanita_privata.pdf',
    // 5 scatti biennali — importi indicativi per livello E
    scattiAnzianita: [
      { anni: 2,  incremento: 13.43 },
      { anni: 4,  incremento: 13.43 },
      { anni: 6,  incremento: 13.43 },
      { anni: 8,  incremento: 13.43 },
      { anni: 10, incremento: 13.43 },
    ],
    levels: [
      { level: 'A - Quadri Superiori',        minimoTabellare: 3245.00 },
      { level: 'B - Quadri',                  minimoTabellare: 2875.00 },
      { level: 'C - Direttivi',               minimoTabellare: 2460.00 },
      { level: 'D - Specializzati Superiori', minimoTabellare: 2145.00 },
      { level: 'E - Specializzati',           minimoTabellare: 1965.00 },
      { level: 'F - Qualificati',             minimoTabellare: 1790.00 },
      { level: 'G - Comuni',                  minimoTabellare: 1620.00 },
      { level: 'H - Ausiliari',               minimoTabellare: 1480.00 },
    ],
  },
};
