export const DUNGEON_RESETS = {
  sod: { type: 'weekly', day: 3, hourUTC: 0 }, // Wed 00:00 UTC
  crucible: { type: 'weekly', day: 3, hourUTC: 0 },
  wl: { type: 'weekly', day: 3, hourUTC: 0 },
  abyssal: { type: 'weekly', day: 3, hourUTC: 0 },
  void_taint: { type: 'weekly', day: 3, hourUTC: 0 },
  
  void_invasion: { type: 'weekly', day: 1, hourUTC: 0 }, // Mon 00:00 UTC
  
  void_nightmare: { type: 'weekly', day: 5, hourUTC: 0 }, // Fri 00:00 UTC
  
  loj: { type: 'weekly', day: 5, hourUTC: 6 }, // Fri 14:00 PHT = 06:00 UTC
  
  berkas: { type: 'daily', hourUTC: 6 }, // Daily 14:00 PHT = 06:00 UTC
  tod: { type: 'daily', hourUTC: 6 },
  infinity: { type: 'daily', hourUTC: 6 }
};

/**
 * Calculates the exact UTC Date of the most recent reset for a given dungeon.
 * @param {string} dungeonId 
 * @param {Date} now Current time (defaults to Date.now())
 * @returns {Date} The exact Date object of the most recent reset.
 */
export function getLastReset(dungeonId, now = new Date()) {
  const rule = DUNGEON_RESETS[dungeonId];
  if (!rule) return new Date(0); // fallback to epoch if unknown

  const d = new Date(now.getTime());
  
  if (rule.type === 'daily') {
    if (d.getUTCHours() < rule.hourUTC) {
      d.setUTCDate(d.getUTCDate() - 1);
    }
    d.setUTCHours(rule.hourUTC, 0, 0, 0);
  } else if (rule.type === 'weekly') {
    let daysToSubtract = d.getUTCDay() - rule.day;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    } else if (daysToSubtract === 0 && d.getUTCHours() < rule.hourUTC) {
      daysToSubtract = 7;
    }
    d.setUTCDate(d.getUTCDate() - daysToSubtract);
    d.setUTCHours(rule.hourUTC, 0, 0, 0);
  }
  
  return d;
}
