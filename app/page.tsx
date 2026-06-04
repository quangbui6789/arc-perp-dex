'use client';

import { useState, useEffect } from 'react';

// Định nghĩa cấu trúc dữ liệu cho Order Book
interface OrderRow {
  price: number;
  quantity: number;
  total: number;
  type: 'buy' | 'sell';
  isUser?: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('TRADE');
  
  // Quản lý trạng thái Ví
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDisconnectMenu, setShowDisconnectMenu] = useState(false);

  // 1. Số dư tại VÍ WEB3 (Dùng để nhận từ Faucet)
  const [walletBalances, setWalletBalances] = useState({
    USDC: 5000.00,
    EURC: 2000.00,
    btc: 0.25
  });

  // 2. Số dư tại TÀI KHOẢN SÀN (Dùng để giao dịch sau khi DEPOSIT)
  const [accountBalances, setAccountBalances] = useState({
    USDC: 1000.00,
    EURC: 0.00,
    btc: 0.05
  });

  // Quản lý các Modal chức năng
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // State xử lý Form Nạp tiền (Deposit)
  const [depositAsset, setDepositAsset] = useState<'USDC' | 'EURC' | 'btc'>('USDC');
  const [depositAmount, setDepositAmount] = useState('500');

  // State xử lý Form Chuyển tiền (Transfer)
  const [transferAsset, setTransferAsset] = useState<'USDC' | 'EURC' | 'btc'>('USDC');
  const [transferAmount, setTransferAmount] = useState('100');
  const [transferTo, setTransferTo] = useState('');

  // Quản lý cặp giao dịch (Hỗ trợ btc/USDC và EURC/USDC)
  const [currentPair, setCurrentPair] = useState('btc/USDC');
  const [showPairSelector, setShowPairSelector] = useState(false);

  // Quản lý Form Đặt Lệnh Trade
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [priceInput, setPriceInput] = useState('63822.0');
  const [qtyInput, setQtyInput] = useState('0.1');
  const [leverage, setLeverage] = useState('20x');

  // Dữ liệu Sổ Lệnh (Order Book)
  const [sellOrders, setSellOrders] = useState<OrderRow[]>([]);
  const [buyOrders, setBuyOrders] = useState<OrderRow[]>([]);

  // Cập nhật giá sàn theo cặp tiền được chọn
  useEffect(() => {
    const basePrice = currentPair === 'btc/USDC' ? 63822.7 : 1.08;
    setPriceInput(basePrice.toFixed(currentPair === 'btc/USDC' ? 1 : 4));

    const sells: OrderRow[] = [];
    const buys: OrderRow[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const diff = currentPair === 'btc/USDC' ? i * 4.5 : i * 0.0002;
      const pSell = basePrice + diff;
      const qSell = Math.random() * (currentPair === 'btc/USDC' ? 1.5 : 500) + 0.1;
      sells.push({ price: pSell, quantity: qSell, total: pSell * qSell, type: 'sell' });

      const pBuy = basePrice - diff;
      const qBuy = Math.random() * (currentPair === 'btc/USDC' ? 1.5 : 500) + 0.1;
      buys.push({ price: pBuy, quantity: qBuy, total: pBuy * qBuy, type: 'buy' });
    }
    setSellOrders(sells.reverse());
    setBuyOrders(buys);
  }, [currentPair]);

  // Kích hoạt Faucet nhận coin trực tiếp về Ví Web3
  const handleFaucet = (token: 'USDC' | 'EURC' | 'btc') => {
    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }
    const amounts = { USDC: 2500, EURC: 1000, btc: 0.05 };
    setWalletBalances(prev => ({
      ...prev,
      [token]: prev[token] + amounts[token]
    }));
    alert(`🎁 Faucet thành công! Đã thêm ${amounts[token]} ${token} vào Ví Web3 của bạn.`);
  };

  // Kích hoạt nạp tiền từ Ví Web3 vào tài khoản sàn (Deposit)
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (walletBalances[depositAsset] < amt) {
      alert(`Số dư trên Ví Web3 không đủ để nạp ${amt} ${depositAsset}! Hãy dùng Faucet trước.`);
      return;
    }

    setWalletBalances(prev => ({ ...prev, [depositAsset]: prev[depositAsset] - amt }));
    setAccountBalances(prev => ({ ...prev, [depositAsset]: prev[depositAsset] + amt }));
    setShowDepositModal(false);
    alert(`💰 Đã nạp thành công ${amt} ${depositAsset} vào tài khoản giao dịch GRVT!`);
  };

  // Kích hoạt chuyển coin đến ví khác (Transfer)
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0 || !transferTo) return;

    if (accountBalances[transferAsset] < amt) {
      alert(`Số dư trên tài khoản sàn không đủ ${amt} ${transferAsset} để chuyển đi!`);
      return;
    }

    setAccountBalances(prev => ({ ...prev, [transferAsset]: prev[transferAsset] - amt }));
    setShowTransferModal(false);
    alert(`💸 Đã chuyển ${amt} ${transferAsset} đến địa chỉ: ${transferTo} thành công.`);
  };

  // Xử lý đặt lệnh Trade (Khớp trực tiếp kiểm tra số dư Account Balances)
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }

    const p = parseFloat(priceInput);
    const q = parseFloat(qtyInput);
    
    // ĐÃ SỬA: Thay iNaN(q) thành isNaN(q) chuẩn TypeScript ở đây
    if (isNaN(p) || isNaN(q) || q <= 0) return;

    const totalCost = p * q;
    const levMultiplier = parseInt(leverage);

    if (orderType === 'BUY') {
      const requiredMargin = totalCost / levMultiplier;
      if (accountBalances.USDC < requiredMargin) {
        alert(`Thất bại: Tài khoản sàn cần tối thiểu ${requiredMargin.toFixed(2)} USDC làm ký quỹ Margin! Vui lòng bấm NẠP COIN.`);
        return;
      }
      setAccountBalances(prev => ({ ...prev, USDC: prev.USDC - requiredMargin }));
      const newRow: OrderRow = { price: p, quantity: q, total: totalCost, type: 'buy', isUser: true };
      setBuyOrders(prev => [newRow, ...prev.slice(0, 4)]);
    } else {
      const token = currentPair.split('/')[0] as 'btc' | 'EURC';
      if (accountBalances[token] < q) {
        alert(`Thất bại: Tài khoản sàn của bạn không đủ ${q} ${token} để thực hiện lệnh vị thế bán!`);
        return;
      }
      setAccountBalances(prev => ({ ...prev, [token]: prev[token] - q }));
      const newRow: OrderRow = { price: p, quantity: q, total: totalCost, type: 'sell', isUser: true };
      setSellOrders(prev => [...prev.slice(1), newRow]);
    }

    alert(`🚀 Đặt lệnh ${orderType} hoàn tất! Dữ liệu vị thế đã cập nhật vào Sổ Lệnh.`);
  };

  const connectWallet = (provider: string) => {
    setWalletAddress(provider === 'metamask' ? '0x2F484e967b28879A81110bC3E1492582846fDe80' : '0x99A61e957b28879A81110bC3E1492582235284ac');
    setIsConnected(true);
    setShowConnectModal(false);
  };

  return (
    <main className="min-h-screen bg-[#090b0d] text-[#e1e3e6] font-sans antialiased text-xs select-none relative">
      
      {/* HEADER BAR */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0d1013] border-b border-[#1c2229] relative z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 font-black text-sm text-white cursor-pointer">
            <span className="text-emerald-400 text-base">⬢</span> grvt <span className="text-[10px] text-gray-500 font-mono font-normal ml-1">sandbox</span>
          </div>
          <nav className="flex items-center gap-5 font-medium text-gray-400">
            <button type="button" onClick={() => setActiveTab('TRADE')} className={`hover:text-white ${activeTab === 'TRADE' && 'text-white font-bold'}`}>Trade</button>
            <button type="button" onClick={() => setShowDepositModal(true)} className="hover:text-emerald-400 text-emerald-500 font-bold">📥 Nạp Coin (Deposit)</button>
            <button type="button" onClick={() => setShowTransferModal(true)} className="hover:text-blue-400 text-blue-500 font-bold">💸 Chuyển Coin (Transfer)</button>
          </nav>
        </div>

        {/* CIRCLE FAUCET ENGINE CONTROL PANEL */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#161c22] border border-[#252f3b] rounded-lg px-2 py-1 gap-2">
            <span className="text-[10px] text-gray-400 font-mono font-bold">Circle Faucet:</span>
            <button type="button" onClick={() => handleFaucet('USDC')} className="text-[10px] bg-[#222a35] hover:bg-emerald-500 hover:text-black font-mono px-1.5 py-0.5 rounded transition-colors">+ USDC</button>
            <button type="button" onClick={() => handleFaucet('EURC')} className="text-[10px] bg-[#222a35] hover:bg-blue-500 hover:text-black font-mono px-1.5 py-0.5 rounded transition-colors">+ EURC</button>
            <button type="button" onClick={() => handleFaucet('btc')} className="text-[10px] bg-[#222a35] hover:bg-yellow-500 hover:text-black font-mono px-1.5 py-0.5 rounded transition-colors">+ btc</button>
          </div>

          {!isConnected ? (
            <button
              type="button"
              onClick={() => setShowConnectModal(true)}
              className="bg-white hover:bg-gray-200 text-black font-bold px-3 py-1.5 rounded-lg text-xs tracking-tight transition-all"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDisconnectMenu(!showDisconnectMenu)}
                className="bg-[#161c22] border border-[#252f3b] rounded-lg px-3 py-1.5 font-mono text-emerald-400 hover:bg-[#1f2730] flex items-center gap-2"
              >
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </button>
              {showDisconnectMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-[#12161a] border border-[#252f3b] rounded-lg p-1 shadow-2xl z-50">
                  <button type="button" onClick={() => { setIsConnected(false); setShowDisconnectMenu(false); }} className="w-full text-left text-red-400 hover:bg-red-950/30 px-3 py-2 rounded-md transition-colors font-medium">
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* DASHBOARD QUẢN LÝ TÀI SẢN */}
      <div className="bg-[#11151a] border-b border-[#1c2229] px-4 py-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-4 text-gray-400">
          <span className="text-gray-200 font-bold">🦊 1. Số dư trên Ví Web3 (Chờ nạp):</span>
          <div>USDC: <span className="text-white font-bold">{walletBalances.USDC.toFixed(2)}</span></div>
          <div>EURC: <span className="text-white font-bold">{walletBalances.EURC.toFixed(2)}</span></div>
          <div>btc: <span className="text-white font-bold">{walletBalances.btc.toFixed(4)}</span></div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-emerald-400 border-t md:border-t-0 md:border-l border-[#252f3b] md:pl-4">
          <span className="text-gray-200 font-bold">🏦 2. Số dư TK Sàn (Có thể trade):</span>
          <div>USDC: <span className="text-white font-bold">{accountBalances.USDC.toFixed(2)}</span></div>
          <div>EURC: <span className="text-white font-bold">{accountBalances.EURC.toFixed(2)}</span></div>
          <div>btc: <span className="text-white font-bold">{accountBalances.btc.toFixed(4)}</span></div>
        </div>
      </div>

      {/* GIAO DIỆN TRADE */}
      {activeTab === 'TRADE' && (
        <div className="flex flex-col">
          
          {/* TICKER STATS BAR */}
          <div className="flex items-center justify-between bg-[#0d1013] px-4 py-2 border-b border-[#1c2229] flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div 
                  onClick={() => setShowPairSelector(!showPairSelector)}
                  className="flex items-center gap-2 cursor-pointer bg-[#161c22] hover:bg-[#1f2730] px-3 py-1 rounded border border-[#252f3b]"
                >
                  <span className="font-bold text-white text-sm font-mono tracking-tight">{currentPair}</span>
                  <span className="text-[10px] text-gray-500">▼</span>
                </div>
                {showPairSelector && (
                  <div className="absolute top-9 left-0 w-44 bg-[#12161a] border border-[#252f3b] rounded-lg shadow-2xl p-1 z-40">
                    <button type="button" onClick={() => { setCurrentPair('btc/USDC'); setShowPairSelector(false); }} className="w-full text-left px-3 py-2 hover:bg-[#161c22] rounded text-white font-mono">btc / USDC</button>
                    <button type="button" onClick={() => { setCurrentPair('EURC/USDC'); setShowPairSelector(false); }} className="w-full text-left px-3 py-2 hover:bg-[#161c22] rounded text-white font-mono">EURC / USDC</button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-5 text-[11px] font-mono text-gray-500">
                <div><span className="text-emerald-400 text-sm font-bold">{currentPair === 'btc/USDC' ? '63,822.7' : '1.0820'}</span> <span className="text-red-500 text-[10px]">-0.45%</span></div>
                <div>Mark: <span className="text-gray-300">{currentPair === 'btc/USDC' ? '63,835.1' : '1.0821'}</span></div>
                <div className="hidden md:block">Index: <span className="text-gray-300">{currentPair === 'btc/USDC' ? '63,820.0' : '1.0818'}</span></div>
                <div className="hidden lg:block">24h Open Interest: <span className="text-emerald-400">12,409.12 USDC</span></div>
              </div>
            </div>
          </div>

          {/* WORKSPACE */}
          <div className="grid grid-cols-1 xl:grid-cols-12 h-[calc(100vh-120px)] overflow-hidden">
            
            {/* TRÁI + GIỮA: CHART VÀ ORDER BOOK */}
            <div className="xl:col-span-9 flex flex-col border-r border-[#1c2229] overflow-y-auto">
              
              {/* CHART BOX */}
              <div className="p-4 bg-[#090b0d] border-b border-[#1c2229] flex-grow flex flex-col justify-between min-h-[340px]">
                <div className="flex items-center justify-between text-gray-500 text-[10px] font-mono border-b border-[#12161a] pb-2 mb-2">
                  <span className="text-white font-bold">{currentPair} • Perpetual Market Stream</span>
                  <span className="text-emerald-400">● Live Connection Active</span>
                </div>

                <div className="w-full flex-grow flex items-end justify-center gap-4 pb-6 pt-4 relative bg-[#0b0e12] rounded-lg border border-[#13181f]">
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none opacity-5">
                    {[...Array(48)].map((_, i) => <div key={i} className="border border-white"></div>)}
                  </div>
                  
                  <div className="flex items-end gap-3 h-[180px] relative z-10 font-mono">
                    <div className="flex flex-col items-center justify-end h-full"><div className="w-[1px] h-12 bg-red-500"></div><div className="w-5 h-20 bg-red-500/80 rounded-sm"></div></div>
                    <div className="flex flex-col items-center justify-end h-full"><div className="w-[1px] h-24 bg-green-500"></div><div className="w-5 h-28 bg-green-500/80 rounded-sm"></div></div>
                    <div className="flex flex-col items-center justify-end h-full"><div className="w-[1px] h-16 bg-red-500"></div><div className="w-5 h-24 bg-red-500/80 rounded-sm"></div></div>
                    <div className="flex flex-col items-center justify-end h-full"><div className="w-[1px] h-32 bg-green-500"></div><div className="w-5 h-36 bg-green-500/80 rounded-sm"></div></div>
                  </div>
                </div>
              </div>

              {/* TWO COLUMN ORDER BOOK */}
              <div className="p-4 bg-[#0d1013] flex-grow">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📊 Order Book Engine</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <div className="text-red-400 font-bold mb-1 border-b border-[#252f3b] pb-1">🛑 Sell Orders (Asks)</div>
                    <table className="w-full text-left">
                      <thead><tr className="text-gray-500 text-[10px]"><th className="pb-1">Price (USDC)</th><th className="pb-1">Quantity</th><th className="pb-1 text-right">Total</th></tr></thead>
                      <tbody>
                        {sellOrders.map((o, i) => (
                          <tr key={i} className={`hover:bg-red-950/20 ${o.isUser ? 'bg-yellow-950 border border-yellow-700 animate-pulse' : ''}`}><td className="py-1 text-red-500 font-bold">{o.price.toFixed(currentPair === 'btc/USDC' ? 1 : 4)}</td><td className="py-1 text-gray-300">{o.quantity.toFixed(3)}</td><td className="py-1 text-right text-gray-400">{o.total.toFixed(2)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <div className="text-emerald-400 font-bold mb-1 border-b border-[#252f3b] pb-1">🟢 Buy Orders (Bids)</div>
                    <table className="w-full text-left">
                      <thead><tr className="text-gray-500 text-[10px]"><th className="pb-1">Price (USDC)</th><th className="pb-1">Quantity</th><th className="pb-1 text-right">Total</th></tr></thead>
                      <tbody>
                        {buyOrders.map((o, i) => (
                          <tr key={i} className={`hover:bg-emerald-950/20 ${o.isUser ? 'bg-yellow-950 border border-yellow-700 animate-pulse' : ''}`}><td className="py-1 text-emerald-400 font-bold">{o.price.toFixed(currentPair === 'btc/USDC' ? 1 : 4)}</td><td className="py-1 text-gray-300">{o.quantity.toFixed(3)}</td><td className="py-1 text-right text-gray-400">{o.total.toFixed(2)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>

            {/* PHẢI: KHUNG ĐẶT LỆNH TRADE CONSOLE */}
            <div className="xl:col-span-3 bg-[#0d1013] p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex gap-2 mb-3">
                  <select className="flex-1 bg-[#161c22] border border-[#252f3b] text-white p-2 rounded-lg focus:outline-none">
                    <option>Cross Margin</option>
                  </select>
                  <select value={leverage} onChange={(e) => setLeverage(e.target.value)} className="w-20 bg-[#161c22] border border-[#252f3b] text-emerald-400 p-2 rounded-lg font-bold font-mono focus:outline-none">
                    <option>10x</option><option>20x</option><option>50x</option>
                  </select>
                </div>

                <div className="flex bg-[#161c22] p-1 rounded-lg mb-4 border border-[#1f2730]">
                  <button type="button" onClick={() => setOrderType('BUY')} className={`flex-1 text-center py-1.5 text-xs font-black rounded uppercase ${orderType === 'BUY' ? 'bg-emerald-500 text-black' : 'text-gray-400'}`}>Buy / Long</button>
                  <button type="button" onClick={() => setOrderType('SELL')} className={`flex-1 text-center py-1.5 text-xs font-black rounded uppercase ${orderType === 'SELL' ? 'bg-red-500 text-white' : 'text-gray-400'}`}>Sell / Short</button>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1"><span>Price</span><span>USDC</span></div>
                    <input type="number" step="any" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] text-white p-2 rounded-lg font-mono focus:outline-none" />
                  </div>
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1"><span>Quantity</span><span>{currentPair.split('/')[0]}</span></div>
                    <input type="number" step="any" value={qtyInput} onChange={(e) => setQtyInput(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] text-white p-2 rounded-lg font-mono focus:outline-none" />
                  </div>

                  <div className="bg-[#161c22] p-3 rounded-lg border border-[#1f2730] text-[11px] font-mono space-y-1.5 text-gray-400">
                    <div className="flex justify-between"><span>Order Value:</span><span className="text-white">{(parseFloat(priceInput || '0') * parseFloat(qtyInput || '0')).toFixed(2)} USDC</span></div>
                    <div className="flex justify-between"><span>Est. Required Margin:</span><span className="text-emerald-400">{((parseFloat(priceInput || '0') * parseFloat(qtyInput || '0')) / parseInt(leverage)).toFixed(2)} USDC</span></div>
                  </div>

                  <button type="submit" className={`w-full py-2.5 rounded-lg font-black uppercase tracking-wider ${orderType === 'BUY' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                    {orderType === 'BUY' ? '🟢 Execute Long Position' : '🛑 Execute Short Position'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: CHỨC NĂNG NẠP TIỀN (DEPOSIT) */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={handleDepositSubmit} className="bg-[#0d1013] border border-[#252f3b] rounded-xl max-w-sm w-full p-5 relative shadow-2xl space-y-4">
            <button type="button" onClick={() => setShowDepositModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xs font-bold uppercase text-emerald-400">📥 Nạp tiền vào tài khoản sàn GRVT</h3>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Chọn tài sản Circle Testnet</label>
              <select value={depositAsset} onChange={(e) => setDepositAsset(e.target.value as any)} className="w-full bg-[#161c22] border border-[#252f3b] p-2.5 rounded-lg text-white font-mono focus:outline-none">
                <option value="USDC">USDC (Ví Web3 khả dụng: {walletBalances.USDC.toFixed(2)})</option>
                <option value="EURC">EURC (Ví Web3 khả dụng: {walletBalances.EURC.toFixed(2)})</option>
                <option value="btc">btc (Ví Web3 khả dụng: {walletBalances.btc.toFixed(4)})</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Số lượng nạp</label>
              <input type="number" step="any" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] p-2 rounded-lg font-mono text-white focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-2.5 rounded-lg uppercase">
              Xác nhận ký quỹ nạp tiền
            </button>
          </form>
        </div>
      )}

      {/* MODAL 2: CHỨC NĂNG CHUYỂN TIỀN (TRANSFER) */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={handleTransferSubmit} className="bg-[#0d1013] border border-[#252f3b] rounded-xl max-w-sm w-full p-5 relative shadow-2xl space-y-4">
            <button type="button" onClick={() => setShowTransferModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xs font-bold uppercase text-blue-400">💸 Chuyển tài sản nội bộ Sandbox</h3>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Chọn tài sản trong sàn</label>
              <select value={transferAsset} onChange={(e) => setTransferAsset(e.target.value as any)} className="w-full bg-[#161c22] border border-[#252f3b] p-2.5 rounded-lg text-white font-mono focus:outline-none">
                <option value="USDC">USDC (Sàn khả dụng: {accountBalances.USDC.toFixed(2)})</option>
                <option value="EURC">EURC (Sàn khả dụng: {accountBalances.EURC.toFixed(2)})</option>
                <option value="btc">btc (Sàn khả dụng: {accountBalances.btc.toFixed(4)})</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Địa chỉ nhận</label>
              <input type="text" placeholder="0x..." value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] p-2 rounded-lg text-white focus:outline-none" required />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Số lượng chuyển</label>
              <input type="number" step="any" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] p-2 rounded-lg font-mono text-white focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-2.5 rounded-lg uppercase">
              Xác nhận chuyển token
            </button>
          </form>
        </div>
      )}

      {/* DIALOG CHỌN VÍ */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0d1013] border border-[#252f3b] rounded-xl max-w-xs w-full p-5 relative shadow-2xl">
            <button type="button" onClick={() => setShowConnectModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-400">Connect Web3 Wallet</h3>
            <div className="space-y-2">
              <button type="button" onClick={() => connectWallet('metamask')} className="w-full bg-[#161c22] hover:bg-[#1f2730] border border-[#252f3b] rounded-lg p-3 flex items-center justify-between font-bold text-left text-white">
                <span>🦊 MetaMask App</span><span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono">Active</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
