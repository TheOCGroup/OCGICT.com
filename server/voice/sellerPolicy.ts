/**
 * G's seller trust policy — OCGICT.com only.
 *
 * What this is: a deterministic, testable model of WHERE a seller
 * conversation stands and HOW G should carry himself in it. It detects
 * emotional context (hesitation, repair/financial stress, attachment,
 * inheritance, urgency, skepticism, comparison shopping, frustration),
 * tracks the property facts the seller has actually stated (with
 * corrections winning), derives the conversation stage from the
 * seller-trust framework, and maps all of that to speech delivery.
 *
 * What this is NOT: empathy theater. G never claims to know exactly how
 * someone feels, never promises a price or an offer, and never uses a
 * seller's vulnerability as leverage. The policy's job is restraint:
 * acknowledge plainly, answer accurately, ask ONE question at a time,
 * and leave every next step voluntary.
 *
 * Framework (flexible, not a script):
 *   1 welcome → 2 motivation → 3 property → 4 timeline
 *   → 5 how OCG evaluates → 6 seller questions → 7 voluntary next step
 */

export type SellerEmotion =
  | "hesitant"
  | "stressed_repairs"
  | "stressed_finances"
  | "attached"
  | "inherited"
  | "urgent"
  | "skeptical"
  | "comparing"
  | "frustrated"
  | "motivated"
  | "curious"
  | "neutral";

export type SellerStage =
  | "welcome"
  | "motivation"
  | "property"
  | "timeline"
  | "evaluation"
  | "questions"
  | "next_step";

export interface PropertyFacts {
  bedrooms?: number;
  condition?: "needs_work" | "as_is" | "vacant" | "tenanted" | "good";
  timeline?: "soon" | "exploring" | "flexible";
  addressHint?: string;
}

export interface SellerCorrection {
  field: "bedrooms" | "condition" | "timeline";
  value: string;
}

export interface SellerContext {
  isSeller: boolean;
  lang: "en" | "es";
  emotions: SellerEmotion[];
  primary: SellerEmotion;
  stage: SellerStage;
  facts: PropertyFacts;
  correction: SellerCorrection | null;
}

export interface SellerDelivery {
  /** Multiplies the intent style's per-segment speed. */
  speedScale: number;
  /** Multiplies inter-sentence pauses. */
  pauseScale: number;
  /** Cap on spoken sentences for this emotional context. */
  maxSentences: number;
  /** When set, the delivery layer prefers this intent's pacing. */
  preferIntent?: "sensitive" | "explanation";
}

/* ------------------------------------------------------------------ */
/* Signal patterns (conservative, EN + ES)                             */
/* ------------------------------------------------------------------ */

