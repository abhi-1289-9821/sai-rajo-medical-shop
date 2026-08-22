const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// ─── System Instruction ──────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are the helpful, concise AI assistant for Sai Rajo Medical Shop, Faizabad.

Trusted shop facts:
- Location: Near ICICI Bank, Rikabganj, Niyawan Road, Faizabad.
- Phone: +91 8127152715 and +91 9565187777.
- Email: sairajomedicalhall@gmail.com
- Hours: 9:00 AM–12:00 AM daily (Mon–Sun).
- Products: Medicines, Personal Care, Healthcare, Baby Care, Medical Devices, Ayurvedic Products, Supplements.
- Ordering: customers submit name, phone, address, medicine list/quantity and when required a prescription image/PDF. Verified pharmacists process orders.
- Offers: 20% discount on medicine orders + free doorstep delivery (no minimum).
- Order tracking: requires an order number and phone number on the homepage.
- Do not claim availability, price, delivery time, or order status unless that information is explicitly included in the request.

Conversation rules:
- Use the full conversation history. Short replies like "yes", "price?", "cetirizine" usually refer to the preceding discussion — always check context before responding.
- Match the user's language: English, Hindi, or Hinglish.
- Be natural and concise — 2 to 5 short paragraphs or bullet points is the default.
- Do not use fixed template headings like "Medicine Inquiry:", "How to Order:", or "Feel free to ask...".
- Do not append discounts, delivery offers, or ordering instructions unless the user asks about price, offers, ordering, or delivery.

Medical safety:
- You provide general pharmacy information only — you are not a doctor and cannot diagnose.
- Never say "You have..." or "You definitely have..." — use "This is commonly associated with..." or "This medicine is often used for...".
- For symptom questions, ask only 1–3 relevant follow-up questions (age, duration, severity) before discussing medicines.
- Never recommend antibiotics, prescription-only medicines, or dose changes for self-treatment.
- For medicine questions: explain general uses, common side effects, and important precautions. Do not assume age, pregnancy status, conditions, allergies, or other medicines.
- If you cannot answer something with confidence, say so clearly rather than guessing.`;

// ─── Emergency Guard (fast, deterministic, no AI call needed) ────────────────
const EMERGENCY_PATTERN =
  /\b(chest\s*pain|severe\s+(difficulty\s+)?breathing|can'?t\s+breathe|cannot\s+breathe|unconscious|passed\s+out|seizure|stroke|face\s+droop|slurred\s+speech|severe\s+bleeding|poison(?:ing)?|anaphylaxis|swelling\s+(of\s+)?(lips|tongue|throat))\b/i;

function emergencyReply() {
  return (
    'This could be a serious medical emergency. Please seek urgent medical care immediately or call your local emergency services right away.\n\n' +
    'Do not rely on a chatbot for emergency situations. For non-urgent queries, feel free to call the shop at **+91 8127152715** or **+91 9565187777**.'
  );
}

// ─── History Converter ────────────────────────────────────────────────────────
// Converts frontend [{role, text}] → Gemini [{role, parts}]
// Frontend uses role 'model' for assistant, Gemini also uses 'model' — pass through.
function toGeminiContents(history, currentMessage) {
  const safeHistory = (Array.isArray(history) ? history : [])
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'model') &&
        typeof m.text === 'string' &&
        m.text.trim().length > 0
    )
    .slice(-14); // last 7 exchanges

  const contents = safeHistory.map((m) => ({
    role: m.role,
    parts: [{ text: m.text.trim() }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: currentMessage }],
  });

  return contents;
}

// ─── Controller ──────────────────────────────────────────────────────────────
/**
 * POST /api/chatbot/chat
 * Body: { message: string, history: Array<{role: 'user'|'model', text: string}> }
 * Response: { success: true, reply: string }
 */
exports.chatWithAI = async (req, res, next) => {
  try {
    const message =
      typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!message || message.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'Please send a message between 1 and 4000 characters.',
      });
    }

    // Fast emergency path — no AI needed, no fallback medicine advice
    if (EMERGENCY_PATTERN.test(message)) {
      return res.status(200).json({
        success: true,
        reply: emergencyReply(),
      });
    }

    // Require API key to be configured
    if (!process.env.GEMINI_API_KEY) {
      console.warn('[Chatbot] GEMINI_API_KEY is not set.');
      return res.status(503).json({
        success: false,
        message:
          "I'm temporarily unable to reply. Please try again in a moment, or contact the shop directly at +91 8127152715.",
      });
    }

    const history = req.body?.history;
    const contents = toGeminiContents(history, message);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.45,
        maxOutputTokens: 500,
      },
    });

    const reply = response.text?.trim();

    if (!reply) {
      throw new Error('Gemini returned empty text.');
    }

    return res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error('[Chatbot] Gemini call failed:', error.message || error);

    // Transparent retry message — never return fake medical advice as fallback
    return res.status(503).json({
      success: false,
      message:
        "I'm temporarily unable to reply. Please try again in a moment, or contact the shop at +91 8127152715 or +91 9565187777.",
    });
  }
};
