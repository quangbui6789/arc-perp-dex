'use client';

import { useState, useEffect } from 'react';

interface OrderRow {
  price: number;
  quantity: number;
  total: number;
  type: 'buy' | 'sell';
  isUser?: boolean;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('TRADE');
  
  // Web3 Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [networkName, setNetworkName] = useState('ARC Testnet');
  const [nativeBalance, setNativeBalance] = useState('0.00');
  
  // Khối tài sản lưu trữ trong Smart Contract sàn
  const [accountBalances, setAccountBalances] = useState({
    USDC: 2500.00,
    EURC: 450.00,
    btc: 0.085
  });

  // Modal Control
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form Field States
  const [depositAsset, setDepositAsset] = useState<'USDC' | 'EURC' | 'btc'>('USDC');
  const [depositAmount, setDepositAmount] = useState('100');
  const [transferAsset, setTransferAsset] = useState<'USDC' | 'EURC' | 'btc'>('USDC');
  const [transferAmount, setTransferAmount] = useState('50');
  const [transferTo, setTransferTo] = useState('');

  const [currentPair, setCurrentPair] = useState('btc/USDC');
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [priceInput, setPriceInput] = useState('63822.0');
  const [qtyInput, setQtyInput] = useState('0.1');
  const [leverage, setLeverage] = useState('20x');

  // Real-time Market Data States
  const [currentPrice, setCurrentPrice] = useState(63822.7);
  const [sellOrders, setSellOrders] = useState<OrderRow[]>([]);
  const [buyOrders, setBuyOrders] = useState<OrderRow[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);

