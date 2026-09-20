'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

async function sendTelegramMessage(text) {
  try {
    await fetch('/api/telegram-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error('เรียก API แจ้งเตือน Telegram ไม่สำเร็จ:', err);
  }
}

function buildOrderMessage({ productName, quantity, totalPrice, newStock }) {
  const timeText = new Date().toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    `🛍️ <b>มีรายการขายใหม่!</b>\n` +
    `- สินค้า: ${productName}\n` +
    `- จำนวน: ${quantity} ชิ้น\n` +
    `- ราคารวม: ${totalPrice} บาท\n` +
    `- สต๊อกคงเหลือปัจจุบัน: ${newStock} ชิ้น\n` +
    `- เวลา: ${timeText}`
  );
}

function buildLowStockMessage({ productName, newStock }) {
  return (
    `🚨 <b>[เตือนภัย] สต๊อกสินค้าใกล้หมด!</b>\n` +
    `- สินค้า: ${productName}\n` +
    `- คงเหลือเพียง: ${newStock} ชิ้น\n` +
    `⚠️ กรุณาเติมสต๊อกสินค้าด่วน!`
  );
}

const LOW_STOCK_THRESHOLD = 5;

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setProducts(data);
    }
    setLoading(false);
  }

  const selectedProduct = products.find((p) => p.id === selectedId);
  const qtyNumber = parseInt(quantity) || 0;
  const totalPrice = selectedProduct ? selectedProduct.price * qtyNumber : 0;

  async function handleSell(e) {
    e.preventDefault();
    setMessage('');

    if (!selectedProduct) {
      alert('กรุณาเลือกสินค้า');
      return;
    }
    if (qtyNumber <= 0) {
      alert('กรุณากรอกจำนวนให้ถูกต้อง');
      return;
    }

    if (qtyNumber > selectedProduct.stock) {
      alert(`สินค้าคงเหลือไม่พอ (เหลือ ${selectedProduct.stock} ${selectedProduct.unit})`);
      return;
    }

    setSubmitting(true);

    const { error: saleError } = await supabase.from('sales').insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qtyNumber,
        total_price: totalPrice,
      },
    ]);

    if (saleError) {
      alert('บันทึกการขายไม่สำเร็จ: ' + saleError.message);
      setSubmitting(false);
      return;
    }

    const newStock = selectedProduct.stock - qtyNumber;
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    if (stockError) {
      alert('อัปเดตสต๊อกไม่สำเร็จ: ' + stockError.message);
      setSubmitting(false);
      return;
    }

    sendTelegramMessage(
      buildOrderMessage({
        productName: selectedProduct.name,
        quantity: qtyNumber,
        totalPrice: totalPrice,
        newStock: newStock,
      })
    );

    if (newStock <= LOW_STOCK_THRESHOLD) {
      sendTelegramMessage(
        buildLowStockMessage({
          productName: selectedProduct.name,
          newStock: newStock,
        })
      );
    }

    setMessage(`ขายสำเร็จ! ${selectedProduct.name} x ${qtyNumber} รวม ${totalPrice} บาท`);
    setSelectedId('');
    setQuantity('');
    setSubmitting(false);
    fetchProducts();
  }

  return (
    <div>
      <h1>ขายสินค้า</h1>

      {message && (
        <div className="card" style={{ background: '#e6f4ea', color: '#1e5e2f' }}>
          {message}
        </div>
      )}

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <div className="card">
          <form onSubmit={handleSell}>
            <div style={{ marginBottom: '12px' }}>
              <label>สินค้า: </label>
              <br />
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="">-- เลือกสินค้า --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price} บาท (เหลือ {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label>จำนวน: </label>
              <br />
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '16px', fontWeight: 'bold' }}>
              ยอดรวม: {totalPrice} บาท
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? 'กำลังบันทึก...' : 'ขาย'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
