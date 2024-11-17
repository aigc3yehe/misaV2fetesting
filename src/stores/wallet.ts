import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWalletStore = defineStore('wallet', () => {
  // 状态
  const walletAddress = ref('0x900709432a8F2C7E65f90aA7CD35D0afe4eB7169')
  const isConnected = ref(false)
  const userUuid = ref('')

  // Actions
  const setWalletAddress = (address: string) => {
    walletAddress.value = address
    isConnected.value = true
  }

  const disconnectWallet = () => {
    walletAddress.value = ''
    isConnected.value = false
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

  return {
    // 状态
    walletAddress,
    isConnected,
    userUuid,
    
    // Actions
    setWalletAddress,
    disconnectWallet,
    getOrCreateUuid
  }
}) 