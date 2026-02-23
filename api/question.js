// Vercel Serverless Function für Latein-Fragen
// Abgestimmt auf prima.kompakt (C.C. Buchner Verlag)
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

    const { difficulty, topic, previousQuestions } = req.body;

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    // ── Themen-Keyword-Filter ─────────────────────────────────────────────────
    // Für jedes Thema: Welche Schlüsselwörter kennzeichnen passende Kategorien/Themen?
    const topicKeywords = {
        mythen: [
            'mytholog', 'Mythen', 'Mythi', 'Götter', 'Gott', 'Göttin', 'Held', 'Sage',
            'Metamorphosen', 'Trojan', 'Aeneas', 'Odysseus', 'Ovid', 'Phädrus', 'Fabeln',
            'Fabel', 'Götterwelt', 'Heldensagen', 'äsopisch', 'Dichtung und Mythologie'
        ],
        geschichte: [
            'Kulturwissen', 'Geschichte', 'Republik', 'Militär', 'Provinzen', 'Politik',
            'Kaiser', 'Rhetorik', 'Alltag', 'Recht', 'Senat', 'Philosophie', 'Philosophi',
            'Literatur', 'Baukunst', 'Frauen', 'Sklav', 'Handel', 'Reisen', 'Römer',
            'sozial', 'Magistrat', 'Prinzipat', 'Cicero', 'Caesar', 'Augustus', 'Plinius',
            'Martial', 'Gesellschaft', 'Expansion', 'Gattung', 'Urbanistik', 'Rezeption',
            'Überzeugungskunst', 'Stoa', 'Epikur', 'Sentenzen', 'Sprichwörter', 'Gallisch',
            'Bürgerkrieg', 'Pompeius', 'Machtlosigkeit', 'Seneca', 'Lukrez'
        ],
        vokabeln: [
            'Vokabel', 'Konjugation', 'Deklination', 'Satzbau', 'Partizip', 'Pronomen',
            'Adjektiv', 'nd-Form', 'Stilmittel', 'Metrik', 'Konjunktiv', 'Kasusbestimmung',
            'übersetzen', 'Stammform', 'Infinitiv', 'Kasus', 'Syntax', 'AcI', 'Imperativ',
            'Perfekt', 'Plusquamperfekt', 'Futur', 'Passiv', 'Imperfekt', 'Präsens',
            'Deponent', 'Gerundium', 'Gerundivum', 'Komparativ', 'Superlativ', 'Irrealis',
            'oratio obliqua', 'Consecutio', 'Hexameter', 'Chiasmus', 'Hyperbaton',
            'Anapher', 'Klimax', 'ferre', 'velle', 'nolle', 'fieri', 'esse',
            'Übersetzung', 'lateinischen Satz', 'Originalsatz', 'Grammatik'
        ]
        // 'ueberraschung' wird nicht gefiltert → alle Kategorien/Themen verfügbar
    };

    /**
     * Filtert ein String-Array nach den Keywords des gewählten Themas.
     * Falls kein Treffer → Fallback auf das komplette Array (damit nie eine leere Liste entsteht).
     */
    function filterByTopic(items, activeTopic) {
        if (!activeTopic || activeTopic === 'ueberraschung') return items;
        const keywords = topicKeywords[activeTopic] || [];
        const filtered = items.filter(item =>
            keywords.some(kw => item.includes(kw))
        );
        return filtered.length > 0 ? filtered : items;  // Fallback: alles
    }

    // Thema validieren (undefined/null → ueberraschung)
    const activeTopic = (topic && ['mythen', 'geschichte', 'vokabeln', 'ueberraschung'].includes(topic))
        ? topic
        : 'ueberraschung';

    // ── Kategorien & Themen nach Schwierigkeitsstufe (prima.kompakt) ──────────

    const difficultyConfig = {
        // LEICHT: Lektionen 1–10 von prima.kompakt (~1.5 Jahre, Anfänger)
        easy: {
            label: 'leicht – prima.kompakt Lektionen 1–10 (1. bis 1.5 Lernjahre)',
            description: `Niveau: prima.kompakt Lektionen 1–10 (Anfänger, ca. 1.–1.5. Lernjahr).
Grammatik auf diesem Niveau:
- Substantive: a-Deklination (z.B. amica, -ae), o-Deklination (z.B. amicus, -i; templum, -i), Beginn konsonantische Deklination (z.B. rex, regis)
- Kasus: Nominativ, Akkusativ, Genitiv, Dativ, Ablativ (Grundformen)
- Verben: Konjugationen im Präsens Aktiv (a-, e-, i-, kons. Konjugation), Imperativ, Infinitiv Präsens
- Imperfekt Aktiv, Verb "esse" (Präsens + Imperfekt)
- Satzlehre: einfache Hauptsätze, erste Gliedsätze, Einführung AcI
- Pronomen: Personalpronomen, einfache Fragepronomen (quis, quid)
Vokabeln: Grundwortschatz ca. 200–300 Wörter (Familie, Alltag in Rom, Schule, Forum, Circus, einfache Tiere, Zahlen)
Kulturwissen: Römisches Alltagsleben, Familie, Forum Romanum, Circus Maximus, Götter-Grundlagen`,
            categories: [
                'Vokabelübersetzung Latein→Deutsch (Grundwortschatz Lektionen 1–10)',
                'Vokabelübersetzung Deutsch→Latein (Grundwortschatz Lektionen 1–10)',
                'Konjugation: Präsens Aktiv (a-, e-, i-, kons. Konjugation)',
                'Konjugation: Imperfekt Aktiv',
                'Konjugation: Formen von "esse" (Präsens/Imperfekt)',
                'Deklination: a-Deklination (amica, -ae)',
                'Deklination: o-Deklination (amicus, -i / templum, -i)',
                'Deklination: Beginn konsonantische Deklination (rex, regis)',
                'Kasusbestimmung: Nominativ, Akkusativ, Genitiv, Dativ, Ablativ erkennen',
                'Satzbau: Einfacher AcI erkennen und übersetzen',
                'Kulturwissen: Römischer Alltag (Familie, Forum, Schule)',
                'Kulturwissen: Circus Maximus, Thermen, römische Götter (Grundlagen)',
                'Einfachen lateinischen Satz übersetzen (Präsens/Imperfekt)'
            ],
            themes: [
                'Familie und Verwandtschaft (pater, mater, filius, filia)',
                'Alltag in Rom (Forum, Markt, Strassen)',
                'Schule und Lehrer (magister, discipulus)',
                'Essen und Mahlzeiten (cena, cibus)',
                'Tiere (equus, canis, leo)',
                'Götter-Grundlagen (Jupiter, Minerva, Mars)',
                'Das römische Haus (villa, atrium, hortus)',
                'Circus und Spiele (gladiator, auriga)',
                'Freundschaft und Grüsse (amicus, salve)',
                'Zahlen und Zeit (primus, secundus, hora)'
            ]
        },

        // MITTEL: Lektionen 11–22 von prima.kompakt (~1.5 Jahre, Fortgeschrittene)
        medium: {
            label: 'mittel – prima.kompakt Lektionen 11–22 (ca. 1.5.–3. Lernjahr)',
            description: `Niveau: prima.kompakt Lektionen 11–22 (Fortgeschrittene, ca. 1.5.–3. Lernjahr).
Grammatik auf diesem Niveau:
- Verben: Perfekt Aktiv (v-/u-/s-/Dehnungs-/Reduplikationsperfekt), Plusquamperfekt, Futur I + II, Passiv (Präsens/Imperfekt/Perfekt), Konjunktiv (Präsens + Imperfekt), Deponentien
- Partizipien: PPP (Partizip Perfekt Passiv), PPA (Partizip Präsens Aktiv), PFA
- Satzlehre: AcI (vertieft), Ablativus Absolutus, Relativsätze, indirekte Fragesätze, Finalsätze (ut/ne), Konsekutivsätze, cum-Sätze
- Substantive: i-Deklination, u-Deklination, e-Deklination, Adjektive der 3. Deklination
- Pronomen: Relativ-, Demonstrativ- (is, hic, ille), Reflexivpronomen
- Steigerung: Komparativ und Superlativ
- nd-Formen: Gerundium, Gerundivum
Vokabeln: Erweiterter Wortschatz ca. 500–700 Wörter
Kulturwissen: Römische Republik, Senat, Militär, Provinzen, Mythologie vertieft`,
            categories: [
                'Konjugation: Perfekt Aktiv (Stammformen bestimmen)',
                'Konjugation: Plusquamperfekt und Futur I/II',
                'Konjugation: Passiv (Präsens, Imperfekt, Perfekt)',
                'Konjugation: Konjunktiv Präsens und Imperfekt',
                'Konjugation: Deponentien (z.B. sequi, loqui, uti)',
                'Partizipien: PPP, PPA erkennen und übersetzen',
                'Satzbau: Ablativus Absolutus analysieren',
                'Satzbau: Relativsätze korrekt zuordnen',
                'Satzbau: AcI (vertieft, mit verschiedenen Zeitverhältnissen)',
                'Satzbau: Finalsätze (ut/ne), Konsekutivsätze, cum-Sätze',
                'Deklination: i-Stämme, u-Deklination, e-Deklination',
                'Adjektive der 3. Deklination und Steigerung (Komparativ/Superlativ)',
                'nd-Formen: Gerundium und Gerundivum',
                'Pronomen: Demonstrativpronomen (is, hic, ille) bestimmen',
                'Kulturwissen: Römische Republik, Senat, Magistrate',
                'Kulturwissen: Römisches Militär und Expansion',
                'Mythologie: Götter, Helden und Sagen (vertieft)',
                'Mittelschweren lateinischen Satz übersetzen'
            ],
            themes: [
                'Krieg und Militär (bellum, exercitus, imperator)',
                'Politik und Staat (senatus, consul, lex)',
                'Römische Republik und ihre Institutionen',
                'Mythologie: Trojanischer Krieg, Odysseus, Aeneas',
                'Mythologie: Metamorphosen und Heldensagen',
                'Provinzen und Expansion (Gallien, Britannien)',
                'Religion und Opfer (templum, sacerdos, sacrificium)',
                'Recht und Gesetz (ius, iudex, poena)',
                'Handel, Geld und Wirtschaft (mercator, pecunia)',
                'Reisen und Geographie (via, navis, mare)',
                'Philosophie-Grundlagen (virtus, sapientia)',
                'Berühmte Römer (Hannibal, Scipio, Romulus)'
            ]
        },

        // SCHWER: Lektüre-Phase & Latinum-Vorbereitung (~2 Jahre)
        hard: {
            label: 'schwer – Lektüre & Latinum-Vorbereitung (ca. 3.–5. Lernjahr)',
            description: `Niveau: Lektüre-Phase und Latinum-Vorbereitung (ca. 3.–5. Lernjahr, Maturaniveau).
Basierend auf den prima.kompakt "Latein original"-Einheiten (Martial, Phädrus, Plinius, Caesar, Cicero) und der Vorbereitung auf das Latinum am Schweizer Gymnasium.

Grammatik auf diesem Niveau (alles aus Leicht + Mittel plus):
- Konjunktiv in allen Zeiten (auch Perfekt und Plusquamperfekt)
- Irrealis (Gegenwart/Vergangenheit)
- Indirekte Rede (oratio obliqua)
- Komplexe Perioden mit verschachtelten Nebensätzen
- Consecutio temporum
- Alle Partizipialkonstruktionen sicher beherrschen
- Supinum I und II
- Seltene Formen (ferre, velle, nolle, malle, fieri, ire)

Textarbeit:
- Originaltexte von Caesar (De bello Gallico), Cicero (Reden, Briefe), Ovid (Metamorphosen), Plinius (Briefe), Martial (Epigramme), Phädrus (Fabeln)
- Stilmittel erkennen (Alliteration, Anapher, Chiasmus, Hyperbaton, Klimax, Trikolon etc.)
- Metrik: Hexameter-Grundlagen (bei Ovid/Vergil)
- Übersetzungstechnik: Konstruktionsmethode, Einrückmethode

Kulturwissen (vertieft):
- Späte Republik und Prinzipat (Caesar, Augustus, Cicero im historischen Kontext)
- Römische Rhetorik und Redekunst
- Philosophische Strömungen (Stoa, Epikureismus, Skeptizismus)
- Römische Literaturgeschichte
- Rezeption der Antike`,
            categories: [
                'Konjunktiv in allen Zeiten anwenden (Perfekt, Plusquamperfekt)',
                'Irrealis erkennen und übersetzen (Gegenwart/Vergangenheit)',
                'Indirekte Rede (oratio obliqua) analysieren',
                'Consecutio temporum: Zeitverhältnisse in Nebensätzen',
                'Komplexe Satzperioden entschlüsseln (verschachtelte Nebensätze)',
                'Unregelmässige Verben: ferre, velle, nolle, malle, fieri, ire',
                'Stilmittel erkennen (Chiasmus, Hyperbaton, Anapher, Klimax etc.)',
                'Metrik: Hexameter (Längen und Kürzen, Zäsuren)',
                'Originaltexte: Caesar (De bello Gallico) – Syntax und Inhalt',
                'Originaltexte: Cicero (Reden/Briefe) – Rhetorik und Argumentation',
                'Originaltexte: Ovid (Metamorphosen) – Dichtung und Mythologie',
                'Originaltexte: Plinius (Briefe) – Alltagsleben und Gesellschaft',
                'Originaltexte: Martial (Epigramme) – Pointe und Gesellschaftskritik',
                'Originaltexte: Phädrus (Fabeln) – Moral und Erzähltechnik',
                'Kulturwissen: Späte Republik (Caesar, Pompeius, Bürgerkriege)',
                'Kulturwissen: Cicero – Leben, Werk und politischer Kontext',
                'Kulturwissen: Prinzipat und augusteisches Zeitalter',
                'Kulturwissen: Römische Rhetorik (genera dicendi, partes orationis)',
                'Philosophie: Stoa, Epikureismus und ihre lateinischen Vertreter',
                'Lateinische Sentenzen und Sprichwörter (mit Kontext)',
                'Anspruchsvollen Originalsatz übersetzen und interpretieren'
            ],
            themes: [
                'Caesar und der Gallische Krieg',
                'Cicero als Redner und Politiker',
                'Ovids Metamorphosen und die Götterwelt',
                'Plinius und das römische Alltagsleben',
                'Martials scharfzüngige Epigramme',
                'Phädrus und die äsopische Fabeltradition',
                'Der Untergang der Republik',
                'Augustus und der Beginn des Prinzipats',
                'Römische Rhetorik und Überzeugungskunst',
                'Philosophie in Rom (Seneca, Cicero, Lukrez)',
                'Römische Literaturgeschichte und Gattungen',
                'Das Weiterleben der Antike (Rezeption)',
                'Recht, Macht und Moral in der Antike',
                'Römische Baukunst und Urbanistik (Kolosseum, Aquädukte)',
                'Frauen in der römischen Gesellschaft',
                'Sklaverei und soziale Schichtung in Rom'
            ]
        }
    };

    const config = difficultyConfig[difficulty];

    // Kategorien und Themen nach gewähltem Thema filtern
    const filteredCategories = filterByTopic(config.categories, activeTopic);
    const filteredThemes     = filterByTopic(config.themes,     activeTopic);

    // Zufällig aus den gefilterten Listen wählen
    const randomCategory = filteredCategories[Math.floor(Math.random() * filteredCategories.length)];
    const randomTheme    = filteredThemes[Math.floor(Math.random() * filteredThemes.length)];
    const randomSeed     = Math.floor(Math.random() * 100000);

    // Themenbezeichnung für den Prompt (menschlich lesbar)
    const topicLabel = {
        mythen:        'Mythen (Götter, Helden, Sagen)',
        geschichte:    'Geschichte & Kultur (Rom, Politik, Alltag)',
        vokabeln:      'Vokabeln & Grammatik',
        ueberraschung: 'gemischt (alle Themen)'
    }[activeTopic] || 'gemischt';

    // ── Bereits gestellte Fragen ausschliessen ──────────────────────────────
    let exclusionNote = '';
    if (previousQuestions && Array.isArray(previousQuestions) && previousQuestions.length > 0) {
        const recent = previousQuestions.slice(-10);
        exclusionNote = `\n\nBEREITS GESTELLTE FRAGEN (stelle KEINE davon erneut!):\n${recent.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }

    const prompt = `Erstelle eine Quiz-Frage für Schweizer Gymnasiasten, die mit dem Lehrbuch "prima.kompakt" (C.C. Buchner Verlag) Latein lernen.

SCHWIERIGKEITSSTUFE: ${config.label}

${config.description}

ÜBERGEORDNETES THEMA dieser Frage: ${topicLabel}
KATEGORIE für diese Frage: ${randomCategory}
THEMENBEREICH: ${randomTheme}
[Zufallsseed: ${randomSeed}]
[Zeitstempel: ${new Date().toISOString()}]

WICHTIG: Erstelle eine NEUE, EINZIGARTIGE Frage passend zum übergeordneten Thema "${topicLabel}", zur Kategorie und zum Themenbereich!${exclusionNote}

QUALITÄTSKONTROLLE – KRITISCH:
✔ Verwende NUR Vokabeln und Grammatik, die zum angegebenen Niveau passen
✔ Bei "leicht": NUR Grundwortschatz und einfache Grammatik (Lektionen 1–10)
✔ Bei "mittel": Erweiterter Wortschatz, aber keine Originaltexte (Lektionen 11–22)
✔ Bei "schwer": Originaltextbezug, komplexe Grammatik, Stilmittel, Metrik erlaubt
✔ Prüfe ALLE Deklinationen/Konjugationen auf 100% Korrektheit
✔ Historische Fakten müssen verifizierbar sein
✔ Falsche Antworten müssen plausibel, aber eindeutig falsch sein
✔ Keine erfundenen oder unsicheren lateinischen Formen

Gib die Antwort als VALIDES JSON zurück (keine Markdown-Formatierung):

{
  "question": "Die Frage präzise und klar formuliert auf Deutsch",
  "options": ["Antwort 1", "Antwort 2", "Antwort 3", "Antwort 4"],
  "correctIndex": 0,
  "explanation": "Kurze, präzise Erklärung mit didaktischem Wert (1-2 Sätze). Bei Grammatikfragen: Regel nennen. Bei Vokabeln: Stammformen angeben."
}

WICHTIG:
- Nur JSON ausgeben, keine zusätzlichen Texte oder Markdown
- correctIndex ist 0, 1, 2 oder 3 (die richtige Antwort)
- Alle 4 Antworten müssen plausibel klingen (keine offensichtlich falschen)
- Erklärung sollte Lerneffekt haben und auf prima.kompakt-Niveau passen
- Im Zweifelsfall: sichere, etablierte Fragen statt kreative mit Fehlerrisiko`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Du bist ein ausgezeichneter, fehlerfreier Latein-Lehrer an einem Schweizer Gymnasium.
Du arbeitest mit dem Lehrbuch "prima.kompakt" vom C.C. Buchner Verlag (22 Lektionen, ca. 800 Lernwörter, danach Originallektüre mit Martial, Phädrus, Plinius, Caesar und Cicero).

QUALITÄTSSTANDARDS:
- Alle lateinischen Vokabeln, Grammatik und Übersetzungen müssen 100% korrekt sein
- Prüfe jede Frage doppelt auf Fehler in Deklination, Konjugation und Syntax
- Verwende nur etablierte, klassische Beispiele (keine erfundenen oder unsicheren Wörter)
- Kulturwissen muss historisch akkurat sein (keine Spekulationen)
- Erklärungen müssen didaktisch wertvoll und präzise sein
- Halte dich STRIKT an das angegebene Niveau – keine zu schweren Fragen bei "leicht"!

NIVEAUSTUFEN (orientiert an prima.kompakt):
- LEICHT (Lektionen 1–10): Grundwortschatz, a-/o-/kons. Deklination, Präsens, Imperfekt, esse, einfacher AcI, Imperativ
- MITTEL (Lektionen 11–22): Perfekt, Passiv, Partizipien, Abl.Abs., Konjunktiv, Relativsätze, Deponentien, nd-Formen
- SCHWER (Lektüre/Latinum): Originaltexte (Caesar, Cicero, Ovid etc.), Stilmittel, Metrik, komplexe Syntax, Irrealis, oratio obliqua

DEINE AUFGABE:
Erstelle akademisch einwandfreie Quiz-Fragen passend zum Niveau und zum angegebenen Thema.
Antworte IMMER nur mit validem JSON, ohne Markdown-Formatierung oder zusätzlichen Text.

WICHTIG:
- Qualität vor Kreativität – lieber eine sichere, korrekte Frage als eine originelle mit Fehlerrisiko
- Jede Frage muss ANDERS sein als alle vorherigen
- Variiere Vokabeln, Grammatikthemen und Kontexte`
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
            topic: activeTopic,
            level: config.label,
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
