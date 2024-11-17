<template>
  <div class="chat-wrapper">
    <!-- Unity 游戏背景 - 临时使用图片占位 -->
    <div class="unity-container">
      <!-- <UnityGame class="unity-background" /> -->
      <div class="temp-background"></div>
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
          <n-text code class="hidden-address">{{ walletStore.walletAddress }}</n-text>
          <n-button class="copy-button" @click="copyWalletAddress">
            Copy
          </n-button>
        </div>
      </div>

      <!-- 聊天面板 -->
      <div class="chat-panel" :class="{ 'expanded': isExpanded }">
        <!-- 添加标题挂件 -->
        <div class="chat-title">
          <n-icon class="chat-title-bg">
            <ChatTitleBackgroundSVG />
          </n-icon>
          <span class="chat-title-text">$MISATO</span>
        </div>
        
        <div class="expand-handle" @click="toggleExpand">
          <n-icon class="expand-icon">
            <ChevronDownIcon v-if="isExpanded" />
            <ChevronUpIcon v-else />
          </n-icon>
        </div>
        <n-message-provider>
          <template v-if="isExpanded">
            <ChatContent v-if="chatState === 'ready'" />
            <div v-else-if="chatState === 'queuing'" class="chat-state-container">
              <n-spin :show="show">
                <template #icon>
                  <LoadingIcon class="loading-icon"/>
                </template>
              </n-spin>
              <div class="state-message">
                There are too many people at the moment, please wait<br/>
                15 people are waiting...
              </div>
              <n-button class="try-connect-btn" @click="handleTryConnect">
                Try to connect
              </n-button>
            </div>
            <div v-else-if="chatState === 'not-connected'" class="chat-state-container">
              <n-icon size="48" class="wallet-icon">
                <WalletIcon />
              </n-icon>
              <div class="state-message">
                Please connect your wallet first
              </div>
              <n-button class="try-connect-btn" @click="handleConnectWallet">
                Connect Wallet
              </n-button>
            </div>
          </template>
        </n-message-provider>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChevronUpIcon from '@/assets/icons/chevron-up-r.svg?component'
import ChevronDownIcon from '@/assets/icons/chevron-down-r.svg?component'
import { useMessage } from 'naive-ui'
import { useWalletStore } from '@/stores'
import ChatTitleBackgroundSVG from '@/assets/icons/chat_title_bg.svg?component'
import LogoIcon from '@/assets/icons/small_logo.svg?component'
import UnityGame from '../UnityGame.vue'
import ChatContent from './ChatContent.vue'
import LoadingIcon from '@/assets/icons/loading.svg?component'

const isExpanded = ref(true)
const walletStore = useWalletStore()
const message = useMessage()
const chatState = ref<'ready' | 'queuing' | 'not-connected'>('not-connected')
const show = ref(true)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const copyWalletAddress = async () => {
  try {
    await navigator.clipboard.writeText(walletStore.walletAddress)
    message.success('Copy success')
  } catch (err) {
    console.error('Copy error:', err)
    message.error('Copy failed')
  }
}

const handleTryConnect = () => {
  // 处理重新连接逻辑
}

const handleConnectWallet = () => {
  // 处理连接钱包逻辑
}
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
}

.unity-background {
  width: 100%;
  height: 100%;
}

.chat-interface {
  position: relative;
  z-index: 1;
  height: 100%;
  pointer-events: none; /* 允许点击穿透到 Unity 背景 */
}

.wallet-card {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 110px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.24); /* #FFFFFF3D */
  backdrop-filter: blur(24px);
  border-radius: 16px;
}

.wallet-header {
  display: flex;
  justify-content: center;
  padding-top: 8px;
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
}

.wallet-content-text {
  font-family: 'PPNeueBit', monospace;
  font-size: 16px;
  font-weight: 700;
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
  width: 94px;
  height: 24px;
  padding: 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.24) !important; /* #FFFFFF3D */
  border-radius: 999px;
  color: #FFFFFF;
  font-size: 12px;
  transition: opacity 0.2s;
}

.copy-button:hover {
  opacity: 0.8;
}

/* 覆盖 naive-ui 按钮的默认样式 */
.copy-button:deep(.n-button__icon) {
  font-size: 14px;
  margin: 0;
}

.copy-button:deep(.n-button__content) {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-panel {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.56);
  backdrop-filter: blur(24px);
  transition: height 0.3s ease;
  height: 48px;
  border-radius: 16px;
}

.chat-panel.expanded {
  height: calc(max(640px, 50vh) - 25px);
}

.expand-handle {
  position: absolute;
  top: -34px;
  right: 0;
  width: 64px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  cursor: pointer;
  background: rgba(88, 255, 208, 0.4);
  border-top: 1px solid #4AC5A0;
  border-left: 1px solid #4AC5A0;
  border-radius: 16px;
}

.expand-icon {
  color: #4AC5A0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-icon :deep(svg) {
  width: 16px !important;
  height: 16px !important;
}

.expand-icon :deep(.n-icon-slot) {
  width: 16px !important;
  height: 16px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wallet-card,
.chat-panel,
.expand-handle {
  pointer-events: auto;
}

.chat-title {
  position: absolute;
  left: 24px;
  top: 0;
  transform: translateY(-50%);
  width: 136px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-title-bg {
  position: absolute;
  width: 128px !important;
  height: 50px !important;
  top: 0;
  left: 0;
}

.chat-title-bg :deep(svg) {
  width: 128px !important;
  height: 50px !important;
}

.chat-title-text {
  position: relative;
  font-family: 'PPNeueBit', monospace;
  font-size: 29px;
  font-weight: 700;
  line-height: 20px;
  top: -3px;
  left: -8px;
  color: #FFFFFF;
  text-align: left;
  text-decoration-skip-ink: none;
  text-underline-position: from-font;
  z-index: 1;
}

.temp-background {
  width: 100%;
  height: 100%;
  background: url('/temp_bg.png') no-repeat center center;
  background-size: cover;
}

.chat-state-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
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
  padding: 6px 33px;
  gap: 10px;
  background: #FA75FF66 !important;
  border: 1px solid #B050B3 !important;
  border-radius: 16px;
  font-family: 'PPNeueBit', monospace;
  font-size: 16px;
  font-weight: 700;
  line-height: 12px;
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

.wallet-icon {
  color: #FFF149;
}

.loading-icon {
  width: 32px;
  height: 32px;
  color: #FFF149;
  animation: spin 6s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 