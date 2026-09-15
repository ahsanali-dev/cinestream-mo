/**
 * Language normalization helper for CineStream media players & watch pages
 * Maps ISO codes and labels to user-friendly names and 3-letter codes
 */

export interface LanguageInfo {
  name: string;
  code: string;
}

export const NETFLIX_CATALOG_LANGUAGES = [
  "Arabic",
  "Czech",
  "German",
  "English",
  "Spanish",
  "Filipino (Tagalog)",
  "French",
  "Hindi",
  "Hungarian",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Portuguese",
  "Russian",
  "Tamil",
  "Telugu",
  "Turkish",
];

export const ISO_LANG_MAP: Record<string, LanguageInfo> = {
  ar: { name: "Arabic", code: "ARA" },
  ara: { name: "Arabic", code: "ARA" },
  arabic: { name: "Arabic", code: "ARA" },

  bn: { name: "Bengali", code: "BEN" },
  ben: { name: "Bengali", code: "BEN" },
  bengali: { name: "Bengali", code: "BEN" },

  cs: { name: "Czech", code: "CES" },
  ces: { name: "Czech", code: "CES" },
  cze: { name: "Czech", code: "CES" },
  czech: { name: "Czech", code: "CES" },

  da: { name: "Danish", code: "DAN" },
  dan: { name: "Danish", code: "DAN" },
  danish: { name: "Danish", code: "DAN" },

  de: { name: "German", code: "DEU" },
  ger: { name: "German", code: "DEU" },
  deu: { name: "German", code: "DEU" },
  german: { name: "German", code: "DEU" },

  el: { name: "Greek", code: "ELL" },
  gre: { name: "Greek", code: "ELL" },
  ell: { name: "Greek", code: "ELL" },
  greek: { name: "Greek", code: "ELL" },

  en: { name: "English", code: "ENG" },
  eng: { name: "English", code: "ENG" },
  english: { name: "English", code: "ENG" },

  es: { name: "Spanish", code: "SPA" },
  spa: { name: "Spanish", code: "SPA" },
  spanish: { name: "Spanish", code: "SPA" },

  fa: { name: "Persian", code: "FAS" },
  fas: { name: "Persian", code: "FAS" },
  per: { name: "Persian", code: "FAS" },
  persian: { name: "Persian", code: "FAS" },

  fil: { name: "Filipino (Tagalog)", code: "FIL" },
  tl: { name: "Filipino (Tagalog)", code: "TGL" },
  tgl: { name: "Filipino (Tagalog)", code: "TGL" },
  tagalog: { name: "Filipino (Tagalog)", code: "TGL" },
  filipino: { name: "Filipino (Tagalog)", code: "FIL" },

  fr: { name: "French", code: "FRA" },
  fre: { name: "French", code: "FRA" },
  fra: { name: "French", code: "FRA" },
  french: { name: "French", code: "FRA" },

  he: { name: "Hebrew", code: "HEB" },
  heb: { name: "Hebrew", code: "HEB" },
  hebrew: { name: "Hebrew", code: "HEB" },

  hi: { name: "Hindi", code: "HIN" },
  hin: { name: "Hindi", code: "HIN" },
  hindi: { name: "Hindi", code: "HIN" },

  hu: { name: "Hungarian", code: "HUN" },
  hun: { name: "Hungarian", code: "HUN" },
  hungarian: { name: "Hungarian", code: "HUN" },

  id: { name: "Indonesian", code: "IND" },
  ind: { name: "Indonesian", code: "IND" },
  indonesian: { name: "Indonesian", code: "IND" },

  it: { name: "Italian", code: "ITA" },
  ita: { name: "Italian", code: "ITA" },
  italian: { name: "Italian", code: "ITA" },

  ja: { name: "Japanese", code: "JPN" },
  jpn: { name: "Japanese", code: "JPN" },
  japanese: { name: "Japanese", code: "JPN" },

  ko: { name: "Korean", code: "KOR" },
  kor: { name: "Korean", code: "KOR" },
  korean: { name: "Korean", code: "KOR" },

  ml: { name: "Malayalam", code: "MAL" },
  mal: { name: "Malayalam", code: "MAL" },
  malayalam: { name: "Malayalam", code: "MAL" },

  mr: { name: "Marathi", code: "MAR" },
  mar: { name: "Marathi", code: "MAR" },
  marathi: { name: "Marathi", code: "MAR" },

  ms: { name: "Malay", code: "MSA" },
  msa: { name: "Malay", code: "MSA" },
  malay: { name: "Malay", code: "MSA" },

  nl: { name: "Dutch", code: "NLD" },
  nld: { name: "Dutch", code: "NLD" },
  dut: { name: "Dutch", code: "NLD" },
  dutch: { name: "Dutch", code: "NLD" },

  no: { name: "Norwegian", code: "NOR" },
  nor: { name: "Norwegian", code: "NOR" },
  norwegian: { name: "Norwegian", code: "NOR" },

  pl: { name: "Polish", code: "POL" },
  pol: { name: "Polish", code: "POL" },
  polish: { name: "Polish", code: "POL" },

  pt: { name: "Portuguese", code: "POR" },
  por: { name: "Portuguese", code: "POR" },
  portuguese: { name: "Portuguese", code: "POR" },

  ro: { name: "Romanian", code: "RON" },
  ron: { name: "Romanian", code: "RON" },
  rum: { name: "Romanian", code: "RON" },
  romanian: { name: "Romanian", code: "RON" },

  ru: { name: "Russian", code: "RUS" },
  rus: { name: "Russian", code: "RUS" },
  russian: { name: "Russian", code: "RUS" },

  sv: { name: "Swedish", code: "SWE" },
  swe: { name: "Swedish", code: "SWE" },
  swedish: { name: "Swedish", code: "SWE" },

  ta: { name: "Tamil", code: "TAM" },
  tam: { name: "Tamil", code: "TAM" },
  tamil: { name: "Tamil", code: "TAM" },

  te: { name: "Telugu", code: "TEL" },
  tel: { name: "Telugu", code: "TEL" },
  telugu: { name: "Telugu", code: "TEL" },

  th: { name: "Thai", code: "THA" },
  tha: { name: "Thai", code: "THA" },
  thai: { name: "Thai", code: "THA" },

  tr: { name: "Turkish", code: "TUR" },
  tur: { name: "Turkish", code: "TUR" },
  turkish: { name: "Turkish", code: "TUR" },

  uk: { name: "Ukrainian", code: "UKR" },
  ukr: { name: "Ukrainian", code: "UKR" },
  ukrainian: { name: "Ukrainian", code: "UKR" },

  ur: { name: "Urdu", code: "URD" },
  urd: { name: "Urdu", code: "URD" },
  urdu: { name: "Urdu", code: "URD" },

  vi: { name: "Vietnamese", code: "VIE" },
  vie: { name: "Vietnamese", code: "VIE" },
  vietnamese: { name: "Vietnamese", code: "VIE" },

  zh: { name: "Chinese", code: "ZHO" },
  zho: { name: "Chinese", code: "ZHO" },
  chi: { name: "Chinese", code: "ZHO" },
  chinese: { name: "Chinese", code: "ZHO" },
};

