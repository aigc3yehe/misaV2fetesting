<template>
  <div class="home">
    <header class="header">
      <div class="header-left">
        <n-icon size="32" class="logo-icon">
          <LogoIcon />
        </n-icon>
        <h1 class="title">MISATO Studio</h1>
      </div>
      <div class="header-right">
        <div class="icon-group">
          <n-button quaternary circle class="icon-button" tag="a" href="https://twitter.com/misato_studio" target="_blank">
            <template #icon>
              <n-icon>
                <XIcon class="icon-default" />
                <XIconHover class="icon-hover" />
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary circle class="icon-button" tag="a" href="https://github.com/misato-studio" target="_blank">
            <template #icon>
              <n-icon>
                <GithubIcon class="icon-default" />
                <GithubIconHover class="icon-hover" />
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary circle class="icon-button" tag="a" href="https://t.me/misato_studio" target="_blank">
            <template #icon>
              <n-icon>
                <TelegramIcon class="icon-default" />
                <TelegramIconHover class="icon-hover" />
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary circle class="icon-button" tag="a" href="/docs" target="_blank">
            <template #icon>
              <n-icon>
                <DocsIcon class="icon-default" />
                <DocsIconHover class="icon-hover" />
              </n-icon>
            </template>
          </n-button>
        </div>
        
        <div 
          class="wallet-button clickable" 
          :class="{ 'connected': isConnected }"
          @click="handleWalletClick"
        >
          <div class="wallet-icon-wrapper" v-if="isConnected">
            <template v-if="walletStore.walletInfo">
              <img 
                :src="walletStore.walletInfo.icon" 
                :alt="walletStore.walletInfo.name"
                class="main-wallet-icon"
              />
              <SmallBaseIcon class="status-icon" />
            </template>
          </div>
          <span>{{ isConnected ? formatAddress(address || '') : 'Connect' }}</span>
        </div>
      </div>
    </header>

    <main class="main-content">
      <n-config-provider :theme="theme">
        <n-split 
          direction="horizontal" 
          :default-size="0.42" 
          :max="0.75" 
          :min="0.42"
          :resize-trigger-size="1"
        >
          <template #1>
            <n-message-provider>
              <ChatPanel />
            </n-message-provider>
          </template>
          <template #2>
            <n-message-provider>
              <FeaturedCollection v-if="galleryStore.currentView === 'featured'" />
              <NFTGallery v-else />
            </n-message-provider>
          </template>
          <template #resize-trigger>
            <div class="resize-trigger"></div>
          </template>
        </n-split>
      </n-config-provider>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch } from 'vue'
import { NIcon, NButton, NConfigProvider } from 'naive-ui'
import { darkTheme } from 'naive-ui'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import NFTGallery from '@/components/gallery/NFTGallery.vue'
import XIcon from '@/assets/icons/x.svg?component'
import XIconHover from '@/assets/icons/x-hover.svg?component'
import GithubIcon from '@/assets/icons/github.svg?component'
import GithubIconHover from '@/assets/icons/github-hover.svg?component'
import TelegramIcon from '@/assets/icons/tg.svg?component'
import TelegramIconHover from '@/assets/icons/tg-hover.svg?component'
import DocsIcon from '@/assets/icons/docs.svg?component'
import DocsIconHover from '@/assets/icons/docs-hover.svg?component'
import LogoIcon from '@/assets/icons/logo.svg?component'
import SmallBaseIcon from '@/assets/icons/small_base.svg?component'
import { useWallet } from '@/composables/useWallet'
import { useDialog } from 'naive-ui'
import { useWalletStore } from '@/stores/wallet'
import { useGalleryStore } from '@/stores'
import FeaturedCollection from '@/components/gallery/FeaturedCollection.vue'

const theme = ref(darkTheme)
const { isConnected, address, handleConnect, handleDisconnect, formatAddress } = useWallet()
const dialog = useDialog()
const walletStore = useWalletStore()
const galleryStore = useGalleryStore()

watch(() => isConnected.value, (newValue) => {
  walletStore.setConnected(newValue)
  if (newValue && address.value) {
    walletStore.setUserWalletAddress(address.value)
  }
}, { immediate: true })

const handleWalletClick = async () => {
  try {
    if (isConnected.value) {
      dialog.warning({
        title: 'Disconnect Wallet',
        content: () => h('div', null, 'Are you sure you want to disconnect your wallet?'),
        positiveText: 'Confirm',
        negativeText: 'Cancel',
        positiveButtonProps: {
          color: '#FB59F5',
          textColor: '#FFFFFF'
        },
        // 添加图标样式
        style: {
          '--n-icon-color': '#FB59F5'
        },
        onPositiveClick: async () => {
          await handleDisconnect()
        }
      })
    } else {
      await handleConnect()
    }
  } catch (error) {
    console.error('Wallet operation error:', error)
  }
}
</script>

