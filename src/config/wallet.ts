import { createAppKit } from '@reown/appkit/vue'
import { baseSepolia } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { walletConnect, coinbaseWallet, injected } from 'wagmi/connectors'
import { http } from 'wagmi'
import { useAppKitInstance } from '@/composables/useAppKitInstance'

const projectId = '24138badb492a0fbadb1a04687d27fcd'

const metadata = {
  name: 'MISATO-AI',
  description: 'MISATO Studio',
  url: window.location.origin,
  icons: ['/misato_icon.jpg']
}

// 只使用 Base 网络
export const networks = [baseSepolia]

// 创建连接器数组
const connectors = [
  walletConnect({ 
    projectId, 
    metadata, 
    showQrModal: false
  }),
  injected({ 
    shimDisconnect: true
  }),
  coinbaseWallet({
    appName: metadata.name,
    appLogoUrl: metadata.icons[0]
  })
]

// 创建Wagmi适配器
export const wagmiAdapter = new WagmiAdapter({
  transports: {
    [baseSepolia.id]: http()
  },
  connectors,
  projectId,
  networks
})

// 导出wagmi配置
export const config = wagmiAdapter.wagmiConfig

// 自定义主题变量
const themeVariables = {
  '--w3m-font-family': '04b03, monospace', // 使用应用的主字体
  '--w3m-accent': '#FB59F5', // 品牌主色
  '--w3m-color-mix': '#FFF', // 辅助色
  '--w3m-color-mix-strength': 50,
  '--w3m-border-radius-master': '2px', // 方形边角
  '--w3m-z-index': 999,
  '--w3m-background-color': '#FBF7F1', // 背景色
  '--w3m-container-border-radius': '4px',
  '--w3m-button-border-radius': '4px',
  '--w3m-text-big-bold-size': '18px',
  '--w3m-text-big-bold-weight': '400',
  '--w3m-overlay-background-color': 'rgba(43, 12, 185, 0.8)', // 半透明遮罩
}

// 初始化钱包函数
export const initWallet = () => {
  const instance = createAppKit({
    adapters: [wagmiAdapter],
    networks: [baseSepolia],
    projectId,
    metadata,
    themeMode: 'light', // 使用亮色主题
    themeVariables, // 应用自定义主题变量
    features: {
      analytics: true,
      swaps: false,
      onramp: false,
      legalCheckbox: true,
      email: false,
      socials: [],
      emailShowWallets: false
    },
    enableWalletConnect: true
  })
  
  // 保存实例
  const { setInstance } = useAppKitInstance()
  setInstance(instance)
  
  return instance
} 