'use client';

import { useState, useEffect } from 'react';
import { createWalletClient, createPublicClient, custom, http, parseUnits, formatUnits } from 'viem';

const arcTestnet = {
  id: 5042002,
  name: 'ARC Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    public: { http: ['https://5042002.rpc.thirdweb.com'] },
    default: { http: ['https://5042002.rpc.thirdweb.com'] },
  },
  blockExplorers: {
    default: { name: 'Arcscan', url: 'https://arcscan.io' },
  },
};

interface Position {
  pair: string;
  type: 'LONG' | 'SHORT';
  size: string;
  entryPrice: string;
  markPrice: string;
  pnl: number;
  txHash: string;
}

interface OrderBookRow {
  price: number;
  size: number;
  total: number;
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [txLoading, setTxLoading] = useState(false);
  const [latestTxHash, setLatestTxHash] = useState('');

  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [marginType, setMarginType] = useState<'Cross' | 'Isolated'>('Isolated');
  const [leverage] = useState(40);
  const [priceInput, setPriceInput] = useState('63822.7');
  const [qtyInput, setQtyInput] = useState('0.1');
  const [marketPrice, setMarketPrice] = useState(63822.7);
  const [priceChange] = useState(-5.03);

  const [positions, setPositions] = useState<Position[]>([]);
  const [asks, setAsks] = useState<OrderBookRow[]>([]);
  const [bids, setBids] = useState<OrderBookRow[]>([]);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const ethereum = (window as any).ethereum;
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${arcTestnet.id.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${arcTestnet.id.toString(16)}`,
                chainName: arcTestnet.name,
                nativeCurrency: arcTestnet.nativeCurrency,
                rpcUrls: arcTestnet.rpcUrls.default.http,
                blockExplorerUrls: [arcTestnet.blockExplorers.default.url]
              }],
            });
          }
        }
        const walletClient = createWalletClient({ chain: arcTestnet, transport: custom(ethereum) });
        const [account] = await walletClient.requestAddresses();
        setWalletAddress(account);
        setIsConnected(true);
        getOnChainBalance(account);
      } catch (err) {
        console.error("Connect error", err);
      }
    } else {
      alert('Vui lòng cài đặt MetaMask / OKX Wallet!');
    }
  };

  const getOnChainBalance = async (address: string) => {
    try {
      const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
      const balanceWei = await publicClient.getBalance({ address: address as `0x${string}` });
      setUsdcBalance(parseFloat(formatUnits(balanceWei, 6)).toFixed(2));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return connectWallet();

    setTxLoading(true);
    try {
      const ethereum = (window as any).ethereum;
      const walletClient = createWalletClient({ chain: arcTestnet, transport: custom(ethereum) });

      const txHash = await walletClient.sendTransaction({
        account: walletAddress as `0x${string}`,
        to: '0x0000000000000000000000000000000000000000',
        value: parseUnits('0', 6), 
      });

      setLatestTxHash(txHash);

      const newPosition: Position = {
        pair: 'BTCUSD Perp',
        type: orderType === 'BUY' ? 'LONG' : 'SHORT',
        size: `${qtyInput} BTC`,
        entryPrice: parseFloat(priceInput).toFixed(1),
        markPrice: marketPrice.toFixed(1),
        pnl: orderType === 'BUY' ? 12.50 : -8.40,
        txHash: txHash
      };

      setPositions(prev => [newPosition, ...prev]);
      setTimeout(() => getOnChainBalance(walletAddress), 3500);
    } catch (error: any) {
      alert(`Giao dịch thất bại: ${error.message}`);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketPrice(prev => {
        const change = (Math.random() - 0.5) * 6;
        const nextPrice = prev + change;

        const generatedAsks: OrderBookRow[] = [];
        const generatedBids: OrderBookRow[] = [];
        for (let i = 1; i <= 8; i++) {
          generatedAsks.push({ price: nextPrice + (i * 1.5), size: Math.random() * 2, total: Math.random() * 25 });
          generatedBids.push({ price: nextPrice - (i * 1.5), size: Math.random() * 2, total: Math.random() * 25 });
        }
        setAsks(generatedAsks.reverse());
        setBids(generatedBids);

        return nextPrice;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#090b0d] text-[#e1e3e6] font-sans text-xs antialiased flex flex-col">
      
      {/* GLOBAL TOP NAVIGATION */}
      <header className="h-12 bg-[#0c0e12] border-b border-[#161a22] flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-black text-white text-sm tracking-wider">
            <span className="text-emerald-400 text-lg">⚙️</span> GRVT <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">ARC TESTNET</span>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-gray-400 font-medium">
            <span className="text-white border-b-2 border-emerald-500 py-3.5 px-1 cursor-pointer">Trade</span>
            <span className="hover:text-white cursor-pointer">Invest</span>
            <span className="hover:text-white cursor-pointer">Portfolio</span>
            <span className="hover:text-white cursor-pointer">Rewards</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href="https://faucet.circle.com/" 
            target="_blank" 
            rel="noreferrer" 
            className="bg-[#12161f] border border-[#263143] text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold px-3 py-1.5 rounded transition-all"
          >
            🚰 Circle Faucet
          </a>

          {!isConnected ? (
            <button onClick={connectWallet} className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-3 py-1.5 rounded">
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-[#11151d] border border-[#1b2331] px-3 py-1.5 rounded font-mono">
              <span className="text-gray-400">Balance: <strong className="text-white">{usdcBalance} USDC</strong></span>
              <span className="text-emerald-400 font-bold">| {walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span>
            </div>
          )}
        </div>
      </header>

      {/* ARCSCAN TRANSACTION NOTIFICATION */}
      {latestTxHash && (
        <div className="bg-emerald-950/50 border-b border-emerald-800 text-emerald-400 px-4 py-2 font-mono flex justify-between items-center text-[11px]">
          <span>⚡ Giao dịch vị thế đã được đóng gói và gửi lên mạng ARC Stablechain thành công!</span>
          <a href={`${arcTestnet.blockExplorers.default.url}/tx/${latestTxHash}`} target="_blank" rel="noreferrer" className="underline font-black hover:text-white">
            Xem trạng thái trên Arcscan Explorer ↗
          </a>
        </div>
      )}

      {/* TICKER STATS BAR */}
      <div className="bg-[#0c0e12] border-b border-[#161a22] px-4 py-2 flex flex-wrap items-center gap-6 font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-xs">BTCUSDT</span>
          <span className="text-gray-500">Perpetual</span>
        </div>
        <div className="text-emerald-400 font-bold text-xs">${marketPrice.toFixed(1)}</div>
        <div>
          <span className="text-gray-500">24h Change:</span>{' '}
          <span className={priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}>{priceChange}%</span>
        </div>
        <div><span className="text-gray-500">Mark Price:</span> <span className="text-white">${marketPrice.toFixed(1)}</span></div>
        <div className="hidden lg:block"><span className="text-gray-500">Open Interest:</span> <span className="text-white">171,753,926.6</span></div>
        <div className="hidden lg:block"><span className="text-gray-500">Funding / Countdown:</span> <span className="text-emerald-400">+0.0100% / 02:43:08</span></div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="flex-grow grid grid-cols-1 xl:grid-cols-12 overflow-hidden">
        
        <div className="xl:col-span-9 flex flex-col overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#161a22]">
            {/* TRADING CHART SIMULATION */}
            <div className="lg:col-span-8 p-4 bg-[#090b0d] flex flex-col justify-between min-h-[400px]">
              <div className="flex items-center justify-between text-gray-500 text-[10px] font-mono">
                <span>CHART: BTC/USDT - 1D - GRVT FEED</span>
                <span className="text-emerald-500">● Live Streaming</span>
              </div>
              
              <div className="w-full h-72 bg-[#0b0e12] rounded border border-[#161a22] relative flex items-end justify-center p-4 gap-4 mt-2">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#141923_1px,transparent_1px),linear-gradient(to_bottom,#141923_1px,transparent_1px)] bg-[size:30px_30px] opacity-20"></div>
                <div className="w-10 h-44 bg-red-500/80 rounded-sm relative flex items-center justify-center"><span className="absolute -top-5 text-red-400 font-mono text-[9px]">$64.1K</span></div>
                <div className="w-10 h-32 bg-red-500/80 rounded-sm"></div>
                <div className="w-10 h-24 bg-emerald-500/80 rounded-sm"></div>
                <div className="w-10 h-40 bg-emerald-500/80 rounded-sm"></div>
                <div className="w-10 h-48 bg-red-500/80 rounded-sm"></div>
                <div className="w-10 h-56 bg-emerald-500/80 rounded-sm relative flex items-center justify-center"><span className="absolute -top-5 text-emerald-400 font-mono text-[9px]">${marketPrice.toFixed(0)}</span></div>
              </div>
            </div>

            {/* ORDERBOOK */}
            <div className="lg:col-span-4 p-4 bg-[#0c0e12] border-t lg:border-t-0 lg:border-l border-[#161a22] font-mono text-[11px]">
              <div className="text-gray-400 font-bold mb-3">Order Book</div>
              
              <div className="space-y-0.5 text-red-500">
                {asks.slice(0, 5).map((row, i) => (
                  <div key={i} className="flex justify-between hover:bg-red-950/20 px-1 py-0.5">
                    <span>{row.price.toFixed(1)}</span>
                    <span className="text-gray-400">{row.size.toFixed(3)}</span>
                    <span className="text-gray-500">{row.total.toFixed(3)}</span>
                  </div>
                ))}
              </div>

              <div className="py-2 my-2 border-y border-[#161a22] text-center text-white font-bold bg-[#11151d]">
                Spread 0.1 (0.00015%)
              </div>

              <div className="space-y-0.5 text-emerald-500">
                {bids.slice(0, 5).map((row, i) => (
                  <div key={i} className="flex justify-between hover:bg-emerald-950/20 px-1 py-0.5">
                    <span>{row.price.toFixed(1)}</span>
                    <span className="text-gray-400">{row.size.toFixed(3)}</span>
                    <span className="text-gray-500">{row.total.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* POSITIONS PANEL */}
          <div className="p-4 bg-[#090b0d] flex-grow min-h-[200px]">
            <div className="flex items-center gap-4 border-b border-[#161a22] pb-2 mb-3 text-gray-400 font-bold">
              <span className="text-white border-b-2 border-emerald-500 pb-2 px-1">Positions ({positions.length})</span>
              <span className="hover:text-white cursor-pointer pb-2">Open Orders</span>
              <span className="hover:text-white cursor-pointer pb-2">Order History</span>
            </div>

            {positions.length === 0 ? (
              <div className="text-center py-8 text-gray-600 font-mono">Chưa tìm thấy vị thế On-chain nào. Hãy mở một lệnh Long/Short bên phải!</div>
            ) : (
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="text-gray-500 border-b border-[#161a22]">
                    <th className="pb-2">Cặp tài sản</th>
                    <th className="pb-2">Loại lệnh</th>
                    <th className="pb-2">Kích thước</th>
                    <th className="pb-2">Giá vào (Entry)</th>
                    <th className="pb-2">Giá thị trường</th>
                    <th className="pb-2">PnL ước tính</th>
                    <th className="pb-2 text-right">Arcscan Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p, idx) => (
                    <tr key={idx} className="border-b border-[#11151d] hover:bg-[#0f131a]">
                      <td className="py-2.5 font-bold text-white">{p.pair}</td>
                      <td className={p.type === 'LONG' ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>{p.type}</td>
                      <td>{p.size}</td>
                      <td>${p.entryPrice}</td>
                      <td>${p.markPrice}</td>
                      <td className={p.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                        {p.pnl >= 0 ? `+$${p.pnl.toFixed(2)}` : `-$${Math.abs(p.pnl).toFixed(2)}`}
                      </td>
                      <td className="text-right">
                        <a 
                          href={`${arcTestnet.blockExplorers.default.url}/tx/${p.txHash}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px] hover:bg-emerald-400 hover:text-black transition-all"
                        >
                          Verify ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* PHẢI: CONSOLE ĐIỀU KHIỂN CHUẨN GRVT */}
        <div className="xl:col-span-3 bg-[#0c0e12] border-t xl:border-t-0 border-l border-[#161a22] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 font-mono">
              <div className="flex gap-1 bg-[#12161f] p-0.5 rounded border border-[#1b2331]">
                <button type="button" onClick={() => setMarginType('Cross')} className={`px-2 py-1 rounded text-[10px] ${marginType === 'Cross' ? 'bg-[#1b2331] text-white font-bold' : 'text-gray-500'}`}>Cross</button>
                <button type="button" onClick={() => setMarginType('Isolated')} className={`px-2 py-1 rounded text-[10px] ${marginType === 'Isolated' ? 'bg-[#1b2331] text-white font-bold' : 'text-gray-500'}`}>Isolated</button>
              </div>
              <div className="text-gray-400 text-[10px]">Đòn bẩy: <span className="text-emerald-400 font-bold">{leverage}x</span></div>
            </div>

            <div className="flex bg-[#12161f] p-1 rounded border border-[#1b2331] mb-4">
              <button type="button" onClick={() => setOrderType('BUY')} className={`flex-1 text-center py-2 font-bold rounded uppercase ${orderType === 'BUY' ? 'bg-emerald-500 text-black' : 'text-gray-400'}`}>Buy / Long</button>
              <button type="button" onClick={() => setOrderType('SELL')} className={`flex-1 text-center py-2 font-bold rounded uppercase ${orderType === 'SELL' ? 'bg-red-500 text-white' : 'text-gray-400'}`}>Sell / Short</button>
            </div>

            <form onSubmit={handleExecuteOrder} className="space-y-4 font-mono">
              <div>
                <div className="flex justify-between text-gray-500 mb-1">
                  <label>Giá giới hạn (Limit)</label>
                  <span>USDC</span>
                </div>
                <input type="number" step="any" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-full bg-[#12161f] border border-[#1f2633] rounded p-2.5 text-white focus:outline-none focus:border-emerald-500" />
              </div>

              <div>
                <div className="flex justify-between text-gray-500 mb-1">
                  <label>Số lượng đặt</label>
                  <span>BTC</span>
                </div>
                <input type="number" step="any" value={qtyInput} onChange={(e) => setQtyInput(e.target.value)} className="w-full bg-[#12161f] border border-[#1f2633] rounded p-2.5 text-white focus:outline-none focus:border-emerald-500" />
              </div>

              <div className="pt-2">
                <input type="range" min="0" max="100" defaultValue="25" className="w-full accent-emerald-500 cursor-pointer" />
                <div className="flex justify-between text-[10px] text-gray-600 mt-1"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
              </div>

              <button 
                type="submit"
                disabled={txLoading}
                className={`w-full py-3 rounded font-black uppercase text-xs tracking-wider transition-all duration-200 mt-4 ${txLoading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : orderType === 'BUY' ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-red-500 text-white hover:bg-red-400'}`}
              >
                {txLoading ? '⏳ ĐANG KÝ ON-CHAIN MẠNG ARC...' : isConnected ? `Đặt lệnh ${orderType} Real-Time` : '🔌 CONNECT WALLET'}
              </button>
            </form>
          </div>

          <div className="border-t border-[#161a22] pt-3 text-[10px] text-gray-500 font-mono space-y-1">
            <div className="flex justify-between"><span>Trạng thái Node:</span><span className="text-emerald-500">Hoạt động (100%)</span></div>
            <div className="flex justify-between"><span>Độ trễ (Latency):</span><span className="text-white">12ms</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}
