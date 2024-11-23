import { ref, h, watch, onMounted } from 'vue'
import { useAccount, useConnect, useDisconnect } from '@wagmi/vue'
import { useWalletStore } from '@/stores'
import { useMessage, useDialog } from 'naive-ui'
import { useAppKit, useAppKitAccount } from '@reown/appkit/vue'

export function useWallet() {
  const { address, isConnected, connector } = useAccount()
  const { connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const walletStore = useWalletStore()
  const message = useMessage()
  const dialog = useDialog()
  const currentConnector = ref<any>(null)
  const appKitAccount = useAppKitAccount()
  const modal = useAppKit()

  onMounted(async () => {
    if (isConnected.value && connector.value) {
      try {
        const connectorInfo = connectors.find(c => c.id === connector.value?.id)
        if (connectorInfo) {
          currentConnector.value = connectorInfo
          walletStore.setWalletInfo({
            name: connectorInfo.name || '',
            icon: connectorInfo.icon || ''
          })
          if (address.value) {
            walletStore.setUserWalletAddress(address.value)
            walletStore.setConnected(true)
          }
        }
      } catch (error) {
        console.error('Failed to restore wallet state:', error)
      }
    }
  })

  watch(() => connector.value, (newConnector) => {
    if (newConnector && isConnected.value) {
      const connectorInfo = connectors.find(c => c.id === newConnector.id)
      if (connectorInfo) {
        currentConnector.value = connectorInfo
        walletStore.setWalletInfo({
          name: connectorInfo.name || '',
          icon: connectorInfo.icon || ''
        })
      }
    }
  }, { immediate: true })

  watch(() => isConnected.value, (newValue) => {
    if (newValue && address.value && currentConnector.value) {
      walletStore.setUserWalletAddress(address.value)
      walletStore.setConnected(true)
      walletStore.setWalletInfo({
        name: currentConnector.value.name || '',
        icon: currentConnector.value.icon || ''
      })
    }
  })

  watch([
    () => isConnected.value,
    () => appKitAccount.value
  ], ([wagmiConnected, appKitAccount]) => {
    if (!wagmiConnected && appKitAccount.isConnected) {
      modal.close()
    }
  }, { immediate: true })

  const checkWalletEnvironment = () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed')
    }
  }

  const showWalletSelection = (availableConnectors: any[]) => {
    return new Promise((resolve) => {
      dialog.create({
        title: 'Select Wallet',
        positiveText: 'Cancel',
        positiveButtonProps: {
          color: '#FB59F5',
          textColor: '#FFFFFF'
        },
        style: {
          width: '400px'
        },
        content: () => h('div', { 
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '20px 0'
          }
        }, availableConnectors.map(connector => 
          h('button', {
            style: {
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '16px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: 'inherit',
              fontSize: '14px',
              outline: 'none',
              '&:hover': {
                borderColor: '#4AC5A0',
                background: 'rgba(74, 197, 160, 0.1)'
              }
            },
            onClick: (e: Event) => {
              e.preventDefault()
              e.stopPropagation()
              dialog.destroyAll()
              resolve(connector)
            }
          }, [
            // 钱包图标
            connector.icon && h('img', {
              src: connector.icon,
              style: {
                width: '32px',
                height: '32px',
                marginRight: '12px',
                borderRadius: '8px'
              }
            }),
            // 钱包名称
            h('span', {
              style: {
                flex: 1,
                textAlign: 'left',
                fontWeight: '500'
              }
            }, connector.name)
          ])
        )),
        showIcon: false,
        closable: true
      })
    })
  }

  const handleConnect = async () => {
    try {
      console.log('打开连接弹窗前状态:', {
        wagmi: {
          connected: isConnected.value,
          address: address.value
        },
        appKit: {
          connected: appKitAccount.value.isConnected,
          address: appKitAccount.value.address,
          status: appKitAccount.value.status
        }
      })
      
      modal.open({ view: 'Connect' })
      
    } catch (error: any) {
      console.error('Wallet connection error:', error)
      message.error('Failed to connect wallet')
    }
  }

  const handleDisconnect = async () => {
    try {
      disconnect()
      currentConnector.value = null
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
    currentConnector,
    handleDisconnect,
    formatAddress
  }
} 