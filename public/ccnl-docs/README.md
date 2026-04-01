# Cartella Documenti CCNL

Questa cartella contiene i PDF ufficiali dei Contratti Collettivi Nazionali di Lavoro.
I file qui depositati vengono serviti staticamente da Vercel sotto il path `/ccnl-docs/`.

## Convenzione nomi file

| CCNL                         | File atteso               |
|------------------------------|---------------------------|
| Commercio e Terziario        | `commercio.pdf`           |
| Metalmeccanica Industria     | `metalmeccanica.pdf`      |
| Turismo - Pubblici Esercizi  | `turismo.pdf`             |
| Multiservizi / Pulizie       | `multiservizi.pdf`        |
| Sanità Privata AIOP/ARIS     | `sanita_privata.pdf`      |

## Aggiornare un PDF esistente

1. Sostituire il file in questa cartella con il PDF aggiornato (stesso nome)
2. `git commit -m "update: CCNL <nome> <anno>"`
3. `git push` → Vercel rideploya automaticamente (~30 secondi)

## Aggiungere un nuovo CCNL con PDF

1. Aggiungere la voce in `constants.ts` con il campo `pdfFilename: 'nome_file.pdf'`
2. Copiare il PDF in questa cartella con il nome corrispondente
3. Commit + push

**Nessuna modifica al codice applicativo è richiesta per aggiornare un PDF esistente.**
