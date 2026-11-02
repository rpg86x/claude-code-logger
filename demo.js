// Demomodus: verzonnen maar realistische data voor screenshots en presentaties.
// Altijd dezelfde uitkomst per dag (vaste seed), zodat beelden reproduceerbaar zijn.

const PROJECTS = {
  nl: ["Weer-app met radarkaart", "Portfolio website", "Budget tracker", "Discord bot voor de club", "Recepten-app", "Fotogalerij opschonen"],
  en: ["Weather app with radar map", "Portfolio website", "Budget tracker", "Discord bot for the club", "Recipe app", "Photo gallery clean-up"],
  de: ["Wetter-App mit Radarkarte", "Portfolio-Website", "Budget-Tracker", "Discord-Bot für den Verein", "Rezepte-App", "Fotogalerie aufräumen"],
  fr: ["Appli météo avec carte radar", "Site portfolio", "Suivi de budget", "Bot Discord pour le club", "Appli de recettes", "Nettoyage de la galerie photo"],
  es: ["App del tiempo con radar", "Web de portafolio", "Control de gastos", "Bot de Discord para el club", "App de recetas", "Limpieza de la galería de fotos"],
};
const SLUGS = ["weather-app", "portfolio", "budget-tracker", "club-bot", "recipes", "photo-gallery"];

