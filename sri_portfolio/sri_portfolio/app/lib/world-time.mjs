export const WORLD_TIME_ZONE = "America/Los_Angeles";
const radians = Math.PI / 180;
const latitude = 37.7749 * radians;
const longitude = -122.4194;
const smooth = (value, low, high) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};
const clock = new Intl.DateTimeFormat("en-US", {
  timeZone: WORLD_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});
const clockParts = new Intl.DateTimeFormat("en-US", {
  timeZone: WORLD_TIME_ZONE,
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

// The skyline clock and the written SF time share this wall-clock reading.
export function wallClock(date) {
  const parts = {};
  for (const part of clockParts.formatToParts(date)) {
    if (part.type === "hour" || part.type === "minute")
      parts[part.type] = Number(part.value);
  }
  return { hour: parts.hour % 24, minute: parts.minute };
}

// Approximate solar position from NOAA's fractional-year equations. UTC keeps
// solar motion continuous across DST; Intl supplies the actual SF wall clock.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
export function worldTime(date) {
  const year = date.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const days = (Date.UTC(year + 1, 0, 1) - yearStart) / 86400000;
  const day = Math.floor((date.getTime() - yearStart) / 86400000) + 1;
  const hour =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const gamma = ((2 * Math.PI) / days) * (day - 1 + (hour - 12) / 24);
  const equation =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const solarMinutes =
    (((hour * 60 + equation + 4 * longitude) % 1440) + 1440) % 1440;
  const angle = (solarMinutes / 4 - 180) * radians;
  const east = -Math.cos(declination) * Math.sin(angle);
  const up =
    Math.sin(latitude) * Math.sin(declination) +
    Math.cos(latitude) * Math.cos(declination) * Math.cos(angle);
  const north =
    Math.cos(latitude) * Math.sin(declination) -
    Math.sin(latitude) * Math.cos(declination) * Math.cos(angle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, up))) / radians;
  const time = wallClock(date);
  return {
    iso: date.toISOString(),
    label: clock.format(date),
    hour: time.hour,
    minute: time.minute,
    direction: [east, up, north],
    altitude,
    daylight: smooth(altitude, -6, 12),
    warmth: 1 - smooth(Math.abs(altitude), 0, 18),
    phase:
      altitude < -6
        ? "Night"
        : altitude < 0
          ? "Twilight"
          : altitude < 12
            ? "Golden light"
            : "Daylight",
  };
}

export const biomeMoods = {
  planet: {
    label: "A little world, on San Francisco time",
    sky: "#8ab4dc",
    sun: "#fff0d2",
    exposure: 1,
  },
  studio: {
    label: "Rain at the windows",
    // Overcast light is neutral grey; a blue sun turned the whole city blue.
    sky: "#a3b0bf",
    sun: "#ebe8e2",
    exposure: 0.7,
  },
  projects: {
    label: "There’s always a side project",
    sky: "#b9b4e1",
    sun: "#ffe0b1",
    exposure: 0.9,
  },
  court: {
    label: "The 5–9 side of life",
    sky: "#a9c9dd",
    sun: "#ffcf94",
    exposure: 1,
  },
  entertainment: {
    label: "Something good in the background",
    sky: "#91add7",
    sun: "#ffd2a1",
    exposure: 0.65,
  },
  trail: {
    label: "A little fresh air",
    sky: "#acd1cd",
    sun: "#fff0cc",
    exposure: 1,
  },
  future: {
    label: "A little room for a conversation",
    sky: "#b8c7bd",
    sun: "#ffe1b2",
    exposure: 0.85,
  },
};
