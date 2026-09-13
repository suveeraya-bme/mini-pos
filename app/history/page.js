'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  // ดึงประวัติการขายทั้งหมด เรียงจากล่าสุดไปเก่าสุด
  async function fetchSales() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setSales(data);
    }
    setLoading(false);
  }

  // รวมยอดขายทั้งหมด
  const totalSum = sales.reduce((sum, s) => sum + Number(s.total_price), 0);

  // แปลงวันเวลาให้อ่านง่าย
  function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  return (
    <div>
      <h1>ประวัติการขาย</h1>

      {/* ยอดขายรวมทั้งหมด */}
      <div className="card" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
        ยอดขายรวมทั้งหมด: {totalSum.toLocaleString()} บาท
      </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : sales.length === 0 ? (
        <p>ยังไม่มีประวัติการขาย</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>วันเวลาที่ขาย</th>
              <th>ชื่อสินค้า</th>
              <th>จำนวน</th>
              <th>ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{formatDateTime(s.sold_at)}</td>
                <td>{s.product_name}</td>
                <td>{s.quantity}</td>
                <td>{Number(s.total_price).toLocaleString()} บาท</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