const PROMPTS = {
  nl: ["maak een donker thema voor de instellingenpagina", "waarom geeft de build een fout op regel 42?", "voeg een zoekbalk toe bovenaan de lijst", "schrijf tests voor de datumfuncties", "kan je de grafiek responsive maken voor mobiel?", "refactor deze functie, hij is veel te lang geworden", "ja, ga door", "ziet er goed uit, commit het maar", "de knop doet niks als ik erop klik, kun je kijken?", "voeg een export naar CSV toe", "maak de laadtijd sneller, de pagina hangt even", "zet het op GitHub", "leg uit wat deze regex doet", "voeg een melding toe als het opslaan gelukt is", "kan het icoon iets groter?", "doe maar optie 2", "maak een README met installatie-instructies", "de API geeft soms een 500, voeg een retry toe", "vertaal alle teksten naar het Engels", "werkt nu, bedankt! volgende stap?", "voeg een filter toe op categorie", "maak een snelkoppeling op mijn bureaublad"],
  en: ["add a dark theme to the settings page", "why does the build fail on line 42?", "add a search bar above the list", "write tests for the date helpers", "can you make the chart responsive on mobile?", "refactor this function, it got way too long", "yes, go ahead", "looks good, commit it", "the button does nothing when I click it, can you check?", "add a CSV export", "speed up the load time, the page hangs for a bit", "push it to GitHub", "explain what this regex does", "show a notification when saving succeeds", "can the icon be a bit bigger?", "let's go with option 2", "write a README with install instructions", "the API sometimes returns a 500, add a retry", "translate all strings to Dutch", "works now, thanks! next step?", "add a category filter", "put a shortcut on my desktop"],
  de: ["füge ein dunkles Design für die Einstellungsseite hinzu", "warum schlägt der Build in Zeile 42 fehl?", "füge oben in der Liste eine Suchleiste hinzu", "schreib Tests für die Datumsfunktionen", "kannst du das Diagramm auf dem Handy responsiv machen?", "refaktoriere diese Funktion, sie ist viel zu lang", "ja, mach weiter", "sieht gut aus, committe es", "der Button macht nichts, wenn ich klicke, kannst du nachsehen?", "füge einen CSV-Export hinzu", "mach die Ladezeit schneller, die Seite hängt kurz", "stell es auf GitHub", "erklär mir, was dieser Regex macht", "zeig eine Meldung, wenn das Speichern geklappt hat", "kann das Icon etwas größer?", "nimm Option 2", "schreib eine README mit Installationsanleitung", "die API gibt manchmal 500 zurück, füge einen Retry hinzu", "übersetze alle Texte ins Englische", "funktioniert jetzt, danke! nächster Schritt?", "füge einen Filter nach Kategorie hinzu", "leg eine Verknüpfung auf meinem Desktop an"],
  fr: ["ajoute un thème sombre à la page des paramètres", "pourquoi le build échoue à la ligne 42 ?", "ajoute une barre de recherche au-dessus de la liste", "écris des tests pour les fonctions de date", "tu peux rendre le graphique responsive sur mobile ?", "refactorise cette fonction, elle est devenue trop longue", "oui, vas-y", "ça a l'air bien, fais le commit", "le bouton ne fait rien quand je clique, tu peux vérifier ?", "ajoute un export CSV", "accélère le chargement, la page bloque un peu", "mets-le sur GitHub", "explique ce que fait cette regex", "affiche une notification quand l'enregistrement réussit", "l'icône peut être un peu plus grande ?", "on part sur l'option 2", "écris un README avec les instructions d'installation", "l'API renvoie parfois une 500, ajoute un retry", "traduis tous les textes en anglais", "ça marche, merci ! étape suivante ?", "ajoute un filtre par catégorie", "crée un raccourci sur mon bureau"],
  es: ["añade un tema oscuro a la página de ajustes", "¿por qué falla el build en la línea 42?", "añade una barra de búsqueda encima de la lista", "escribe tests para las funciones de fecha", "¿puedes hacer el gráfico responsive en el móvil?", "refactoriza esta función, se ha vuelto demasiado larga", "sí, adelante", "se ve bien, haz el commit", "el botón no hace nada al pulsarlo, ¿puedes mirarlo?", "añade una exportación a CSV", "acelera la carga, la página se queda colgada un momento", "súbelo a GitHub", "explica qué hace esta regex", "muestra un aviso cuando se guarde bien", "¿puede ser el icono un poco más grande?", "vamos con la opción 2", "escribe un README con instrucciones de instalación", "la API a veces devuelve un 500, añade un reintento", "traduce todos los textos al inglés", "¡ya funciona, gracias! ¿siguiente paso?", "añade un filtro por categoría", "pon un acceso directo en mi escritorio"],
};

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function demoData(days = 120, lang = "nl") {
  const titles = PROJECTS[lang] || PROJECTS.en, texts = PROMPTS[lang] || PROMPTS.en;
  const now = Date.now();
  const prompts = [];
  const activity = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today); day.setDate(day.getDate() - i);
    const key = day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();
    const r = rng(key);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    if (r() > (weekend ? 0.55 : 0.85)) continue; // vrije dag

    // 1–3 sessies: ochtend, middag en/of avond
    const slots = [[8.5, 11], [13, 16], [19, 22.5]].filter(() => r() < 0.6);
    if (!slots.length) slots.push([19, 22]);
    for (const [from, to] of slots) {
      const pi = Math.floor(r() * SLUGS.length);
      const session = `demo-${key}-${from}`;
      let t = day.getTime() + (from + r() * (to - from - 0.5)) * 3600000;
      const end = t + (20 + r() * 100) * 60000;
      while (t < end && t < now) {
        prompts.push({
          id: `${session}-${prompts.length}`, ts: Math.round(t), session,
          text: texts[Math.floor(r() * texts.length)], title: titles[pi], project: SLUGS[pi],
        });
        // Claude werkt na elke prompt een tijdje door
        const work = (0.5 + r() * 5) * 60000;
        for (let a = t; a < t + work && a < now; a += 15000 + r() * 30000) activity.push(Math.round(a));
        t += work + (0.3 + r() * 4) * 60000;
      }
    }
  }
  return {
    generated: now, files: 0, demo: true, archiveSince: prompts.length ? prompts[0].ts : null,
    prompts, activity: activity.sort((a, b) => a - b),
  };
}

module.exports = { demoData };
