'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function SellPage() {
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching products:', error)
    } else {
      setProducts(data || [])
      if (data && data.length > 0) {
        setSelectedProductId(data[0].id)
      }
    }
  }

  async function sendTelegramNotification(product, soldQuantity, remainingStock, totalPrice) {
    const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      console.warn('ยังไม่ได้ตั้งค่า Bot Token หรือ Chat ID')
      return
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`

    try {
      const orderMessage = `🛍️ <b>มีรายการขายใหม่!</b>\n` +
        `- สินค้า: ${product.name}\n` +
        `- จำนวน: ${soldQuantity} ชิ้น\n` +
        `- ราคารวม: ${totalPrice.toLocaleString()} บาท\n` +
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
      console.error('Failed to send Telegram notification:', err)
    }
  }

  async function handleSell(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const selectedProduct = products.find(p => p.id === parseInt(selectedProductId))

    if (!selectedProduct) {
      setMessage('❌ กรุณาเลือกสินค้า')
      setLoading(false)
      return
    }

    if (quantity <= 0) {
      setMessage('❌ จำนวนต้องมากกว่า 0')
      setLoading(false)
      return
    }

    if (selectedProduct.stock < quantity) {
      setMessage(`❌ สต๊อกไม่พอ (คงเหลือ ${selectedProduct.stock} ชิ้น)`)
      setLoading(false)
      return
    }

    const totalPrice = selectedProduct.price * quantity
    const newStock = selectedProduct.stock - quantity

    try {
      const { error: salesError } = await supabase
        .from('sales')
        .insert([{ product_id: selectedProduct.id, quantity: parseInt(quantity), total_price: totalPrice }])

      if (salesError) throw salesError

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', selectedProduct.id)

      if (updateError) throw updateError

      await sendTelegramNotification(selectedProduct, quantity, newStock, totalPrice)

      setMessage(`✅ ขายสำเร็จ! (${selectedProduct.name} x ${quantity})`)
      setQuantity(1)
      fetchProducts()
    } catch (error) {
      console.error('Error processing sale:', error)
      setMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🛒 หน้าขายสินค้า (Mini POS)</h1>
      {message && <div style={{ padding: '10px', marginBottom: '20px', borderRadius: '5px', backgroundColor: message.startsWith('✅') ? '#e6fffa' : '#ffebe9' }}>{message}</div>}
      <form onSubmit={handleSell} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>เลือกสินค้า:</label>
          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{ width: '100%', padding: '10px' }}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} - {p.price} บาท (เหลือ {p.stock} ชิ้น)</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>จำนวนที่ขาย:</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: '100%', padding: '10px' }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px' }}>
          {loading ? 'กำลังบันทึก...' : 'บันทึกการขาย'}
        </button>
      </form>
    </div>
  )
}