const RE = {
  hesitant:
    /\b(not sure|not certain|just looking|just exploring|maybe sell|thinking about (it|selling)|no s[eé] si|no estoy segur[oa]|solo (estoy )?(mirando|explorando|preguntando)|todav[ií]a no s[eé]|quiz[aá]s)\b/i,
  stressed_repairs:
    /\b(needs? (a lot of |lots of )?work|needs? repairs|roof (leaks|is bad)|can'?t afford (to )?(fix|repair)|too (many|much) repairs|repairs? (are|is) too much|necesita (muchas |muchos )?(reparaciones|arreglos)|no (puedo|tengo para) (pagar|arreglar)|el techo (gotea|est[aá] mal))\b/i,
  stressed_finances:
    /\b(behind on (my )?(payments|mortgage)|foreclos\w*|can'?t afford (the )?(payments|mortgage|to keep)|owe (too much|a lot|on)|debt|atrasad[oa] (en|con) (los )?pagos|no puedo (pagar|seguir pagando)|embargo|debo mucho)\b/i,
  attached:
    /\b(family home|grew up (there|in)|raised (my|our) (kids|children) (there|in)|so many memories|hard to let (it )?go|emotional(ly)? (hard|difficult)|casa de (mi|la) familia|cri[eé] a mis hijos|muchos recuerdos|dif[ií]cil (dejarla|venderla))\b/i,
  inherited:
    /\b(inherit\w*|probate|passed away|my (mother|father|mom|dad|parent) (died|passed)|hered\w*|falleci\w*|mi (madre|padre|mam[aá]|pap[aá]) (falleci\w*|muri\w*))\b/i,
  urgent:
    /\b(sell (fast|quickly|soon|asap)|as soon as possible|need to (move|sell) (soon|quickly|fast)|relocat\w*|job transfer|divorce|moving (soon|out of state)|vender(?:la|lo|las|los)? (pronto|r[aá]pido)|lo antes posible|cuanto antes|necesito vender(?:la|lo|las|los)? (pronto|r[aá]pido)|me (mudo|voy a mudar)|traslado)\b/i,
  skeptical:
    /\b(lowball|low[- ]ball|scam|rip ?off|legit(imate)?|how do i know|too good to be true|trust you|what'?s the catch|estafa|enga[ñn]o|¿?c[oó]mo s[eé] que|oferta (muy )?baja|no conf[ií]o)\b/i,
  comparing:
    /\b(list (it|the house|my house) (with|on)|real ?estate agent|realtor|traditional (listing|sale)|on the market|compare (my )?options|should i list|listar(la)? con un agente|agente (inmobiliario|de bienes)|vender(?:la|lo|las|los)? con un agente|poner(la)? en (el mercado|venta)|comparar opciones)\b/i,
  frustrated:
    /\b(stop (calling|texting|messaging)|leave me alone|annoying|frustrat\w*|already told you|not interested|don'?t (call|contact) me|dejen de (llamar|escribir)|no me llamen|molest\w*|no me interesa|ya les dije)\b/i,
  motivated:
    /\b(ready to sell|want to sell (now|it)|let'?s do it|i (do )?want to sell|quiero vender(?:la|lo|las|los)?( ya)?|listo para vender|quiero vender mi casa)\b/i,
  curious:
    /\b(how (does|do) (it|you|this) work|how do you (evaluate|decide|value)|what'?s the process|how (would|do) (an? )?offer|c[oó]mo funciona|c[oó]mo (eval[uú]an|deciden|calculan)|cu[aá]l es el proceso|c[oó]mo ser[ií]a una oferta)\b/i,
} as const;

/** Priority when several signals fire: safety of the seller first. */
const EMOTION_ORDER: SellerEmotion[] = [
  "frustrated", "inherited", "stressed_finances", "stressed_repairs",
  "attached", "hesitant", "skeptical", "comparing", "urgent",
  "motivated", "curious", "neutral",
];

const SELLER_SIGNAL =
  /\b(sell|selling|my house|my property|homeowner|inherited|probate|estate|vender(?:la|lo|las|los)?|vendiendo|vendo|vend[ií]|vendid[oa]|venta|mi casa|mi propiedad|herencia|propietari[oa]|hered\w*)\b/i;

const EVALUATION_EXPLAINED =
  /\b(comparable sales|we (evaluate|look at)|how we evaluate|ventas comparables|evaluamos|comps)\b/i;

/* ------------------------------------------------------------------ */
/* Fact extraction (latest statement wins; corrections win outright)   */
/* ------------------------------------------------------------------ */

const NUM_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
};
const NUM_ALT = Object.keys(NUM_WORDS).join("|");

function extractBedrooms(text: string): number | undefined {
  const m =
    text.match(new RegExp(`\\b(\\d{1,2})\\s*(?:bed(?:room)?s?|br|rec[aá]maras?|cuartos?|habitaciones?)\\b`, "i")) ||
    text.match(new RegExp(`\\b(${NUM_ALT})\\s*(?:bedrooms?|rec[aá]maras?|habitaciones?)\\b`, "i"));
  if (!m) return undefined;
  const v = /^\d+$/.test(m[1]) ? Number(m[1]) : NUM_WORDS[m[1].toLowerCase()];
  return v !== undefined && v >= 0 && v <= 20 ? v : undefined;
}

function extractCondition(text: string): PropertyFacts["condition"] | undefined {
  if (/\b(vacant|empty|vac[ií]a|desocupada)\b/i.test(text)) return "vacant";
  if (/\b(tenant|rented|inquilinos?|rentada)\b/i.test(text)) return "tenanted";
  if (/\b(needs? (work|repairs)|fixer|mal estado|necesita (reparaciones|arreglos)|as[- ]is|as[ií] como est[aá])\b/i.test(text)) return "needs_work";
  if (/\b(good (shape|condition)|move[- ]in ready|buen (estado)|buenas condiciones)\b/i.test(text)) return "good";
  return undefined;
}

function extractTimeline(text: string): PropertyFacts["timeline"] | undefined {
  if (/\b(soon|asap|as soon as possible|quickly|this month|right away|pronto|r[aá]pido|lo antes posible|cuanto antes|este mes)\b/i.test(text)) return "soon";
  if (/\b(just (looking|exploring)|no rush|no hurry|exploring|later|sin prisa|no tengo prisa|explorando|solo mirando|m[aá]s adelante)\b/i.test(text)) return "exploring";
  if (/\b(flexible|whenever|cuando sea)\b/i.test(text)) return "flexible";
  return undefined;
}

function extractAddressHint(original: string): string | undefined {
  const m = original.match(/\b\d{2,6}\s+(?:[A-Z][a-z]+\s?){1,3}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Court|Ct)?\b/);
  return m ? m[0] : undefined;
}

const CORRECTION_LEAD =
  /\b(actually|wait[,. ]|no[,. ] (it'?s|its|that'?s)|correction|i meant|en realidad|espera[,. ]|no[,. ] (es|son|ser[ií]a)|quiero decir|mejor dicho|perd[oó]n[,. ])\b/i;

function extractFacts(turns: string[]): { facts: PropertyFacts; correction: SellerCorrection | null } {
  const facts: PropertyFacts = {};
  let correction: SellerCorrection | null = null;
  turns.forEach((turn, i) => {
    const isLast = i === turns.length - 1;
    const lower = turn.toLowerCase();
    const beds = extractBedrooms(lower);
    if (beds !== undefined) {
      if (isLast && CORRECTION_LEAD.test(lower) && facts.bedrooms !== undefined && facts.bedrooms !== beds) {
        correction = { field: "bedrooms", value: String(beds) };
      }
      facts.bedrooms = beds;
    }
    const cond = extractCondition(lower);
    if (cond) {
      if (isLast && CORRECTION_LEAD.test(lower) && facts.condition && facts.condition !== cond) {
        correction = { field: "condition", value: cond };
      }
      facts.condition = cond;
    }
    const tl = extractTimeline(lower);
    if (tl) {
      if (isLast && CORRECTION_LEAD.test(lower) && facts.timeline && facts.timeline !== tl) {
        correction = { field: "timeline", value: tl };
      }
      facts.timeline = tl;
    }
    const addr = extractAddressHint(turn);
    if (addr) facts.addressHint = addr;
  });
  return { facts, correction };
}

/* ------------------------------------------------------------------ */
/* Context analysis                                                    */
/* ------------------------------------------------------------------ */

export function analyzeSellerContext(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  message: string,
  opts: { spanish?: boolean } = {},
): SellerContext {
  const userTurns = [...history.filter((h) => h.role === "user").map((h) => h.content), message];
  const allUser = userTurns.join(" ");
  const assistantText = history.filter((h) => h.role === "assistant").map((h) => h.content).join(" ");
  const lower = message.toLowerCase();
  const lowerAll = allUser.toLowerCase();

  const isSeller = SELLER_SIGNAL.test(lowerAll);
  const fired = (Object.keys(RE) as Array<keyof typeof RE>).filter((k) => RE[k].test(lower));
  // Standing context from earlier turns still shapes delivery (an
  // inherited-property seller stays a sensitive conversation), but the
  // CURRENT turn's signals lead.
  const standing = (Object.keys(RE) as Array<keyof typeof RE>).filter((k) => RE[k].test(lowerAll));
  const emotions = EMOTION_ORDER.filter(
    (e) => fired.includes(e as keyof typeof RE) || standing.includes(e as keyof typeof RE),
  );
  const primary: SellerEmotion = emotions.length
    ? (EMOTION_ORDER.find((e) => fired.includes(e as keyof typeof RE)) ?? emotions[0])
    : RE.curious.test(lower)
      ? "curious"
      : "neutral";
  const emotionList = emotions.length ? emotions : [primary];

  const { facts, correction } = extractFacts(userTurns);

  let stage: SellerStage = "welcome";
  if (isSeller) {
    const motivationKnown = emotionList.some((e) =>
      ["urgent", "hesitant", "inherited", "stressed_repairs", "stressed_finances", "attached"].includes(e),
    ) || facts.timeline !== undefined;
    const propertyKnown = facts.bedrooms !== undefined || facts.condition !== undefined || facts.addressHint !== undefined;
    const evaluationKnown = EVALUATION_EXPLAINED.test(assistantText);
    if (!motivationKnown) stage = "motivation";
    else if (!propertyKnown) stage = "property";
    else if (facts.timeline === undefined) stage = "timeline";
    else if (!evaluationKnown) stage = "evaluation";
    else stage = "questions";
    if (propertyKnown && facts.timeline !== undefined && evaluationKnown && /next step|siguiente paso|preliminary offer|oferta preliminar/i.test(assistantText)) {
      stage = "next_step";
    }
  }

  return {
    isSeller,
    lang: opts.spanish ? "es" : "en",
    emotions: emotionList,
    primary,
    stage,
    facts,
    correction,
  };
}

/* ------------------------------------------------------------------ */
/* Delivery mapping (Phase 4)                                          */
/* ------------------------------------------------------------------ */

const SENSITIVE_SET: SellerEmotion[] = [
  "inherited", "stressed_finances", "stressed_repairs", "attached", "hesitant", "frustrated",
];

export function deliveryForContext(ctx: SellerContext): SellerDelivery {
  const p = ctx.primary;
  if (SENSITIVE_SET.includes(p)) {
    return { speedScale: 0.95, pauseScale: 1.3, maxSentences: 2, preferIntent: "sensitive" };
  }
  switch (p) {
    case "urgent":
    case "motivated":
      return { speedScale: 1.0, pauseScale: 0.9, maxSentences: 2 };
    case "skeptical":
      return { speedScale: 0.97, pauseScale: 1.1, maxSentences: 3, preferIntent: "explanation" };
    case "comparing":
    case "curious":
      return { speedScale: 0.99, pauseScale: 1.05, maxSentences: 3, preferIntent: "explanation" };
    default:
      return { speedScale: 1.0, pauseScale: 1.0, maxSentences: 3 };
  }
}

/* ------------------------------------------------------------------ */
/* Reply guardrails (defense in depth for ANY reply source)            */
/* ------------------------------------------------------------------ */

const PRESSURE_OR_PROMISE =
  /\b(guarantee(d|s)?\s+(offer|price|you)|we promise|i promise you|act now|limited[- ]time|don'?t miss out|you (must|have to) (decide|act)|sign today|precio garantizado|te garantizo|garantizamos|act[uú]a ahora|no pierda(s)? esta oportunidad|oferta por tiempo limitado)\b/i;

/**
 * Enforce the trust rules on a finished reply: at most ONE question in
 * a seller conversation, and no sentence carrying pressure or a price
 * promise survives — it is removed, never reworded into a softer claim.
 */
export function guardSellerReply(reply: string, ctx: SellerContext): string {
  if (!ctx.isSeller) return reply;
  const sentences = reply.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
  const kept: string[] = [];
  let questions = 0;
  for (const s of sentences) {
    if (PRESSURE_OR_PROMISE.test(s)) continue;
    const isQ = /[?？]\s*$/.test(s);
    if (isQ) {
      questions += 1;
      if (questions > 1) continue;
    }
    kept.push(s);
  }
  return kept.join(" ");
}
