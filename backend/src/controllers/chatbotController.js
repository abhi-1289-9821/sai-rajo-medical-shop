const { GoogleGenAI } = require('@google/genai');

// System prompt defining persona, product categories, store context, and safety guardrails
const SYSTEM_INSTRUCTION = `You are the official AI Assistant of Sai Rajo Medical Shop (also known as Sai Rajo Medical Hall).

The website sells items in the following categories:
- Medicines
- Personal Care
- Healthcare
- Baby Care
- Medical Devices
- Ayurvedic Products
- Supplements

Store Details & Info:
- Location: Near ICICI Bank, Rikabganj, Niyawan Road, Faizabad
- Phone numbers: +91 8127152715, +91 9565187777
- Email: sairajomedicalhall@gmail.com
- Business Hours: 9:00 AM - 12:00 AM (Monday - Sunday)
- Current Offers: 20% discount on all medicine orders, Free Doorstep Delivery with no minimum value.
- Ordering Process: Customers can add medicine list & quantity on the website, upload prescription image/PDF if needed, and place an order. Verified pharmacists process all orders.
- Order Tracking: Customers can track order status live on the homepage using Order Number and Phone Number.

STRICT GUARDRAILS & RULES:
1. Answer customer questions politely, helpfully, and professionally.
2. DO NOT diagnose diseases or provide medical diagnoses under any circumstances.
3. DO NOT prescribe prescription medicines or recommend clinical dosages for prescription-only drugs.
4. ALWAYS recommend consulting a qualified doctor or physician for serious, severe, persistent, or emergency health symptoms.
5. Provide clear information on store products, categories, ordering steps, prescription upload process, and store contact details.`;

/**
 * Intelligent Fallback response generator when GEMINI_API_KEY is not set or network fails
 */
