import { ref, computed, watch } from 'vue'
import { useWalletStore } from '@/stores'
import { useMessage } from 'naive-ui'
import { useAppKit, useAppKitAccount, useWalletInfo, useDisconnect } from '@reown/appkit/vue'
import { useAppKitInstance } from '@/composables/useAppKitInstance'

const projectId = '24138badb492a0fbadb1a04687d27fcd'

interface WalletListing {
  id: string
  name: string
  rdns: string
  image_url: {
    sm: string
    md: string
    lg: string
  }
}

export function useWallet() {
  const walletStore = useWalletStore()
  const message = useMessage()
  const appKitAccount = useAppKitAccount()
  const modal = useAppKit()
  const { disconnect } = useDisconnect()
  const { walletInfo } = useWalletInfo()
  const { appKitInstance } = useAppKitInstance()

  const getWalletIcon = async (rdns: string) => {
    try {
      const walletName = rdns.split('.').pop() || ''

      console.log('walletName', walletName)
      
      const response = await fetch(`https://explorer-api.walletconnect.com/v3/wallets?projectId=${projectId}&search=${walletName}`)
      const data = await response.json()
      
      // 获取所有钱包列表
      const wallets = Object.values(data.listings) as WalletListing[]
      
      if (wallets.length === 0) return ''
      
      // 尝试找到匹配 rdns 的钱包
      const wallet = wallets.find((w) => w.rdns === rdns) || wallets[0]
      
      // 返回中等尺寸的图标 URL
      console.log('wallet icon', wallet.image_url.md)
      return wallet.image_url.md
    } catch (error) {
      console.error('Failed to fetch wallet icon:', error)
      return ''
    }
  }

  appKitInstance.value.subscribeWalletInfo(async (state: any) => {
    console.log('state', state)
    const searchTerm = state?.rdns || state?.name || ''
    if (searchTerm) {
      const iconUrl = await getWalletIcon(searchTerm)
      walletStore.setWalletInfo({
        name: searchTerm,
        icon: iconUrl
      })
    }
  })

  // 从 AppKit 获取状态
  const address = computed(() => appKitAccount.value.address)
  const isConnected = computed(() => appKitAccount.value.isConnected)

  // 监听 AppKit 账户变化
  watch(() => appKitAccount.value, (account) => {
    console.log('account', account)
    console.log('walletInfo', walletInfo.value)
    if (account.isConnected && account.address) {
      walletStore.setUserWalletAddress(account.address)
      walletStore.setConnected(true)
      // 使用 walletInfo 更新钱包信息
      console.log('walletInfo', walletInfo.value)
      if (walletInfo.value) {
        walletStore.setWalletInfo({
          name: walletInfo.value.name || '',
          icon: walletInfo.value.icon || ''
        })
      }
    } else {
      walletStore.disconnectWallet()
    }
  }, { immediate: true })

  const handleDisconnect = async () => {
    try {
      await disconnect()
      walletStore.disconnectWallet()
      message.success('Wallet disconnected')
    } catch (error: any) {
      console.error('Wallet disconnection error:', error)
      message.error('Failed to disconnect wallet')
      throw error
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return {
    address,
    isConnected,
    handleDisconnect,
    formatAddress,
    walletInfo,
    appKitInstance
  }
} 