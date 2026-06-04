'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Khởi tạo động component Biểu đồ và tắt SSR để tránh lỗi kẹt Loading Candlestick Engine
const CandlestickChart = dynamic(
  () => import('./components/CandlestickChart'), // Đảm bảo đường dẫn này đúng với file chứa code biểu đồ của bạn
  { 
    ssr: false, 
    loading: () => (
      <div className="flex h-[350px] flex-col items-center justify-center text-gray-400">
        <div className="animate-pulse text-sm font-medium">Real-time Hybrid Orderbook Candlestick Engine...</div>
      </div>
    )
  }
);

export default function Home() {
  // Quản lý trạng thái chuyển đổi giữa các Tab bằng State hoạt động trực tiếp ở Client
  const [activeTab, setActiveTab] = useState('TRADE');

  const navItems = [
    { name: 'TRADE', hasApy: false },
    { name: 'EARN', hasApy: true },
    { name: 'PORTFOLIO', hasApy: false },
    { name: 'CIRCLE FAUCET', hasApy: false }
  ];

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white font-sans selection:bg-green-500 selection:text-black">
      {/* HEADER / NAVBAR */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-900 bg-[#0b0e11]">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 font-black text-lg tracking-wider text-white">
            <span className="text-yellow-400 text-xl">⚡</span> ARC PERP
          </div>
          
          {/* Menu điều hướng các Tab */}
          <nav className="flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`text-xs font-bold transition-all duration-200 uppercase tracking-wider relative py-1 focus:outline-none ${
                    isActive ? 'text-green-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.name}
                  {item.hasApy && (
                    <span className="ml-2 text-[10px] bg-green-950/80 text-green-400 px-1.5 py-0.5 rounded border border-green-900 font-semibold normal-case">
                      15% APY
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-green-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Địa chỉ ví giả lập hiển thị góc phải */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono text-green-400 max-w-[140px] truncate shadow-sm">
          0x2F484e967b28879...
        </div>
      </header>

      {/* NỘI DUNG THAY ĐỔI THEO TAB */}
      <div className="p-4 max-w-[1600px] mx-auto">
        {activeTab === 'TRADE' && (
          <>
            {/* Ticker / Thanh thông tin thị trường */}
            <div className="flex flex-wrap items-center gap-6 mb-4 text-[11px] text-gray-400 bg-[#12161a]/40 border border-gray-900 rounded-lg p-3">
              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                MON / USDT <span className="text-red-500 font-normal bg-red-950/30 px-1 py-0.5 rounded text-[10px]">-1.70%</span>
              </div>
              <div>Index Price: <span className="text-white font-mono">0.02105</span></div>
              <div>Mark Price: <span className="text-white font-mono">0.02101</span></div>
              <div>24h Vol: <span className="text-green-400 font-mono">1,103,336.64 USDT</span></div>
              <div>Funding Rate: <span className="text-green-400 font-mono">+0.0100%</span></div>
            </div>

            {/* Bố cục chính: Biểu đồ và Khung đặt lệnh */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Vùng hiển thị biểu đồ */}
              <div className="lg:col-span-3 bg-[#12161a] border border-gray-900 rounded-xl p-4 flex flex-col justify-between min-h-[480px]">
                <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  MONUSDT • 15m • TradingView Stream
                </div>
                <div className="my-auto w-full">
                  <CandlestickChart />
                </div>
              </div>

              {/* Vùng hiển thị Margin Console */}
              <div className="bg-[#12161a] border border-gray-900 rounded-xl p-5 h-fit shadow-lg">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-5 text-gray-200">
                  <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                  Margin Console
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1.5 uppercase tracking-wider font-semibold">Circle Faucet Asset</label>
                    <select className="w-full bg-[#1b2026] border border-gray-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-green-500/50 transition-colors cursor-pointer">
                      <option>Circle USDC</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-semibold tracking-wider">
                      <span className="uppercase">Deposit Amount</span>
                      <span>Available: 0.00</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        defaultValue="1" 
                        className="w-full bg-[#1b2026] border border-gray-800 rounded-lg p-2.5 text-xs text-white font-mono pr-12 focus:outline-none focus:border-green-500/50 transition-colors"
                      />
                      <span className="absolute right-3 top-3 text-[10px] text-gray-500 font-bold tracking-tight">USDC</span>
                    </div>
                  </div>

                  <button className="w-full bg-green-500 hover:bg-green-400 active:scale-[0.99] text-slate-950 font-black py-3 rounded-lg text-xs transition-all duration-150 uppercase tracking-widest mt-2 shadow-md shadow-green-500/10">
                    Confirm Cross Margin Deposit
                  </button>
                </div>
              </div>
            </div>

            {/* Khung chứa Sổ lệnh / Order Book mẫu phía dưới */}
            <div className="mt-4 bg-[#12161a] border border-gray-900 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-400 border-b border-gray-900 pb-2 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                📄 Order Book
              </div>
              <div className="text-center text-xs text-gray-600 py-6 font-mono">
                Orderbook data feed streaming via local engine...
              </div>
            </div>
          </>
        )}

        {activeTab === 'EARN' && (
          <div className="bg-[#12161a] border border-gray-900 rounded-xl p-6 text-center min-h-[300px] flex flex-col justify-center items-center">
            <h2 className="text-lg font-bold text-green-400 mb-2">ARC Vault & Staking Program</h2>
            <p className="text-xs text-gray-400 max-w-md">Deposit liquidity into market maker vaults to earn an estimated 15% APY accumulated in real-time from trade funding rates.</p>
          </div>
        )}

        {activeTab === 'PORTFOLIO' && (
          <div className="bg-[#12161a] border border-gray-900 rounded-xl p-6 text-center min-h-[300px] flex flex-col justify-center items-center">
            <h2 className="text-lg font-bold text-white mb-2">User Account Portfolio</h2>
            <p className="text-xs text-gray-400 max-w-md">Connect your decentralized wallet to track active perpetual leverage positions, margin collateral status, and historical distributions.</p>
          </div>
        )}

        {activeTab === 'CIRCLE FAUCET' && (
          <div className="bg-[#12161a] border border-gray-900 rounded-xl p-6 text-center min-h-[300px] flex flex-col justify-center items-center">
            <h2 className="text-lg font-bold text-blue-400 mb-2">Circle Testnet Faucet</h2>
            <p className="text-xs text-gray-400 max-w-md">Claim test tokens directly into your connected wallet to experience high-leverage trading operations on the Arc architecture.</p>
          </div>
        )}
      </div>
    </main>
  );
}
