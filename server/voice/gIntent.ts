/**
 * General-intent routing for G's local conversation engine.
 *
 * P0 repair (founder browser failure, 2026-10-23): the local provider
 * answered through a brittle keyword chain whose default was the
 * generic introduction — so natural spoken questions ("What exactly do
 * you guys do?", "Do you charge any fees?", "Can I talk to a real
 * person?") all received the identical intro, repeatedly, ignoring the
 * conversation. This module replaces that default path with a scored,
 * filler-tolerant intent layer (EN + ES) and a fallback that never
 * repeats the introduction once it has been given.
 *
 * Honesty rules: replies state only what the site's own certified copy
 * supports (no invented fees, areas beyond Wichita metro, timelines as
 * ranges with "varies", no promised prices). At most one question per
 * reply, by construction.
 */

export type GeneralIntent =
  | "fees" | "areas" | "process" | "timeline" | "human"
  | "propertyTypes" | "howSelling" | "evaluation" | "priceExpectation"
  | "contact" | "appointment" | "company" | "team" | "thanks"
  | "goodbye" | "sellerGeneric" | "investorGeneric";

const FILLERS = new Set([
  "exactly", "just", "really", "actually", "basically", "guys", "guy",
  "please", "uh", "um", "hmm", "so", "well", "like", "kind", "sort",
  "tell", "me", "let", "ask", "question", "wondering", "curious",
  "oiga", "este", "pues", "bueno",
]);

/** Lowercase, strip punctuation, drop filler words. */
export function normalizeForIntent(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[¿¡]/g, " ")
    .replace(/[^a-záéíóúñü0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !FILLERS.has(w));
  return " " + words.join(" ") + " ";
}

interface IntentRule {
  intent: GeneralIntent;
  phrases: string[];
  words: string[];
}