/**
 * Normalizes language metadata from raw tags or labels into a clean name and 3-letter code
 */
export function resolveLanguageInfo(rawLang?: string, rawLabel?: string): LanguageInfo {
  const cleanLang = (rawLang || "").toLowerCase().trim();
  const cleanLabel = (rawLabel || "").toLowerCase().trim();

  // Try direct lookup by lang or label
  const match =
    ISO_LANG_MAP[cleanLang] ||
    ISO_LANG_MAP[cleanLabel] ||
    ISO_LANG_MAP[cleanLang.slice(0, 2)] ||
    ISO_LANG_MAP[cleanLabel.slice(0, 2)];

  if (match) return match;

  // Fallback using raw label if clean
  if (rawLabel && rawLabel.length > 1 && !rawLabel.toLowerCase().startsWith("track")) {
    return {
      name: rawLabel,
      code: (cleanLang || rawLabel).slice(0, 3).toUpperCase(),
    };
  }

  // Fallback to code
  if (cleanLang) {
    return {
      name: cleanLang.toUpperCase(),
      code: cleanLang.slice(0, 3).toUpperCase(),
    };
  }

  return { name: "Audio", code: "AUD" };
}

export const PREFERRED_AUDIO_LANG_KEY = "cinestream_preferred_audio_lang";

/**
 * Cleans any raw language string to a user-friendly pure language name (e.g. "Hindi", "English")
 */
export function cleanLanguageName(name?: string): string {
  if (!name) return "English";
  let clean = name
    .replace(/\s*\((?:Dubbed|NetMirror Cloud|Cloud|Original|HD|Fast|Server\s*\d+|1080p|720p)\)/gi, "")
    .trim();
  const info = resolveLanguageInfo(undefined, clean);
  return info.name || clean || "English";
}

/**
 * Retrieves the user's saved audio language preference from localStorage
 */
export function getPreferredAudioLanguage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PREFERRED_AUDIO_LANG_KEY);
  } catch {
    return null;
  }
}

/**
 * Persists the user's audio language preference to localStorage
 */
export function setPreferredAudioLanguage(lang: string): void {
  if (typeof window === "undefined" || !lang) return;
  try {
    const clean = cleanLanguageName(lang);
    localStorage.setItem(PREFERRED_AUDIO_LANG_KEY, clean);
  } catch {}
}

/**
 * Checks whether a target language name/code matches a track's metadata
 */
export function isLanguageMatch(
  targetLang: string,
  track: { label?: string; lang?: string; name?: string }
): boolean {
  if (!targetLang) return false;
  const target = cleanLanguageName(targetLang).toLowerCase().trim();
  const targetInfo = resolveLanguageInfo(target, target);

  const tLang = (track.lang || "").toLowerCase().trim();
  const tLabel = cleanLanguageName(track.label || track.name || "").toLowerCase().trim();
  const tInfo = resolveLanguageInfo(tLang, tLabel);

  return (
    tLang === target ||
    tLabel === target ||
    tInfo.name.toLowerCase() === target ||
    tInfo.code.toLowerCase() === target ||
    targetInfo.name.toLowerCase() === tInfo.name.toLowerCase() ||
    targetInfo.code.toLowerCase() === tInfo.code.toLowerCase() ||
    (target.length >= 2 && tLang.startsWith(target.slice(0, 2)))
  );
}

