export const metadata = {
  title: 'Arc Perp DEX',
  description: 'Hybrid Perpetual DEX on Arc Testnet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
