<template>
  <div class="home">
    <header class="header">
      <div class="header-left">
        <n-icon size="32" class="logo-icon">
          <LogoIcon />
        </n-icon>
        <n-icon class="misato-studio-icon">
          <MisatoStudioIcon />
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
        
        <n-button quaternary class="wallet-button" :class="{ 'connected': isConnected }">
          <template #icon>
            <n-icon class="wallet-icon">
              <WalletIcon v-if="!isConnected" />
              <WalletConnectedIcon v-else />
            </n-icon>
          </template>
          <span v-if="isConnected">{{ formatAddress(walletAddress) }}</span>
          <span v-else>Connect Wallet</span>
        </n-button>
      </div>
    </header>

    <main class="main-content">
      <n-config-provider :theme="theme">
        <n-split direction="horizontal" :default-size="0.42" :max="0.75" :min="0.42">
          <template #1>
            <n-message-provider>
              <ChatPanel />
            </n-message-provider>
          </template>
          <template #2>
            <!-- <NFTGallery /> -->
          </template>
        </n-split>
      </n-config-provider>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
import MisatoStudioIcon from '@/assets/icons/misato_studio.svg?component'
import WalletIcon from '@/assets/icons/metamask.svg?component'
import WalletConnectedIcon from '@/assets/icons/metamask.svg?component'

const theme = ref(darkTheme)
const isConnected = ref(false)
const walletAddress = ref('')

const formatAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
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
  padding: 0 24px;
  background: var(--sl-color-gray-900);
  border-bottom: 1px solid var(--sl-color-gray-800);
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
}

:deep(.n-split-pane-2) {
  background: var(--sl-color-gray-900);
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
  display: none;
  font-family: 'PPNeueBit', monospace;
  font-size: 28px;
  font-weight: 400;
  line-height: 40px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  color: var(--brand-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-group {
  display: flex;
  gap: 20px;
}

.wallet-button {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 20px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.07);
}

.wallet-button.connected {
  background: var(--brand-secondary);
  color: var(--sl-color-gray-900);
}

.wallet-button:hover {
  background: var(--brand-primary);
  color: var(--sl-color-gray-900);
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

.wallet-button {
  background: rgba(255, 255, 255, 0.07) !important;
}
</style>
