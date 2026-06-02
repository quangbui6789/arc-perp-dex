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
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const clearingHouseAddress = "0xYourContractAddressHere"; 
      const abi = ["function depositCollateral(address token, uint256 amount) external"];
      
      const contract = new ethers.Contract(clearingHouseAddress, abi, signer);
      const tokenAddress = tokenType === "USDC" ? "0xUSDCTestnetAddress" : "0xcirBTCTestnetAddress";
      const parsedAmount = ethers.parseUnits(amount, 18);

      const tx = await contract.depositCollateral(tokenAddress, parsedAmount);
      await tx.wait();
      alert("Nạp ký quỹ thành công!");
    } catch (error) {
      console.error("Lỗi nạp tiền:", error);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-400">Arc Perp DEX (GRVT Clone)</h1>
        
        {!walletAddress ? (
          <button onClick={connectWallet} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold transition">
            Kết nối ví Arc Testnet
          </button>
        ) : (
          <div className="text-sm bg-gray-700 p-2 rounded mb-4 text-center truncate">
            Ví: {walletAddress}
          </div>
        )}

        <hr className="my-6 border-gray-700" />

        <h2 className="text-lg font-medium mb-3">Nạp tài sản ký quỹ (Margin)</h2>
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1">Chọn loại Token Faucet</label>
          <select value={tokenType} onChange={(e) => setTokenType(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
            <option value="USDC">Circle USDC</option>
            <option value="cirBTC">Circle wrapped BTC (cirBTC)</option>
            <option value="EURC">Circle EURC</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-400 mb-1">Số lượng</label>
          <input type="number" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
        </div>

        <button onClick={handleDeposit} className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold transition">
          Xác nhận nạp vào Sàn Perp
        </button>
      </div>
    </main>
  );
}
