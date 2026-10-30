import type { WalletInput } from '@/shared/contracts'

/** Blank wallet form values (selects start on their placeholder). */
export const EMPTY_WALLET: WalletInput = {
  displayName: '',
  nickname: '',
  network: '' as WalletInput['network'],
  profileName: '',
  address: '',
  secondaryAddress: '',
  type: '' as WalletInput['type'],
  referralCode: '',
  email: '',
  ensName: '',
}
