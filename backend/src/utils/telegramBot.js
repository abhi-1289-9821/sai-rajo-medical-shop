const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Sends a Telegram notification to the store owner when a new order is placed.
 * @param {Object} order - The order object
 */
async function sendNewOrderNotification(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Gracefully skip if credentials are not configured
  if (!token || !chatId || token.startsWith('YOUR_') || chatId.startsWith('YOUR_')) {
    console.warn('[Telegram Notification] Skipped. TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.');
    return;
  }

  const hasPrescription = order.prescription_url ? 'Yes' : 'No';

  // Construct message matching the requested layout
  const message = `🔔 *New Medical Order*

*Order ID:* #${order.order_number}

*Customer Name:* ${order.customer_name}
*Phone Number:* ${order.phone}
*Address:* ${order.address}

*Medicines Requested:*
${order.medicines_requested}

*Prescription:* ${hasPrescription}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (response.ok) {
      console.log(`[Telegram Notification] Sent successfully for order #${order.order_number}`);
      return true;
    } else {
      const data = await response.text();
      console.error(`[Telegram Notification] Error response (Status ${response.status}):`, data);
      return false;
    }
  } catch (error) {
    console.error('[Telegram Notification] Connection error:', error.message);
    return false;
  }
}

module.exports = {
  sendNewOrderNotification
};
