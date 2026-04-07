// api/question.js — Lingua Viva, Latein-Quiz (Kantonsschule Kreuzlingen)
// Stack: Vercel Serverless Function → OpenAI GPT-4.1-mini
//
// Features:
//   1. Anti-Halluzinations-Validierung
//        - lokale Wortliste (latin-wordlist.js)
//        - PONS-API als Fallback für unbekannte Wörter (pons-lookup.js)
//   2. Anti-Self-Answering-Check
//        - stellt sicher, dass der Fragetext die korrekte Antwort nicht verrät
//   3. Retry-Loop (max. 2 Versuche) mit kontextueller Fehlerrückmeldung ans Modell
//   4. Statischer Fallback aus /data/questions_all.json, falls alle Retries scheitern
//
// Datenschutz-Hinweis (wichtig!):
//   - OpenAI erhält: Prompt + generierte Frage. Kein Schülertext.
//   - PONS erhält: einzelne lateinische Wörter zur Validierung (max. 5 pro Frage).
//     Das wird nur aufgerufen, wenn die lokale Wortliste ein Wort nicht erkennt.
//   - Beide APIs laufen über HTTPS. Secrets kommen aus Vercel Environment Variables
//     (OPENAI_API_KEY, PONS_API_SECRET).

import {
  validateQuestion,
  extractLatinCandidates,
  validateLatinWords,
} from './validate-latin.js';
import { validateWithPons } from './pons-lookup.js';
import fallbackData from '../data/questions_all.json' assert { type: 'json' };

const MAX_RETRIES = 2;
const DIFFICULTY_TO_FALLBACK_KEY = {
  easy: 'leicht',
  medium: 'mittel',
  hard: 'schwer',
};

// ── Schwierigkeitskonfiguration (abgestimmt auf prima.kompakt) ────────────────
const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Leicht (prima.kompakt Lektionen 1–10)',
    points: 10,
    description: `Grundwortschatz (ca. 300 Lernwörter), a-/o-/kons. Deklination,
      Präsens & Imperfekt Aktiv, esse, Imperativ, einfacher AcI.
      Themen: Alltag in Rom, Familie, Forum, Circus, einfache Mythologie.`,
    categories: [
      'Vokabeln übersetzen (Latein→Deutsch)',
      'Vokabeln übersetzen (Deutsch→Latein)',
      'Grammatik: Deklination bestimmen',
      'Grammatik: Verbform übersetzen',
      'Römischer Alltag',
      'Einfache Mythologie',
      'Lingua Viva: Lateinische Wörter im Deutschen (via, per, ultra, extra)',
      'Lingua Viva: Lateinische Abkürzungen (etc., i.e., e.g., a.m., p.m.)',
      'Lingua Viva: Markennamen aus dem Lateinischen (Audi, Volvo, Aqua)',
    ],
    temperature: 0.4,
    maxTokens: 500,
  },
  medium: {
    label: 'Mittel (prima.kompakt Lektionen 11–22)',
    points: 25,
    description: `Erweiterter Wortschatz, Perfekt, Passiv (Präsens/Imperfekt/Perfekt),
      Partizipien (PPP/PPA), Ablativus Absolutus, Konjunktiv (Präsens/Imperfekt),
      Relativsätze, Deponentien, nd-Formen, Komparativ/Superlativ.
      Themen: Republik, Militär, Mythologie vertieft, Philosophie.`,
    categories: [
      'Grammatik: Passiv erkennen und übersetzen',
      'Grammatik: Partizipialkonstruktionen (PPP/PPA)',
      'Grammatik: Ablativus Absolutus',
      'Grammatik: Konjunktiv Präsens/Imperfekt',
      'Römische Geschichte und Republik',
      'Erweiterte Mythologie und Helden',
      'Lingua Viva: Lateinische Phrasen (status quo, ad hoc, per se)',
      'Lingua Viva: Wissenschaftsbegriffe (Virus, Aquarium, Spektrum)',
      'Lingua Viva: Deutsche Redewendungen mit antikem Ursprung',
      'Lingua Viva: Latein in Medizin und Recht',
    ],
    temperature: 0.4,
    maxTokens: 600,
  },
  hard: {
    label: 'Schwer (Lektüre & Latinum-Vorbereitung)',
    points: 50,
    description: `Lektüre-Niveau: Originaltexte von Caesar, Cicero, Vergil, Ovid, Horaz,
      Phädrus, Martial, Plinius. Stilmittel (Chiasmus, Hendiadyoin, Litotes, Hyperbaton…),
      Metrik (daktylischer Hexameter, elegisches Distichon), komplexe Syntax
      (Irrealis, oratio obliqua, Gerundivum, nd-Formen), Übersetzungskompetenz.`,
    categories: [
      'Originaltexte: Caesar (De bello Gallico)',
      'Originaltexte: Cicero (Reden, Briefe)',
      'Originaltexte: Vergil (Aeneis)',
      'Originaltexte: Ovid (Metamorphosen, Tristia)',
      'Stilmittel erkennen und benennen',
      'Metrik: Hexameter und Distichon',
      'Komplexe Syntax: Irrealis, oratio obliqua',
      'Lingua Viva: Kirchenlatein und Liturgie',
      'Lingua Viva: Rechtslatein (habeas corpus, in dubio pro reo)',
      'Lingua Viva: Neo-Latein und romanische Sprachentwicklung',
    ],
    temperature: 0.35,
    maxTokens: 700,
  },
};

