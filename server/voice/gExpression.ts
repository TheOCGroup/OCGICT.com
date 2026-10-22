/**
 * G's speech expression layer — G-owned, in G's repository (OCGICT.com).
 *
 * What this does: translates a chat reply into a delivery plan for the
 * shared Kokoro service — sentence segments with per-intent speed and
 * inter-sentence pauses — after rewriting the text into a spoken form
 * (numbers, currency, phones, addresses, times) that a TTS engine reads
 * accurately. The behavioral concepts mirror what directed-TTS systems
 * (e.g. Fish Audio Drama 3) do with performance instructions, reproduced
 * legitimately: no direction text is ever inserted into the spoken text,
 * so nothing but the reply itself can be heard. Delivery is shaped only
 * by (a) the words chosen for numbers/symbols, (b) punctuation that was
 * already in the reply, (c) synthesis speed per segment, and (d) real
 * silence between segments (inserted by wavStitch, not by the model).
 *
 * Intents: greeting, question, explanation, confirmation, sensitive,
 * closing, statement. The chat layer may pass an explicit intent; when
 * it doesn't, the reply text is classified here. Restraint is the rule:
 * speeds stay within 0.93–1.03, pauses are conversational, and nothing
 * theatrical (no sighs, laughter, or filler) is ever synthesized.
 */

export type GSpeechIntent =
  | "greeting"
  | "question"
  | "explanation"
  | "confirmation"
  | "sensitive"
  | "closing"
  | "statement";

export interface SpeechSegment {
  /** Spoken-form text for this segment (already normalized). */
  text: string;
  /** Kokoro synthesis speed for this segment. */
  speed: number;
  /** Real silence to append after this segment, in milliseconds. */
  pauseAfterMs: number;
}

export interface DeliveryPlan {
  intent: GSpeechIntent;
  lang: "en" | "es";
  segments: SpeechSegment[];
  /** All segment texts joined — the exact words that will be spoken. */
  spokenText: string;
}

const INTENTS: readonly GSpeechIntent[] = [
  "greeting",
  "question",
  "explanation",
  "confirmation",
  "sensitive",
  "closing",
  "statement",
];

export function isGSpeechIntent(v: unknown): v is GSpeechIntent {
  return typeof v === "string" && (INTENTS as readonly string[]).includes(v);
}

/* ------------------------------------------------------------------ */
/* Number words                                                        */
/* ------------------------------------------------------------------ */

const EN_SMALL = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const EN_ORDINALS: Record<string, string> = {
  one: "first", two: "second", three: "third", five: "fifth", eight: "eighth",
  nine: "ninth", twelve: "twelfth", twenty: "twentieth", thirty: "thirtieth",
  forty: "fortieth", fifty: "fiftieth", sixty: "sixtieth", seventy: "seventieth",
  eighty: "eightieth", ninety: "ninetieth",
};

function enUnder1000(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h) parts.push(`${EN_SMALL[h]} hundred`);
  if (r >= 20) {
    const t = EN_TENS[Math.floor(r / 10)];
    const o = r % 10;
    parts.push(o ? `${t}-${EN_SMALL[o]}` : t);
  } else if (r > 0) {
    parts.push(EN_SMALL[r]);
  }
  return parts.join(" ");
}

export function numberToWordsEN(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  n = Math.floor(n);
  if (n === 0) return "zero";
  if (n < 1000) return enUnder1000(n);
  for (const [scale, word] of [[1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]] as const) {
    if (n >= scale) {
      const head = numberToWordsEN(Math.floor(n / scale));
      const rest = n % scale;
      return `${head} ${word}${rest ? ` ${numberToWordsEN(rest)}` : ""}`;
    }
  }
  return enUnder1000(n);
}

export function ordinalToWordsEN(n: number): string {
  const cardinal = numberToWordsEN(n);
  const words = cardinal.split(" ");
  const last = words[words.length - 1];
  const hyphen = last.split("-");
  const tail = hyphen[hyphen.length - 1];
  const ord = EN_ORDINALS[tail] ?? `${tail}th`;
  hyphen[hyphen.length - 1] = ord;
  words[words.length - 1] = hyphen.join("-");
  return words.join(" ");
}

