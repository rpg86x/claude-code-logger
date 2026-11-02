// Demomodus: verzonnen maar realistische data voor screenshots en presentaties.
// Altijd dezelfde uitkomst per dag (vaste seed), zodat beelden reproduceerbaar zijn.

const PROJECTS = [
  { title: "Weer-app met radarkaart", project: "weer-app" },
  { title: "Portfolio website", project: "portfolio" },
  { title: "Budget tracker", project: "budget-tracker" },
  { title: "Discord bot voor de club", project: "club-bot" },
  { title: "Recepten-app", project: "recepten" },
  { title: "Fotogalerij opschonen", project: "fotogalerij" },
];

const PROMPTS = [
  "maak een donker thema voor de instellingenpagina",
  "waarom geeft de build een fout op regel 42?",
  "voeg een zoekbalk toe bovenaan de lijst",
  "schrijf tests voor de datumfuncties",
  "kan je de grafiek responsive maken voor mobiel?",
  "refactor deze functie, hij is veel te lang geworden",
  "ja, ga door",
  "ziet er goed uit, commit het maar",
  "de knop doet niks als ik erop klik, kun je kijken?",
  "voeg een export naar CSV toe",
  "maak de laadtijd sneller, de pagina hangt even",
  "zet het op GitHub",
  "leg uit wat deze regex doet",
  "voeg een melding toe als het opslaan gelukt is",
  "kan het icoon iets groter?",
  "doe maar optie 2",
  "maak een README met installatie-instructies",
  "de API geeft soms een 500, voeg een retry toe",
  "vertaal alle teksten naar het Engels",
  "werkt nu, bedankt! volgende stap?",
  "voeg een filter toe op categorie",
  "maak een snelkoppeling op mijn bureaublad",
];

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

function demoData(days = 120) {
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
      const p = PROJECTS[Math.floor(r() * PROJECTS.length)];
      const session = `demo-${key}-${from}`;
      let t = day.getTime() + (from + r() * (to - from - 0.5)) * 3600000;
      const end = t + (20 + r() * 100) * 60000;
      while (t < end && t < now) {
        prompts.push({
          id: `${session}-${prompts.length}`, ts: Math.round(t), session,
          text: PROMPTS[Math.floor(r() * PROMPTS.length)], title: p.title, project: p.project,
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
