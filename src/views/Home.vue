<template>
  <div class="home">
    <header class="header">
      <div class="header-left">
        <n-icon size="32" class="logo-icon">
          <LogoIcon v-if="!isMobile" />
          <MobileLogoIcon v-else />
        </n-icon>
        <h1 class="title">MISATO Studio</h1>
      </div>
      <div class="header-right">
        <div 
          class="icon-group"
          :class="{ 
            'mobile': isMobile,
            'menu-open': isMenuOpen 
          }"
        >
          <a href="http://www.misato.ai" target="_blank" class="misato-link">
            misato.ai
          </a>
          <a href="https://x.com/Misato_virtuals" target="_blank">
            <img src="@/assets/x.png" class="social-icon" />
          </a>
          <a href="https://t.me/misatocoin" target="_blank">
            <img src="@/assets/telegram.png" class="social-icon" />
          </a>
        </div>
        
        <div 
          class="wallet-button clickable" 
          :class="{ 'connected': isConnected }"
          @click="isConnected ? disconnectWallet() : modal.open({ view: 'Connect' })"
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

        <div v-if="isMobile" class="menu-toggle" @click="toggleMenu">
          <n-icon size="24">
            <MenuIcon v-if="!isMenuOpen" />
            <CloseIcon v-else />
          </n-icon>
        </div>
      </div>
    </header>

    <main class="main-content">
      <n-config-provider :theme="theme">
        <template v-if="!isMobile">
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
        </template>
        
        <template v-else>
          <div class="mobile-layout">
            <n-message-provider>
              <div class="mobile-panels">
                <div 
                  v-show="mobileActivePanel !== 'gallery'"
                  class="mobile-panel-header"
                  :class="{ 'featured': galleryStore.currentView === 'featured' }"
                  @click="toggleMobilePanel('gallery')"
                >
                  <div class="header-background">
                    <div class="header-bg-pattern"></div>
                    <div class="header-content">
                      <div class="icon-title-group">
                        <n-icon size="20" class="panel-icon">
                          <GalleryIcon />
                        </n-icon>
                        <span class="panel-title">{{ galleryStore.currentView === 'featured' ? 'Featured Collection' : 'NFT Gallery' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="mobile-panel-content" v-show="mobileActivePanel === 'gallery'">
                  <div class="gallery-background">
                    <div class="bg-pattern"></div>
                    <div class="bg-line"></div>
                    <div class="gallery-content">
                      <FeaturedCollection v-if="galleryStore.currentView === 'featured'" />
                      <NFTGallery v-else />
                    </div>
                  </div>
                </div>

                <div 
                  v-show="mobileActivePanel !== 'chat'"
                  class="mobile-panel-header chat-header clickable"
                  @click="toggleMobilePanel('chat')"
                >
                  <div class="header-content">
                    <div class="icon-title-group">
                      <n-icon size="20" class="panel-icon">
                        <UpIcon />
                      </n-icon>
                      <n-icon size="20" class="chat-icon">
                        <ChatIcon />
                      </n-icon>
                      <span class="chat-title">MISATO</span>
                    </div>
                  </div>
                </div>
                
                <div class="mobile-panel-content" v-show="mobileActivePanel === 'chat'">
                  <ChatPanel />
                </div>
              </div>
            </n-message-provider>
          </div>
        </template>
      </n-config-provider>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, h, watch, watchEffect } from 'vue'
import { NIcon, NConfigProvider } from 'naive-ui'
import { darkTheme } from 'naive-ui'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import NFTGallery from '@/components/gallery/NFTGallery.vue'
import LogoIcon from '@/assets/icons/logo.svg?component'
import SmallBaseIcon from '@/assets/icons/small_base.svg?component'
import MobileLogoIcon from '@/assets/icons/mobile_logo.svg?component'
import { useWallet } from '@/composables/useWallet'
import { useDialog } from 'naive-ui'
import { useWalletStore } from '@/stores/wallet'
import { useGalleryStore } from '@/stores'
import FeaturedCollection from '@/components/gallery/FeaturedCollection.vue'
import { useDevice } from '@/composables/useDevice'
import MenuIcon from '@/assets/icons/menu.svg?component'
import CloseIcon from '@/assets/icons/close.svg?component'
import ChatIcon from '@/assets/icons/chat_icon.svg?component'
import GalleryIcon from '@/assets/icons/down.svg?component'
import UpIcon from '@/assets/icons/up.svg?component'
import { useAppKit, useWalletInfo } from '@reown/appkit/vue'

const theme = ref(darkTheme)
const { isConnected, address, handleDisconnect, formatAddress } = useWallet()
const dialog = useDialog()
const walletStore = useWalletStore()
const galleryStore = useGalleryStore()
const { isMobile } = useDevice()
const isMenuOpen = ref(false)
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
const { walletInfo } = useWalletInfo()

watch(() => isConnected.value, (newValue) => {
  console.log('isConnected', newValue)
  console.log('walletInfo', {
    name: walletInfo.value?.name,
    icon: walletInfo.value?.icon
  })
  walletStore.setConnected(newValue)
  if (newValue && address.value) {
    walletStore.setUserWalletAddress(address.value)
  }
}, { immediate: true })

// 获取 AppKit modal 实例
const modal = useAppKit()

// 修改钱包点击处理方法
const disconnectWallet = async () => {
  try {
    dialog.warning({
      title: 'Disconnect Wallet',
      content: () => h('div', null, 'Are you sure you want to disconnect your wallet?'),
      positiveText: 'Confirm',
      negativeText: 'Cancel',
      positiveButtonProps: {
        color: '#FB59F5',
        textColor: '#FFFFFF'
      },
      style: {
        '--n-icon-color': '#FB59F5'
      },
      onPositiveClick: async () => {
        await handleDisconnect()
      }
    })
  } catch (error) {
    console.error('Wallet operation error:', error)
  }
}

watchEffect(() => {
  console.log('isMobile value changed:', isMobile.value)
})

const mobileActivePanel = ref('chat')

const toggleMobilePanel = (panel: 'gallery' | 'chat') => {
  mobileActivePanel.value = mobileActivePanel.value === panel ? panel : panel
}
</script>

<style scoped>
.home {
  height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
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
  position: relative;
  overflow: hidden;
}

:deep(.n-config-provider) {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.n-split) {
  flex: 1;
  min-height: 0;
  height: 100%;
}

:deep(.n-split-pane) {
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

:deep(.n-split-pane) > * {
  flex: 1;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.n-split-pane-1) {
  background: transparent;
  position: relative;
  z-index: 5;
}

:deep(.n-split-pane-2) {
  position: relative;
  overflow: hidden;
  background: #FBF7F1;
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
  gap: 16px;
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

.social-icon {
  width: 25px;
  height: 25px;
  object-fit: contain;
}

.icon-group a {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

/* 移除链接的默认样式和hover效果 */
.icon-group a:hover {
  background: none;
  box-shadow: none;
}

.mobile-layout {
  height: 100%;
  overflow: hidden;
  background: var(--background-primary);
}

/* 移动端基础样式调整 */
@media (max-width: 768px) {
  .header {
    padding: 0 0.12rem; /* 12px */
    height: 0.64rem; /* 64px */
  }
  
  .icon-group {
    gap: 0.08rem; /* 8px */
  }
  
  .title {
    font-size: 0.18rem; /* 18px */
    line-height: 0.24rem; /* 24px */
  }
  
  .social-icon {
    width: 0.24rem; /* 24px */
    height: 0.24rem; /* 24px */
  }

  .wallet-button {
    height: 0.24rem; /* 24px */
    padding: 0 0.03rem; /* 0 3px */
    padding-right: 0.06rem; /* 6px */
    gap: 0.03rem; /* 3px */
  }

  .wallet-button span {
    font-size: 0.14rem; /* 14px */
    line-height: 0.2rem; /* 20px */
  }

  .wallet-icon-wrapper {
    width: 0.24rem; /* 24px */
    height: 0.24rem; /* 24px */
  }

  .main-wallet-icon {
    width: 0.24rem; /* 24px */
    height: 0.24rem; /* 24px */
  }

  .status-icon {
    width: 0.12rem; /* 12px */
    height: 0.12rem; /* 12px */
    bottom: -0.02rem; /* -2px */
    right: -0.02rem; /* -2px */
  }

  /* Logo 图标样式 */
  .logo-icon {
    width: 0.24rem !important; /* 24px */
    height: 0.24rem !important; /* 24px */
  }

  .logo-icon :deep(svg) {
    width: 0.24rem;
    height: 0.24rem;
  }

  .logo-icon:deep(.n-icon) {
    width: 0.24rem !important;
    height: 0.24rem !important;
    font-size: 0.24rem !important;
  }

  /* 标题文字大小 */
  .title {
    font-size: 0.18rem; /* 18px */
    line-height: 0.24rem; /* 24px */
  }

  /* 调整标题和图标的间距 */
  .header-left {
    gap: 0.08rem; /* 8px */
  }
}

.menu-toggle {
  display: none;
  cursor: pointer;
  padding: 0.06rem; /* 6px */
  margin-left: -0.12rem; /* -12px */
  width: 0.36rem; /* 36px */
  height: 0.36rem; /* 36px */
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-toggle :deep(.n-icon) {
  width: 0.24rem !important; /* 24px */
  height: 0.24rem !important; /* 24px */
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
  }

  .header {
    position: relative;
  }

  .icon-group.mobile {
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    background: var(--Background-Primary, #FBF7F1);
    display: flex;
    width: 100%;
    padding: 24px 16px;
    justify-content: center;
    align-items: center;
    gap: 20px;
    
    /* 默认隐藏 */
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  }

  .icon-group.mobile.menu-open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  /* 非移动端时显示原来的样式 */
  .icon-group:not(.mobile) {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* 移动端时隐藏原来的图标组 */
  .icon-group.mobile:not(.menu-open) {
    display: none;
  }

  /* 调整移动端社交图标尺寸 */
  .icon-group.mobile .social-icon {
    width: 40px;
    height: 40px;
  }

  .icon-group.mobile a {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.mobile-panels {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--background-primary);
}

.mobile-panel-header {
  height: 32px;
  background: #EBD2EF;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.header-bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 850px;
  background-image: url('@/assets/icons/bg.svg');
  background-position: top center;
  background-size: 100% auto;
  pointer-events: none;
  opacity: 0.5;
}

.header-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}

.icon-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-title {
  color: var(--Text-P, #2C0CB9);
  font-family: '04b03';
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
}

.mobile-panel-content {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: #FBF7F1;
}

.gallery-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.bg-pattern,
.bg-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 背景图案不影响交互 */
  opacity: 0.5;
}

.bg-pattern {
  background-image: url('@/assets/icons/bg.svg');
  background-repeat: repeat;
  background-position: top center;
  background-size: contain;
}

.bg-line {
  background-image: url('@/assets/bg_line.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% 100%;
}

.gallery-content {
  position: relative;
  z-index: 2;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 确保 FeaturedCollection 和 NFTGallery 组件能正确显示 */
.gallery-content :deep(.featured-collection),
.gallery-content :deep(.nft-gallery) {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 2;
  overflow-y: auto;
}

/* Gallery 背景样式 */
.mobile-panel-content:has(> .featured-collection),
.mobile-panel-content:has(> .nft-gallery) {
  background: #FBF7F1;
  position: relative;
}

.mobile-panel-content:has(> .featured-collection)::before,
.mobile-panel-content:has(> .featured-collection)::after,
.mobile-panel-content:has(> .nft-gallery)::before,
.mobile-panel-content:has(> .nft-gallery)::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.mobile-panel-content:has(> .featured-collection)::before,
.mobile-panel-content:has(> .nft-gallery)::before {
  background-image: url('@/assets/icons/bg.svg');
  background-repeat: repeat;
  background-position: top center;
  background-size: contain;
  opacity: 1;
}

.mobile-panel-content:has(> .featured-collection)::after,
.mobile-panel-content:has(> .nft-gallery)::after {
  background-image: url('@/assets/bg_line.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% 100%;
  opacity: 1;
}

/* 确保内容在背景之上 */
.mobile-panel-content > * {
  height: 100%;
  position: relative;
  z-index: 1;
}

@media (max-width: 768px) {
  .home {
    /* 修改高度计算方式，使用动态视口高度 */
    height: 100dvh;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
  }

  .mobile-layout {
    /* 使用 calc 计算实际可用高度 */
    height: calc(100dvh - 0.64rem);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .mobile-panels {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    /* 添加底部安全区域间距 */
    padding-bottom: env(safe-area-inset-bottom);
  }

  .mobile-panel-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    min-height: 0;
    /* 确保内容可以滚动 */
    position: relative;
  }

  .gallery-content {
    min-height: 100%;
    /* 移除之前的 padding-bottom */
    height: 100%;
    overflow-y: auto;
  }

  /* 修复聊天面板的高度问题 */
  .mobile-panel-content:has(> .chat-panel) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* 确保聊天面板内容可以正确滚动 */
  .chat-panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}

/* Featured Collection header 特殊样式 */
.mobile-panel-header.featured {
  background: #FBF7F1;
}

.mobile-panel-header.featured::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/icons/bg.svg');
  background-repeat: repeat;
  background-position: top center;
  background-size: contain;
  opacity: 1;
  pointer-events: none;
}

/* Chat 折叠面板特殊样式 */
.chat-header .header-content {
  display: flex;
  align-items: center;
}

.chat-header .panel-icon {
  width: 20px;
  height: 20px;
}

.chat-header .chat-icon {
  width: 20px;
  height: 20px;
  margin-left: -1px;
}

.chat-header .chat-title {
  color: var(--Text-P, #2C0CB9);
  font-family: '04b03';
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 18px;
}

/* 确保所有图标大小一致 */
.panel-icon :deep(svg),
.chat-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.misato-link {
  font-family: '04b03';
  font-size: 20px;
  margin-top: 4px;
  color: var(--brand-primary);
  text-decoration: none;
  padding: 4px 8px;
}

.misato-link:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .misato-link {
    font-size: 14px;
  }
}
</style>
