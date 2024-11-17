import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWalletStore = defineStore('wallet', () => {
  // MISATO 的固定钱包地址
  const misatoWalletAddress = ref('0x900709432a8F2C7E65f90aA7CD35D0afe4eB7169')
  // 用户连接的钱包地址
  const userWalletAddress = ref('')
  const isConnected = ref(false)
  const userUuid = ref('')
  const walletInfo = ref<{
    name: string;
    icon: string;
  } | null>(null)

  // Actions
  const setUserWalletAddress = (address: string) => {
    userWalletAddress.value = address
  }

  const setConnected = (status: boolean) => {
    isConnected.value = status
  }

  const disconnectWallet = () => {
    userWalletAddress.value = ''
    isConnected.value = false
    walletInfo.value = null
  }

  const getOrCreateUuid = () => {
    const UUID_STORAGE_KEY = 'misato_user_uuid'
    const storedUuid = localStorage.getItem(UUID_STORAGE_KEY)
    
    if (storedUuid) {
      userUuid.value = storedUuid
      return storedUuid
    }
    
    const newUuid = crypto.randomUUID()
    localStorage.setItem(UUID_STORAGE_KEY, newUuid)
    userUuid.value = newUuid
    return newUuid
  }

  const setWalletInfo = (info: { name: string; icon: string }) => {
    walletInfo.value = info
  }

  return {
    misatoWalletAddress, // MISATO 的钱包地址
    userWalletAddress,   // 用户的钱包地址
    isConnected,
    userUuid,
    walletInfo,
    
    setUserWalletAddress,
    setConnected,
    disconnectWallet,
    getOrCreateUuid,
    setWalletInfo
  }
}) 