function generateFallbackResponse(userMessage) {
  const lower = userMessage.toLowerCase().trim();

  // Safety Guardrail 1: Diagnosis or severe symptom check (Highest Priority)
  if (
    lower.includes('diagnose') || 
    lower.includes('chest pain') || 
    lower.includes('shortness of breath') || 
    lower.includes('severe pain') || 
    lower.includes('high fever for days') ||
    lower.includes('stroke') ||
    lower.includes('heart attack') ||
    lower.includes('what disease do i have')
  ) {
    return "⚠️ **Medical Advisory**: I am an AI assistant for Sai Rajo Medical Shop and cannot diagnose diseases or medical conditions. For serious or severe symptoms, please consult a qualified doctor or emergency medical service immediately.";
  }

  // Safety Guardrail 2: Prescription / Dosage advice
  if (
    lower.includes('prescribe') || 
    lower.includes('antibiotic dosage') || 
    lower.includes('prescription for') ||
    lower.includes('how many mg should i take')
  ) {
    return "💊 **Prescription Policy**: I cannot prescribe prescription medicines or determine prescription medication dosages. For prescription drugs, please consult your healthcare provider. Once you have a valid prescription, you can upload it on our website to order your medicines easily!";
  }

  // Greeting check
  const greetings = ['hi', 'hii', 'hiii', 'hello', 'helo', 'hey', 'heyy', 'good morning', 'good afternoon', 'good evening', 'namaste', 'greetings', 'start', 'help'];
  if (greetings.includes(lower)) {
    return "👋 **Hello! Welcome to Sai Rajo Medical Shop!**\n\nI am your 24/7 AI Assistant. How can I help you today?\n\n- 💊 **Medicines** (20% OFF + Free Doorstep Delivery)\n- 👶 **Baby Care Products**\n- 🌡️ **Medical Devices**\n- 🧴 **Personal Care & Supplements**\n- 📝 **Order Placement & Prescription Upload**\n\nFeel free to ask about any medicine, product category, store location, or ordering instructions!";
  }

  // Thanks / Closing check
  const thanks = ['thanks', 'thank you', 'thx', 'thanku', 'dhanyawad', 'ok', 'okay', 'bye', 'goodbye'];
  if (thanks.includes(lower)) {
    return "🙏 **You're welcome!** Thank you for choosing **Sai Rajo Medical Shop**. We are happy to assist you with all your medicine and healthcare needs. Have a great day! 😊";
  }

  // Specific Medicine Name check (Dolo, Paracetamol, etc.)
  if (lower.includes('dolo') || lower.includes('paracetamol') || lower.includes('crocin')) {
    return "💊 **Dolo 650 (Paracetamol 650mg)**:\n\n**Dolo 650** is a popular medicine containing **Paracetamol (650mg)** used for:\n- 🌡️ Lowering body temperature during fever\n- 🤕 Relieving mild to moderate pain (headaches, body aches, toothaches)\n\n**Availability at Sai Rajo Medical Shop**:\nIt is available in our store with **20% DISCOUNT** and **Free Doorstep Delivery**!\n\n⚠️ *Disclaimer: Always follow doctor's advice or label instructions. For persistent fever (>3 days), consult a doctor.*";
  }

  // Specific Category Scored Matching Engine
  const categoryRules = [
    {
      id: 'baby_care',
      keywords: ['baby care', 'baby', 'diaper', 'wipes', 'baby lotion', 'cerelac', 'johnson', 'pampers', 'huggies'],
      response: "👶 **Baby Care Category**: Yes! We stock a complete range of authentic **Baby Care** products at **Sai Rajo Medical Shop**, including:\n- Diapers & Baby Wipes (Pampers, Huggies, MamyPoko)\n- Baby Skincare (Lotion, Cream, Powder, Gentle Soap)\n- Baby Nutrition (Cerelac, Formula Milk)\n- Baby Feeding Accessories\n\nYou can order baby care items directly on our homepage with **Free Doorstep Delivery**!"
    },
    {
      id: 'medical_devices',
      keywords: ['medical device', 'device', 'bp monitor', 'glucometer', 'sugar testing', 'oximeter', 'nebulizer', 'heating pad'],
      response: "🌡️ **Medical Devices**: We sell digital Blood Pressure monitors, Blood Glucose (Sugar) testing meters & strips, Pulse Oximeters, Nebulizers, Digital Thermometers, and Heating Pads. Place an order on our homepage for fast delivery!"
    },
    {
      id: 'ayurvedic',
      keywords: ['ayurvedic', 'ayurveda', 'herbal', 'chyawanprash', 'dabur', 'zandu', 'patanjali'],
      response: "🌿 **Ayurvedic Products**: We carry genuine Ayurvedic products including Dabur Chyawanprash, Ayurvedic herbal oils, immunity boosters, and natural remedies at **Sai Rajo Medical Shop**."
    },
    {
      id: 'supplements',
      keywords: ['supplement', 'protein', 'multivitamin', 'vitamin', 'calcium', 'omega 3'],
      response: "🏋️ **Health & Nutrition Supplements**: We supply multivitamins, calcium & Vitamin D3 supplements, protein powders, Vitamin C, and Omega-3 fish oil capsules. Order online on our homepage with **20% OFF**!"
    },
    {
      id: 'personal_care',
      keywords: ['personal care', 'soap', 'shampoo', 'face wash', 'lotion', 'toothpaste', 'hygiene', 'skin care'],
      response: "🧴 **Personal Care Category**: Yes! We offer top personal care brands covering skincare, hair care (shampoos/conditioners), body soaps, oral care (toothpaste/toothbrushes), and personal hygiene products. Add your items in our order form to get **Free Doorstep Delivery**!"
    },
    {
      id: 'healthcare',
      keywords: ['healthcare', 'first aid', 'bandage', 'dettol', 'cotton', 'antiseptic', 'thermometer'],
      response: "🩺 **Healthcare Essentials**: We stock first aid kits, bandages, antiseptic liquids (Dettol/Savlon), medical cotton, thermometers, and daily healthcare supplies at Sai Rajo Medical Shop."
    }
  ];

  // Score each category based on keyword matches
  let bestMatch = null;
  let highestScore = 0;

  for (const rule of categoryRules) {
    const score = rule.keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? kw.length : 0), 0);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = rule;
    }
  }

  if (bestMatch && highestScore > 0) {
    return bestMatch.response;
  }

  // Specific named medicines fallback (expanded with popular Indian pharmacy items including Omez-D / Omezd)
  const commonMeds = [
    'omez-d', 'omezd', 'omez', 'omeprazole', 'pantocid', 'pan-40', 'pan40', 'pan 40', 'pantoprazole', 'azithromycin', 
    'combiflam', 'dispirin', 'gelusil', 'digene', 'vicks', 'cough syrup', 'saridon', 'aspirin', 
    'zinetac', 'allegra', 'sinarest', 'cetirizine', 'pain killer', 'fever medicine', 'calpol', 
    'crocin', 'dolo', 'montair', 'amoxyclav', 'augmentin', 'metformin', 'telma', 'atorvas', 
    'aciloc', 'rantac', 'pantodac', 'liv52', 'shelcal', 'ecosprin', 'limcee', 'becosules', 'citralka', 'evion'
  ];

  const stripNonAlpha = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetAlpha = stripNonAlpha(lower);
  const matchedMed = commonMeds.find(med => lower.includes(med) || targetAlpha.includes(stripNonAlpha(med)));

  // Exclude common greetings, filler words, and question words from short medicine detection
  const nonMedicineWords = [
    'hi', 'hii', 'hiii', 'hello', 'helo', 'hey', 'heyy', 'thanks', 'thank you', 'ok', 'okay', 
    'yes', 'no', 'bye', 'goodbye', 'help', 'info', 'what', 'why', 'how', 'where', 'who', 'is', 'are'
  ];

  const isShortQuery = userMessage.trim().length >= 2 && 
    userMessage.trim().length <= 50 && 
    !nonMedicineWords.includes(lower);

  if (matchedMed || lower.includes('medicine') || lower.includes('tablet') || lower.includes('capsule') || lower.includes('syrup') || isShortQuery) {
    const rawName = matchedMed || userMessage.trim().replace(/^['"\s]+|['"\s]+$/g, '');
    const medLabel = rawName.split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
    
    return `💊 **Medicine Inquiry**: Yes! **${medLabel}** is available at **Sai Rajo Medical Shop**!\n\nYou can order it directly on our website with **20% DISCOUNT** and **Free Doorstep Delivery**.\n\n**How to Order**:\n1. Fill in your Name, Phone, and Delivery Address on our home page.\n2. Add **${medLabel}** and the required quantity in the medicine list.\n3. (Optional) Upload your prescription if required.\n4. Click **Submit Order**!`;
  }

  // Product categories list query
  if (
    lower.includes('category') || 
    lower.includes('categories') || 
    lower.includes('sell') || 
    lower.includes('product') || 
    lower.includes('what do you have')
  ) {
    return "🛒 **Sai Rajo Medical Shop Categories**:\n\nWe offer a wide range of authentic products across:\n1. 💊 **Medicines** (Prescription & Over-The-Counter)\n2. 🧴 **Personal Care**\n3. 🩺 **Healthcare**\n4. 👶 **Baby Care**\n5. 🌡️ **Medical Devices**\n6. 🌿 **Ayurvedic Products**\n7. 🏋️ **Supplements**\n\nYou can order any of these directly on our website!";
  }

  // Ordering or Prescription Upload query
  if (
    lower.includes('order') || 
    lower.includes('buy') || 
    lower.includes('upload') || 
    lower.includes('prescription') ||
    lower.includes('how to')
  ) {
    return "📝 **How to Order at Sai Rajo Medical Shop**:\n\n1. Enter your Name, Phone Number, and Delivery Address on our home page.\n2. Add your required medicines and quantities.\n3. (Optional) Upload an image/PDF of your prescription.\n4. Click **Submit Order**.\nOur pharmacists will review your order, package your items, and deliver them to your doorstep with **Free Delivery** and **20% Discount**!";
  }

  // Store Hours / Location / Contact query
  if (
    lower.includes('hour') || 
    lower.includes('time') || 
    lower.includes('timing') || 
    lower.includes('location') || 
    lower.includes('address') || 
    lower.includes('phone') || 
    lower.includes('contact') || 
    lower.includes('where')
  ) {
    return "📍 **Sai Rajo Medical Shop Info**:\n\n- **Address**: Near ICICI Bank, Rikabganj, Niyawan Road, Faizabad\n- **Business Hours**: 9:00 AM - 12:00 AM (Monday - Sunday)\n- **Phones**: +91 8127152715, +91 9565187777\n- **Email**: sairajomedicalhall@gmail.com\n- **Special Offer**: 20% OFF on medicines + Free Doorstep Delivery!";
  }

  // Discount / Offer query
  if (
    lower.includes('discount') || 
    lower.includes('offer') || 
    lower.includes('deal') || 
    lower.includes('coupon') || 
    lower.includes('price')
  ) {
    return "🎉 **Special Local Offers**:\n\n- **20% DISCOUNT** on all medicine orders submitted today!\n- **FREE Doorstep Delivery** on all orders with no minimum order value.\nPlace your order directly on our website for fast home delivery!";
  }

  // Clean Medicine & Product Inquiry Fallback (replaces old awkward boilerplate text)
  const cleanInput = userMessage.trim().replace(/^['"\s]+|['"\s]+$/g, '');
  const formattedInput = cleanInput.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  return `💊 **Medicine Inquiry**: Yes! **${formattedInput}** is available at **Sai Rajo Medical Shop**!\n\nYou can order it directly on our website with **20% DISCOUNT** and **Free Doorstep Delivery**.\n\n**How to Order**:\n1. Fill in your Name, Phone, and Delivery Address on our home page.\n2. Add **${formattedInput}** and the required quantity in the medicine list.\n3. (Optional) Upload your prescription if required.\n4. Click **Submit Order**!`;
}

/**
 * Controller: Handle Chatbot message request
 * POST /api/chatbot/chat
 */
exports.chatWithAI = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.log(`[Chatbot] GEMINI_API_KEY not set. Serving fallback response for: "${message}"`);
      const reply = generateFallbackResponse(message);
      return res.status(200).json({
        success: true,
        reply,
        fallback: true
      });
    }

    // Call Google Gen AI SDK using gemini-flash-latest
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Format chat history for Gemini API
      const formattedContents = [];
      
      // Add previous conversation context if present
      if (Array.isArray(history)) {
        history.forEach(item => {
          if (item.role && item.text) {
            formattedContents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }]
            });
          }
        });
      }

      // Add current user message
      formattedContents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: formattedContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      });

      const reply = response.text || generateFallbackResponse(message);

      return res.status(200).json({
        success: true,
        reply
      });
    } catch (apiErr) {
      console.error('[Chatbot] Gemini API error:', apiErr.message || apiErr);
      // Fallback gracefully on API key errors, quota limit, or network issues
      const reply = generateFallbackResponse(message);
      return res.status(200).json({
        success: true,
        reply,
        fallback: true
      });
    }
  } catch (error) {
    next(error);
  }
};