// ── Topic-Konfiguration ───────────────────────────────────────────────────────
const TOPIC_CONFIG = {
  mythen: {
    label: 'Mythen & Götter',
    keywords: [
      'griechische und römische Götter (Jupiter, Mars, Venus, Minerva, Diana, Neptun…)',
      'Helden und Halbgötter (Hercules, Aeneas, Odysseus/Ulixes)',
      'Gründungssagen (Romulus und Remus, trojanischer Krieg)',
      'Unterwelt (Tartarus, Elysium, Pluto/Dis)',
      'Metamorphosen und Verwandlungssagen',
      'Orakel und Prophezeiungen',
    ],
  },
  geschichte: {
    label: 'Geschichte & Rom',
    keywords: [
      'Römische Republik und ihre Institutionen (Senat, Konsuln, Volkstribunen)',
      'Römische Kaiser (Augustus, Nero, Marcus Aurelius…)',
      'Berühmte Römer (Caesar, Cicero, Cato, Scipio, Pompeius)',
      'Militär und Conquista (Legionen, Belagerungen, Provinzen)',
      'Soziale Strukturen (Patrizier/Plebejer, Sklaven, Klienten)',
      'Rom in der Schweiz (Vindonissa, Augusta Raurica, Aventicum)',
    ],
  },
  alltagslatein: {
    label: 'Lingua Viva / Alltagslatein',
    keywords: [
      'Lateinische Abkürzungen (etc., e.g., i.e., vs., cf., ibid., op. cit.)',
      'Lateinische Lehnwörter im Deutschen und Englischen',
      'Marken und Namen mit lateinischer Herkunft (Audi, Nike, Volvo, Amazon)',
      'Lateinische Phrasen im modernen Gebrauch (ad hoc, status quo, carpe diem)',
      'Wissenschaftslatein (Biologie, Medizin, Recht, Philosophie)',
      'Kirchenlatein und Vatikan',
      'Romanische Sprachen als direkte Nachkommen des Lateins',
      'Lateinische Redewendungen mit antiken Ursprüngen',
    ],
  },
  ueberraschung: {
    label: 'Überrasche mich!',
    keywords: [], // bei 'ueberraschung' wird zufällig ein anderes Topic gewählt
  },
};

function normalizeTopic(topic) {
  if (topic === 'ueberrasche') return 'ueberraschung';
  return TOPIC_CONFIG[topic] ? topic : 'ueberraschung';
}

// ── Anti-Self-Answering-Check ────────────────────────────────────────────────
// Verhindert, dass der Fragetext Wörter aus der korrekten Antwort enthält.
//
// Regel: Wenn ein signifikantes Token (≥ 3 Zeichen, kein Stoppwort) aus der
// korrekten Antwortoption im Fragetext auftaucht, gilt die Frage als "leaky".
//
// Wichtig: Verglichen wird nur gegen die KORREKTE Antwort, nicht gegen die
// Distraktoren. Sonst würden legitime Fragen wie "Wer war der Vater des
// Hercules?" (Antwort: Jupiter, Hercules nur im Stem) fälschlich abgelehnt.

