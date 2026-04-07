// pons-lookup.js
// Optionale PONS-API-Integration für Randfall-Validierung
// Lingua Viva — Latein-Quiz KSK
//
// Setup:
//   1. Registrierung auf https://de.pons.com (kostenlos)
//   2. API-Schlüssel unter Profil → API aktivieren
//   3. In Vercel: Environment Variable PONS_API_SECRET setzen
//   Free Tier: 1.000 Abfragen/Monat — ausreichend für Validierung
//
// Die PONS-API wird NUR aufgerufen, wenn:
//   - Das Wort NICHT in der lokalen Wortliste (latin-wordlist.js) ist
//   - Das lokale Ergebnis "invalid" zurückgibt
//   - Maximal 5 Abfragen pro Frage (Quota schonen)

const PONS_API_BASE = 'https://api.pons.com/v1/dictionary';

/**
 * Einzelne PONS-Abfrage für ein lateinisches Wort.
 * Sprache: la → de (Latein → Deutsch)
 */
export async function lookupPons(word) {
  const secret = process.env.PONS_API_SECRET;

  if (!secret) {
    // Kein API-Key konfiguriert — graceful fallback
    return { found: null, word, reason: 'no_api_key' };
  }

  try {
    const url = `${PONS_API_BASE}?q=${encodeURIComponent(word)}&l=la-de&in=la&language=de`;

    const response = await fetch(url, {
      headers: { 'X-Secret': secret },
      // Timeout: 2 Sekunden (Quiz darf nicht zu lange warten)
      signal: AbortSignal.timeout(2000),
    });

    // 204 = kein Eintrag gefunden
    if (response.status === 204) {
      return { found: false, word };
    }

    // 429 = Rate Limit
    if (response.status === 429) {
      console.warn('[PONS] Rate limit erreicht');
      return { found: null, word, reason: 'rate_limit' };
    }

    if (!response.ok) {
      console.error(`[PONS] API-Fehler: HTTP ${response.status}`);
      return { found: null, word, reason: `http_${response.status}` };
    }

    const data = await response.json();

    // PONS gibt ein Array zurück — prüfe ob Treffer vorhanden
    const hasHits = Array.isArray(data) &&
                    data.length > 0 &&
                    data[0]?.hits?.length > 0;

    if (!hasHits) {
      return { found: false, word };
    }

    // Ersten Treffer für Logging extrahieren
    const firstHit = data[0].hits[0];
    const translation = firstHit?.roms?.[0]?.arabs?.[0]?.translations?.[0];

    return {
      found: true,
      word,
      translation: translation?.target || null,
    };

  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.warn(`[PONS] Timeout bei "${word}"`);
      return { found: null, word, reason: 'timeout' };
    }
    console.error(`[PONS] Fehler bei "${word}":`, error.message);
    return { found: null, word, reason: 'network_error' };
  }
}

/**
 * Validiert mehrere unbekannte Wörter über PONS.
 * Maximal 5 Abfragen pro Aufruf, um Quota zu schonen.
 *
 * @param {string[]} unknownWords - Wörter, die nicht in der lokalen Liste sind
 * @returns {{ confirmed: string[], rejected: string[], uncertain: string[] }}
 */
export async function validateWithPons(unknownWords) {
  if (!unknownWords || unknownWords.length === 0) {
    return { confirmed: [], rejected: [], uncertain: [] };
  }

  // Max 5 Abfragen
  const toCheck = unknownWords.slice(0, 5);

  // Parallele Abfragen
  const results = await Promise.all(toCheck.map(w => lookupPons(w)));

  const confirmed = results.filter(r => r.found === true).map(r => r.word);
  const rejected  = results.filter(r => r.found === false).map(r => r.word);
  const uncertain = results.filter(r => r.found === null).map(r => r.word);

  console.log('[PONS] Validation:', { confirmed, rejected, uncertain });

  return { confirmed, rejected, uncertain };
}
