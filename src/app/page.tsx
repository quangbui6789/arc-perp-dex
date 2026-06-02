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
        console.error("Kết nối ví thất bại:", error);
      }
    } else {
      alert("Vui lòng cài đặt MetaMask!");
    }
  };

  const handleDeposit = async () => {
    if (!walletAddress) return alert("Hãy kết nối ví trước!");
    if (!amount) return alert("Vui lòng nhập số lượng!");
    alert(`Đang xử lý nạp ${amount} ${tokenType} từ Faucet Circle vào Arc Testnet Smart Contract...`);
  };

  return (
    <main className="min-h-screen bg-[#0B0E11] text-gray-200 font-sans antialiased">
      {/* Top Header Bar giống GRVT */}
      <header className="border-b border-gray-800 bg-[#12161A] px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <span className="text-xl font-bold text-white tracking-wider flex items-center">
            <span className="text-emerald-500 mr-1">⚡</span>ARC PERP
          </span>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-gray-400">
            <a className="text-white border-b-2 border-emerald-500 pb-3 mt-1 cursor-pointer">Trade</a>
            <a className="hover:text-white transition py-1 cursor-pointer">Earn (15% APY)</a>
            <a className="hover:text-white transition py-1 cursor-pointer">Portfolio</a>
            <a className="hover:text-white transition py-1 cursor-pointer">Circle Faucet</a>
          </nav>
        </div>
        
        {!walletAddress ? (
          <button onClick={connectWallet} className="bg-emerald-500 hover:bg-emerald-600 text-gray-950 px-4 py-1.5 rounded-lg font-semibold text-sm transition">
            Connect Wallet
          </button>
        ) : (
          <div className="text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg max-w-[160px] truncate text-emerald-400 font-mono">
            {walletAddress}
          </div>
        )}
      </header>

      {/* Ticker Bar thông số thị trường */}
      <div className="bg-[#12161A] border-b border-gray-800 px-6 py-2 flex space-x-8 text-xs">
        <div>
          <span className="text-gray-500 block">MON/USDT</span>
          <span className="text-rose-500 font-semibold">0.02105 (-1.70%)</span>
        </div>
        <div>
          <span className="text-gray-500 block">Mark Price</span>
          <span className="text-gray-300">0.02101</span>
        </div>
        <div>
          <span className="text-gray-500 block">24h Volume</span>
          <span className="text-emerald-400">1,103,336.64 USDT</span>
        </div>
      </div>

      {/* Main Layout: Chia làm 3 khu vực chức năng */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
        
        {/* Cột 1 & 2: Biểu đồ & Sổ lệnh (Order Book) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Chart Placeholder */}
          <div className="bg-[#12161A] border border-gray-800 rounded-xl p-4 h-[300px] flex flex-col justify-center items-center text-center">
            <span className="text-gray-500 text-sm mb-2">📊 TradingView Chart Component</span>
            <span className="text-xs text-gray-600 font-mono">[MONUSDT - 15m - Pro Mode]</span>
            <div className="w-full max-w-md bg-gray-800/30 h-1.5 mt-4 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full w-[45%]"></div>
            </div>
          </div>

          {/* Order Book chuyên nghiệp */}
          <div className="bg-[#12161A] border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Book</h3>
            <div className="grid grid-cols-2 gap-6 font-mono text-xs">
              {/* Ask Side (Bán) */}
              <div className="text-rose-400 space-y-1.5">
                <div className="flex justify-between"><span>0.02111</span><span className="text-gray-500">11,954</span></div>
                <div className="flex justify-between"><span>0.02110</span><span className="text-gray-500">83,994</span></div>
                <div className="flex justify-between"><span>0.02109</span><span className="text-gray-500">69,661</span></div>
              </div>
              {/* Bid Side (Mua) */}
              <div className="text-emerald-400 space-y-1.5">
                <div className="flex justify-between"><span>0.02100</span><span className="text-gray-500">191,660</span></div>
                <div className="flex justify-between"><span>0.02099</span><span className="text-gray-500">224,516</span></div>
                <div className="flex justify-between"><span>0.02098</span><span className="text-gray-500">82,061</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột 3: Bảng điều khiển Ký quỹ (Margin Asset) */}
        <div className="bg-[#12161A] border border-gray-800 rounded-xl p-6 h-fit shadow-xl">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Deposit Collateral (Margin)
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Select Circle Faucet Asset</label>
              <select value={tokenType} onChange={(e) => setTokenType(e.target.value)} className="w-full bg-[#171C22] border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer">
                <option value="USDC">Circle USDC</option>
                <option value="cirBTC">Circle wrapped BTC (cirBTC)</option>
                <option value="EURC">Circle EURC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Margin Amount</label>
              <div className="relative">
                <input type="number" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#171C22] border border-gray-700 rounded-lg p-3 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                <span className="absolute right-3 top-3 text-xs font-semibold text-gray-400">{tokenType}</span>
              </div>
            </div>

            <button onClick={handleDeposit} className="w-full bg-emerald-500 hover:bg-emerald-600 text-gray-950 py-3 rounded-xl font-bold text-sm tracking-wide transition shadow-lg shadow-emerald-500/10 mt-2">
              Confirm Deposit to Perp Contract
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
