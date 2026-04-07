// validate-latin.js
// Extrahiert und validiert lateinische Wörter in generierten Quiz-Fragen
// Teil von Lingua Viva — Latein-Quiz KSK

import { isLikelyLatinWord } from './latin-wordlist.js';

// Deutsche Stoppwörter — werden bei der Prüfung ignoriert
const GERMAN_STOPWORDS = new Set([
  'die', 'der', 'das', 'des', 'dem', 'den', 'ein', 'eine', 'eines', 'einer',
  'und', 'oder', 'aber', 'auch', 'noch', 'nicht', 'nur', 'sehr',
  'ist', 'sind', 'war', 'waren', 'hat', 'haben', 'wird', 'wurde', 'kann',
  'was', 'wie', 'wer', 'wen', 'wem', 'wo', 'wann', 'warum', 'welche',
  'welcher', 'welches', 'welchen', 'welchem', 'als', 'wenn', 'weil', 'dass',
  'von', 'mit', 'auf', 'für', 'nach', 'aus', 'bei', 'bis', 'über', 'unter',
  'vor', 'zum', 'zur', 'ins', 'im', 'am', 'an', 'in', 'zu',
  'sich', 'ihm', 'ihr', 'ihn', 'sie', 'wir', 'ihr', 'man',
  'alle', 'beide', 'jeder', 'jeden', 'jedes', 'jeder', 'kein', 'keine',
  'bedeutet', 'heisst', 'bezeichnet', 'nennt', 'genannt', 'bedeutete',
  'lateinisch', 'lateinische', 'lateinischen', 'lateinischer', 'latein',
  'deutsch', 'deutsche', 'deutschen', 'griechisch', 'griechische',
  'wort', 'wortes', 'worte', 'wörter', 'form', 'formen', 'endung',
  'plural', 'singular', 'genitiv', 'dativ', 'akkusativ', 'nominativ', 'ablativ',
  'verb', 'verbs', 'substantiv', 'adjektiv', 'konjugation', 'deklination',
  'dieser', 'dieses', 'diesem', 'diesen', 'dieser',
  // Lateinische Funktionswörter (immer gültig, nicht prüfen nötig)
  'est', 'sunt', 'non', 'sed', 'aut', 'nec', 'nam', 'enim',
  'cum', 'tum', 'iam', 'quo', 'quod', 'qui', 'quae', 'quem',
  'vel', 'etiam', 'autem', 'ergo', 'igitur', 'itaque', 'tamen',
  'nunc', 'ubi', 'ibi', 'hic', 'ille', 'ipse', 'quis', 'quid',
  'omnis', 'omne', 'magnus', 'multus', 'bonus', 'malus', 'novus',
]);

/**
 * Extrahiert lateinische Kandidatenwörter aus einer Quizfrage.
 * Sucht nach Wörtern in Anführungszeichen, kursiv markiert oder mit lat. Morphologie.
 */
export function extractLatinCandidates(questionData) {
  const candidates = new Set();

  const allText = [
    questionData.question || '',
    ...(questionData.options || []),
    questionData.explanation || '',
  ].join(' ');

  // Muster 1: Wörter in einfachen/doppelten Anführungszeichen oder Guillemets
  // z.B. "amicus", ‚bellum', «vita»
  const quotedPattern = /["""„«»‚']([a-zA-Z][a-zA-Z\s,]{1,30}?)["""„«»‚']/g;
  let match;
  while ((match = quotedPattern.exec(allText)) !== null) {
    match[1].split(/[\s,]+/).forEach(w => {
      if (w.length >= 3 && /^[a-zA-Z]+$/.test(w)) candidates.add(w);
    });
  }

  // Muster 2: Wörter mit typisch lateinischen Morphemen (Endungen)
  const latinEndingPattern = /\b([a-zA-Z]{3,}(?:us|um|ae|am|orum|arum|ibus|avit|abat|atur|untur|isse|andi|ando|andum|atus|itus))\b/g;
  while ((match = latinEndingPattern.exec(allText)) !== null) {
    if (!GERMAN_STOPWORDS.has(match[1].toLowerCase())) {
      candidates.add(match[1]);
    }
  }

  // Muster 3: Stammformen in Erklärungen (z.B. "amare, amo, amavi, amatum")
  // Erkenne Wörter zwischen Kommas, die lateinisch aussehen
  const explanation = questionData.explanation || '';
  const stammPattern = /\b([a-z]{3,}(?:are|ere|ire|us|a|um|is|or|or|men|nis))\b/g;
  while ((match = stammPattern.exec(explanation)) !== null) {
    if (!GERMAN_STOPWORDS.has(match[1])) candidates.add(match[1]);
  }

  // Filter: Deutsche Stoppwörter und Zahlen entfernen
  return [...candidates].filter(w => {
    const lower = w.toLowerCase();
    return !GERMAN_STOPWORDS.has(lower) && !/^\d+$/.test(w) && w.length >= 3;
  });
}

/**
 * Validiert eine Liste von lateinischen Kandidatenwörtern.
 * Gibt valide, invalide und unbekannte Wörter zurück.
 */
export function validateLatinWords(candidates) {
  const valid = [];
  const invalid = [];

  for (const word of candidates) {
    if (isLikelyLatinWord(word)) {
      valid.push(word);
    } else {
      invalid.push(word);
    }
  }

  return {
    valid,
    invalid,
    allValid: invalid.length === 0,
    score: candidates.length > 0 ? valid.length / candidates.length : 1,
  };
}

/**
 * Vollständige Validierung einer Quizfrage.
 * Gibt ein Ergebnisobjekt mit pass/fail und Details zurück.
 */
export function validateQuestion(questionData) {
  // 1. Strukturprüfung
  if (!questionData.question || typeof questionData.question !== 'string') {
    return { pass: false, reason: 'Frage fehlt oder ist kein String' };
  }
  if (!Array.isArray(questionData.options) || questionData.options.length !== 4) {
    return { pass: false, reason: 'options muss ein Array mit genau 4 Einträgen sein' };
  }
  if (typeof questionData.correctIndex !== 'number' ||
      questionData.correctIndex < 0 || questionData.correctIndex > 3) {
    return { pass: false, reason: 'correctIndex muss 0–3 sein' };
  }
  if (!questionData.explanation || typeof questionData.explanation !== 'string') {
    return { pass: false, reason: 'explanation fehlt' };
  }
  if (questionData.options.some(o => !o || typeof o !== 'string' || o.trim() === '')) {
    return { pass: false, reason: 'Eine oder mehrere Antwortoptionen sind leer' };
  }

  // 2. Lateinvalidierung
  const candidates = extractLatinCandidates(questionData);
  const latinResult = validateLatinWords(candidates);

  // Für diesen Quiz-Modus gilt: Schon ein einziges unbekanntes lateinisches Wort
  // ist ein Ablehnungsgrund, weil auch ein "nur falscher Distraktor" lehrschädlich wäre.
  if (latinResult.invalid.length > 0) {
    return {
      pass: false,
      reason: `Potenzielle Halluzinationen: ${latinResult.invalid.join(', ')}`,
      candidates,
      latinResult,
    };
  }

  return {
    pass: true,
    candidates,
    latinResult,
    warning: null,
  };
}