<style scoped>
.home {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}

.header {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--background-primary);
  position: relative;
  z-index: 20;
}

.header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    to right,
    #39EDFF 0%,
    #39EDFF 33.33%,
    #A940FF 33.33%,
    #A940FF 66.66%,
    var(--brand-primary) 66.66%,
    var(--brand-primary) 100%
  );
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

:deep(.n-config-provider) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.n-split) {
  flex: 1;
  min-height: 0;
}

:deep(.n-split-pane) {
  height: 100%;
  overflow: hidden;
  position: relative;
}

:deep(.n-split-pane-1) {
  background: transparent;
  position: relative;
  z-index: 5;
}

:deep(.n-split-pane-2) {
  position: relative;
  overflow: hidden;
  background: var(--sl-color-gray-950, #09090b);
}

:deep(.n-split-pane-2)::before,
:deep(.n-split-pane-2)::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

:deep(.n-split-pane-2)::before {
  background-image: url('@/assets/icons/bg.svg');
  background-repeat: repeat;
  background-position: top center;
  background-size: contain;
  opacity: 1;
}

:deep(.n-split-pane-2)::after {
  background-image: url('@/assets/bg_line.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% 100%;
  opacity: 1;
}

:deep(.n-split-pane-2) > * {
  position: relative;
  z-index: 1;
}

:deep(.unity-wrapper) {
  position: relative;
  z-index: 3;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
}

.logo-icon {
  color: var(--brand-secondary);
  display: flex;
  align-items: center;
  width: 32px !important;
  height: 32px !important;
}

.logo-icon :deep(svg) {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon:deep(.n-icon) {
  width: 32px !important;
  height: 32px !important;
  font-size: 32px !important;
}

.misato-studio-icon {
  color: var(--brand-secondary);
  display: flex;
  align-items: center;
  width: 181px !important;
  height: 13px !important;
}

.misato-studio-icon :deep(svg) {
  width: 181px;
  height: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.misato-studio-icon:deep(.n-icon) {
  width: 181px !important;
  height: 13px !important;
  font-size: 32px !important;
}

.title {
  font-family: '04b03', monospace;
  font-size: 22px;
  font-weight: 400;
  line-height: 22px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  background: #FF00FF;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: block;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-group {
  display: flex;
  align-items: center;
  gap: 20px;
}

.wallet-button {
  height: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  padding-right: 12px;
  background: var(--Brand-Primary, #F0F);
}

.wallet-button.connected {
  background: #FFFFFF;
}

.wallet-button span {
  color: #FFFFFF;
  font-family: '04b03';
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
}

.wallet-button.connected span {
  color: var(--brand-primary, #F0F);
}

:deep(.n-button) {
  --n-text-color: var(--sl-color-gray-600);
  --n-text-color-hover: var(--brand-primary);
  --n-text-color-pressed: var(--brand-primary);
  --n-color-hover: transparent;
  --n-color-pressed: transparent;
  --n-border-hover: none;
  --n-border-pressed: none;
}

:deep(.n-icon) {
  font-size: 20px;
}

.icon-button {
  position: relative;
  background: transparent !important;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.07) !important;
}

.icon-default {
  display: block;
}

.icon-hover {
  display: none;
}

.icon-button:hover .icon-default {
  display: none;
}

.icon-button:hover .icon-hover {
  display: block;
}

.wallet-icon {
  font-size: 28px !important;
  width: 28px !important;
  height: 28px !important;
}

:deep(.n-icon) {
  font-size: 20px;
  width: 20px;
  height: 20px;
}

.icon-button :deep(.n-button__icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.n-button) {
  --n-color: transparent !important;
  --n-color-hover: transparent !important;
  --n-color-pressed: transparent !important;
  --n-border: none !important;
  --n-border-hover: none !important;
  --n-border-pressed: none !important;
}

.wallet-icon-wrapper {
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-wallet-icon {
  width: 24px;
  height: 24px;
}

.status-icon {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  z-index: 1;
}

:deep(svg) {
  width: 28px;
  height: 28px;
}

.icon-wrapper {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper img,
.icon-wrapper :deep(svg) {
  width: 20px;
  height: 20px;
}

.resize-trigger {
  height: 100%;
  width: 1px;
  background: var(--brand-primary, #F0F);
  opacity: 0.3;
}

.resize-trigger:hover {
  opacity: 0.6;
}
</style>