const LEAK_STOPWORDS = new Set([
  // Deutsche Funktionswörter
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'und', 'oder', 'aber', 'auch', 'nicht', 'nur', 'mit', 'von', 'aus', 'bei', 'zum', 'zur',
  'für', 'auf', 'über', 'unter', 'vor', 'nach', 'bis', 'als', 'wie', 'was', 'wer', 'wen',
  'welche', 'welcher', 'welches', 'welchen', 'ist', 'sind', 'war', 'waren', 'hat', 'haben',
  'wird', 'wurde', 'kann', 'sich', 'ihn', 'ihm', 'ihr', 'sie', 'man', 'dass', 'weil',
  'diese', 'dieser', 'dieses', 'diesem', 'diesen', 'folgenden', 'folgende', 'folgender',
  // Themen-Vokabular, das in Quiz-Stems natürlich vorkommt
  'wort', 'wörter', 'worte', 'form', 'formen', 'endung', 'bedeutung', 'bedeutet',
  'heisst', 'nennt', 'genannt', 'bezeichnet', 'begriff', 'begriffe',
  'latein', 'lateinisch', 'lateinische', 'lateinischen', 'lateinischer', 'lateinisches',
  'deutsch', 'deutsche', 'deutschen', 'übersetzung', 'übersetzen',
  'frage', 'antwort', 'option', 'korrekt', 'falsch',
  'römer', 'römisch', 'römische', 'römischen', 'römischer', 'antike', 'antik',
  'satz', 'text', 'autor', 'werk', 'zitat',
]);

function normalizeForLeak(str) {
  return (str || '')
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str) {
  return normalizeForLeak(str)
    .split(' ')
    .filter(tok => tok.length >= 3 && !LEAK_STOPWORDS.has(tok));
}

/**
 * Prüft Self-Answering: kommen Tokens der korrekten Antwort im Fragetext vor?
 * @returns {{ clean: boolean, leaked: string[] }}
 */
export function checkAnswerLeakage(q) {
  if (!q || typeof q.question !== 'string' || !Array.isArray(q.options)) {
    return { clean: true, leaked: [] };
  }
  const correct = q.options[q.correctIndex];
  if (!correct) return { clean: true, leaked: [] };

  const stemTokens = new Set(tokenize(q.question));
  const correctTokens = tokenize(correct);

  const leaked = correctTokens.filter(tok => stemTokens.has(tok));
  return { clean: leaked.length === 0, leaked };
}

// ── Hybrid-Validierung: lokale Wortliste + PONS-Fallback ─────────────────────
// Die lokale Wortliste ist klein (~500 Lemmata). Für unbekannte Wörter fragen
// wir PONS (max. 5 Wörter pro Frage). So reduzieren wir false positives, ohne
// die Halluzinations-Erkennung zu verlieren.
async function validateQuestionHybrid(q) {
  // 1. Strukturcheck + lokale Wortliste
  const local = validateQuestion(q);
  if (!local.pass) {
    // Strukturfehler (fehlende Options, etc.) → sofort ablehnen
    if (!local.latinResult) return local;

    // Lokal unbekannte Wörter → PONS fragen
    const unknown = local.latinResult.invalid;
    if (unknown.length === 0) return local;

    const pons = await validateWithPons(unknown);

    // PONS bestätigte Wörter → upgrade auf "valid"
    const stillInvalid = pons.rejected;
    if (stillInvalid.length === 0) {
      return {
        pass: true,
        candidates: local.candidates,
        latinResult: { ...local.latinResult, invalid: [], allValid: true },
        warning:
          pons.uncertain.length > 0
            ? `PONS nicht erreichbar für: ${pons.uncertain.join(', ')} — lokal unbekannt, aber durchgelassen.`
            : null,
      };
    }

    return {
      pass: false,
      reason: `Halluzinierte lateinische Wörter (auch nach PONS-Check): ${stillInvalid.join(', ')}`,
      candidates: local.candidates,
      latinResult: { ...local.latinResult, invalid: stillInvalid },
    };
  }

  return local;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { difficulty = 'easy', topic = 'ueberraschung', previousQuestions = [] } = req.body || {};
  const normalizedTopic = normalizeTopic(topic);

  if (!DIFFICULTY_CONFIG[difficulty]) {
    return res.status(400).json({ error: `Ungültige Schwierigkeit: ${difficulty}` });
  }

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const questionData = await generateQuestion({
        difficulty,
        topic: normalizedTopic,
        previousQuestions,
        attempt,
        lastError,
      });

      // ── 1. Anti-Self-Answering-Check ───────────────────────────────────
      const leakCheck = checkAnswerLeakage(questionData);
      if (!leakCheck.clean) {
        const reason = `Self-Answering: Frage enthält Token der korrekten Antwort: ${leakCheck.leaked.join(', ')}`;
        console.log(`[Attempt ${attempt + 1}] ${reason}`);
        if (attempt < MAX_RETRIES) {
          lastError = reason;
          continue;
        }
        console.warn('⚠️  Alle Versuche leaked die Antwort — Fallback.');
        return res.status(200).json(getFallbackQuestion(difficulty, normalizedTopic));
      }

      // ── 2. Latein-Validierung (lokal + PONS-Fallback) ─────────────────
      const validation = await validateQuestionHybrid(questionData);

      console.log(`[Attempt ${attempt + 1}] Validation:`, {
        pass: validation.pass,
        reason: validation.reason || 'OK',
        invalid: validation.latinResult?.invalid || [],
        warning: validation.warning || null,
      });

      if (!validation.pass) {
        if (attempt < MAX_RETRIES) {
          lastError = validation.reason;
          continue;
        }
        console.warn(`⚠️  Alle Versuche fehlgeschlagen. Fallback für ${difficulty}/${normalizedTopic}`);
        return res.status(200).json(getFallbackQuestion(difficulty, normalizedTopic));
      }

      if (validation.warning) {
        questionData._warning = validation.warning;
      }

      return res.status(200).json(questionData);

    } catch (error) {
      console.error(`[Attempt ${attempt + 1}] Error:`, error.message);
      lastError = error.message;

      if (attempt === MAX_RETRIES) {
        console.warn('⚠️  API-Fehler nach allen Versuchen. Fallback.');
        return res.status(200).json(getFallbackQuestion(difficulty, normalizedTopic));
      }
    }
  }
}