function enDecimalWords(intPart: string, fracPart: string): string {
  const digits = fracPart.split("").map((d) => EN_SMALL[Number(d)]).join(" ");
  return `${numberToWordsEN(Number(intPart))} point ${digits}`;
}

const ES_SMALL = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
  "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const ES_TENS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const ES_HUNDREDS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function esUnder1000(n: number): string {
  if (n === 100) return "cien";
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h) parts.push(ES_HUNDREDS[h]);
  if (r >= 30) {
    const t = ES_TENS[Math.floor(r / 10)];
    const o = r % 10;
    parts.push(o ? `${t} y ${ES_SMALL[o]}` : t);
  } else if (r > 0) {
    parts.push(ES_SMALL[r]);
  }
  return parts.join(" ");
}

export function numberToWordsES(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  n = Math.floor(n);
  if (n === 0) return "cero";
  if (n < 1000) return esUnder1000(n);
  if (n >= 1e12) {
    const head = numberToWordsES(Math.floor(n / 1e12));
    const rest = n % 1e12;
    const word = head === "uno" ? "un billón" : `${head.replace(/uno$/, "un")} billones`;
    return `${word}${rest ? ` ${numberToWordsES(rest)}` : ""}`;
  }
  if (n >= 1e9) {
    const head = numberToWordsES(Math.floor(n / 1e9));
    const rest = n % 1e9;
    return `${head === "uno" ? "mil millones" : `${head} mil millones`}${rest ? ` ${numberToWordsES(rest)}` : ""}`;
  }
  if (n >= 1e6) {
    const head = numberToWordsES(Math.floor(n / 1e6));
    const rest = n % 1e6;
    const word = head === "uno" ? "un millón" : `${head.replace(/uno$/, "un")} millones`;
    return `${word}${rest ? ` ${numberToWordsES(rest)}` : ""}`;
  }
  const head = numberToWordsES(Math.floor(n / 1000));
  const rest = n % 1000;
  return `${head === "uno" ? "mil" : `${head} mil`}${rest ? ` ${numberToWordsES(rest)}` : ""}`;
}

/* ------------------------------------------------------------------ */
/* Spoken-text normalization                                           */
/* ------------------------------------------------------------------ */

const DIRECTIONS: Record<string, string> = { N: "North", S: "South", E: "East", W: "West" };

function digitsToWordsEN(digits: string): string {
  return digits.split("").map((d) => EN_SMALL[Number(d)]).join(" ");
}

