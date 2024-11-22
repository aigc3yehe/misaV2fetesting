import { createConfig, http } from '@wagmi/vue'
import { base } from '@wagmi/vue/chains'
import { injected } from '@wagmi/vue/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
  ],
  transports: {
    [base.id]: http()
  }
})