import "./globals.css";

export const metadata = {
  title: 'Arc Perp DEX (GRVT Clone)',
  description: 'Hybrid Perpetual DEX on Arc Testnet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0B0E11] text-gray-200 antialiased">
        {children}
      </body>
    </html>
  )
}
