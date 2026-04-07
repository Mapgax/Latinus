// api/question.js — Lingua Viva, Latein-Quiz KSK
// Stack: Vercel Serverless Function → OpenAI GPT-4.1-mini
// Features: Validation Layer, static JSON fallback, retry loop

import { validateQuestion } from './validate-latin.js';
// Optional: import { validateWithPons } from './pons-lookup.js';

// ── Statische Fallback-Fragen ─────────────────────────────────────────────────
// Werden geladen, wenn alle Retries fehlschlagen
// Die vollständige Datenbank liegt in /data/questions_all.json
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
      'Grammatik: Partizipialkonstruktionen',
      'Grammatik: Ablativus Absolutus',
      'Grammatik: Konjunktiv Präsens/Imperfekt',
      'Römische Geschichte und Republik',
      'Erweiterte Mythologie und Helden',
      'Latein im Alltag (Etymologie, Abkürzungen)',
    ],
    temperature: 0.4,
    maxTokens: 600,
  },
  hard: {
    label: 'Schwer (Lektüre & Latinum-Vorbereitung)',
    points: 50,
    description: `Lektüre-Niveau: Originaltexte von Caesar, Cicero, Vergil, Ovid, Horaz,
      Phädrus, Martial, Plinius. Stilmittel (Chiasmus, Hendiadyoin, Litotes, Hyperbaton...),
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
      'Latinum-Prüfungsvorbereitung',
    ],
    temperature: 0.35,  // Noch konservativer für Lektüre-Genauigkeit
    maxTokens: 700,
  },
};

// ── Topic-Konfiguration ───────────────────────────────────────────────────────
const TOPIC_CONFIG = {
  mythen: {
    label: 'Mythen & Götter',
    keywords: [
      'griechische und römische Götter (Jupiter, Mars, Venus, Minerva, Diana, Neptun...)',
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
      'Römische Kaiser (Augustus, Nero, Marcus Aurelius...)',
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
    keywords: [], // Alle Topics gemischt
  },
};

function normalizeTopic(topic) {
  if (topic === 'ueberrasche') return 'ueberraschung';
  return TOPIC_CONFIG[topic] ? topic : 'ueberraschung';
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { difficulty = 'easy', topic = 'ueberraschung', previousQuestions = [] } = req.body;
  const normalizedTopic = normalizeTopic(topic);

  if (!DIFFICULTY_CONFIG[difficulty]) {
    return res.status(400).json({ error: `Ungültige Schwierigkeit: ${difficulty}` });
  }

  let lastError = null;

  // ── Retry Loop ──────────────────────────────────────────────────────────────
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const questionData = await generateQuestion({
        difficulty,
        topic: normalizedTopic,
        previousQuestions,
        attempt,
        lastError,
      });

      // ── Validierung ───────────────────────────────────────────────────────
      const validation = validateQuestion(questionData);

      console.log(`[Attempt ${attempt + 1}] Validation:`, {
        pass: validation.pass,
        reason: validation.reason || 'OK',
        invalid: validation.latinResult?.invalid || [],
        warning: validation.warning || null,
      });

      if (!validation.pass) {
        if (attempt < MAX_RETRIES) {
          lastError = validation.reason;
          continue; // nächster Versuch
        }
        // Max Retries ausgeschöpft → Fallback
        console.warn(`⚠️ Alle Versuche fehlgeschlagen. Fallback für ${difficulty}/${normalizedTopic}`);
        return res.status(200).json(getFallbackQuestion(difficulty, normalizedTopic));
      }

      // Warnung mitgeben, aber Frage trotzdem servieren
      if (validation.warning) {
        questionData._warning = validation.warning;
      }

      return res.status(200).json(questionData);

    } catch (error) {
      console.error(`[Attempt ${attempt + 1}] Error:`, error.message);
      lastError = error.message;

      if (attempt === MAX_RETRIES) {
        console.warn('⚠️ API-Fehler nach allen Versuchen. Fallback.');
        return res.status(200).json(getFallbackQuestion(difficulty, normalizedTopic));
      }
    }
  }
}

// ── Fragengeneration ──────────────────────────────────────────────────────────
async function generateQuestion({ difficulty, topic, previousQuestions, attempt, lastError }) {
  const config = DIFFICULTY_CONFIG[difficulty];

  // Topic bestimmen (bei 'ueberraschung' zufällig)
  let activeTopic = topic;
  if (topic === 'ueberraschung') {
    const topics = ['mythen', 'geschichte', 'alltagslatein'];
    activeTopic = topics[Math.floor(Math.random() * topics.length)];
  }
  const topicInfo = TOPIC_CONFIG[activeTopic] || TOPIC_CONFIG.ueberraschung;

  // Zufällige Kategorie wählen
  const categories = config.categories;
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];

  // Zufälliges Keyword aus Topic
  const keywords = topicInfo.keywords;
  const randomKeyword = keywords.length > 0
    ? keywords[Math.floor(Math.random() * keywords.length)]
    : randomCategory;

  // Exclusion-Liste
  const exclusionNote = previousQuestions.length > 0
    ? `\n\nBISHERIGE FRAGEN (nicht wiederholen):\n${previousQuestions.slice(-8).join('\n')}`
    : '';

  // Retry-Hinweis
  const retryNote = lastError && attempt > 0
    ? `\n\n⚠️ FEHLER IM VORHERIGEN VERSUCH: ${lastError}\nBitte korrigiere und verwende NUR verifizierte, belegte lateinische Formen.`
    : '';

  // Seed für Variety
  const seed = Math.floor(Math.random() * 10000);

  const systemPrompt = `Du bist ein streng akademischer Latein-Prüfer an einem Schweizer Gymnasium (Kantonsschule Küsnacht).
Du arbeitest ausschliesslich mit dem Lehrbuch "prima.kompakt" (C.C. Buchner Verlag, 22 Lektionen).

ABSOLUTE SPRACHLICHE REGELN — KEINE AUSNAHMEN:
1. Verwende AUSSCHLIESSLICH lateinische Wörter, die in Standard-Wörterbüchern (Georges, Stowasser, PONS) belegt sind.
2. KEINE erfundenen, rekonstruierten oder unsicheren Wortformen.
3. Bei Vokabelfragen: Gib in der Erklärung die Stammformen an (z.B. "amare, amo, amavi, amatum").
4. Bei Deklinationen: Nenne Genus und Deklination (z.B. "bellum, -i n., 2. Dekl.").
5. Falsche Antwortoptionen: Verwende EXISTIERENDE, aber falsche Formen — keine erfundenen.
6. Im Zweifel: Wähle ein häufigeres, sichereres Wort.
7. Qualität vor Kreativität — lieber eine einfache, korrekte Frage als eine kreative mit Fehlerrisiko.

QUALITÄTSKONTROLLE vor der JSON-Ausgabe:
✔ Ist jedes lateinische Wort in einem Standardwörterbuch auffindbar?
✔ Stimmen alle Endungen mit Deklination/Konjugation überein?
✔ Sind die Stammformen korrekt?
✔ Würde Frau Döpfert (Lateinlehrerin KSK) diese Frage als fehlerfrei akzeptieren?

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
  "question": "Frage auf Deutsch (oder mit lateinischen Zitaten in Anführungszeichen)",
  "options": ["Antwort A", "Antwort B", "Antwort C", "Antwort D"],
  "correctIndex": 0,
  "explanation": "Erklärung mit Lerneffekt (1–2 Sätze, inkl. Stammformen wenn relevant)"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',        // Upgrade von gpt-4o-mini
      temperature: config.temperature, // 0.4 (war 1.0)
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
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                      content.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      questionData = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('JSON konnte nicht aus der Antwort extrahiert werden');
    }
  }

  return questionData;
}

// ── Fallback-Fragen aus JSON ──────────────────────────────────────────────────
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

    // Absoluter Notfall-Fallback
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
      explanation: 'vita, -ae f. (1. Deklination) = das Leben. Steckt in "vital", "Vitamin" und "revitalisieren".',
      _isFallback: true,
    };
  }
}
