# Ludus Latinus 🏛️

Ein interaktives, gamifiziertes Latein-Quiz für die Kantonsschule Kollegium Schwyz (KSK).

## ✨ Features

### 🎮 Gamification
- **3 Schwierigkeitsstufen**: Einfach, Mittel, Schwer
- **Punktesystem**: 10/20/30 Punkte pro richtige Antwort
- **Echtzeit-Statistik**: Punkte, richtige Antworten, Gesamtfragen
- **Session-basiert**: Keine Datenspeicherung (datenschutzkonform!)

### 📚 Fragetypen (von Claude AI generiert)
- **Vokabelübersetzung**: Latein → Deutsch
- **Grammatikfragen**: Konjugationen, Deklinationen, Satzbau
- **Kulturwissen**: Römische Geschichte, Mythologie, Alltag

### 🌍 Mehrsprachigkeit
- Deutsch
- Latina (Latein)
- Schwiizerdütsch

### 🎨 Design
- Römisch-inspiriertes, elegantes Design
- Mediterrane Farbpalette (Terra Cotta, Roman Gold)
- Smooth Animationen und Transitions
- Responsive für alle Geräte

### 🔒 Datenschutz
- **Keine localStorage/Cookies**: Alle Daten nur in Session
- **Keine User-Tracking**: Vollständig anonym
- **DSGVO-konform**: Keine personenbezogenen Daten

## 🚀 Deployment auf Vercel

### Methode 1: GitHub Integration (Empfohlen)

1. **Code auf GitHub hochladen**:
   ```bash
   cd /pfad/zu/deinem/projekt
   git add index.html
   git commit -m "Updated Ludus Latinus with Claude API"
   git push origin main
   ```

2. **Vercel mit GitHub verbinden**:
   - Gehe zu [vercel.com](https://vercel.com)
   - Klicke auf "New Project"
   - Wähle dein GitHub Repository "Latinus"
   - Klicke auf "Import"

3. **Projekt konfigurieren**:
   - Framework Preset: "Other"
   - Root Directory: `./`
   - Build Command: (leer lassen)
   - Output Directory: `./`
   
4. **Deploy**:
   - Klicke auf "Deploy"
   - Fertig! 🎉

### Methode 2: Vercel CLI

```bash
# Vercel CLI installieren (falls noch nicht installiert)
npm i -g vercel

# In deinem Projektordner
cd /pfad/zu/deinem/projekt

# Deployen
vercel

# Für Production
vercel --prod
```

## 🛠️ Technische Details

### Verwendete Technologien
- **HTML5**: Struktur
- **CSS3**: Styling mit Custom Properties, Animations, Grid/Flexbox
- **Vanilla JavaScript**: Logik und API-Integration
- **Claude API**: Dynamische Fragengenerierung via Anthropic AI

### API Integration
Die Fragen werden live von der Claude API generiert:
- Model: `claude-sonnet-4-20250514`
- Endpoint: `https://api.anthropic.com/v1/messages`
- Keine API-Key Konfiguration nötig (wird von Vercel/Browser gehandhabt)

### Browser-Kompatibilität
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile Browsers: ✅

## 📝 Anpassungen

### Schwierigkeitsgrade ändern
In `index.html` die Punkte anpassen (Zeile ~570):
```javascript
score += currentDifficulty === 'easy' ? 10 : 
         currentDifficulty === 'medium' ? 20 : 30;
```

### Farben anpassen
CSS Custom Properties in `:root` (Zeile ~15):
```css
--terra-cotta: #C1666B;
--roman-gold: #D4AF37;
--marble-white: #F5F1E8;
/* etc. */
```

### Fragetypen erweitern
Prompt in `loadQuestion()` anpassen (Zeile ~450):
```javascript
const prompt = `Du bist ein Latein-Lehrer. Erstelle eine...`;
```

## 🐛 Troubleshooting

### Fragen laden nicht
- **Browser-Konsole** öffnen (F12) und Fehler prüfen
- **API-Limit**: Claude API hat Rate Limits
- **Netzwerk**: Internet-Verbindung prüfen

### Design sieht anders aus
- **Browser-Cache** leeren (Ctrl+Shift+R)
- **Google Fonts** laden prüfen

### Punktezählung funktioniert nicht
- **Session**: Punkte werden beim Neuladen zurückgesetzt (gewollt!)
- **JavaScript aktiviert?**: Browser-Einstellungen prüfen

## 📄 Lizenz

© 2025 - Erstellt von Mirjam Döpfert, Lehrperson für Latein an der KSK

## 🤝 Beitragen

Falls du Verbesserungsvorschläge hast:
1. Fork das Repository
2. Erstelle einen Feature Branch
3. Commit deine Änderungen
4. Erstelle einen Pull Request

## 💡 Ideen für Erweiterungen

- [ ] Timer für schnelle Antworten (Bonus-Punkte)
- [ ] Kategorien-Filter (nur Grammatik, nur Vokabeln, etc.)
- [ ] Fortschritts-Balken pro Session
- [ ] Sound-Effekte bei richtigen/falschen Antworten
- [ ] Dark Mode Toggle
- [ ] Export der Session-Statistik als PDF
- [ ] Leaderboard (optional, mit Opt-In)

---

**Viel Erfolg beim Latein-Lernen! Vale! 🏛️**
