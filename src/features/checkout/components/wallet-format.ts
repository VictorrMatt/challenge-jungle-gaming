import type { NetworkId, WalletType } from '@/shared/contracts'

export const NETWORK_OPTIONS: Array<{ value: NetworkId; label: string }> = [
  { value: 'ethereum', label: 'Ethereum Mainnet' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
]

export const WALLET_TYPE_LABEL: Record<WalletType, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
