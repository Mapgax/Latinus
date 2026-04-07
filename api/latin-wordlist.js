// latin-wordlist.js
// Kuratierte Wortliste für Lingua Viva — Latein-Quiz KSK
// Quellen: prima.kompakt (C.C. Buchner, Lektionen 1–22) + Whitaker's Words (klassisches Latein)
// Alle Lemmata (Wörterbuchformen) — keine flektierten Formen

export const LATIN_WORDLIST = new Set([

  // ── A ─────────────────────────────────────────────────────────
  'ab', 'abesse', 'abire', 'absens', 'abuti', 'accedere', 'accipere',
  'acer', 'acerbus', 'acies', 'ad', 'adesse', 'adire', 'adiuvare',
  'admirari', 'adventus', 'aedificare', 'aedificium', 'aeger',
  'aequus', 'agere', 'ager', 'agricola', 'alba', 'albus',
  'alea', 'aliquis', 'alius', 'altus', 'amare', 'ambitio',
  'amicus', 'amor', 'anima', 'animosus', 'animus', 'annus',
  'ante', 'antiquus', 'aperire', 'appellare', 'appropinquare',
  'apud', 'aqua', 'aquila', 'ara', 'arbor', 'ardere',
  'arma', 'ars', 'atque', 'audere', 'audire', 'aurum',
  'aut', 'auxilium',

  // ── B ─────────────────────────────────────────────────────────
  'bellum', 'bellator', 'bene', 'beneficium', 'bonus', 'brevis',

  // ── C ─────────────────────────────────────────────────────────
  'caedes', 'caelum', 'Caesar', 'caput', 'capere', 'carcer',
  'causa', 'cedere', 'celer', 'certe', 'certus', 'civis',
  'civitas', 'clarus', 'cogere', 'cognoscere', 'colere',
  'comes', 'committere', 'comparare', 'confirmare', 'confligere',
  'consilium', 'consul', 'constituere', 'contra', 'copiae',
  'corpus', 'credere', 'crudelis', 'cum', 'cupiditas',
  'cupidus', 'cura', 'custodire', 'custos',

  // ── D ─────────────────────────────────────────────────────────
  'dare', 'dea', 'debere', 'decere', 'deducere', 'defendere',
  'delectare', 'delere', 'deus', 'dicere', 'dies',
  'difficilis', 'dignus', 'discedere', 'discere', 'dividere',
  'domina', 'dominus', 'domus', 'ducere', 'dux',

  // ── E ─────────────────────────────────────────────────────────
  'e', 'ex', 'ego', 'enim', 'esse', 'et', 'etiam',
  'exercere', 'exercitus', 'exire', 'expectare',

  // ── F ─────────────────────────────────────────────────────────
  'facere', 'facilis', 'fama', 'familia', 'fatum', 'femina',
  'ferox', 'ferre', 'fidelis', 'fides', 'filia', 'filius',
  'finis', 'flere', 'florere', 'forma', 'fortis', 'fortuna',
  'forum', 'frater', 'fugere', 'fuga',

  // ── G ─────────────────────────────────────────────────────────
  'Gallia', 'Gallus', 'gaudere', 'gens', 'genus', 'gerere',
  'gladiator', 'gladius', 'gloria', 'gratia', 'gravis',

  // ── H ─────────────────────────────────────────────────────────
  'habere', 'hasta', 'hic', 'homo', 'honor', 'hora',
  'hortari', 'hostis',

  // ── I ─────────────────────────────────────────────────────────
  'ibi', 'ille', 'imperare', 'imperator', 'imperium',
  'in', 'incipere', 'inimicus', 'inquit', 'inter',
  'interesse', 'invenire', 'ipse', 'ira', 'iubere',
  'ius', 'iustus', 'iter',

  // ── L ─────────────────────────────────────────────────────────
  'labor', 'laetus', 'laus', 'laudare', 'legere', 'legio',
  'lex', 'liber', 'liberare', 'libertas', 'locus', 'longus',
  'lupa', 'lux',

  // ── M ─────────────────────────────────────────────────────────
  'magnus', 'malus', 'manus', 'mare', 'mater', 'medicus',
  'memoria', 'mens', 'mercator', 'miles', 'mittere',
  'modus', 'mons', 'moriri', 'mors', 'movere', 'mulier',
  'multus', 'mundus', 'munus', 'murus',

  // ── N ─────────────────────────────────────────────────────────
  'nam', 'narrare', 'nauta', 'navigare', 'navis', 'nec',
  'neque', 'nomen', 'non', 'novus', 'nox', 'nuntius',

  // ── O ─────────────────────────────────────────────────────────
  'occidere', 'oculus', 'omnis', 'onus', 'oppidum', 'optimus',
  'opus', 'oratio', 'orare',

  // ── P ─────────────────────────────────────────────────────────
  'parare', 'pars', 'pater', 'patria', 'pax', 'pecunia',
  'per', 'perdere', 'periculum', 'petere', 'philosophus',
  'poena', 'poeta', 'populus', 'porta', 'posse', 'post',
  'potens', 'potentia', 'praemium', 'primus', 'princeps',
  'proelium', 'propter', 'provincia', 'puella', 'puer',
  'pulcher', 'putare',

  // ── Q ─────────────────────────────────────────────────────────
  'quaerere', 'quam', 'qui', 'quod', 'quoque',

  // ── R ─────────────────────────────────────────────────────────
  'ratio', 'recusare', 'redire', 'regere', 'regnum', 'relinquere',
  'res', 'rex', 'rogare', 'Roma', 'Romanus', 'Romulus', 'Remus',

  // ── S ─────────────────────────────────────────────────────────
  'sacer', 'saevus', 'salus', 'sapiens', 'scribere', 'sed',
  'semper', 'senatus', 'senator', 'sentire', 'servare',
  'servus', 'signum', 'silva', 'sine', 'socius', 'sol',
  'soror', 'spectare', 'stare', 'sub', 'superare',

  // ── T ─────────────────────────────────────────────────────────
  'tacere', 'tamen', 'tantum', 'templum', 'tempus', 'terra',
  'terrere', 'timere', 'timor', 'trans', 'tum',

  // ── U ─────────────────────────────────────────────────────────
  'ubi', 'urbs', 'ut',

  // ── V ─────────────────────────────────────────────────────────
  'valere', 'venire', 'verbum', 'veritas', 'via', 'victoria',
  'videre', 'vincere', 'vir', 'virtus', 'vita', 'vocare',
  'vox', 'vulnerare', 'vulnus',

  // ── Mythologie & Eigennamen ────────────────────────────────────
  'Aeneas', 'Apollo', 'Bacchus', 'Brutus', 'Cicero',
  'Diana', 'Hercules', 'Iuno', 'Iuppiter', 'Mars',
  'Mercurius', 'Minerva', 'Neptunus', 'Olympus', 'Ovidius',
  'Pluto', 'Saturnus', 'Ulixes', 'Venus', 'Vergilius',
  'Vulcanus', 'Troia', 'Carthago', 'Graecia',

  // ── Grammatik-Lernwörter (Lektionen 11–22) ────────────────────
  'abesse', 'adesse', 'amare', 'cogitare', 'conari',
  'deponere', 'fari', 'loqui', 'meminisse', 'mirari',
  'noscere', 'oblivisci', 'progredi', 'sequi', 'uti',

  // ── Lektüre-Wortschatz (Latinum / schwer) ─────────────────────
  'abstinere', 'bellator', 'casus', 'circumdare', 'clamor',
  'classis', 'cohortem', 'conficere', 'copiae', 'decernere',
  'deducere', 'demittere', 'destinare', 'diligentia',
  'discidium', 'eloquentia', 'equus', 'exsilium', 'fatum',
  'flagitium', 'frumentum', 'gloria', 'gravis', 'hostis',
  'iacere', 'impedire', 'impetus', 'inopia', 'insidiae',
  'integrum', 'iustum', 'latere', 'legatus', 'lenis',
  'liberare', 'littera', 'loqui', 'lucrari', 'ludus',
  'magister', 'maiestas', 'maleficium', 'maximus', 'meritum',
  'minimus', 'mirabilis', 'modo', 'monere', 'munire',
  'negotium', 'nobilis', 'nocere', 'obesse', 'occasio',
  'officium', 'oppugnare', 'ordo', 'otium', 'pati',
  'paucus', 'perire', 'persuadere', 'plures', 'posse',
  'praesidium', 'proficisci', 'prohibere', 'promittere',
  'pugna', 'pugnare', 'quaestio', 'rapere', 'recte',
  'recuperare', 'resistere', 'respondere', 'revocare',
  'sapientia', 'scelerus', 'simulare', 'sinere', 'sistere',
  'spem', 'spes', 'studere', 'studium', 'suadere',
  'tollere', 'tradere', 'transferre', 'turpis', 'tutus',
  'ulcisci', 'ultimus', 'unicus', 'uti', 'utilitas',
  'vacare', 'vastare', 'velle', 'verus', 'vetare',
  'vinculum', 'violentus', 'visere', 'vivere', 'volare',

]);

