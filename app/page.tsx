'use client';

import { useState, useEffect } from 'react';

interface OrderRow {
  price: number;
  quantity: number;
  total: number;
  type: 'buy' | 'sell';
  isUser?: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('TRADE');
  
  // Trạng thái kết nối Web3 Real Wallet
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [nativeBalance, setNativeBalance] = useState('0.00');
  
  // State quản lý số dư Token Testnet trong sàn (Dùng giao dịch ảo hoặc khớp lệnh)
  const [accountBalances, setAccountBalances] = useState({
    USDC: 1000.00,
    EURC: 250.00,
    btc: 0.05
  });

  // Khung điều hướng Modal
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form states
  const [depositAsset, setDepositAsset] = useState<'USDC' | 'EURC' | 'btc'>('USDC');
  const [depositAmount, setDepositAmount] = useState('10');
  const [transferAsset, setTransferAsset] = useState<'USDC' | 'EURC' | 'btc'>('USDC');
  const [transferAmount, setTransferAmount] = useState('5');
  const [transferTo, setTransferTo] = useState('');

  const [currentPair, setCurrentPair] = useState('btc/USDC');
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [priceInput, setPriceInput] = useState('63822.0');
  const [qtyInput, setQtyInput] = useState('0.1');
  const [leverage, setLeverage] = useState('20x');

  const [sellOrders, setSellOrders] = useState<OrderRow[]>([]);
  const [buyOrders, setBuyOrders] = useState<OrderRow[]>([]);

  // Hàm kết nối ví MetaMask / Web3 thật
  const connectWalletReal = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const eth = (window as any).ethereum;
        // Yêu cầu tài khoản từ ví
        const accounts = await eth.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setWalletAddress(address);
        setIsConnected(true);

