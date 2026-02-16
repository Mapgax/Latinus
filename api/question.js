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

    const prompt = `Du bist ein Latein-Lehrer für Schweizer Gymnasiasten. Erstelle eine ${difficultyDescriptions[difficulty]} lateinische Quiz-Frage.

Mische die Fragetypen abwechslungsreich:
- Vokabelübersetzung (Latein → Deutsch): z.B. "Was bedeutet 'puella'?"
- Grammatikfrage (Konjugation, Deklination): z.B. "Welche Form ist 'laudavisti'?"
- Satzbau & Syntax: z.B. "Identifiziere den AcI in diesem Satz"
- Kulturwissen: z.B. "Wer war der erste römische Kaiser?"
- Mythologie: z.B. "Wer ist der römische Gott des Krieges?"

Gib die Antwort als VALIDES JSON zurück (keine Markdown-Formatierung):

{
  "question": "Die Frage klar formuliert auf Deutsch",
  "options": ["Antwort 1", "Antwort 2", "Antwort 3", "Antwort 4"],
  "correctIndex": 0,
  "explanation": "Eine kurze, lehrreiche Erklärung (1-2 Sätze) auf Deutsch"
}

WICHTIG:
- Nur JSON ausgeben, keine zusätzlichen Texte oder Markdown
- correctIndex ist 0, 1, 2 oder 3
- Alle 4 Antworten müssen plausibel klingen
- Erklärung sollte Lerneffekt haben`;

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
                        content: 'Du bist ein erfahrener Latein-Lehrer. Antworte IMMER nur mit validem JSON, ohne Markdown-Formatierung.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 500
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
