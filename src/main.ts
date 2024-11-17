import './assets/styles/fonts.css'
import './assets/main.css'

import { createApp } from 'vue'
import naive from 'naive-ui'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { WagmiPlugin } from '@wagmi/vue'
import { config } from './config/wagmi'

const app = createApp(App)
app.use(naive)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const queryClient = new QueryClient()

app.use(WagmiPlugin, { config })
   .use(VueQueryPlugin, { queryClient })

app.mount('#app')
