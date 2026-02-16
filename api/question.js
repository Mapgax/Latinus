// Vercel Serverless Function für Latein-Fragen
// Diese Datei muss in /api/question.js liegen

export default async function handler(req, res) {
    // CORS Headers für Frontend-Zugriff
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { difficulty, previousQuestions } = req.body;

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    // ── Zufällige Kategorie und Thema für Vielfalt ────────────────────
    const categories = [
        'Vokabelübersetzung (Latein → Deutsch)',
        'Vokabelübersetzung (Deutsch → Latein)',
        'Konjugation (Präsens, Perfekt, Imperfekt, Futur)',
        'Deklination (Nominativ, Genitiv, Dativ, Akkusativ, Ablativ)',
        'Satzbau & Syntax (AcI, Ablativus Absolutus, Relativsätze)',
        'Kulturwissen (Römische Geschichte)',
        'Kulturwissen (Römischer Alltag & Gesellschaft)',
        'Mythologie (Götter, Helden, Sagen)',
        'Redewendungen & Sprichwörter (lateinische Sentenzen)',
        'Textverständnis (kurzer lateinischer Satz übersetzen)'
    ];

    const themes = [
        'Familie und Verwandtschaft', 'Krieg und Militär', 'Politik und Staat',
        'Religion und Götter', 'Natur und Tiere', 'Essen und Trinken',
        'Schule und Bildung', 'Recht und Gesetz', 'Handel und Geld',
        'Architektur und Städte', 'Reisen und Geographie', 'Körper und Gesundheit',
        'Emotionen und Charakter', 'Zeit und Kalender', 'Kleidung und Mode',
        'Philosophie und Weisheit', 'Literatur und Dichtung', 'Sport und Spiele'
    ];

    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomSeed = Math.floor(Math.random() * 100000);

    const difficultyDescriptions = {
        easy: 'einfach (Anfänger, grundlegende Vokabeln wie "amare", "bellum", einfache Grammatik, 1.-2. Lernjahr)',
        medium: 'mittel (Fortgeschrittene, komplexere Strukturen, AcI, Ablativus Absolutus, 3.-4. Lernjahr)',
        hard: 'schwer (Experten, anspruchsvolle Fragen zu Syntax, Stilistik, römischer Kultur und Philosophie, Maturaniveau)'
    };

    // ── Bereits gestellte Fragen ausschliessen ────────────────────────
    let exclusionNote = '';
    if (previousQuestions && Array.isArray(previousQuestions) && previousQuestions.length > 0) {
        const recent = previousQuestions.slice(-10);
        exclusionNote = `\n\nBEREITS GESTELLTE FRAGEN (stelle KEINE davon erneut!):\n${recent.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }

    const prompt = `Erstelle eine ${difficultyDescriptions[difficulty]} lateinische Quiz-Frage für Schweizer Gymnasiasten.

KATEGORIE für diese Frage: ${randomCategory}
THEMENBEREICH: ${randomTheme}
[Zufallsseed: ${randomSeed}]
[Zeitstempel: ${new Date().toISOString()}]

WICHTIG: Erstelle eine NEUE, EINZIGARTIGE Frage passend zur obigen Kategorie und zum Themenbereich!${exclusionNote}

QUALITÄTSKONTROLLE - KRITISCH:
✔ Verwende NUR klassische, etablierte Vokabeln (Caesar, Cicero, Ovid)
✔ Prüfe ALLE Deklinationen/Konjugationen auf Korrektheit
✔ Historische Fakten müssen verifizierbar sein
✔ Falsche Antworten müssen plausibel, aber eindeutig falsch sein
✔ Keine erfundenen oder unsicheren lateinischen Formen

Gib die Antwort als VALIDES JSON zurück (keine Markdown-Formatierung):

{
  "question": "Die Frage präzise und klar formuliert auf Deutsch",
  "options": ["Antwort 1", "Antwort 2", "Antwort 3", "Antwort 4"],
  "correctIndex": 0,
  "explanation": "Kurze, präzise Erklärung mit didaktischem Wert (1-2 Sätze)"
}

WICHTIG:
- Nur JSON ausgeben, keine zusätzlichen Texte oder Markdown
- correctIndex ist 0, 1, 2 oder 3 (die richtige Antwort)
- Alle 4 Antworten müssen plausibel klingen (keine offensichtlich falschen)
- Erklärung sollte Lerneffekt haben und präzise sein
- Im Zweifelsfall: sichere, etablierte Fragen statt kreative mit Fehlerrisiko`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-5-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Du bist ein ausgezeichneter, fehlerfreier Latein-Lehrer mit akademischer Expertise.

QUALITÄTSSTANDARDS:
- Alle lateinischen Vokabeln, Grammatik und Übersetzungen müssen 100% korrekt sein
- Prüfe jede Frage doppelt auf Fehler in Deklination, Konjugation und Syntax
- Verwende nur etablierte, klassische Beispiele (keine erfundenen oder unsicheren Wörter)
- Kulturwissen muss historisch akkurat sein (keine Spekulationen)
- Erklärungen müssen didaktisch wertvoll und präzise sein

DEINE AUFGABE:
Erstelle akademisch einwandfreie Quiz-Fragen für Schweizer Gymnasiasten.
Antworte IMMER nur mit validem JSON, ohne Markdown-Formatierung oder zusätzlichen Text.

WICHTIG:
- Qualität vor Kreativität - lieber eine sichere, korrekte Frage als eine originelle mit Fehlerrisiko.
- Jede Frage muss ANDERS sein als alle vorherigen. Variiere Vokabeln, Grammatikthemen und Epochen.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 1.0,
                max_tokens: 600
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API Error:', errorData);
            return res.status(response.status).json({
                error: 'OpenAI API request failed',
                details: errorData
            });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        console.log('✅ Question generated:', {
            difficulty,
            category: randomCategory,
            theme: randomTheme,
            timestamp: new Date().toISOString(),
            tokensUsed: data.usage?.total_tokens,
            questionPreview: content.substring(0, 100) + '...'
        });

        let questionData;
        try {
            questionData = JSON.parse(content);
        } catch (e) {
            const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                             content.match(/(\{[\s\S]*\})/);

            if (jsonMatch) {
                questionData = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error('Could not parse JSON from response');
            }
        }

        if (!questionData.question || !Array.isArray(questionData.options) ||
            questionData.options.length !== 4 ||
            typeof questionData.correctIndex !== 'number' ||
            !questionData.explanation) {
            throw new Error('Invalid question structure');
        }

        return res.status(200).json(questionData);

    } catch (error) {
        console.error('Error generating question:', error);
        return res.status(500).json({
            error: 'Failed to generate question',
            message: error.message
        });
    }
}
