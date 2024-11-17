import './assets/styles/fonts.css'
import './assets/main.css'

import { createApp } from 'vue'
import naive from 'naive-ui'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(naive)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