const RULES: IntentRule[] = [
  {
    intent: "fees",
    phrases: ["how much does it cost", "how much do you charge", "do you charge", "any fees", "your fees", "what does it cost", "charge for", "cost to use", "cuánto cobran", "cuanto cobran", "cobran algo", "qué cobran", "que cobran", "cuánto cuesta", "cuanto cuesta"],
    words: ["fees", "fee", "cost", "costs", "charge", "charges", "cuesta", "cobran", "costo", "tarifa", "honorarios", "comisión", "comision"],
  },
  {
    intent: "priceExpectation",
    phrases: ["how much would you pay", "how much will you pay", "what would you pay", "how much can you offer", "how much do you offer", "cuánto pagarían", "cuanto pagarian", "cuánto ofrecen", "cuanto ofrecen", "cuánto me dan", "cuanto me dan"],
    words: ["pay", "offer", "pagarían", "ofrecen"],
  },
  {
    intent: "areas",
    phrases: ["what areas", "which areas", "where do you buy", "areas do you", "qué áreas", "que areas", "en qué zonas", "en que zonas", "dónde compran", "donde compran", "qué partes", "que partes"],
    words: ["areas", "area", "locations", "located", "wichita", "zonas", "áreas", "ubicación"],
  },
  {
    intent: "timeline",
    phrases: ["how long", "how fast", "how quickly", "cuánto tarda", "cuanto tarda", "cuánto tiempo", "cuanto tiempo", "cuánto demora", "cuanto demora"],
    words: ["long", "fast", "timeline", "tarda", "tiempo", "demora", "plazo"],
  },
  {
    intent: "process",
    phrases: ["the process", "your process", "how it works", "how does it work", "how the process works", "what are the steps", "step by step", "el proceso", "cómo funciona", "como funciona", "cuáles son los pasos", "cuales son los pasos"],
    words: ["process", "steps", "works", "proceso", "pasos", "funciona"],
  },
  {
    intent: "human",
    phrases: ["real person", "a human", "actual person", "talk to someone", "speak to someone", "persona real", "un humano", "hablar con alguien", "una persona de verdad"],
    words: ["person", "human", "someone", "persona", "humano", "alguien"],
  },
  {
    intent: "propertyTypes",
    phrases: ["kinds of houses", "types of houses", "what houses do you buy", "kind of homes", "tipos de casas", "qué casas compran", "que casas compran", "cualquier casa"],
    words: ["houses", "homes", "properties", "casas", "propiedades"],
  },
  {
    intent: "howSelling",
    phrases: ["sell to you", "selling to you", "sell my house to you", "sell my home to you", "venderles", "venderle a ustedes", "vender mi casa a ustedes"],
    words: ["venderles"],
  },
  {
    intent: "evaluation",
    phrases: ["how do you evaluate", "how do you value", "how do you decide", "how do you come up with", "cómo evalúan", "como evaluan", "cómo valoran", "cómo deciden"],
    words: ["evaluate", "value", "evalúan", "valoran"],
  },
  {
    intent: "appointment",
    phrases: ["come look", "come see", "come out", "schedule a visit", "book an appointment", "set up an appointment", "venir a ver", "agendar una cita", "programar una visita"],
    words: ["visit", "appointment", "schedule", "cita", "visita", "venir"],
  },
  {
    intent: "contact",
    phrases: ["phone number", "your number", "how do i contact", "how can i reach", "número de teléfono", "numero de telefono", "cómo contacto", "como contacto", "cómo los contacto"],
    words: ["phone", "contact", "reach", "email", "teléfono", "telefono", "contacto", "correo"],
  },
  {
    intent: "team",
    phrases: ["who runs", "who owns", "who founded", "who started", "your team", "who is behind", "quién dirige", "quien dirige", "quién fundó", "su equipo"],
    words: ["team", "owner", "founder", "equipo"],
  },
  {
    intent: "company",
    phrases: ["what do you do", "what does the oc group do", "what is the oc group", "what is ocg", "who are you", "about the oc group", "about your company", "qué hacen", "que hacen", "qué es the oc group", "quiénes son", "quienes son", "qué es ocg"],
    words: ["services", "company", "servicios", "empresa"],
  },
  {
    intent: "thanks",
    phrases: ["thank you", "thanks a lot", "muchas gracias", "te agradezco", "se agradece"],
    words: ["thanks", "thank", "gracias"],
  },
  {
    intent: "goodbye",
    phrases: ["that is all", "thats all", "eso es todo", "es todo gracias"],
    words: ["bye", "goodbye", "adios", "adiós"],
  },
  {
    intent: "sellerGeneric",
    phrases: ["sell my house", "sell my home", "sell my property", "want to sell", "selling a house", "cash offer", "vender mi casa", "quiero vender", "vendo mi casa"],
    words: ["sell", "selling", "seller", "vender", "venta"],
  },
  {
    intent: "investorGeneric",
    phrases: ["first flip", "buy and hold", "quiero invertir"],
    words: ["investor", "investing", "invest", "flip", "flipping", "lender", "financing", "capital", "invertir", "inversión", "inversion"],
  },
];

