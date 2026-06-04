'use client';

import { useState, useEffect } from 'react';

// Định nghĩa cấu trúc dữ liệu cho Order Book
interface OrderRow {
  price: number;
  quantity: number;
  total: number;
  type: 'buy' | 'sell';
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('TRADE');
  
  // Quản lý trạng thái Ví
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDisconnectMenu, setShowDisconnectMenu] = useState(false);

  // Số dư 3 đồng coin Faucet trên Circle Testnet
  const [balances, setBalances] = useState({
    USDC: 10000.00,
    BTC: 0.50,
    ETH: 2.50
  });

  // Quản lý cặp giao dịch (Mặc định chọn BTC/USDT giống GRVT)
  const [currentPair, setCurrentPair] = useState('BTC/USDC');
  const [showPairSelector, setShowPairSelector] = useState(false);

  // Quản lý Form Đặt Lệnh
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [priceInput, setPriceInput] = useState('63902.4');
  const [qtyInput, setQtyInput] = useState('0.5');
  const [leverage, setLeverage] = useState('40x');

  // Dữ liệu Sổ Lệnh (Order Book) chia 2 phần sâu chuỗi
  const [sellOrders, setSellOrders] = useState<OrderRow[]>([]);
  const [buyOrders, setBuyOrders] = useState<OrderRow[]>([]);

  // Thiết lập thông số giá mặc định theo cặp tiền
  useEffect(() => {
    const basePrice = currentPair === 'BTC/USDC' ? 63822.7 : 3450.5;
    setPriceInput(basePrice.toFixed(1));

    // Khởi tạo Order book động giả lập đúng biên độ của sàn
    const sells: OrderRow[] = [];
    const buys: OrderRow[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const pSell = basePrice + (i * 3.5);
      const qSell = Math.random() * 2 + 0.1;
      sells.push({ price: pSell, quantity: qSell, total: pSell * qSell });

      const pBuy = basePrice - (i * 3.5);
      const qBuy = Math.random() * 2 + 0.1;
      buys.push({ price: pBuy, quantity: qBuy, total: pBuy * qBuy });
    }
    setSellOrders(sells.reverse()); // Sắp xếp giá giảm dần ở phe bán
    setBuyOrders(buys);
  }, [currentPair]);

  // Hàm xử lý Faucet nhận thêm 3 đồng coin testnet
  const handleFaucet = (token: 'USDC' | 'BTC' | 'ETH') => {
    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }
    const amounts = { USDC: 5000, BTC: 0.1, ETH: 0.5 };
    setBalances(prev => ({
      ...prev,
      [token]: prev[token] + amounts[token]
    }));
    alert(`🎁 Đã Faucet thành công ${amounts[token]} ${token} từ Circle Testnet Network!`);
  };

  const connectWallet = (provider: string) => {
    setWalletAddress(provider === 'metamask' ? '0x2F484e967b28879A81110bC3E1492582846fDe80' : '0x99A61e957b28879A81110bC3E1492582235284ac');
    setIsConnected(true);
    setShowConnectModal(false);
  };

  // Logic Đặt Lệnh Khớp Vào Sổ Lệnh
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }

    const p = parseFloat(priceInput);
    const q = parseFloat(qtyInput);
    if (isNaN(p) || isNaN(q)) return;

    const newRow: OrderRow = { price: p, quantity: q, total: p * q, type: orderType === 'BUY' ? 'buy' : 'sell' };

    if (orderType === 'BUY') {
      if (balances.USDC < p * q / 40) { alert('Không đủ số dư USDC testnet (đã tính leverage)!'); return; }
      setBuyOrders(prev => [newRow, ...prev.slice(0, 4)]);
      setBalances(prev => ({ ...prev, USDC: prev.USDC - (p * q / 40) }));
    } else {
      const token = currentPair.split('/')[0] as 'BTC' | 'ETH';
      if (balances[token] < q) { alert(`Không đủ số dư ${token} testnet để đặt lệnh Short!`); return; }
      setSellOrders(prev => [...prev.slice(1), newRow]);
      setBalances(prev => ({ ...prev, [token]: prev[token] - q }));
    }

    alert(`🚀 Lệnh ${orderType} ${q} ${currentPair.split('/')[0]} ở giá ${p} đã được đẩy lên Sổ lệnh sàn GRVT clone!`);
  };

  return (
    <main className="min-h-screen bg-[#090b0d] text-[#e1e3e6] font-sans antialiased text-xs select-none">
      
      {/* TOP NAVIGATION BAR (Chuẩn GRVT) */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0d1013] border-b border-[#1c2229] relative z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 font-black text-sm tracking-tight text-white cursor-pointer">
            <span className="text-emerald-400 text-base">⬢</span> grvt <span className="text-[10px] text-gray-500 font-mono font-normal ml-1">clone</span>
          </div>
          <nav className="flex items-center gap-5 font-medium text-gray-400">
            <button onClick={() => setActiveTab('TRADE')} className={`hover:text-white ${activeTab === 'TRADE' && 'text-white font-bold'}`}>Trade</button>
            <button onClick={() => setActiveTab('INVEST')} className={`hover:text-white relative ${activeTab === 'INVEST' && 'text-white font-bold'}`}>Invest <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1 py-0.2 rounded ml-1 font-mono">15% APY</span></button>
            <button onClick={() => setActiveTab('EARN')} className={`hover:text-white ${activeTab === 'EARN' && 'text-white font-bold'}`}>Earn <span className="text-[9px] bg-green-500/10 text-green-400 px-1 py-0.2 rounded ml-1 font-mono">11% APY</span></button>
            <button onClick={() => setActiveTab('PORTFOLIO')} className={`hover:text-white ${activeTab === 'PORTFOLIO' && 'text-white font-bold'}`}>Portfolio</button>
          </nav>
        </div>

        {/* Cụm ví + Circle Faucet Panel */}
        <div className="flex items-center gap-3">
          {/* Quick Faucet Dropdown */}
          <div className="flex items-center bg-[#161c22] border border-[#252f3b] rounded-lg px-2 py-1 gap-2">
            <span className="text-[10px] text-gray-400 uppercase font-mono font-bold">Circle Faucet:</span>
            <button onClick={() => handleFaucet('USDC')} className="text-[10px] bg-[#222a35] hover:bg-emerald-500 hover:text-black font-mono px-1.5 py-0.5 rounded transition-colors">+USDC</button>
            <button onClick={() => handleFaucet('BTC')} className="text-[10px] bg-[#222a35] hover:bg-yellow-500 hover:text-black font-mono px-1.5 py-0.5 rounded transition-colors">+BTC</button>
            <button onClick={() => handleFaucet('ETH')} className="text-[10px] bg-[#222a35] hover:bg-blue-500 hover:text-black font-mono px-1.5 py-0.5 rounded transition-colors">+ETH</button>
          </div>

          {!isConnected ? (
            <button
              onClick={() => setShowConnectModal(true)}
              className="bg-white hover:bg-gray-200 text-black font-bold px-3 py-1.5 rounded-lg text-xs tracking-tight transition-all"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDisconnectMenu(!showDisconnectMenu)}
                className="bg-[#161c22] border border-[#252f3b] rounded-lg px-3 py-1.5 font-mono text-emerald-400 hover:bg-[#1f2730] transition-colors flex items-center gap-2"
              >
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </button>
              {showDisconnectMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-[#12161a] border border-[#252f3b] rounded-lg p-1 shadow-2xl">
                  <button onClick={disconnectWallet} className="w-full text-left text-red-400 hover:bg-red-950/30 px-3 py-2 rounded-md transition-colors font-medium">
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* CHỨC NĂNG CHÍNH: GIAO DIỆN TRADE KHỚP 100% GRVT */}
      {activeTab === 'TRADE' && (
        <div className="flex flex-col">
          
          {/* 1. TICKER BAR */}
          <div className="flex items-center justify-between bg-[#0d1013] px-4 py-2 border-b border-[#1c2229] flex-wrap gap-4">
            <div className="flex items-center gap-6">
              {/* Asset Selector Dropdown */}
              <div className="relative">
                <div 
                  onClick={() => setShowPairSelector(!showPairSelector)}
                  className="flex items-center gap-2 cursor-pointer bg-[#161c22] hover:bg-[#1f2730] px-3 py-1 rounded border border-[#252f3b]"
                >
                  <span className="font-bold text-white text-sm tracking-tight">{currentPair}</span>
                  <span className="text-[10px] text-gray-500">Perpetual ▼</span>
                </div>
                {showPairSelector && (
                  <div className="absolute top-9 left-0 w-44 bg-[#12161a] border border-[#252f3b] rounded-lg shadow-2xl p-1 z-40">
                    <button onClick={() => { setCurrentPair('BTC/USDC'); setShowPairSelector(false); }} className="w-full text-left px-3 py-2 hover:bg-[#161c22] rounded text-white font-mono">BTC/USDC</button>
                    <button onClick={() => { setCurrentPair('ETH/USDC'); setShowPairSelector(false); }} className="w-full text-left px-3 py-2 hover:bg-[#161c22] rounded text-white font-mono">ETH/USDC</button>
                  </div>
                )}
              </div>

              {/* Ticker Stats */}
              <div className="flex items-center gap-5 text-[11px] font-mono">
                <div><span className={currentPair === 'BTC/USDC' ? "text-emerald-400 text-sm font-bold" : "text-red-400 text-sm font-bold"}>{currentPair === 'BTC/USDC' ? '63,822.7' : '3,450.5'}</span> <span className="text-red-500 text-[10px]">-5.03%</span></div>
                <div className="hidden sm:block text-gray-500">Mark <span className="text-gray-300">{currentPair === 'BTC/USDC' ? '63,838.6' : '3,451.2'}</span></div>
                <div className="hidden md:block text-gray-500">24h High <span className="text-gray-300">{currentPair === 'BTC/USDC' ? '67,478.6' : '3,610.0'}</span></div>
                <div className="hidden md:block text-gray-500">24h Vol(USDC) <span className="text-emerald-500">479,403,360.4</span></div>
                <div className="text-gray-500">Funding / Countdown <span className="text-emerald-400">+0.0100% / 02:43:08</span></div>
              </div>
            </div>
            
            {/* Wallet Quick Balance Display */}
            <div className="text-[11px] font-mono text-gray-400 flex items-center gap-4 bg-[#12161a] px-3 py-1 rounded border border-[#1c2229]">
              <div>USDC: <span className="text-white font-bold">{balances.USDC.toFixed(2)}</span></div>
              <div>BTC: <span className="text-white font-bold">{balances.BTC.toFixed(3)}</span></div>
              <div>ETH: <span className="text-white font-bold">{balances.ETH.toFixed(3)}</span></div>
            </div>
          </div>

          {/* 2. GRID WORKSPACE LAYOUT */}
          <div className="grid grid-cols-1 xl:grid-cols-12 h-[calc(100vh-85px)] overflow-hidden">
            
            {/* CỘT TRÁI + GIỮA: CHART VÀ ORDER BOOK (9/12) */}
            <div className="xl:col-span-9 flex flex-col border-r border-[#1c2229] overflow-y-auto">
              
              {/* VÙNG BIỂU ĐỒ NẾN MOCKUP CHUẨN TỶ LỆ */}
              <div className="p-4 bg-[#090b0d] border-b border-[#1c2229] flex-grow flex flex-col justify-between min-h-[360px]">
                <div className="flex items-center justify-between text-gray-500 text-[10px] font-mono border-b border-[#12161a] pb-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{currentPair} • 1D • GRVT Engine Stream</span>
                    <span className="text-gray-600">1m 15m 1h 1d 1w</span>
                  </div>
                  <div className="text-gray-400 font-bold">● Live Connection Active</div>
                </div>

                {/* Phần thân mô phỏng chart đồ thị */}
                <div className="w-full flex-grow flex items-end justify-center gap-4 pb-6 pt-4 relative bg-[#0b0e12] rounded-lg border border-[#13181f]">
                  {/* Grid Lines làm mờ nền */}
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none opacity-5">
                    {[...Array(48)].map((_, i) => <div key={i} className="border border-white"></div>)}
                  </div>
                  
                  {/* Cột nến động thay đổi linh hoạt */}
                  <div className="flex items-end gap-3 h-[200px] relative z-10 font-mono text-[9px] text-gray-600">
                    <div className="flex flex-col items-center justify-end h-full"><div className="w-[1px] h-12 bg-red-500"></div><div className="w-5 h-20 bg-red-500/80 rounded-sm"></div></div>
                    <div className="flex flex-col items-center justify-end h-full"><div className="w-[1px] h-24 bg-green-500"></div><div className="w-5 h-28 bg-green-500/80 rounded-sm"></div></div>
                    <div className="flex flex-col items-center justify-end h-full"><div className="w-[1px] h-16 bg-red-500"></div><div className="w-5 h-32 bg-red-500/80 rounded-sm"></div></div>
                    <div className="flex flex-col items-center justify-end h-full"><div className="w-[1px] h-10 bg-green-500"></div><div className="w-5 h-16 bg-green-500/80 rounded-sm"></div></div>
                    <div className="flex flex-col items-center justify-end h-full"><div className="w-[1px] h-32 bg-green-500"></div><div className="w-5 h-24 bg-green-500/80 rounded-sm"></div></div>
                  </div>
                </div>
              </div>

              {/* SỔ LỆNH ORDER BOOK KÉP (NẰM DƯỚI CHART CHUẨN GRVT) */}
              <div className="p-4 bg-[#0d1013] flex-grow">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>📊 Order Book / Market Liquidity</span>
                  <span className="text-[10px] text-emerald-500 font-mono normal-case">Circle Testnet Live Feed</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  {/* Bên lệnh bán (Asks - Màu đỏ) */}
                  <div>
                    <div className="text-red-400 font-bold mb-1.5 border-b border-[#252f3b] pb-1">🛑 Sell Orders (Asks)</div>
                    <table className="w-full text-left">
                      <thead><tr className="text-gray-500 text-[11px]"><th className="pb-1">Price (USDC)</th><th className="pb-1">Quantity</th><th className="pb-1 text-right">Total</th></tr></thead>
                      <tbody>
                        {sellOrders.map((o, i) => (
                          <tr key={i} className="hover:bg-red-950/20 transition-colors"><td className="py-1 text-red-500 font-bold">{o.price.toFixed(1)}</td><td className="py-1 text-gray-300">{o.quantity.toFixed(3)}</td><td className="py-1 text-right text-gray-400">{o.total.toFixed(1)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bên lệnh mua (Bids - Màu xanh) */}
                  <div>
                    <div className="text-emerald-400 font-bold mb-1.5 border-b border-[#252f3b] pb-1">🟢 Buy Orders (Bids)</div>
                    <table className="w-full text-left">
                      <thead><tr className="text-gray-500 text-[11px]"><th className="pb-1">Price (USDC)</th><th className="pb-1">Quantity</th><th className="pb-1 text-right">Total</th></tr></thead>
                      <tbody>
                        {buyOrders.map((o, i) => (
                          <tr key={i} className="hover:bg-emerald-950/20 transition-colors"><td className="py-1 text-emerald-400 font-bold">{o.price.toFixed(1)}</td><td className="py-1 text-gray-300">{o.quantity.toFixed(3)}</td><td className="py-1 text-right text-gray-400">{o.total.toFixed(1)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>

            {/* CỘT PHẢI: KHUNG ĐẶT LỆNH GIAO DỊCH CHUYÊN NGHIỆP (3/12) */}
            <div className="xl:col-span-3 bg-[#0d1013] p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Margin Type & Leverage Selector */}
                <div className="flex gap-2 mb-4">
                  <select className="flex-1 bg-[#161c22] border border-[#252f3b] text-white p-2 rounded-lg text-xs font-bold focus:outline-none">
                    <option>Isolated Margin</option>
                    <option>Cross Margin</option>
                  </select>
                  <select 
                    value={leverage} 
                    onChange={(e) => setLeverage(e.target.value)}
                    className="w-24 bg-[#161c22] border border-[#252f3b] text-emerald-400 p-2 rounded-lg text-xs font-bold font-mono focus:outline-none"
                  >
                    <option>10x</option><option>20x</option><option>40x</option><option>100x</option>
                  </select>
                </div>

                {/* Tab Mua / Bán */}
                <div className="flex bg-[#161c22] p-1 rounded-lg mb-4 border border-[#1f2730]">
                  <button onClick={() => setOrderType('BUY')} className={`flex-1 text-center py-2 text-xs font-black rounded-md uppercase transition-all ${orderType === 'BUY' ? 'bg-emerald-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>Buy / Long</button>
                  <button onClick={() => setOrderType('SELL')} className={`flex-1 text-center py-2 text-xs font-black rounded-md uppercase transition-all ${orderType === 'SELL' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Sell / Short</button>
                </div>

                {/* Form Nhập Giá / Số lượng */}
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1 text-[11px]"><span>Price</span><span>USDC</span></div>
                    <input type="number" step="any" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] text-white p-2.5 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500/50" />
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-400 mb-1 text-[11px]"><span>Quantity</span><span>{currentPair.split('/')[0]}</span></div>
                    <input type="number" step="any" value={qtyInput} onChange={(e) => setQtyInput(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] text-white p-2.5 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500/50" />
                  </div>

                  {/* Thanh kéo tỷ lệ phần trăm lệnh */}
                  <div className="flex justify-between gap-1 pt-1">
                    {['25%', '50%', '75%', '100%'].map((pct) => (
                      <button key={pct} type="button" className="flex-1 bg-[#1c2229] hover:bg-[#252f3b] text-gray-400 py-1 rounded text-[10px] font-mono transition-colors">{pct}</button>
                    ))}
                  </div>

                  {/* Bảng tính toán thông số lệnh ký quỹ */}
                  <div className="bg-[#161c22] p-3 rounded-lg border border-[#1f2730] text-[11px] font-mono space-y-1.5 text-gray-400">
                    <div className="flex justify-between"><span>Order Value:</span><span className="text-white">{(parseFloat(priceInput || '0') * parseFloat(qtyInput || '0')).toFixed(2)} USDC</span></div>
                    <div className="flex justify-between"><span>Margin Requirement:</span><span className="text-emerald-400">{((parseFloat(priceInput || '0') * parseFloat(qtyInput || '0')) / parseInt(leverage)).toFixed(2)} USDC</span></div>
                  </div>

                  {/* Nút Đặt Lệnh Thực Thi */}
                  <button type="submit" className={`w-full py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all active:scale-[0.99] shadow-lg ${orderType === 'BUY' ? 'bg-emerald-500 hover:bg-emerald-400 text-black' : 'bg-red-500 hover:bg-red-400 text-white'}`}>
                    {orderType === 'BUY' ? '🟢 Execute Open Long' : '🛑 Execute Open Short'}
                  </button>
                </form>
              </div>

              <div className="border-t border-[#1c2229] pt-3 mt-4 text-[11px] text-gray-500 font-mono text-center">
                Connected to Circle Sandbox Relay Engine
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CÁC TABS PHỤ ĐỂ MÔ PHỎNG ĐỦ CHỨC NĂNG SÀN */}
      {activeTab !== 'TRADE' && (
        <div className="p-8 max-w-xl mx-auto text-center min-h-[400px] flex flex-col justify-center items-center bg-[#0d1013] border border-[#1c2229] rounded-2xl mt-12">
          <h2 className="text-base font-bold text-emerald-400 uppercase tracking-widest mb-2">{activeTab} Ecosystem Dashboard</h2>
          <p className="text-gray-400 leading-relaxed text-xs">Môi trường phân tích trạng thái và phân phối thanh khoản được liên kết trực tiếp với dữ liệu ví mạng thử nghiệm Circle Testnet.</p>
        </div>
      )}

      {/* DIALOG POP-UP MODAL CHỌN KẾT NỐI VÍ */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0d1013] border border-[#252f3b] rounded-xl max-w-xs w-full p-5 relative shadow-2xl animate-in fade-in duration-150">
            <button onClick={() => setShowConnectModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-400">Connect Web3 Wallet</h3>
            <div className="space-y-2">
              <button onClick={() => connectWallet('metamask')} className="w-full bg-[#161c22] hover:bg-[#1f2730] border border-[#252f3b] rounded-lg p-3 flex items-center justify-between font-bold text-left text-white transition-colors">
                <span>🦊 MetaMask App</span><span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono">Active</span>
              </button>
              <button onClick={() => connectWallet('coinbase')} className="w-full bg-[#161c22] hover:bg-[#1f2730] border border-[#252f3b] rounded-lg p-3 flex items-center justify-between font-bold text-left text-white transition-colors">
                <span>🛡️ Coinbase Wallet</span><span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">Detected</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
