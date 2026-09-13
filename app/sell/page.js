'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

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

  // ดึงรายการสินค้าทั้งหมดมาใส่ dropdown
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

  // กดปุ่ม "ขาย"
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

    // ตรวจสอบ stock เพียงพอหรือไม่
    if (qtyNumber > selectedProduct.stock) {
      alert(`สินค้าคงเหลือไม่พอ (เหลือ ${selectedProduct.stock} ${selectedProduct.unit})`);
      return;
    }

    setSubmitting(true);

    // บันทึกรายการขายลงตาราง sales
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

    // อัปเดต stock ในตาราง products ให้ลดลง
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

    // สำเร็จ: แสดงข้อความ, รีเซ็ตฟอร์ม, โหลดข้อมูลใหม่
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
            {/* Dropdown เลือกสินค้า */}
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

            {/* จำนวนที่จะขาย */}
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

            {/* ยอดรวมอัตโนมัติ */}
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