const REPLIES: Record<GeneralIntent, { en: string; es: string }> = {
  fees: {
    en: "There's no charge and no obligation for a preliminary property review or a conversation with us. If you sell directly to us, there are no agent commissions or listing fees; if you list with an agent instead, a commission usually applies. Exact figures depend on the path you choose — would you like me to walk through how the two compare?",
    es: "No hay ningún cargo ni obligación por una revisión preliminar de la propiedad ni por conversar con nosotros. Si vende directamente con nosotros, no hay comisiones de agente ni gastos de listado; si vende con un agente, normalmente sí aplica una comisión. Las cifras exactas dependen del camino que elija. ¿Le gustaría que comparemos ambas opciones?",
  },
  areas: {
    en: "We're based in Wichita, and we focus on Wichita and the surrounding metro communities here in Sedgwick County. If a property is a little farther out, it's still worth a conversation — the team can confirm whether it fits. Is your property in the Wichita area?",
    es: "Estamos en Wichita y nos enfocamos en Wichita y las comunidades cercanas del condado de Sedgwick. Si una propiedad está un poco más lejos, igual vale la pena conversarlo; el equipo puede confirmar si encaja. ¿Su propiedad está en el área de Wichita?",
  },
  process: {
    en: "Here's how it works, step by step. First a conversation about your property and your timing. Then we review recent comparable sales and the repairs the home needs, and we explain every number. If it makes sense, you get a written preliminary offer with no obligation. You decide — and only then would anything move toward closing. Would you like to start with your property, or ask about a step first?",
    es: "Así funciona, paso a paso. Primero conversamos sobre su propiedad y sus tiempos. Después revisamos las ventas comparables recientes y las reparaciones que la casa necesita, y le explicamos cada cifra. Si tiene sentido, recibe una oferta preliminar por escrito y sin obligación. Usted decide, y solo entonces avanzaría cualquier cierre. ¿Prefiere empezar por su propiedad o preguntar por algún paso?",
  },
  timeline: {
    en: "It varies with the path you choose. A preliminary review usually takes days, not weeks. If both sides agree on a direct sale, closing is often a few weeks; listing with an agent usually takes longer, between preparing the home, showings, and waiting for a buyer. I can't promise an exact date — that depends on your situation. What's driving your timeline?",
    es: "Depende del camino que elija. Una revisión preliminar suele tomar días, no semanas. Si ambas partes acuerdan una venta directa, el cierre suele ser de algunas semanas; vender con un agente normalmente toma más tiempo, entre preparar la casa, las visitas y esperar al comprador. No puedo prometerle una fecha exacta. ¿Qué está marcando su plazo?",
  },
  human: {
    en: "Of course — I'm G, an AI guide, and the team is glad to talk directly. You can reach them through the Contact page on this site, or call (720) 620-9929. Would you like me to point you to the contact form?",
    es: "Claro — soy G, una guía de IA, y el equipo con gusto habla directamente con usted. Puede contactarlos en la página de contacto de este sitio o llamar al (720) 620-9929. ¿Le muestro cómo llegar al formulario de contacto?",
  },
  propertyTypes: {
    en: "We look at single-family homes in just about any condition — move-in ready, needing repairs, inherited, vacant, or with tenants. The review weighs location, condition, and recent comparable sales. Would you like to tell me a little about the home you have in mind?",
    es: "Evaluamos casas unifamiliares en casi cualquier estado: listas para vivir, con reparaciones pendientes, heredadas, vacías o con inquilinos. La revisión considera la ubicación, el estado y las ventas comparables recientes. ¿Le gustaría contarme un poco sobre la casa que tiene en mente?",
  },
  howSelling: {
    en: "Selling to us directly means no repairs, no showings, and no agent commissions — we review the property as-is, explain our numbers, and make a written preliminary offer with no obligation. It's usually faster and simpler than listing, though a home in great condition can sometimes bring more on the open market. Are you hoping to sell soon, or just exploring your options?",
    es: "Vendernos directamente significa sin reparaciones, sin visitas y sin comisiones de agente: revisamos la propiedad tal como está, le explicamos nuestras cifras y le hacemos una oferta preliminar por escrito y sin obligación. Suele ser más rápido y sencillo que vender con un agente, aunque una casa en muy buen estado a veces logra más en el mercado abierto. ¿Espera vender pronto o solo está explorando sus opciones?",
  },
  evaluation: {
    en: "Here's how we evaluate a property. We look at recent comparable sales near the home, the repairs it needs, and the real costs of buying, holding, and reselling. That gives us a preliminary range — a formal offer only comes after a real review by our team, in writing, with no obligation. Would you like to start with the property's condition, or its location?",
    es: "Así evaluamos una propiedad. Revisamos las ventas comparables recientes cerca de la casa, las reparaciones que necesita y los costos reales de comprar, mantener y revender. Con eso obtenemos un rango preliminar; una oferta formal solo llega después de una revisión real de nuestro equipo, por escrito y sin obligación. ¿Prefiere empezar por el estado de la propiedad o por su ubicación?",
  },
  priceExpectation: {
    en: "I can't put a number on a specific home without a real review — anyone who does that sight-unseen isn't being straight with you. What I can do is explain how we get to a number: recent comparable sales, needed repairs, and the real costs of buying, holding, and reselling. Would you like to start with the home's location and condition?",
    es: "No puedo darle una cifra por una casa específica sin una revisión real; quien lo haga sin verla no le está hablando con honestidad. Lo que sí puedo es explicarle cómo llegamos a una cifra: ventas comparables recientes, reparaciones necesarias y los costos reales de comprar, mantener y revender. ¿Empezamos por la ubicación y el estado de la casa?",
  },
  contact: {
    en: "You can reach The OC Group through the Contact page on this site, or call (720) 620-9929. If you'd rather start here, tell me what you're working on and I'll point you to the right next step.",
    es: "Puede contactar a The OC Group en la página de contacto de este sitio o llamar al (720) 620-9929. Si prefiere empezar aquí, cuénteme qué está buscando y le indico el siguiente paso correcto.",
  },
  appointment: {
    en: "A visit can be arranged once we've had a preliminary conversation about the property — that way the team comes prepared. The fastest route is the Sell page or the Contact page on this site, and they'll set a time with you directly. Would you like to start with a few details about the property?",
    es: "Una visita puede coordinarse después de una conversación preliminar sobre la propiedad, para que el equipo llegue preparado. La vía más rápida es la página de venta o la de contacto de este sitio, y ellos fijan la hora directamente con usted. ¿Empezamos con algunos datos de la propiedad?",
  },
  company: {
    en: "The OC Group is a Wichita-based real estate acquisition and renovation advisory business. We help property owners explore sale options and help investors evaluate deals, plan renovations, coordinate financing, and decide whether to renovate, resell, or hold. I am G, its AI guide. Are you here as a property owner, investor, or just exploring?",
    es: "The OC Group es una empresa de Wichita dedicada a la adquisición y renovación de propiedades y a la asesoría de inversión. Ayudamos a propietarios a explorar opciones de venta y a inversionistas a evaluar oportunidades, planear renovaciones, coordinar financiamiento y decidir entre renovar, revender o mantener. Soy G, su guía de IA. ¿Viene como propietario, inversionista o solo a explorar?",
  },
  team: {
    en: "The OC Group is a Wichita-based team — I'm G, their AI guide here on the site. For anything about the people behind the company, the Contact page reaches them directly, or you can call (720) 620-9929. Is there something specific you'd like to ask them?",
    es: "The OC Group es un equipo con base en Wichita; yo soy G, su guía de IA en este sitio. Para cualquier cosa sobre las personas detrás de la empresa, la página de contacto los alcanza directamente, o puede llamar al (720) 620-9929. ¿Hay algo específico que le gustaría preguntarles?",
  },
  thanks: {
    en: "You're very welcome. If anything else comes up — selling, investing, or how any of this works — I'm right here.",
    es: "Con mucho gusto. Si surge cualquier otra cosa — vender, invertir o cómo funciona todo esto — aquí estoy.",
  },
  goodbye: {
    en: "Thanks for stopping by. If you'd like to pick this up later, I'll be here — and the team is on the Contact page whenever you're ready.",
    es: "Gracias por su visita. Si quiere retomar esto después, aquí estaré, y el equipo está en la página de contacto cuando usted lo desee.",
  },
  sellerGeneric: {
    en: "Absolutely. We can look at selling as-is or making repairs first, and figure out what fits your timeline. You don't need all the details right now. Are you hoping to sell soon, or just exploring your options?",
    es: "Claro que sí. Podemos revisar la opción de vender tal como está o hacer reparaciones primero, según lo que convenga a su tiempo. No necesita tener todos los detalles ahora. ¿Espera vender pronto o solo está explorando sus opciones?",
  },
  investorGeneric: {
    en: "We can help you evaluate a deal, check renovation costs and risks, and plan the next move. Are you looking at a particular property or still deciding what to invest in?",
    es: "Podemos ayudarle a evaluar una oportunidad, revisar costos de renovación y riesgos, y planear el siguiente paso. ¿Ya tiene una propiedad en mente o todavía está decidiendo en qué invertir?",
  },
};

