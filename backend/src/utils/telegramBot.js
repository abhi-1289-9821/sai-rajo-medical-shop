const https = require('https');
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

  const payload = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown'
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[Telegram Notification] Sent successfully for order #${order.order_number}`);
          resolve(true);
        } else {
          console.error(`[Telegram Notification] Error response (Status ${res.statusCode}):`, data);
          resolve(false); // Resolve false so it doesn't block client response
        }
      });
    });

    req.on('error', (error) => {
      console.error('[Telegram Notification] Connection error:', error);
      resolve(false); // Resolve false so it doesn't block client response
    });

    req.write(payload);
    req.end();
  });
}

module.exports = {
  sendNewOrderNotification
};
