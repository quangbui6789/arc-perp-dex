"use client";
import { useState } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [tokenType, setTokenType] = useState<string>("USDC");

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
      } catch (error) {
        console.error("Kết kết nối ví thất bại:", error);
      }
    } else {
      alert("Vui lòng cài đặt MetaMask!");
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0E11] text-gray-200 antialiased selection:bg-emerald-500/30">
      {/* Top Navigation Bar */}
      <header className="border-b border-gray-800/80 bg-[#12161A] px-6 py-3 flex justify-between items-center backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center space-x-8">
          <span className="text-lg font-bold text-white tracking-widest flex items-center">
            <span className="text-emerald-500 mr-1.5 animate-pulse">⚡</span>ARC PERP
          </span>
          <nav className="hidden md:flex space-x-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <a className="text-emerald-400 border-b-2 border-emerald-500 pb-4 mt-1 cursor-pointer">Trade</a>
            <a className="hover:text-white transition py-1 cursor-pointer">Earn <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded ml-1">15% APY</span></a>
            <a className="hover:text-white transition py-1 cursor-pointer">Portfolio</a>
            <a className="hover:text-white transition py-1 cursor-pointer text-blue-400">Circle Faucet</a>
          </nav>
        </div>
        
        {!walletAddress ? (
          <button onClick={connectWallet} className="bg-emerald-500 hover:bg-emerald-600 text-gray-950 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 transform active:scale-95 shadow-lg shadow-emerald-500/20">
            Connect Wallet
          </button>
        ) : (
          <div className="text-xs bg-gray-900 border border-gray-800 px-3 py-2 rounded-lg max-w-[150px] truncate text-emerald-400 font-mono ring-1 ring-emerald-500/20">
            {walletAddress}
          </div>
        )}
      </header>

      {/* Market Ticker Stats Bar */}
      <div className="bg-[#12161A]/60 border-b border-gray-800/60 px-6 py-2.5 flex flex-wrap gap-8 text-[11px] font-medium text-gray-400">
        <div className="flex items-center space-x-2">
          <span className="text-white font-bold">MON / USDT</span>
          <span className="text-rose-500 font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded">-1.70%</span>
        </div>
        <div><span className="text-gray-500 mr-1.5">Index Price:</span><span className="text-gray-200 font-mono">0.02105</span></div>
        <div><span className="text-gray-500 mr-1.5">Mark Price:</span><span className="text-gray-300 font-mono">0.02101</span></div>
        <div><span className="text-gray-500 mr-1.5">24h Vol:</span><span className="text-emerald-400 font-mono">1,103,336.64 USDT</span></div>
        <div><span className="text-gray-500 mr-1.5">Funding Rate:</span><span className="text-emerald-400 font-mono">+0.0100%</span></div>
      </div>

      {/* Main Professional Trading Grid */}
      <div className="max-w-[1600px] mx-auto p-4 grid grid-cols-1 xl:grid-cols-4 gap-4">
        
        {/* Left Columns: Charts & Order Book */}
        <div className="xl:col-span-3 space-y-4">
          {/* Chart Workspace Container */}
          <div className="bg-[#12161A] border border-gray-800/80 rounded-xl p-4 h-[420px] flex flex-col justify-center items-center relative overflow-hidden group shadow-inner">
            <div className="absolute top-3 left-4 flex items-center space-x-2 text-xs font-semibold text-gray-400 bg-gray-900/50 px-2.5 py-1 rounded-md border border-gray-800">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span>MONUSDT • 15m • TradingView Stream</span>
            </div>
            <div className="text-center space-y-2 max-w-sm">
              <div className="text-4xl text-gray-700 font-light tracking-widest group-hover:text-emerald-500/40 transition-colors duration-500">📊</div>
              <p className="text-xs text-gray-500 font-mono">Real-time Hybrid Orderbook Candlestick Engine</p>
            </div>
            {/* Fake chart bottom indicator lines */}
            <div className="absolute bottom-0 left-0 w-full h-[60px] bg-gradient-to-t from-emerald-500/5 to-transparent border-t border-gray-800/20 grid grid-cols-12 items-end px-4 gap-1">
              {[40,20,55,70,30,45,60,85,40,50,65,35].map((h, i) => (
                <div key={i} style={{height: `${h}%`}} className={`rounded-t-sm w-full ${i % 3 === 0 ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}></div>
              ))}
            </div>
          </div>

          {/* Dual Order Book Column Layout */}
          <div className="bg-[#12161A] border border-gray-800/80 rounded-xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800/50 pb-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                <span className="mr-1.5 text-gray-500">📋</span> Order Book
              </h3>
              <span className="text-[10px] text-gray-500 font-mono">Spread: 0.00001 (0.05%)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs">
              {/* Sell Orders (Asks) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-gray-500 border-b border-gray-900 pb-1 uppercase tracking-wider"><span>Price (USDT)</span><span>Size (MON)</span></div>
                <div className="flex justify-between text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded"><span>0.02111</span><span className="text-gray-400">11,954</span></div>
                <div className="flex justify-between text-rose-400/90 bg-rose-500/[0.03] px-2 py-0.5 rounded"><span>0.02110</span><span className="text-gray-400">83,994</span></div>
                <div className="flex justify-between text-rose-400/80 bg-rose-500/[0.01] px-2 py-0.5 rounded"><span>0.02109</span><span className="text-gray-400">69,661</span></div>
              </div>
              {/* Buy Orders (Bids) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-gray-500 border-b border-gray-900 pb-1 uppercase tracking-wider"><span>Price (USDT)</span><span>Size (MON)</span></div>
                <div className="flex justify-between text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded"><span>0.02100</span><span className="text-gray-400">191,660</span></div>
                <div className="flex justify-between text-emerald-400/90 bg-emerald-500/[0.03] px-2 py-0.5 rounded"><span>0.02099</span><span className="text-gray-400">224,516</span></div>
                <div className="flex justify-between text-emerald-400/80 bg-emerald-500/[0.01] px-2 py-0.5 rounded"><span>0.02098</span><span className="text-gray-400">82,061</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Margin Faucet Deposit Console */}
        <div className="bg-[#12161A] border border-gray-800/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between h-fit ring-1 ring-gray-800/40">
          <div>
            <div className="flex items-center space-x-2 mb-5 border-b border-gray-800/50 pb-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Margin Console</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Circle Faucet Asset</label>
                <div className="relative">
                  <select value={tokenType} onChange={(e) => setTokenType(e.target.value)} className="w-full bg-[#171C22] border border-gray-700/80 rounded-lg p-3 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer transition-all">
                    <option value="USDC">Circle USDC</option>
                    <option value="cirBTC">Circle wrapped BTC (cirBTC)</option>
                    <option value="EURC">Circle EURC</option>
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500 text-[10px]">▼</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">Deposit Amount</label>
                  <span className="text-[10px] text-gray-500 font-mono">Available: 0.00</span>
                </div>
                <div className="relative">
                  <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#171C22] border border-gray-700/80 rounded-lg p-3 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                  <span className="absolute right-3 top-3 text-[11px] font-bold text-gray-500 font-mono bg-gray-900/60 px-2 py-0.5 rounded">{tokenType}</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => alert(`Đang đẩy lệnh nạp Ký quỹ: ${amount} ${tokenType} vào Smart Contract...`)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-gray-950 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10 mt-6 transform active:scale-[0.98]">
            Confirm Cross Margin Deposit
          </button>
        </div>

      </div>
    </main>
  );
}
