import { createConfig, http } from '@wagmi/vue'
import { baseSepolia } from 'viem/chains'
import { injected } from '@wagmi/vue/connectors'

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http()
  }
})