<template>
  <div class="chat-wrapper">
    <div class="unity-container">
      <UnityGame class="unity-background" />
      <!-- <div class="temp-background"></div> -->
    </div>
    
    <!-- 主聊天界面 -->
    <div class="chat-interface">
      <!-- 钱包卡片 -->
      <div class="wallet-card">
        <div class="wallet-header">
          <n-icon size="20" class="logo-icon">
            <LogoIcon />
          </n-icon>
        </div>
        <div class="wallet-content">
          <n-text class="wallet-content-text">MISATO's wallet</n-text>
          <n-text code class="hidden-address">{{ walletStore.misatoWalletAddress }}</n-text>
          <n-button class="copy-button" @click="copyMisatoWalletAddress">
            Copy
          </n-button>
        </div>
      </div>

      <!-- 聊天面板 -->
      <div class="chat-panel" :class="{ 'expanded': isExpanded }">
        <div class="chat-header">
          <div class="header-left">
            <n-icon size="20" class="n-icon">
              <ChatIcon />
            </n-icon>
            <span class="header-title">MISATO</span>
          </div>
          <div class="header-right">
            <n-icon size="20" class="mode-icon clickable" @click="toggleExpand">
              <TurboModeIcon v-if="isExpanded" />
              <SimpleModeIcon v-else />
            </n-icon>
          </div>
        </div>
        <template v-if="isExpanded">
          <n-message-provider>
            <div class="chat-content-container">
              <ChatContent v-if="chatState === 'ready'" />
              <div v-else class="chat-state-wrapper">
                <div class="chat-state-container">
                  <!-- 顶部蓝条 -->
                  <div class="blue-bar"></div>
                  <!-- 内容区域 -->
                  <div class="content-area">
                    <!-- 排队中状态 -->
                    <template v-if="chatState === 'queuing'">
                      <n-icon size="32" class="loading-icon">
                        <LoadingIcon />
                      </n-icon>
                      <div class="state-message">
                        There are too many people at the moment, please wait<br/>
                        15 people are waiting...
                      </div>
                      <n-button class="try-connect-btn" @click="handleTryConnect">
                        Try to connect
                      </n-button>
                    </template>
                    
                    <!-- 未连接状态 -->
                    <template v-if="chatState === 'not-connected'">
                      <n-icon size="32" class="loading-icon">
                        <LoadingIcon />
                      </n-icon>
                      <div class="state-message">
                        Please connect your wallet first
                      </div>
                      <n-button class="try-connect-btn" @click="handleConnectWallet">
                        Connect Wallet
                      </n-button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </n-message-provider>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useWalletStore } from '@/stores'
import LogoIcon from '@/assets/icons/small_logo.svg?component'
import UnityGame from '../UnityGame.vue'
import ChatContent from './ChatContent.vue'
import LoadingIcon from '@/assets/icons/loading.svg?component'
import { useWallet } from '@/composables/useWallet'
import ChatIcon from '@/assets/icons/chat_icon.svg'
import SimpleModeIcon from '@/assets/icons/s.svg'
import TurboModeIcon from '@/assets/icons/t.svg'
import { useAppKit } from '@reown/appkit/vue'

const isExpanded = ref(true)
const walletStore = useWalletStore()
const message = useMessage()
const chatState = ref<'ready' | 'queuing' | 'not-connected'>('not-connected')
const { handleConnect } = useWallet()
const modal = useAppKit()

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const copyMisatoWalletAddress = async () => {
  try {
    await navigator.clipboard.writeText(walletStore.misatoWalletAddress)
    message.success('Copy success')
  } catch (err) {
    console.error('Copy error:', err)
    message.error('Copy failed')
  }
}

const handleTryConnect = () => {
  // 处理重新连接逻辑
}

const handleConnectWallet = async () => {
  try {
    // 使用 AppKit modal 打开钱包连接
    modal.open()
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    message.error('Failed to connect wallet')
  }
}

// 监听钱包状态变化
watch(() => walletStore.isConnected, (newValue) => {
  console.log('Wallet connection status changed:', newValue)
  chatState.value = newValue ? 'ready' : 'not-connected'
}, { immediate: true })
</script>

<style scoped>
.chat-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.unity-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 3;
  pointer-events: auto;
}

.unity-background {
  width: 100%;
  height: 100%;
}

.chat-interface {
  position: relative;
  z-index: 4;
  height: 100%;
  pointer-events: none;
}

.wallet-card {
  position: absolute;
  top: 24px;
  right: 8px;
  width: 120px;
  display: flex;
  padding: 8px;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  background: rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(12px);
}

