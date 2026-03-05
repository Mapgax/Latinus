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
    const topicKeywords = {
        mythen: [
            'mytholog', 'Mythen', 'Mythi', 'Götter', 'Gott', 'Göttin', 'Held', 'Sage',
            'Metamorphosen', 'Trojan', 'Aeneas', 'Odysseus', 'Ovid', 'Phädrus', 'Fabeln',
            'Fabel', 'Götterwelt', 'Heldensagen', 'äsopisch', 'Dichtung und Mythologie'
        ],
        geschichte: [
            'Kulturwissen', 'Geschichte', 'Republik', 'Militär', 'Provinzen', 'Politik',
            'Kaiser', 'Rhetorik', 'Alltag', 'Recht', 'Senat', 'Philosophie',
            'Literatur', 'Baukunst', 'Frauen', 'Sklav', 'Handel', 'Reisen', 'Römer',
            'sozial', 'Magistrat', 'Prinzipat', 'Cicero', 'Caesar', 'Augustus', 'Plinius',
            'Martial', 'Gesellschaft', 'Expansion', 'Urbanistik', 'Rezeption',
            'Stoa', 'Epikur', 'Sentenzen', 'Sprichwörter', 'Bürgerkrieg', 'Seneca'
        ],
        alltagslatein: [
            'Lingua Viva', 'via', 'per', 'ad hoc', 'status quo', 'ultra', 'extra',
            'etc.', 'i.e.', 'e.g.', 'et al.', 'a.m.', 'p.m.',
            'veni vidi vici', 'carpe diem', 'cogito ergo sum', 'alea iacta', 'Rubikon',
            'alma mater', 'curriculum vitae', 'vox populi', 'mea culpa', 'sine qua non',
            'tabula rasa', 'memento mori', 'tempus fugit', 'in flagranti', 'alibi',
            'anno Domini', 'ad absurdum', 'prima vista',
            'Audi', 'Volvo', 'Marke', 'Firmenname', 'Produktname', 'audere', 'volvere',
            'Aquarium', 'Virus', 'Vakuum', 'Medium', 'Index', 'Agenda', 'Datum', 'Album',
            'Spektrum', 'Stadium', 'Radius', 'Fokus', 'Homo sapiens', 'Genus', 'Species',
            'Anatomie', 'Medizin', 'Biologie', 'Botanik', 'Zoologie', 'Taxonomie',
            'Redewendung', 'Sprichwort', 'Herkunft', 'Ursprung', 'Etymologie',
            'Rubikon', 'Achillesferse', 'Pyrrhussieg', 'gordisch',
            'Kirchenlatein', 'Vatikan', 'Liturgie', 'Neo-Latein', 'Nuntii Latini',
            'juristisch', 'Rechtslatein', 'Pharmazie', 'Apotheke',
            'Präfix', 'Suffix', 'Lehnwort', 'Fremdwort', 'Romanisch',
            'Französisch', 'Spanisch', 'Italienisch', 'Wortwurzel', 'lateinische Wurzel'
        ]
        // 'ueberraschung' wird nicht gefiltert → alle Kategorien/Themen verfügbar
    };

    /**
     * Filtert ein String-Array nach den Keywords des gewählten Themas.
     * Falls kein Treffer → Fallback auf das komplette Array.
     */
    function filterByTopic(items, activeTopic) {
        if (!activeTopic || activeTopic === 'ueberraschung') return items;
        const keywords = topicKeywords[activeTopic] || [];
        const filtered = items.filter(item =>
            keywords.some(kw => item.toLowerCase().includes(kw.toLowerCase()))
        );
        return filtered.length > 0 ? filtered : items;
    }

    // Thema validieren
    const activeTopic = (topic && ['mythen', 'geschichte', 'alltagslatein', 'ueberraschung'].includes(topic))
        ? topic
        : 'ueberraschung';

    // ── Kategorien & Themen nach Schwierigkeitsstufe ──────────────────────────

    const difficultyConfig = {
        easy: {
            label: 'leicht – prima.kompakt Lektionen 1–10 (1. bis 1.5 Lernjahre)',
            description: `Niveau: prima.kompakt Lektionen 1–10 (Anfänger, ca. 1.–1.5. Lernjahr).
Grammatik: a-/o-/kons. Deklination, Präsens/Imperfekt Aktiv, esse, einfacher AcI, Imperativ.
Vokabeln: Grundwortschatz ca. 200–300 Wörter (Familie, Alltag, Schule, Forum, Circus, Götter).`,
            categories: [
                'Vokabelübersetzung Latein→Deutsch (Grundwortschatz Lektionen 1–10)',
                'Vokabelübersetzung Deutsch→Latein (Grundwortschatz Lektionen 1–10)',
                'Konjugation: Präsens Aktiv (a-, e-, i-, kons. Konjugation)',
                'Konjugation: Imperfekt Aktiv',
                'Konjugation: Formen von "esse" (Präsens/Imperfekt)',
                'Deklination: a-Deklination und o-Deklination',
                'Kasusbestimmung: Nominativ, Akkusativ, Genitiv, Dativ, Ablativ erkennen',
                'Satzbau: Einfacher AcI erkennen und übersetzen',
                'Kulturwissen: Römischer Alltag (Familie, Forum, Schule)',
                'Kulturwissen: Circus Maximus, Thermen, römische Götter (Grundlagen)',
                'Lingua Viva: Lateinische Wörter im Deutschen (via, per, ultra, extra, super)',
                'Lingua Viva: Lateinische Abkürzungen im Alltag (etc., i.e., e.g., a.m., p.m.)',
                'Lingua Viva: Lateinische Zahlpräfixe (uni-, bi-, tri-, quad-)',
                'Lingua Viva: Bekannte lateinische Phrasen (carpe diem, veni vidi vici)',
                'Lingua Viva: Markennamen aus dem Lateinischen (Audi, Volvo, Aqua)'
            ],
            themes: [
                'Familie und Verwandtschaft (pater, mater, filius, filia)',
                'Alltag in Rom (Forum, Markt, Strassen)',
                'Schule und Lehrer (magister, discipulus)',
                'Tiere (equus, canis, leo)',
                'Götter-Grundlagen (Jupiter, Minerva, Mars)',
                'Das römische Haus (villa, atrium, hortus)',
                'Circus und Spiele (gladiator, auriga)',
                'Lingua Viva: Lateinische Wörter im Alltag (via, per, ultra, extra, super)',
                'Lingua Viva: Lateinische Abkürzungen (etc., i.e., e.g., a.m., p.m.)',
                'Lingua Viva: Markennamen und Produktnamen (Audi, Volvo, Aqua, Nova)',
                'Lingua Viva: Monate und Wochentage aus dem Lateinischen (Januar, März, August)',
                'Lingua Viva: Lateinische Zahlpräfixe im Alltag (Unikat, Billion, Triathlon)'
            ]
        },

        medium: {
            label: 'mittel – prima.kompakt Lektionen 11–22 (ca. 1.5.–3. Lernjahr)',
            description: `Niveau: prima.kompakt Lektionen 11–22 (Fortgeschrittene, ca. 1.5.–3. Lernjahr).
Grammatik: Perfekt/Plusquamperfekt/Futur, Passiv, Konjunktiv, Partizipien (PPP/PPA), AcI vertieft,
Ablativus Absolutus, Relativsätze, Finalsätze, Deponentien, nd-Formen, Komparativ/Superlativ.
Vokabeln: ca. 500–700 Wörter. Kulturwissen: Republik, Senat, Militär, Provinzen.`,
            categories: [
                'Konjugation: Perfekt Aktiv (Stammformen bestimmen)',
                'Konjugation: Plusquamperfekt und Futur I/II',
                'Konjugation: Passiv (Präsens, Imperfekt, Perfekt)',
                'Konjugation: Konjunktiv Präsens und Imperfekt',
                'Konjugation: Deponentien (z.B. sequi, loqui, uti)',
                'Partizipien: PPP, PPA erkennen und übersetzen',
                'Satzbau: Ablativus Absolutus analysieren',
                'Satzbau: AcI (vertieft), Finalsätze, Konsekutivsätze, cum-Sätze',
                'Adjektive der 3. Deklination und Steigerung (Komparativ/Superlativ)',
                'nd-Formen: Gerundium und Gerundivum',
                'Kulturwissen: Römische Republik, Senat, Magistrate',
                'Kulturwissen: Römisches Militär und Expansion',
                'Mythologie: Götter, Helden und Sagen (vertieft)',
                'Lingua Viva: Lateinische Phrasen im Alltag (status quo, pro und contra, ad hoc, per se)',
                'Lingua Viva: Wissenschaftliche Fachbegriffe aus dem Lateinischen (Virus, Aquarium, Vakuum, Spektrum)',
                'Lingua Viva: Redewendungen mit lateinischem Ursprung (Rubikon, Pyrrhussieg, Achillesferse)',
                'Lingua Viva: Lateinische Wortwurzeln in romanischen Sprachen',
                'Lingua Viva: Latein in Medizin und Recht (Alibi, Corpus delicti, per os)',
                'Lingua Viva: Geflügelte Worte und ihre Herkunft (veni vidi vici, alea iacta est)',
                'Lingua Viva: Lateinische Lehnwörter im Deutschen und Englischen (alibi, agenda, curriculum)'
            ],
            themes: [
                'Krieg und Militär (bellum, exercitus, imperator)',
                'Politik und Staat (senatus, consul, lex)',
                'Römische Republik und ihre Institutionen',
                'Mythologie: Trojanischer Krieg und Metamorphosen',
                'Religion und Opfer (templum, sacerdos)',
                'Recht und Gesetz (ius, iudex, poena)',
                'Berühmte Römer (Hannibal, Scipio, Romulus)',
                'Lingua Viva: Lateinische Phrasen im Alltag (status quo, ad hoc, pro und contra, per se)',
                'Lingua Viva: Wissenschaftsbegriffe lateinischer Herkunft (Virus, Aquarium, Vakuum, Spektrum)',
                'Lingua Viva: Deutsche Redewendungen mit antikem Ursprung (Rubikon, Pyrrhussieg, Achillesferse)',
                'Lingua Viva: Latein in Medizin und Recht (Alibi, Corpus delicti, Rezept)',
                'Lingua Viva: Geflügelte Worte der Antike (veni vidi vici, alea iacta est, Et tu Brute)',
                'Lingua Viva: Markennamen und ihr lateinischer Ursprung (Audi, Volvo, Alfa Romeo, Nivea)'
            ]
        },

        hard: {
            label: 'schwer – Lektüre & Latinum-Vorbereitung (ca. 3.–5. Lernjahr)',
            description: `Niveau: Lektüre-Phase und Latinum-Vorbereitung (ca. 3.–5. Lernjahr, Maturaniveau).
Originaltexte: Caesar, Cicero, Ovid, Plinius, Martial, Phädrus.
Grammatik: Konjunktiv alle Zeiten, Irrealis, oratio obliqua, Consecutio temporum,
alle Partizipialkonstruktionen, Stilmittel, Metrik (Hexameter).
Kulturwissen: Späte Republik, Prinzipat, Rhetorik, Philosophie (Stoa, Epikur), Rezeption.`,
            categories: [
                'Konjunktiv in allen Zeiten (Perfekt, Plusquamperfekt)',
                'Irrealis erkennen und übersetzen (Gegenwart/Vergangenheit)',
                'Indirekte Rede (oratio obliqua) analysieren',
                'Consecutio temporum: Zeitverhältnisse in Nebensätzen',
                'Unregelmässige Verben: ferre, velle, nolle, malle, fieri, ire',
                'Stilmittel erkennen (Chiasmus, Hyperbaton, Anapher, Klimax etc.)',
                'Metrik: Hexameter (Längen und Kürzen, Zäsuren)',
                'Originaltexte: Caesar (De bello Gallico) – Syntax und Inhalt',
                'Originaltexte: Cicero (Reden/Briefe) – Rhetorik und Argumentation',
                'Originaltexte: Ovid (Metamorphosen) – Dichtung und Mythologie',
                'Originaltexte: Plinius, Martial, Phädrus',
                'Kulturwissen: Späte Republik, Prinzipat, augusteisches Zeitalter',
                'Philosophie: Stoa, Epikureismus und ihre Vertreter',
                'Lateinische Sentenzen und Sprichwörter (mit Kontext)',
                'Lingua Viva: Lateinische Redewendungen mit mythologischem Hintergrund (Rubikon, Gordischer Knoten)',
                'Lingua Viva: Kirchenlatein und Liturgie (Pater noster, Agnus Dei, Ave Maria, Te Deum)',
                'Lingua Viva: Latein im Recht (habeas corpus, in dubio pro reo, prima facie, Corpus Juris)',
                'Lingua Viva: Neo-Latein und Latein als lebende Sprache (Vatikan, Nuntii Latini, Akademien)',
                'Lingua Viva: Lateinische Etymologie in Botanik, Zoologie, Astronomie (Homo sapiens, Genus, Species)',
                'Lingua Viva: Latein in Inschriften, Wappen, Mottos (Confederatio Helvetica, E pluribus unum)',
                'Lingua Viva: Latein als Mutter der romanischen Sprachen – Etymologie und Entwicklung',
                'Lingua Viva: Lateinische Sentenzen und ihre Rezeptionsgeschichte (Horaz: carpe diem, memento mori)'
            ],
            themes: [
                'Caesar und der Gallische Krieg',
                'Cicero als Redner und Politiker',
                'Ovids Metamorphosen und die Götterwelt',
                'Plinius, Martial, Phädrus',
                'Der Untergang der Republik',
                'Augustus und der Prinzipat',
                'Römische Rhetorik und Überzeugungskunst',
                'Philosophie in Rom (Seneca, Cicero, Lukrez)',
                'Das Weiterleben der Antike (Rezeption)',
                'Recht, Macht und Moral in der Antike',
                'Lingua Viva: Redewendungen mit mythologischem Hintergrund (Rubikon, Achillesferse, Gordischer Knoten)',
                'Lingua Viva: Kirchenlatein – Liturgie und Gebet (Pater noster, Ave Maria, Agnus Dei)',
                'Lingua Viva: Latein im modernen Recht (habeas corpus, in dubio pro reo, Corpus Juris)',
                'Lingua Viva: Neo-Latein: Vatikan, Nuntii Latini, lateinische Akademien',
                'Lingua Viva: Lateinische Etymologie in Wissenschaft (Homo sapiens, Aquarium, Botanik)',
                'Lingua Viva: Latein in Wappen und nationalen Mottos (Confederatio Helvetica, E pluribus unum)',
                'Lingua Viva: Latein → Romanische Sprachen (Vulgarlatein, Entwicklung, Gemeinsamkeiten)',
                'Lingua Viva: Sentenzen und ihre Herkunft (Horaz carpe diem, Seneca tempus fugit, Ovid)'
            ]
        }
    };

    const config = difficultyConfig[difficulty];

    // Kategorien und Themen nach gewähltem Thema filtern
    const filteredCategories = filterByTopic(config.categories, activeTopic);
    const filteredThemes     = filterByTopic(config.themes,     activeTopic);

    const randomCategory = filteredCategories[Math.floor(Math.random() * filteredCategories.length)];
    const randomTheme    = filteredThemes[Math.floor(Math.random() * filteredThemes.length)];
    const randomSeed     = Math.floor(Math.random() * 100000);

    const topicLabel = {
        mythen:        'Mythen (Götter, Helden, Sagen)',
        geschichte:    'Geschichte & Kultur (Rom, Politik, Alltag)',
        alltagslatein: 'Lingua Viva – Latein heute & überall',
        ueberraschung: 'gemischt (alle Themen)'
    }[activeTopic] || 'gemischt';

    // ── Bereits gestellte Fragen ausschliessen ────────────────────────────────
    let exclusionNote = '';
    if (previousQuestions && Array.isArray(previousQuestions) && previousQuestions.length > 0) {
        const recent = previousQuestions.slice(-10);
        exclusionNote = `\n\nBEREITS GESTELLTE FRAGEN (stelle KEINE davon erneut!):\n${recent.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }

    // ── Spezielle Anweisung für Lingua Viva ──────────────────────────────────
    const linguaVivaExtra = activeTopic === 'alltagslatein' ? `

SPEZIELLE ANWEISUNGEN FÜR "LINGUA VIVA – LATEIN HEUTE & ÜBERALL":
Ziel: Zeige den Schülerinnen und Schülern, dass Latein keine tote Sprache ist!
Fragen sollen folgende Bereiche abdecken:

1. WÖRTER IM ALLTAG: Lateinische Wörter die wir täglich nutzen
   Beispiele: via, per, ultra, extra, sub, super, contra, pro, status quo, ad hoc, etc.

2. ABKÜRZUNGEN: Lateinische Kürzel im modernen Gebrauch
   Beispiele: etc. (et cetera), i.e. (id est), e.g. (exempli gratia), a.m./p.m., NB (nota bene), PS (post scriptum), et al. (et alii)

3. GEFLÜGELTE WORTE: Bekannte Phrasen und ihre Bedeutung
   Beispiele: "carpe diem" (Horaz), "veni vidi vici" (Caesar), "alea iacta est" (Caesar/Sueton),
   "in medias res" (Horaz), "alma mater", "curriculum vitae", "sine qua non", "tabula rasa", "memento mori"

4. REDEWENDUNGEN MIT ANTIKEM URSPRUNG im Deutschen:
   Beispiele: "den Rubikon überschreiten", "die Würfel sind gefallen", "Pyrrhussieg",
   "Achillesferse", "Gordischer Knoten", "Prokrustesbett", "nach Canossa gehen"

5. MARKENNAMEN aus dem Lateinischen:
   Beispiele: Audi (lat. "audi!" = höre!), Volvo (lat. "volvo" = ich wälze/rolle),
   Aqua (Wasser), Nova, Optima, Maxima, Alfa Romeo, Subaru (nicht lateinisch!), Nivea (lat. "nivea" = schneeweiss)

6. WISSENSCHAFT: Lateinische Fachbegriffe in modernen Disziplinen
   Beispiele: Virus, Vakuum, Aquarium, Medium, Index, Agenda, Datum, Album, Spektrum, Radius,
   Homo sapiens, Genus, Species (Biologie), Corpus delicti, Alibi (Recht)

7. ROMANISCHE SPRACHEN: Wo lebt Latein als Sprache weiter?
   Beispiele: Latein → Italienisch, Spanisch, Französisch, Portugiesisch, Rumänisch
   Gemeinsamkeiten zeigen (aqua → eau/agua/acqua)

8. LATEIN HEUTE GESPROCHEN:
   Beispiele: Vatikan (offizielle Sprache), Nuntii Latini (finnisches Radiolatein), lateinische Akademien,
   Kirchenlatein, lateinische Inschriften, Universitätsmottos, Staatsmottos

Wähle Beispiele passend zur Schwierigkeitsstufe:
- LEICHT: Sehr bekannte Beispiele (a.m./p.m., super, ultra, Audi, carpe diem)
- MITTEL: Phrasen, Redewendungen, Wissenschaftsbegriffe mit Erklärung
- SCHWER: Etymologie, Kirchenlatein, Rechtslatein, Neo-Latein, romanische Sprachentwicklung
` : '';

    const prompt = `Erstelle eine Quiz-Frage für Schweizer Gymnasiasten (Lehrbuch "prima.kompakt", C.C. Buchner Verlag).

SCHWIERIGKEITSSTUFE: ${config.label}
${config.description}

THEMA dieser Frage: ${topicLabel}
KATEGORIE: ${randomCategory}
THEMENBEREICH: ${randomTheme}
[Seed: ${randomSeed}] [Zeit: ${new Date().toISOString()}]
${linguaVivaExtra}
Erstelle eine NEUE, EINZIGARTIGE Frage zu diesem Thema!${exclusionNote}

QUALITÄTSKONTROLLE:
✔ Nur Niveau-passendes Vokabular und Grammatik
✔ Alle lateinischen Formen 100% korrekt
✔ Historische/etymologische Fakten verifizierbar
✔ Falsche Antworten plausibel, aber eindeutig falsch
✔ Bei Lingua Viva: Erklärung enthält Etymologie + heutige Relevanz

Antwort als valides JSON (kein Markdown):
{
  "question": "Frage auf Deutsch",
  "options": ["Antwort A", "Antwort B", "Antwort C", "Antwort D"],
  "correctIndex": 0,
  "explanation": "Erklärung mit Lerneffekt (1-2 Sätze)"
}`;

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
                        content: `Du bist ein ausgezeichneter Latein-Lehrer an einem Schweizer Gymnasium mit Expertise in lateinischer Sprachwissenschaft und Rezeptionsgeschichte.
Du arbeitest mit dem Lehrbuch "prima.kompakt" (C.C. Buchner Verlag, 22 Lektionen).

QUALITÄTSSTANDARDS:
- Alle Formen, Vokabeln und Übersetzungen müssen 100% korrekt sein
- Etymologische Angaben müssen wissenschaftlich akkurat sein
- Kulturwissen muss historisch belegt sein
- Erklärungen didaktisch wertvoll und präzise
- Strikt ans angegebene Niveau halten

NIVEAUSTUFEN:
- LEICHT: Grundwortschatz, einfache Grammatik (Lektionen 1–10)
- MITTEL: Erweiterter Wortschatz, keine Originaltexte (Lektionen 11–22)
- SCHWER: Originaltexte, Stilmittel, Metrik, komplexe Syntax

KATEGORIE LINGUA VIVA:
Zeige, dass Latein keine tote Sprache ist. Erkläre in der "explanation" immer:
- die lateinische Wurzel/Herkunft
- wie das Wort/die Phrase heute noch lebt
Begeistere die Schülerinnen und Schüler für die Lebendigkeit des Lateins!

Antworte NUR mit validem JSON, kein Markdown.`
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