/**
 * Score-based routing. Returns the winning intent's reply, or null when
 * nothing clears the bar (caller then uses the contextual fallback).
 * A phrase hit scores 3, a word hit 1; a win needs >= 3 and a strictly
 * highest score (ties resolve to the earlier, more specific rule).
 */
export function routeGeneralIntent(
  message: string,
  opts: { spanish: boolean },
): { intent: GeneralIntent; reply: string } | null {
  const norm = normalizeForIntent(message);
  let best: { intent: GeneralIntent; score: number } | null = null;
  for (const rule of RULES) {
    let score = 0;
    for (const p of rule.phrases) {
      if (norm.includes(" " + p.replace(/\s+/g, " ").trim() + " ") || norm.includes(p)) score += 3;
    }
    for (const w of rule.words) {
      if (norm.includes(" " + w + " ")) score += 1;
    }
    if (score >= 3 && (!best || score > best.score)) best = { intent: rule.intent, score };
  }
  if (!best) return null;
  const r = REPLIES[best.intent];
  return { intent: best.intent, reply: opts.spanish ? r.es : r.en };
}

/** Has G already introduced himself / described the company this chat? */
export function introAlreadyGiven(history: Array<{ role: string; content: string }>): boolean {
  const joined = history.filter((h) => h.role === "assistant").map((h) => h.content).join("\n");
  return /I am G, (The OC Group's|its) AI guide|Soy G, (la|su) guía de IA/.test(joined);
}

/**
 * The non-repeating fallback. The capability introduction is allowed
 * exactly once per conversation (when nothing has been said yet);
 * afterwards the fallback acknowledges the miss and asks a clarifying
 * question tied to the conversation's context instead of restarting.
 */
export function generalFallback(opts: {
  spanish: boolean;
  sellerContext: boolean;
  investorContext: boolean;
  introGiven: boolean;
}): string {
  const { spanish, sellerContext, investorContext, introGiven } = opts;
  if (!introGiven) {
    return spanish
      ? "Soy G, la guía de IA de The OC Group. Puedo ayudarle a vender una casa, evaluar una inversión, entender reparaciones o financiamiento, y conocer nuestros servicios. ¿Qué le gustaría explorar?"
      : "I am G, The OC Group's AI guide. I can help with selling a house, evaluating an investment, understanding repairs or financing, and learning about our services. What would you like to explore?";
  }
  if (spanish) {
    if (sellerContext) return "Puedo profundizar en cualquier parte: cómo evaluamos una casa, cuáles son los pasos de una venta directa o qué costos tendría usted. ¿Qué le ayudaría más?";
    if (investorContext) return "Puedo profundizar en cualquier parte: cómo evaluamos una oportunidad, los costos de renovación o las opciones de financiamiento. ¿Qué le ayudaría más?";
    return "Quiero orientarle bien: ¿su pregunta es como propietario que piensa vender, como inversionista, o sobre la empresa en sí?";
  }
  if (sellerContext) return "I can go deeper on any part of that — how we evaluate a home, what the steps of a direct sale look like, or what it costs you, which is nothing for a preliminary review. Which would help most?";
  if (investorContext) return "I can go deeper on any part of that — how we evaluate an opportunity, renovation costs and risks, or financing options. Which would help most?";
  return "Let me point you the right way: are you asking as a homeowner thinking about selling, as an investor, or about the company itself?";
}