export function normalizeSpokenTextEN(text: string): string {
  // Square brackets are never spoken; strip the marks, keep the words.
  let t = text.replace(/\[|\]/g, "");
  // Phone numbers first: (316) 555-0134 / 316-555-0134 / 3165550134.
  t = t.replace(
    /(?:\+?1[\s.-]?)?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\b/g,
    (_m, a: string, b: string, c: string) =>
      `${digitsToWordsEN(a)}, ${digitsToWordsEN(b)}, ${digitsToWordsEN(c)}`,
  );
  // Years: 2026 -> twenty twenty-six; 2005 -> two thousand five; 1999 -> nineteen ninety-nine.
  t = t.replace(/\b(19|20)(\d{2})\b/g, (_m, c: string, y: string) => {
    const year = Number(`${c}${y}`);
    const rest = year % 100;
    if (year >= 2010) {
      return rest < 10 ? `twenty oh ${EN_SMALL[rest]}` : `twenty ${numberToWordsEN(rest)}`;
    }
    if (year >= 2000) {
      return rest === 0 ? "two thousand" : `two thousand ${numberToWordsEN(rest)}`;
    }
    return rest === 0 ? "nineteen hundred" : `nineteen ${numberToWordsEN(rest)}`;
  });
  // Times: 3:30 PM -> three thirty PM; 3:00 PM -> three PM; 3:05 PM -> three oh five PM.
  t = t.replace(/\b(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?/g, (_m, h: string, min: string, ap: string) => {
    const hour = numberToWordsEN(Number(h));
    const suffix = ap.toUpperCase() === "A" ? "AM" : "PM";
    if (min === "00") return `${hour} ${suffix}`;
    if (Number(min) < 10) return `${hour} oh ${EN_SMALL[Number(min)]} ${suffix}`;
    return `${hour} ${numberToWordsEN(Number(min))} ${suffix}`;
  });
  // Negative currency first: -$5,000 -> minus five thousand dollars (only
  // when the minus leads the amount; "$5-$10" is a range, not a negative).
  t = t.replace(/(^|[\s(])-\$([\d,]+(?:\.\d{1,2})?)/g, (_m, pre: string, amt: string) => {
    const [dollarsRaw, centsRaw] = amt.split(".");
    const dollars = Number(dollarsRaw.replace(/,/g, ""));
    const words = `${pre}minus ${numberToWordsEN(dollars)} ${dollars === 1 ? "dollar" : "dollars"}`;
    if (!centsRaw) return words;
    const cents = Number(centsRaw.padEnd(2, "0"));
    return cents === 0 ? words : `${words} and ${numberToWordsEN(cents)} ${cents === 1 ? "cent" : "cents"}`;
  });
  // Currency: $285,000 -> two hundred eighty-five thousand dollars; $99.50 -> ... and fifty cents.
  t = t.replace(/\$([\d,]+(?:\.\d{1,2})?)/g, (_m, amt: string) => {
    const [dollarsRaw, centsRaw] = amt.split(".");
    const dollars = Number(dollarsRaw.replace(/,/g, ""));
    const words = `${numberToWordsEN(dollars)} ${dollars === 1 ? "dollar" : "dollars"}`;
    if (!centsRaw) return words;
    const cents = Number(centsRaw.padEnd(2, "0"));
    if (cents === 0) return words;
    return `${words} and ${numberToWordsEN(cents)} ${cents === 1 ? "cent" : "cents"}`;
  });
  // Percents: 12.5% -> twelve point five percent.
  t = t.replace(/(\d+(?:\.\d+)?)\s*%/g, (_m, v: string) => {
    if (v.includes(".")) {
      const [i, f] = v.split(".");
      return `${enDecimalWords(i, f)} percent`;
    }
    return `${numberToWordsEN(Number(v))} percent`;
  });
  // Direction before a street number: W. 34th -> West 34th (runs before
  // ordinal expansion, which would hide the digit from the lookahead).
  t = t.replace(/\b([NSEW])\.\s+(?=\d)/g, (_m, d: string) => `${DIRECTIONS[d]} `);
  // Ordinals: 34th -> thirty-fourth.
  t = t.replace(/\b(\d+)(?:st|nd|rd|th)\b/gi, (_m, v: string) => ordinalToWordsEN(Number(v)));
  // Decimals: 196.5 -> one hundred ninety-six point five.
  t = t.replace(/\b(\d+)\.(\d+)\b/g, (_m, i: string, f: string) => enDecimalWords(i, f));
  // Comma-grouped integers: 1,250 -> one thousand two hundred fifty.
  t = t.replace(/\b\d{1,3}(?:,\d{3})+\b/g, (m) => numberToWordsEN(Number(m.replace(/,/g, ""))));
  // Direction after a house number: 123 W -> 123 West (digits already expanded or not).
  t = t.replace(/(\b\d+|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|hundred|thousand)+)\s+([NSEW])\.?(?=[\s,]|$)/gi,
    (_m, num: string, d: string) => `${num} ${DIRECTIONS[d.toUpperCase()]}`);
  // Street suffixes. St. after a number/ordinal word reads as Street; before a name, Saint.
  t = t.replace(/\bSt\.?(?=[\s,]|$)/g, (m, offset: number, whole: string) => {
    const before = whole.slice(0, offset).trimEnd();
    return /(?:\d|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|teenth|tieth|hundred|thousand)$/i.test(before)
      ? "Street"
      : "Saint";
  });
  t = t.replace(/\bAve\.?\b/g, "Avenue").replace(/\bBlvd\.?\b/g, "Boulevard")
    .replace(/\bRd\.?\b/g, "Road").replace(/\bLn\.?\b/g, "Lane")
    .replace(/\bSte\.?\b/g, "Suite").replace(/\bApt\.?\b/g, "Apartment");
  t = t.replace(/\bsq\.?\s*ft\.?\b/gi, "square feet");
  // Remaining plain integers (counts, days, prices without $).
  t = t.replace(/\b\d+\b/g, (m) => numberToWordsEN(Number(m)));
  t = t.replace(/\s*&\s*/g, " and ");
  return t.replace(/\s{2,}/g, " ").trim();
}

export function normalizeSpokenTextES(text: string): string {
  let t = text.replace(/\[|\]/g, "");
  // Negative currency first: -$5,000 -> menos cinco mil dólares.
  t = t.replace(/(^|[\s(])-\$([\d,]+(?:\.\d{1,2})?)/g, (_m, pre: string, amt: string) => {
    const [dollarsRaw, centsRaw] = amt.split(".");
    const dollars = Number(dollarsRaw.replace(/,/g, ""));
    const words = `${pre}menos ${numberToWordsES(dollars)} ${dollars === 1 ? "dólar" : "dólares"}`;
    if (!centsRaw) return words;
    const cents = Number(centsRaw.padEnd(2, "0"));
    return cents === 0 ? words : `${words} con ${numberToWordsES(cents)} centavos`;
  });
  // Currency (content uses US formatting): $285,000 -> doscientos ochenta y cinco mil dólares.
  t = t.replace(/\$([\d,]+(?:\.\d{1,2})?)/g, (_m, amt: string) => {
    const [dollarsRaw, centsRaw] = amt.split(".");
    const dollars = Number(dollarsRaw.replace(/,/g, ""));
    const words = `${numberToWordsES(dollars)} ${dollars === 1 ? "dólar" : "dólares"}`;
    if (!centsRaw) return words;
    const cents = Number(centsRaw.padEnd(2, "0"));
    if (cents === 0) return words;
    return `${words} con ${numberToWordsES(cents)} centavos`;
  });
  // Percents: 12.5% -> doce punto cinco por ciento.
  t = t.replace(/(\d+(?:[.,]\d+)?)\s*%/g, (_m, v: string) => {
    const norm = v.replace(",", ".");
    if (norm.includes(".")) {
      const [i, f] = norm.split(".");
      const digits = f.split("").map((d) => ES_SMALL[Number(d)]).join(" ");
      return `${numberToWordsES(Number(i))} punto ${digits} por ciento`;
    }
    return `${numberToWordsES(Number(v))} por ciento`;
  });
  t = t.replace(/\b\d{1,3}(?:,\d{3})+\b/g, (m) => numberToWordsES(Number(m.replace(/,/g, ""))));
  t = t.replace(/\b(\d+)\.(\d+)\b/g, (_m, i: string, f: string) => {
    const digits = f.split("").map((d) => ES_SMALL[Number(d)]).join(" ");
    return `${numberToWordsES(Number(i))} punto ${digits}`;
  });
  t = t.replace(/\b\d+\b/g, (m) => numberToWordsES(Number(m)));
  return t.replace(/\s{2,}/g, " ").trim();
}

export function normalizeSpokenText(text: string, lang: "en" | "es"): string {
  return lang === "es" ? normalizeSpokenTextES(text) : normalizeSpokenTextEN(text);
}

/* ------------------------------------------------------------------ */
/* Intent classification                                               */
/* ------------------------------------------------------------------ */

const SENSITIVE_RE =
  /sorry for your loss|my condolences|passed away|loss in the family|going through a (hard|difficult|tough)|no rush at all|take all the time you need|foreclos|divorce|bankrupt|lamento (mucho )?su pérdida|mis condolencias|no hay prisa|tómese su tiempo/i;
const GREETING_RE = /^(hi|hello|hey|welcome|good (morning|afternoon|evening)|hola|buenos días|buenas (tardes|noches)|bienvenid[oa])\b/i;
const CONFIRM_RE =
  /^(perfect|got it|great|done|absolutely|sounds good|of course|perfecto|claro|listo)\b|you'?re all set|we'?ll reach out|i'?ve noted|you'?re booked|ya quedó|nos comunicaremos/i;
const CLOSING_RE = /thanks for stopping by|thanks for your time|talk soon|whenever you'?re ready|have a (great|good) (day|evening)|gracias por su visita|que tenga un buen día/i;

export function classifyIntent(text: string, hint?: unknown): GSpeechIntent {
  if (isGSpeechIntent(hint)) return hint;
  const t = text.trim();
  if (SENSITIVE_RE.test(t)) return "sensitive";
  if (GREETING_RE.test(t) && t.length < 220) return "greeting";
  if (t.length <= 140 && CONFIRM_RE.test(t)) return "confirmation";
  if (t.length <= 220 && CLOSING_RE.test(t)) return "closing";
  if (t.endsWith("?") || t.endsWith("？")) return "question";
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= 2 || t.length > 180) return "explanation";
  return "statement";
}

/* ------------------------------------------------------------------ */
/* Delivery plan                                                       */
/* ------------------------------------------------------------------ */

interface IntentStyle { speed: number; pauseMs: number; firstSpeed?: number }

const STYLES: Record<GSpeechIntent, IntentStyle> = {
  greeting: { speed: 1.0, pauseMs: 260 },
  question: { speed: 0.98, pauseMs: 320 },
  explanation: { speed: 1.0, pauseMs: 360, firstSpeed: 0.97 },
  confirmation: { speed: 1.03, pauseMs: 160 },
  sensitive: { speed: 0.93, pauseMs: 480 },
  closing: { speed: 1.0, pauseMs: 220 },
  statement: { speed: 1.0, pauseMs: 300 },
};

const MAX_SEGMENTS = 8;
const MAX_SEGMENT_CHARS = 400;

function splitSentences(text: string): string[] {
  const raw = text.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const s of raw) {
    if (s.length <= MAX_SEGMENT_CHARS) { out.push(s); continue; }
    // Split an over-long sentence at comma boundaries, greedily packed.
    const parts = s.split(/,\s+/);
    let cur = "";
    for (const p of parts) {
      const next = cur ? `${cur}, ${p}` : p;
      if (next.length > MAX_SEGMENT_CHARS && cur) { out.push(cur); cur = p; }
      else cur = next;
    }
    if (cur) out.push(cur);
  }
  // Cap segment count by merging the tail ONLY while the merged segment
  // stays within the per-segment character cap (a merged segment must
  // never exceed what a single synthesis request accepts).
  while (out.length > MAX_SEGMENTS) {
    const last = out[out.length - 1];
    const prev = out[out.length - 2];
    if (`${prev} ${last}`.length > MAX_SEGMENT_CHARS) break;
    out.splice(out.length - 2, 2, `${prev} ${last}`);
  }
  return out;
}

export function planDelivery(
  text: string,
  opts: { lang?: string; intent?: unknown } = {},
): DeliveryPlan {
  const lang: "en" | "es" = (opts.lang ?? "en").toLowerCase().startsWith("es") ? "es" : "en";
  const intent = classifyIntent(text, opts.intent);
  const spoken = normalizeSpokenText(text, lang);
  const style = STYLES[intent];
  const sentences = splitSentences(spoken);
  const segments: SpeechSegment[] = sentences.map((s, i) => ({
    text: s,
    speed: i === 0 && style.firstSpeed !== undefined ? style.firstSpeed : style.speed,
    pauseAfterMs: i === sentences.length - 1 ? 0 : style.pauseMs,
  }));
  return { intent, lang, segments, spokenText: segments.map((s) => s.text).join(" ") };
}
