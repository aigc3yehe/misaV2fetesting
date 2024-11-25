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

  // 初始化函数
  const initialize = () => {
    // 从 localStorage 恢复钱包信息
    const storedWalletInfo = localStorage.getItem('misato_wallet_info')
    if (storedWalletInfo) {
      try {
        walletInfo.value = JSON.parse(storedWalletInfo)
      } catch (e) {
        console.error('Failed to parse stored wallet info')
      }
    }

    // 初始化或获取 UUID
    const UUID_STORAGE_KEY = 'misato_user_uuid'
    const storedUuid = localStorage.getItem(UUID_STORAGE_KEY)
    
    if (storedUuid) {
      userUuid.value = storedUuid
    } else {
      const newUuid = crypto.randomUUID()
      localStorage.setItem(UUID_STORAGE_KEY, newUuid)
      userUuid.value = newUuid
    }
  }

  // 其他方法
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
    localStorage.removeItem('misato_wallet_info')
  }

  const setWalletInfo = (info: { name: string; icon: string }) => {
    walletInfo.value = info
    localStorage.setItem('misato_wallet_info', JSON.stringify(info))
  }

  // 初始化
  initialize()

  return {
    misatoWalletAddress, // MISATO 的钱包地址
    userWalletAddress,   // 用户的钱包地址
    isConnected,
    userUuid,
    walletInfo,
    
    setUserWalletAddress,
    setConnected,
    disconnectWallet,
    setWalletInfo
  }
}) 