// ── Fragengeneration (OpenAI-Aufruf) ─────────────────────────────────────────
async function generateQuestion({ difficulty, topic, previousQuestions, attempt, lastError }) {
  const config = DIFFICULTY_CONFIG[difficulty];

  // Topic bestimmen (bei 'ueberraschung' zufällig aus den drei Haupt-Topics)
  let activeTopic = topic;
  if (topic === 'ueberraschung') {
    const topics = ['mythen', 'geschichte', 'alltagslatein'];
    activeTopic = topics[Math.floor(Math.random() * topics.length)];
  }
  const topicInfo = TOPIC_CONFIG[activeTopic] || TOPIC_CONFIG.ueberraschung;

  // Zufällige Kategorie + Keyword für Variety
  const randomCategory = config.categories[Math.floor(Math.random() * config.categories.length)];
  const randomKeyword = topicInfo.keywords.length > 0
    ? topicInfo.keywords[Math.floor(Math.random() * topicInfo.keywords.length)]
    : randomCategory;
  const seed = Math.floor(Math.random() * 10000);

  // Exclusion-Liste (max. 8 letzte Fragen)
  const exclusionNote = previousQuestions.length > 0
    ? `\n\nBISHERIGE FRAGEN (nicht wiederholen!):\n${previousQuestions.slice(-8).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  // Retry-Hinweis mit konkreter Fehlerbeschreibung
  const retryNote = lastError && attempt > 0
    ? `\n\n⚠️ FEHLER IM VORHERIGEN VERSUCH: ${lastError}
Bitte korrigiere und verwende NUR belegte lateinische Formen. Achte besonders darauf,
dass der Fragetext die korrekte Antwort nicht wörtlich enthält.`
    : '';

  const systemPrompt = `Du bist ein streng akademischer Latein-Prüfer an der Kantonsschule Kreuzlingen.
Du arbeitest ausschliesslich mit dem Lehrbuch "prima.kompakt" (C.C. Buchner Verlag, 22 Lektionen).

═══════════════════════════════════════════════════════════════
ABSOLUTE REGEL #1 — KEIN SELF-ANSWERING (höchste Priorität):
═══════════════════════════════════════════════════════════════
Die Frage DARF NIEMALS die korrekte Antwort enthalten — weder wörtlich
noch als offensichtlichen Hinweis. Das gilt besonders für:

  ✗ Lateinische Wörter, die auch in den Antwortoptionen stehen
  ✗ Deutsche Übersetzungen, die die korrekte Antwort eindeutig identifizieren
  ✗ Eigennamen, die nur zu einer Option passen

SCHLECHT (verrät Antwort):
  Q: "Welches lateinische Wort 'bellum' bedeutet 'Krieg'?"
  Options: [bellum, exercitus, pax, gladius]
  → Das Wort 'bellum' steht in Frage UND Antwort — UNZULÄSSIG.

GUT (verrät nichts):
  Q: "Welches der folgenden lateinischen Substantive bezeichnet den
      bewaffneten Konflikt zwischen Staaten?"
  Options: [bellum, exercitus, pax, gladius]

Selbstprüfung VOR der JSON-Ausgabe:
  1. Nimm die korrekte Antwort.
  2. Prüfe: Kommt auch nur ein signifikantes Wort daraus im Fragetext vor?
  3. Wenn JA → Frage umformulieren, bis es NEIN heisst.

═══════════════════════════════════════════════════════════════
ABSOLUTE REGEL #2 — KEINE HALLUZINATIONEN:
═══════════════════════════════════════════════════════════════
- Verwende AUSSCHLIESSLICH lateinische Wörter, die in Standard-Wörterbüchern
  (Georges, Stowasser, PONS) belegt sind.
- KEINE erfundenen, rekonstruierten oder unsicheren Wortformen.
- Bei Vokabelfragen: Stammformen in der Erklärung angeben
  (z.B. "amare, amo, amavi, amatum").
- Bei Deklinationen: Genus und Deklination nennen
  (z.B. "bellum, -i n., 2. Dekl.").
- Falsche Antwortoptionen: EXISTIERENDE, aber falsche Formen — nie erfundene.
- Im Zweifel: ein häufigeres, sicheres Wort wählen.

═══════════════════════════════════════════════════════════════
NIVEAUSTUFEN:
═══════════════════════════════════════════════════════════════
- LEICHT: Grundwortschatz, einfache Grammatik (Lektionen 1–10)
- MITTEL: Erweiterter Wortschatz, keine Originaltexte (Lektionen 11–22)
- SCHWER: Originaltexte, Stilmittel, Metrik, komplexe Syntax

═══════════════════════════════════════════════════════════════
QUALITÄTSKONTROLLE (vor der Ausgabe durchgehen):
═══════════════════════════════════════════════════════════════
  ✔ Self-Answering-Check bestanden? (siehe Regel #1)
  ✔ Jedes lateinische Wort im Standardwörterbuch belegt?
  ✔ Endungen stimmen mit Deklination/Konjugation überein?
  ✔ Stammformen in der Erklärung korrekt?
  ✔ Falsche Optionen plausibel, aber eindeutig falsch?
  ✔ Niveau passt zur Schwierigkeitsstufe?
  ✔ Würde Frau Döpfert (Lateinlehrerin KSK) diese Frage akzeptieren?

Antworte NUR mit validem JSON. Kein Markdown, kein Text davor oder danach.`;

  const userPrompt = `SCHWIERIGKEITSSTUFE: ${config.label}
NIVEAUBESCHREIBUNG: ${config.description}

THEMA: ${topicInfo.label}
KATEGORIE: ${randomCategory}
SCHWERPUNKT: ${randomKeyword}
[Seed: ${seed}]

Erstelle eine NEUE, einzigartige Frage zu diesem Thema und Schwerpunkt.${exclusionNote}${retryNote}

Antworte mit exakt diesem JSON-Format:
{
  "question": "Frage auf Deutsch (korrekte Antwort darf NICHT im Fragetext stehen!)",
  "options": ["Antwort A", "Antwort B", "Antwort C", "Antwort D"],
  "correctIndex": 0,
  "explanation": "Erklärung mit Lerneffekt (1–2 Sätze, inkl. Stammformen wenn relevant)"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: config.temperature,
      top_p: 0.9,
      max_tokens: config.maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API Fehler ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Leere Antwort von OpenAI');

  // JSON parsen (Markdown-Backticks entfernen falls vorhanden)
  let questionData;
  try {
    questionData = JSON.parse(content);
  } catch {
    const jsonMatch =
      content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
      content.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      questionData = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('JSON konnte nicht aus der Antwort extrahiert werden');
    }
  }

  return questionData;
}

// ── Statischer Fallback aus questions_all.json ────────────────────────────────
function getFallbackQuestion(difficulty, topic) {
  try {
    const fallbackDifficultyKey = DIFFICULTY_TO_FALLBACK_KEY[difficulty] || difficulty;
    const fallbackTopicKey = fallbackData.topics[topic] ? topic : 'ueberraschung';
    const topicData = fallbackData.topics[fallbackTopicKey] || fallbackData.topics.ueberraschung;
    const questions = topicData?.[fallbackDifficultyKey];

    if (questions && questions.length > 0) {
      const q = questions[Math.floor(Math.random() * questions.length)];
      return { ...q, _isFallback: true };
    }

    return {
      question: 'Was bedeutet das lateinische Wort "amicus"?',
      options: ['Feind', 'Freund', 'Bruder', 'Lehrer'],
      correctIndex: 1,
      explanation: 'amicus, -i m. (2. Deklination) = der Freund. Stammformen: amicus, amici.',
      _isFallback: true,
    };
  } catch (error) {
    console.error('Fehler beim Laden des Fallbacks:', error);
    return {
      question: 'Was bedeutet "vita" auf Latein?',
      options: ['Tod', 'Sieg', 'Leben', 'Kraft'],
      correctIndex: 2,
      explanation:
        'vita, -ae f. (1. Deklination) = das Leben. Steckt in "vital", "Vitamin" und "revitalisieren".',
      _isFallback: true,
    };
  }
}
