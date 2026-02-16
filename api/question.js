// Vercel Serverless Function für Latein-Fragen
// Diese Datei muss in /api/question.js liegen

export default async function handler(req, res) {
    // CORS Headers für Frontend-Zugriff
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Nur POST erlauben
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { difficulty } = req.body;

    // Validierung
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    const difficultyDescriptions = {
        easy: 'einfach (Anfänger, grundlegende Vokabeln wie "amare", "bellum", einfache Grammatik)',
        medium: 'mittel (Fortgeschrittene, komplexere Strukturen, AcI, Ablativus Absolutus)',
        hard: 'schwer (Experten, anspruchsvolle Fragen zu Syntax, Stilistik, römischer Kultur und Philosophie)'
    };

    const prompt = `Erstelle eine ${difficultyDescriptions[difficulty]} lateinische Quiz-Frage für Schweizer Gymnasiasten.

[Zeitstempel: ${new Date().toISOString()}]

WICHTIG: Erstelle eine NEUE, ANDERE Frage - keine Wiederholungen!

FRAGETYPEN (abwechslungsreich mischen):
- Vokabelübersetzung (Latein → Deutsch): z.B. "Was bedeutet 'puella'?"
- Grammatikfrage (Konjugation, Deklination): z.B. "Welche Form ist 'laudavisti'?"
- Satzbau & Syntax: z.B. "Identifiziere den AcI in diesem Satz"
- Kulturwissen: z.B. "Wer war der erste römische Kaiser?"
- Mythologie: z.B. "Wer ist der römische Gott des Krieges?"

QUALITÄTSKONTROLLE - KRITISCH:
✓ Verwende NUR klassische, etablierte Vokabeln (Caesar, Cicero, Ovid)
✓ Prüfe ALLE Deklinationen/Konjugationen auf Korrektheit
✓ Historische Fakten müssen verifizierbar sein
✓ Falsche Antworten müssen plausibel, aber eindeutig falsch sein
✓ Keine erfundenen oder unsicheren lateinischen Formen

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
        // OpenAI API Call
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
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

WICHTIG: Qualität vor Kreativität - lieber eine sichere, korrekte Frage als eine originelle mit Fehlerrisiko.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.6,
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

        // Debug: Log für Vercel (um zu sehen, ob API aufgerufen wird)
        console.log('✅ Question generated:', {
            difficulty: difficulty,
            timestamp: new Date().toISOString(),
            tokensUsed: data.usage?.total_tokens,
            questionPreview: content.substring(0, 100) + '...'
        });

        // Parse JSON (entferne mögliche Markdown-Formatierung)
        let questionData;
        try {
            // Versuche direkt zu parsen
            questionData = JSON.parse(content);
        } catch (e) {
            // Falls Markdown vorhanden, extrahiere JSON
            const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                             content.match(/(\{[\s\S]*\})/);
            
            if (jsonMatch) {
                questionData = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error('Could not parse JSON from response');
            }
        }

        // Validiere die Struktur
        if (!questionData.question || !Array.isArray(questionData.options) || 
            questionData.options.length !== 4 || 
            typeof questionData.correctIndex !== 'number' ||
            !questionData.explanation) {
            throw new Error('Invalid question structure');
        }

        // Erfolgreich!
        return res.status(200).json(questionData);

    } catch (error) {
        console.error('Error generating question:', error);
        return res.status(500).json({ 
            error: 'Failed to generate question',
            message: error.message 
        });
    }
}