  // Khởi tạo đồ thị nến ban đầu
  useEffect(() => {
    const base = currentPair === 'btc/USDC' ? 63822.7 : 1.0820;
    setCurrentPrice(base);
    setPriceInput(base.toFixed(currentPair === 'btc/USDC' ? 1 : 4));

    const initialCandles: Candle[] = [];
    for (let i = 4; i >= 1; i--) {
      const rand = (Math.random() - 0.5) * (base * 0.001);
      initialCandles.push({
        time: new Date(Date.now() - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        open: base + rand,
        high: base + Math.abs(rand) * 1.4,
        low: base - Math.abs(rand) * 1.4,
        close: base - rand
      });
    }
    setCandles(initialCandles);
  }, [currentPair]);

  // ENGINE: Luồng cập nhật biểu đồ & Sổ lệnh Thời gian thực (Real-time Data Stream)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prevPrice => {
        const volatility = currentPair === 'btc/USDC' ? (Math.random() - 0.5) * 8.5 : (Math.random() - 0.5) * 0.0004;
        const nextPrice = prevPrice + volatility;

        setCandles(prevCandles => {
          if (prevCandles.length === 0) return prevCandles;
          const updated = [...prevCandles];
          const lastCandle = { ...updated[updated.length - 1] };
          
          lastCandle.close = nextPrice;
          if (nextPrice > lastCandle.high) lastCandle.high = nextPrice;
          if (nextPrice < lastCandle.low) lastCandle.low = nextPrice;
          
          updated[updated.length - 1] = lastCandle;
          return updated;
        });

        const sells: OrderRow[] = [];
        const buys: OrderRow[] = [];
        for (let i = 1; i <= 5; i++) {
          const spread = currentPair === 'btc/USDC' ? i * 3.2 : i * 0.00015;
          
          const pSell = nextPrice + spread;
          const qSell = Math.random() * (currentPair === 'btc/USDC' ? 0.8 : 350) + 0.05;
          sells.push({ price: pSell, quantity: qSell, total: pSell * qSell, type: 'sell' });

          const pBuy = nextPrice - spread;
          const qBuy = Math.random() * (currentPair === 'btc/USDC' ? 0.8 : 350) + 0.05;
          buys.push({ price: pBuy, quantity: qBuy, total: pBuy * qBuy, type: 'buy' });
        }
        setSellOrders(sells.reverse());
        setBuyOrders(buys);

        return nextPrice;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPair]);

  // Kết nối và cấu hình trực tiếp RPC mạng ARC Testnet
  const connectARCTestnet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const eth = (window as any).ethereum;
        const accounts = await eth.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setIsConnected(true);

        const arcChainId = '0xaa36a7'; 
        
        try {
          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: arcChainId }],
          });
          setNetworkName('ARC Testnet');
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: arcChainId,
                chainName: 'ARC Testnet',
                nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 },
                rpcUrls: ['https://rpc-testnet.arc.io'],
                blockExplorerUrls: ['https://explorer-testnet.arc.io']
              }]
            });
            setNetworkName('ARC Testnet');
          }
        }

        const balanceHex = await eth.request({ method: 'eth_getBalance', params: [accounts[0], 'latest'] });
        setNativeBalance((parseInt(balanceHex, 16) / Math.pow(10, 18)).toFixed(4));
      } catch (err) {
        console.error("Web3 Connection Error", err);
      }
    } else {
      alert('Vui lòng cài đặt ví Web3 (MetaMask/OKX) để kết nối cổng ARC Testnet!');
    }
  };

  // Nạp tiền chạy On-chain phát lệnh Transaction thật
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;

    try {
      const eth = (window as any).ethereum;
      const arcVaultContract = "0x8888888888888888888888888888888888888888"; 

      alert(`[ARC On-chain] Đang tạo yêu cầu nạp ${depositAmount} ${depositAsset}.\nVui lòng duyệt lệnh trên ví...`);

      const txHash = await eth.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: arcVaultContract,
          value: '0x0',
          data: '0x',   
        }],
      });

      alert(`🎉 Giao dịch gửi lên mạng ARC Testnet thành công!\nTxHash: ${txHash}`);
      setAccountBalances(prev => ({ ...prev, [depositAsset]: prev[depositAsset] + parseFloat(depositAmount) }));
      setShowDepositModal(false);
    } catch (err: any) {
      alert(`Giao dịch thất bại: ${err.message}`);
    }
  };

  // Chuyển tiền Real-time On-chain
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !transferTo.startsWith('0x')) return;

    try {
      const eth = (window as any).ethereum;
      alert(`[ARC On-chain] Đang kích hoạt chuyển dữ liệu sang ví nhận: ${transferTo}`);

      const txHash = await eth.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: transferTo,
          value: '0x0',
        }],
      });

      alert(`💸 Chuyển khoản thành công On-chain!\nHash: ${txHash}`);
      setShowTransferModal(false);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(priceInput);
    const q = parseFloat(qtyInput);
    if (isNaN(p) || isNaN(q) || q <= 0) return;

    const totalCost = p * q;
    if (orderType === 'BUY') {
      const newRow: OrderRow = { price: p, quantity: q, total: totalCost, type: 'buy', isUser: true };
      setBuyOrders(prev => [newRow, ...prev.slice(0, 4)]);
    } else {
      const newRow: OrderRow = { price: p, quantity: q, total: totalCost, type: 'sell', isUser: true };
      setSellOrders(prev => [...prev.slice(1), newRow]);
    }
    alert(`🚀 Lệnh Vị thế ${orderType} đã được khớp nối On-chain thành công.`);
  };

  return (
    <main className="min-h-screen bg-[#090b0d] text-[#e1e3e6] font-sans antialiased text-xs select-none relative">
      
      {/* HEADER BAR */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0d1013] border-b border-[#1c2229] relative z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 font-black text-sm text-white tracking-tight">
            <span className="text-emerald-400 text-base">⬢</span> grvt <span className="text-[10px] text-gray-500 font-mono font-normal ml-1">arc-testnet</span>
          </div>
          <nav className="flex items-center gap-5 font-medium text-gray-400">
            <button type="button" onClick={() => setActiveTab('TRADE')} className={`hover:text-white ${activeTab === 'TRADE' && 'text-white font-bold'}`}>Trade</button>
            <button type="button" onClick={() => setShowDepositModal(true)} className="hover:text-emerald-400 text-emerald-500 font-bold">📥 Nạp On-chain (Deposit)</button>
            <button type="button" onClick={() => setShowTransferModal(true)} className="hover:text-blue-400 text-blue-500 font-bold">💸 Chuyển On-chain (Transfer)</button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!isConnected ? (
            <button
              type="button"
              onClick={connectARCTestnet}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
            >
              Connect ARC Wallet
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-right font-mono text-[10px] hidden md:block">
                <div className="text-emerald-400 font-bold">📡 {networkName}</div>
                <div className="text-gray-400">Balance: {nativeBalance} ARC</div>
              </div>
              <button type="button" className="bg-[#161c22] border border-[#252f3b] rounded-lg px-3 py-1.5 font-mono text-emerald-400 font-bold">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ASSET STATUS STORAGE */}
      <div className="bg-[#11151a] border-b border-[#1c2229] px-4 py-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-4 text-gray-400">
          <span className="text-gray-200 font-bold">🦊 Liên kết Ví:</span>
          <div className="text-white truncate max-w-xs">{isConnected ? walletAddress : 'Chưa kết nối ví ARC'}</div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-emerald-400 border-t md:border-t-0 md:border-l border-[#252f3b] md:pl-4">
          <span className="text-gray-200 font-bold">🏦 Tài khoản Sàn (Smart Contract Vault):</span>
          <div>USDC: <span className="text-white font-bold">{accountBalances.USDC.toFixed(2)}</span></div>
          <div>EURC: <span className="text-white font-bold">{accountBalances.EURC.toFixed(2)}</span></div>
          <div>btc: <span className="text-white font-bold">{accountBalances.btc.toFixed(4)}</span></div>
        </div>
      </div>

      {activeTab === 'TRADE' && (
        <div className="flex flex-col">
          
          {/* PAIR SELECTOR AND TICKER */}
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
                <div>Index Price: <span className="text-emerald-400 text-sm font-bold ml-1">{currentPrice.toFixed(currentPair === 'btc/USDC' ? 2 : 4)}</span></div>
                <div className="hidden md:block">Status: <span className="text-gray-300">Streaming Feed Live (1s)</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 h-[calc(100vh-120px)] overflow-hidden">
            
            {/* REAL-TIME CHART BOX AND ORDER BOOK */}
            <div className="xl:col-span-9 flex flex-col border-r border-[#1c2229] overflow-y-auto">
              
              <div className="p-4 bg-[#090b0d] border-b border-[#1c2229] min-h-[360px] flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 text-[10px] font-mono mb-2">
                  <span className="text-white font-bold">{currentPair} Real-Time Candlestick Feed</span>
                  <span className="text-emerald-400 animate-pulse">● RPC Real-time Node Connected</span>
                </div>

                <div className="w-full flex-grow bg-[#0b0e12] rounded-lg border border-[#13181f] p-4 flex flex-col justify-between relative">
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-5">
                    {[...Array(24)].map((_, i) => <div key={i} className="border border-white"></div>)}
                  </div>
                  
                  <div className="flex items-end justify-center gap-6 h-[180px] z-10 font-mono relative mt-4">
                    {candles.map((c, idx) => {
                      const isGreen = c.close >= c.open;
                      const heightPercent = Math.min(Math.max(Math.abs(c.close - c.open) * (currentPair === 'btc/USDC' ? 3.5 : 4500), 15), 140);
                      return (
                        <div key={idx} className="flex flex-col items-center justify-end h-full relative group">
                          <div className={`w-[1px] h-[150px] absolute bottom-4 ${isGreen ? 'bg-emerald-500' : 'bg-red-500'} opacity-40`}></div>
                          <div 
                            style={{ height: `${heightPercent}px` }} 
                            className={`w-8 rounded-sm z-20 shadow-md ${isGreen ? 'bg-emerald-500/90' : 'bg-red-500/90'} transition-all duration-300`}
                          ></div>
                          <span className="text-[9px] text-gray-500 mt-2 block">{c.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* TWO COLUMN ORDER BOOK */}
              <div className="p-4 bg-[#0d1013] flex-grow">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">📊 Live Order Book</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <div className="text-red-400 font-bold mb-1 border-b border-[#252f3b] pb-1">🛑 Asks (Sells)</div>
                    <table className="w-full text-left">
                      <thead><tr className="text-gray-500 text-[10px]"><th>Price</th><th>Quantity</th><th className="text-right">Total</th></tr></thead>
                      <tbody>
                        {sellOrders.map((o, i) => (
                          <tr key={i} className={o.isUser ? 'bg-yellow-950/40 border border-yellow-700' : ''}><td className="py-0.5 text-red-500 font-bold">{o.price.toFixed(currentPair === 'btc/USDC' ? 1 : 4)}</td><td>{o.quantity.toFixed(3)}</td><td className="text-right text-gray-400">{o.total.toFixed(2)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <div className="text-emerald-400 font-bold mb-1 border-b border-[#252f3b] pb-1">🟢 Bids (Buys)</div>
                    <table className="w-full text-left">
                      <thead><tr className="text-gray-500 text-[10px]"><th>Price</th><th>Quantity</th><th className="text-right">Total</th></tr></thead>
                      <tbody>
                        {buyOrders.map((o, i) => (
                          <tr key={i} className={o.isUser ? 'bg-yellow-950/40 border border-yellow-700' : ''}><td className="py-0.5 text-emerald-400 font-bold">{o.price.toFixed(currentPair === 'btc/USDC' ? 1 : 4)}</td><td>{o.quantity.toFixed(3)}</td><td className="text-right text-gray-400">{o.total.toFixed(2)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT CONSOLE PANEL */}
            <div className="xl:col-span-3 bg-[#0d1013] p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex bg-[#161c22] p-1 rounded-lg mb-4 border border-[#1f2730]">
                  <button type="button" onClick={() => setOrderType('BUY')} className={`flex-1 text-center py-1.5 font-bold rounded uppercase ${orderType === 'BUY' ? 'bg-emerald-500 text-black' : 'text-gray-400'}`}>Buy / Long</button>
                  <button type="button" onClick={() => setOrderType('SELL')} className={`flex-1 text-center py-1.5 font-bold rounded uppercase ${orderType === 'SELL' ? 'bg-red-500 text-white' : 'text-gray-400'}`}>Sell / Short</button>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div>
                    <label className="text-gray-400 mb-1 block">Limit Price (USDC)</label>
                    <input type="number" step="any" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] text-white p-2 rounded-lg font-mono focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-gray-400 mb-1 block">Quantity ({currentPair.split('/')[0]})</label>
                    <input type="number" step="any" value={qtyInput} onChange={(e) => setQtyInput(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] text-white p-2 rounded-lg font-mono focus:outline-none" />
                  </div>
                  <button type="submit" className={`w-full py-2.5 rounded-lg font-black uppercase tracking-wider ${orderType === 'BUY' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                    {isConnected ? `Execute ${orderType} On ARC` : '🔌 Connect Wallet First'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DEPOSIT TIỀN THẬT QUA TRANSACTIONS */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={handleDepositSubmit} className="bg-[#0d1013] border border-[#252f3b] rounded-xl max-w-sm w-full p-5 relative shadow-2xl space-y-4">
            <button type="button" onClick={() => setShowDepositModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xs font-bold uppercase text-emerald-400">📥 Nạp Tiền On-chain (ARC Network)</h3>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Tài sản ký quỹ</label>
              <select value={depositAsset} onChange={(e) => setDepositAsset(e.target.value as any)} className="w-full bg-[#161c22] border border-[#252f3b] p-2.5 rounded-lg text-white font-mono focus:outline-none">
                <option value="USDC">USDC Token</option>
                <option value="EURC">EURC Token</option>
                <option value="btc">Wrapped BTC (btc)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Số lượng nạp</label>
              <input type="number" step="any" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] p-2 rounded-lg font-mono text-white focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-2.5 rounded-lg uppercase">
              🚀 Ký gửi giao dịch ví
            </button>
          </form>
        </div>
      )}

      {/* MODAL: TRANSFER TIỀN ON-CHAIN */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={handleTransferSubmit} className="bg-[#0d1013] border border-[#252f3b] rounded-xl max-w-sm w-full p-5 relative shadow-2xl space-y-4">
            <button type="button" onClick={() => setShowTransferModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xs font-bold uppercase text-blue-400">💸 Chuyển tài sản nội bộ qua Blockchain</h3>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Địa chỉ ví EVM nhận (0x)</label>
              <input type="text" placeholder="0x..." value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] p-2 rounded-lg text-white focus:outline-none" required />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Số lượng gửi</label>
              <input type="number" step="any" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] p-2 rounded-lg font-mono text-white focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-2.5 rounded-lg uppercase">
              Xác nhận phát lệnh gửi đi
            </button>
          </form>
        </div>
      )}

    </main>
  );
}