.wallet-header {
  display: flex;
  justify-content: center;
}

.logo-icon {
  color: var(--brand-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px !important;
  height: 20px !important;
}

.logo-icon :deep(svg) {
  width: 20px !important;
  height: 20px !important;
}

.logo-icon :deep(.n-icon-slot) {
  width: 20px !important;
  height: 20px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wallet-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: -8px;
}

.wallet-content-text {
  font-family: '04b03', monospace;
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  color: rgba(255, 255, 255, 0.72); /* #FFFFFFB8 */
}

.hidden-address {
  display: none; /* 隐藏地址文本 */
}

.copy-button {
  display: flex;
  height: 24px;
  padding: 4px 0;
  justify-content: center;
  align-items: center;
  gap: 6px;
  align-self: stretch;
  background: rgba(0, 0, 0, 0.24) !important;
  color: #FFFFFF;
  font-family: '04b03', monospace;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  transition: opacity 0.2s;
  border-radius: 0px;
}

.copy-button:hover {
  color: var(--brand-primary) !important; /* 使用品牌主色（粉色） */
  opacity: 0.8;
}

.chat-panel {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  border: 1px solid #2C0CB9;
  background: #B1FDE1;
  transition: height 0.3s ease;
  height: 40px;
  padding: 6px;
}

.chat-panel.expanded {
  display: flex;
  height: max(54vh, 462px);
  padding: 6px;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.chat-header {
  width: 100%;
  height: 28px;
  display: flex;
  justify-content: space-between;
  padding: 4px;
  align-self: stretch;
  border: 1px solid #2C0CB9;
  background: #EBD2EF;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 100%;
}

.header-left .n-icon {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;  /* 填满父元素高度 */
  width: 40px;   /* 给一个固定宽度 */
}

.header-left :deep(.n-icon) {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
}

.header-left :deep(.n-icon svg) {
  width: 100%;
  height: 100%;
}

.header-title {
  color: #2C0CB9;
  font-family: '04b03', monospace;
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  height: 100%; 
}

.mode-icon {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 40px;
}

.mode-icon:hover {
  opacity: 0.8;
}

.temp-background {
  width: 100%;
  height: 100%;
  background: url('/temp_bg.png') no-repeat center center;
  background-size: cover;
}

.chat-state-wrapper {
  display: flex;
  padding: 0px 40px;
  justify-content: center;
  align-items: center;
  flex: 1 0 0;
  align-self: stretch;
  height: 100%;
}

.chat-state-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.blue-bar {
  height: 9px;
  align-self: stretch;
  border-top: 2px solid var(--Text-P, #2C0CB9);
  border-left: 2px solid var(--Text-P, #2C0CB9);
  border-right: 2px solid var(--Text-P, #2C0CB9);
  background: #B1FDE1;
}

.content-area {
  border: 2px solid var(--Text-P, #2C0CB9);
  background: #FFF;
  box-shadow: 4px 4px 0px 0px #F0F;
  display: flex;
  padding: 24px 0px;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  align-self: stretch;
}

.state-message {
  font-family: 'PPNeueBit', sans-serif;
  font-size: 20px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  background: linear-gradient(180deg, #FA75FF 0%, #FA75FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 确保文本在换行时保持样式 */
.state-message br {
  display: block;
  content: "";
  margin: 8px 0;
}

.try-connect-btn {
  width: 160px !important;
  height: 32px;
  padding: 6px 0;
  background: #FA75FF66 !important;
  border: 1px solid #B050B3 !important;
  border-radius: 16px;
  font-family: 'PPNeueBit', monospace;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  color: #FA75FF !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.try-connect-btn:hover {
  background: #FA75FF80 !important;
  color: #FA75FF !important;
}

.loading-icon {
  color: #FFF149;
}

.loading-icon :deep(svg) {
  width: 32px !important;
  height: 32px !important;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.chat-panel,
.wallet-card,
.chat-header,
.input-container,
.messages-container,
.n-button,
.chat-content-container {
  pointer-events: auto;
}

.header-left :deep(.n-icon),
.header-right :deep(.n-icon) {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.header-right :deep(.n-icon) {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
}

.header-right :deep(.n-icon svg) {
  width: 100%;
  height: 100%;
}

.chat-content-container {
  flex: 1;
  border: 1px solid var(--Text-P, #2C0CB9);
  background: #C79DDC;
  width: 100%;
  height: calc(100% - 40px); /* 40px 是标题栏的高度 */
  overflow: hidden;
  position: relative;
}
</style> 