
export const metadata = {
  title: 'Arc Perp DEX (GRVT Pro Mode)',
  description: 'Hybrid Perpetual DEX on Arc Testnet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0E11] text-gray-200 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