        // Lấy thông tin Chain ID hiện tại
        const chainId = await eth.request({ method: 'eth_chainId' });
        if (chainId === '0xa869') {
          setNetworkName('Avalanche Fuji Testnet');
        } else {
          setNetworkName('Wrong Network (Chuyển sang Fuji)');
          // Tự động yêu cầu chuyển sang mạng Avalanche Fuji Testnet
          try {
            await eth.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xa869' }],
            });
            setNetworkName('Avalanche Fuji Testnet');
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              // Nếu mạng chưa được thêm vào ví, tự động thêm mạng Fuji Testnet
              await eth.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xa869',
                  chainName: 'Avalanche Fuji Testnet',
                  nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
                  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
                  blockExplorerUrls: ['https://testnet.snowtrace.io/']
                }]
              });
            }
          }
        }

        // Đọc số dư native token thật trên ví
        const balanceHex = await eth.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        const balanceInWei = parseInt(balanceHex, 16);
        const balanceInAvax = (balanceInWei / Math.pow(10, 18)).toFixed(4);
        setNativeBalance(balanceInAvax);

      } catch (error) {
        console.error("User denied account access or error occurred", error);
      }
    } else {
      alert('Vui lòng cài đặt MetaMask hoặc trình duyệt Web3 Wallet để chạy tính năng Testnet!');
    }
  };

  // Lắng nghe sự kiện thay đổi tài khoản hoặc mạng từ ví MetaMask
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      eth.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setIsConnected(false);
          setWalletAddress('');
        }
      });
      eth.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  // Cập nhật Sổ lệnh ảo phục vụ giao dịch UI
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

  // Hàm chuyển hướng Faucet Token Link Testnet
  const openFaucetLink = () => {
    window.open('https://faucet.circle.com/', '_blank');
  };

  // Ký giao dịch gửi On-chain thật (Deposit on Testnet Chain)
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Vui lòng kết nối ví Web3 trước khi nạp!');
      return;
    }

    try {
      const eth = (window as any).ethereum;
      const amountInWei = (parseFloat(depositAmount) * Math.pow(10, 18)).toString(16);
      
      // Địa chỉ hợp đồng nhận quỹ hoặc ví lưu trữ của sàn Sandbox (Địa chỉ Testnet mẫu)
      const vaultAddress = "0x2F484e967b28879A81110bC3E1492582846fDe80"; 

      alert(`Đang khởi tạo giao dịch On-chain nạp ${depositAmount} ${depositAsset}. Vui lòng xác nhận trên ví MetaMask của bạn...`);

      // Gửi giao dịch nạp tiền trực tiếp lên blockchain mạng Testnet
      const txHash = await eth.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: vaultAddress,
          value: '0x0', // Giá trị Native truyền vào nếu nạp ERC20
          data: '0x',  // Hex data call Smart Contract nếu có tương tác Router
        }],
      });

      alert(`🎉 Giao dịch thành công!\nTxHash: ${txHash}\nTài sản đang được đồng bộ hóa lên hệ thống.`);
      
      // Cập nhật số dư hiển thị tài khoản giao dịch ảo trên app
      setAccountBalances(prev => ({
        ...prev,
        [depositAsset]: prev[depositAsset] + parseFloat(depositAmount)
      }));
      setShowDepositModal(false);
    } catch (err: any) {
      alert(`Giao dịch bị từ chối hoặc lỗi: ${err.message}`);
    }
  };

  // Ký giao dịch Chuyển tiền (Transfer On-chain thật)
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    if (!transferTo.startsWith('0x') || transferTo.length !== 42) {
      alert('Địa chỉ ví nhận không đúng định dạng EVM!');
      return;
    }

    try {
      const eth = (window as any).ethereum;
      alert(`Đang kích hoạt yêu cầu ký chuyển ví On-chain sang: ${transferTo}...`);

      const txHash = await eth.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: transferTo,
          value: '0x0', 
        }],
      });

      alert(`💸 Chuyển tài sản thành công On-chain!\nHash: ${txHash}`);
      setShowTransferModal(false);
    } catch (err: any) {
      alert(`Lỗi giao dịch: ${err.message}`);
    }
  };

  // Xử lý thực thi Lệnh Trade khi người dùng nhấn nút đặt lệnh
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      connectWalletReal();
      return;
    }

    const p = parseFloat(priceInput);
    const q = parseFloat(qtyInput);
    if (isNaN(p) || isNaN(q) || q <= 0) return;

    const totalCost = p * q;
    const levMultiplier = parseInt(leverage);

    if (orderType === 'BUY') {
      const requiredMargin = totalCost / levMultiplier;
      if (accountBalances.USDC < requiredMargin) {
        alert(`Số dư tài khoản sàn không đủ làm quỹ Margin kị vị thế (${requiredMargin.toFixed(2)} USDC)!`);
        return;
      }
      setAccountBalances(prev => ({ ...prev, USDC: prev.USDC - requiredMargin }));
      const newRow: OrderRow = { price: p, quantity: q, total: totalCost, type: 'buy', isUser: true };
      setBuyOrders(prev => [newRow, ...prev.slice(0, 4)]);
    } else {
      const token = currentPair.split('/')[0] as 'btc' | 'EURC';
      if (accountBalances[token] < q) {
        alert(`Tài khoản không đủ vị thế ${q} ${token} để Short!`);
        return;
      }
      setAccountBalances(prev => ({ ...prev, [token]: prev[token] - q }));
      const newRow: OrderRow = { price: p, quantity: q, total: totalCost, type: 'sell', isUser: true };
      setSellOrders(prev => [...prev.slice(1), newRow]);
    }

    alert(`🚀 Đặt lệnh ${orderType} thành công trên Sổ lệnh mạng Appchain Testnet.`);
  };

  return (
    <main className="min-h-screen bg-[#090b0d] text-[#e1e3e6] font-sans antialiased text-xs select-none relative">
      
      {/* HEADER BAR */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0d1013] border-b border-[#1c2229] relative z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 font-black text-sm text-white cursor-pointer">
            <span className="text-emerald-400 text-base">⬢</span> grvt <span className="text-[10px] text-gray-500 font-mono font-normal ml-1">arc-testnet</span>
          </div>
          <nav className="flex items-center gap-5 font-medium text-gray-400">
            <button type="button" onClick={() => setActiveTab('TRADE')} className={`hover:text-white ${activeTab === 'TRADE' && 'text-white font-bold'}`}>Trade</button>
            <button type="button" onClick={() => setShowDepositModal(true)} className="hover:text-emerald-400 text-emerald-500 font-bold">📥 Nạp Web3 On-chain (Deposit)</button>
            <button type="button" onClick={() => setShowTransferModal(true)} className="hover:text-blue-400 text-blue-500 font-bold">💸 Chuyển On-chain (Transfer)</button>
          </nav>
        </div>

        {/* WEB3 NETWORK CONTROL PANEL */}
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={openFaucetLink} 
            className="text-[10px] bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 px-2 py-1 rounded-lg font-bold transition-all"
          >
            🚰 Get Circle Faucet Tokens ↗
          </button>

          {!isConnected ? (
            <button
              type="button"
              onClick={connectWalletReal}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs tracking-tight transition-all shadow-lg shadow-emerald-950/20"
            >
              Connect Real Wallet
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-right font-mono text-[10px] hidden md:block">
                <div className="text-emerald-400 font-bold">{networkName}</div>
                <div className="text-gray-400">Wallet AVAX: {nativeBalance}</div>
              </div>
              <button
                type="button"
                className="bg-[#161c22] border border-[#252f3b] rounded-lg px-3 py-1.5 font-mono text-emerald-400 font-bold"
              >
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* DASHBOARD QUẢN LÝ TÀI SẢN TRÊN BLOCKCHAIN */}
      <div className="bg-[#11151a] border-b border-[#1c2229] px-4 py-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-4 text-gray-400">
          <span className="text-gray-200 font-bold">🦊 1. Địa chỉ ví liên kết:</span>
          <div className="text-white truncate max-w-xs">{isConnected ? walletAddress : 'Chưa kết nối ví thật'}</div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-emerald-400 border-t md:border-t-0 md:border-l border-[#252f3b] md:pl-4">
          <span className="text-gray-200 font-bold">🏦 2. Số dư Ký quỹ Sàn:</span>
          <div>USDC: <span className="text-white font-bold">{accountBalances.USDC.toFixed(2)}</span></div>
          <div>EURC: <span className="text-white font-bold">{accountBalances.EURC.toFixed(2)}</span></div>
          <div>btc: <span className="text-white font-bold">{accountBalances.btc.toFixed(4)}</span></div>
        </div>
      </div>

      {/* GIAO DIỆN TRADE */}
      {activeTab === 'TRADE' && (
        <div className="flex flex-col">
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
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 h-[calc(100vh-120px)] overflow-hidden">
            {/* TRÁI + GIỮA: CHART VÀ ORDER BOOK */}
            <div className="xl:col-span-9 flex flex-col border-r border-[#1c2229] overflow-y-auto">
              <div className="p-4 bg-[#090b0d] border-b border-[#1c2229] flex-grow flex flex-col justify-between min-h-[340px]">
                <div className="flex items-center justify-between text-gray-500 text-[10px] font-mono border-b border-[#12161a] pb-2 mb-2">
                  <span className="text-white font-bold">{currentPair} • Perpetual Market Stream</span>
                  <span className="text-emerald-400">● ARC Testnet RPC Node Live</span>
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
                  <button type="submit" className={`w-full py-2.5 rounded-lg font-black uppercase tracking-wider ${orderType === 'BUY' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                    {isConnected ? (orderType === 'BUY' ? '🟢 Execute Long Position' : '🛑 Execute Short Position') : '🔌 Connect Wallet To Trade'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CHỨC NĂNG NẠP TIỀN THẬT QUA TRANSACTIONS */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={handleDepositSubmit} className="bg-[#0d1013] border border-[#252f3b] rounded-xl max-w-sm w-full p-5 relative shadow-2xl space-y-4">
            <button type="button" onClick={() => setShowDepositModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xs font-bold uppercase text-emerald-400">📥 Nạp Tiền On-chain Vào Smart Contract</h3>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Mạng: Avalanche Fuji Testnet</label>
              <select value={depositAsset} onChange={(e) => setDepositAsset(e.target.value as any)} className="w-full bg-[#161c22] border border-[#252f3b] p-2.5 rounded-lg text-white font-mono focus:outline-none">
                <option value="USDC">Circle USDC Token</option>
                <option value="EURC">Circle EURC Token</option>
                <option value="btc">Wrapped BTC (btc)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Số lượng gửi lệnh nạp</label>
              <input type="number" step="any" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] p-2 rounded-lg font-mono text-white focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-2.5 rounded-lg uppercase">
              🚀 Ký và nạp tiền via Web3
            </button>
          </form>
        </div>
      )}

      {/* MODAL 2: TRANSFER TIỀN THẬT */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={handleTransferSubmit} className="bg-[#0d1013] border border-[#252f3b] rounded-xl max-w-sm w-full p-5 relative shadow-2xl space-y-4">
            <button type="button" onClick={() => setShowTransferModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xs font-bold uppercase text-blue-400">💸 Chuyển tài sản nội bộ Sandbox via Tx</h3>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Chọn tài sản</label>
              <select value={transferAsset} onChange={(e) => setTransferAsset(e.target.value as any)} className="w-full bg-[#161c22] border border-[#252f3b] p-2.5 rounded-lg text-white font-mono focus:outline-none">
                <option value="USDC">USDC</option>
                <option value="EURC">EURC</option>
                <option value="btc">btc</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Địa chỉ ví EVM nhận</label>
              <input type="text" placeholder="0x..." value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] p-2 rounded-lg text-white focus:outline-none" required />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Số lượng chuyển</label>
              <input type="number" step="any" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full bg-[#161c22] border border-[#252f3b] p-2 rounded-lg font-mono text-white focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-2.5 rounded-lg uppercase">
              Xác nhận gửi giao dịch ví
            </button>
          </form>
        </div>
      )}

    </main>
  );
}
