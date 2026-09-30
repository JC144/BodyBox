// Jours calendaires locaux au format YYYY-MM-DD, et arithmétique sur ces jours.
// Les calculs passent par UTC pour ne pas être perturbés par les changements d'heure.

const pad = (n) => String(n).padStart(2, '0');

/** Jour local (YYYY-MM-DD) d'un horodatage. */
export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toUtc(day) {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Ajoute n jours (éventuellement négatif) à un jour. */
export function addDays(day, n) {
  return fromUtc(toUtc(day) + n * 86400000);
}

/** Nombre de jours de a à b (b − a). */
export function diffDays(a, b) {
  return Math.round((toUtc(b) - toUtc(a)) / 86400000);
}

/** Jour de la semaine, lundi = 0 … dimanche = 6. */
export function weekdayMon0(day) {
  return (new Date(toUtc(day)).getUTCDay() + 6) % 7;
}

/** Lundi de la semaine contenant ce jour. */
export function startOfWeek(day) {
  return addDays(day, -weekdayMon0(day));
}
