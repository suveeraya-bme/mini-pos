  // ฟังก์ชันยิงแจ้งเตือน Telegram (ใส่ค่าตรงเพื่อตัดปัญหา Environment Variables)
  async function sendTelegramNotification(product, soldQuantity, remainingStock, totalPrice) {
    const botToken = '8839537374:AAGZYNcOJHf2FnInhaFv0OzwRXk6gqdGKck'
    const chatId = '-1004299543597'
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`

    try {
      // 1. แจ้งเตือนออเดอร์ใหม่
      const orderMessage = `🛍️ <b>มีรายการขายใหม่!</b>\n` +
        `- สินค้า: ${product.name}\n` +
        `- จำนวน: ${soldQuantity} ชิ้น\n` +
        `- ราคารวม: ${totalPrice} บาท\n` +
        `- สต๊อกคงเหลือ: ${remainingStock} ชิ้น`

      await fetch(telegramApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: orderMessage,
          parse_mode: 'HTML'
        })
      })

      // 2. แจ้งเตือนสต๊อกเหลือน้อย (<= 5 ชิ้น)
      if (remainingStock <= 5) {
        const lowStockMessage = `🚨 <b>[เตือนภัย] สต๊อกสินค้าใกล้หมด!</b>\n` +
          `- สินค้า: ${product.name}\n` +
          `- คงเหลือเพียง: ${remainingStock} ชิ้น\n` +
          `⚠️ กรุณาเติมสต๊อกสินค้าด่วน!`

        await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: lowStockMessage,
            parse_mode: 'HTML'
          })
        })
      }
    } catch (err) {
      console.error('Telegram Error:', err)
    }
  }
