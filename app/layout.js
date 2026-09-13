import './globals.css';

export const metadata = {
  title: 'Mini POS',
  description: 'Mini POS system for small shop',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <nav className="navbar">
          <div className="navbar-title">Mini POS</div>
          <div className="navbar-links">
            <a href="/">หน้าแรก</a>
            <a href="/sell">ขายสินค้า</a>
            <a href="/history">ประวัติการขาย</a>
          </div>
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