// ── Flektionsendungen für Stammerkennung ─────────────────────────
// Wenn ein Wort nicht im Wörterbuch ist, versuchen wir den Stamm zu finden
const LATIN_SUFFIXES = [
  // Deklinationsendungen
  'arum', 'orum', 'erum', 'ibus', 'is', 'ae', 'am', 'as',
  'um', 'us', 'em', 'es', 'os', 'orum', 'i', 'o',
  // Konjugationsendungen
  'abat', 'ebat', 'ibat', 'abant', 'ebant', 'ibant',
  'avit', 'evit', 'ivit', 'averunt', 'erunt', 'ivi',
  'amus', 'emus', 'imus', 'atis', 'etis', 'itis',
  'ant', 'ent', 'unt', 'atur', 'etur', 'itur',
  'antur', 'entur', 'untur', 'are', 'ere', 'ire',
  'isse', 'ari', 'eri', 'iri',
  // Partizipien
  'atus', 'itus', 'utus', 'ans', 'ens', 'ntis',
  'andus', 'endus', 'iendus',
];

// Lemma-Endungen, die wir nach Stammreduktion ausprobieren
const LEMMA_ENDINGS = [
  'are', 'ere', 'ire', 'us', 'a', 'um', 'is', 'er', 'or',
  'io', 'as', 'es', 'os', 'men',
];

/**
 * Prüft ob ein Wort wahrscheinlich ein gültiges lateinisches Wort ist.
 * Direkter Treffer oder über Stammerkennung.
 */
export function isLikelyLatinWord(word) {
  if (!word || word.length < 2) return true; // zu kurz zum Prüfen

  const lower = word.toLowerCase();

  // Direkter Treffer
  if (LATIN_WORDLIST.has(lower) || LATIN_WORDLIST.has(word)) return true;

  // Stammreduktion: Endung abschneiden, dann Lemma-Endung anhängen
  for (const suffix of LATIN_SUFFIXES) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 2) {
      const stem = lower.slice(0, -suffix.length);
      for (const ending of LEMMA_ENDINGS) {
        if (LATIN_WORDLIST.has(stem + ending)) return true;
      }
      // Auch den nackten Stamm prüfen (z.B. für i-Stämme)
      if (LATIN_WORDLIST.has(stem) || LATIN_WORDLIST.has(stem + 'e')) return true;
    }
  }

  return false;
}
