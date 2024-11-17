import { ref, h, watch, onMounted } from 'vue'
import { useAccount, useConnect, useDisconnect, type Connector } from '@wagmi/vue'
import { useWalletStore } from '@/stores'
import { useMessage, useDialog, c } from 'naive-ui'

export function useWallet() {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const walletStore = useWalletStore()
  const message = useMessage()
  const dialog = useDialog()
  const currentConnector = ref<any>(null)

  onMounted(async () => {
    if (isConnected.value && connector.value) {
      const connectorInfo = connectors.find(c => c.id === connector.value?.id)
      if (connectorInfo) {
        currentConnector.value = connectorInfo
        walletStore.setWalletInfo({
          name: connectorInfo.name || '',
          icon: connectorInfo.icon || ''
        })
      }
    }
  })

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
      checkWalletEnvironment()
      
      const availableConnectors = connectors.filter(c => 
        c.id != null && c.id != undefined && c.name != null && c.name != undefined && c.icon != null && c.icon != undefined
      )
      
      console.log('Filtered connectors:', availableConnectors)
      
      if (availableConnectors.length === 0) {
        message.error('Please install a supported wallet (e.g. MetaMask, TokenPocket)')
        return
      }

      let selectedConnector
      if (availableConnectors.length === 1) {
        selectedConnector = availableConnectors[0]
      } else {
        selectedConnector = await showWalletSelection(availableConnectors)
        console.log('Selected connector:', selectedConnector)
      }

      if (!selectedConnector) return

      currentConnector.value = selectedConnector
      
      connect({ 
        connector: selectedConnector as Connector 
      })
      
    } catch (error: any) {
      currentConnector.value = null
      console.error('Wallet connection error:', error)
      message.error('Failed to connect wallet')
      walletStore.disconnectWallet()
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
    handleConnect,
    handleDisconnect,
    formatAddress
  }
} 