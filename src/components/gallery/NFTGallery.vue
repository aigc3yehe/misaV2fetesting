<template>
  <div class="gallery-container">
    <!-- 导航栏 -->
    <div class="nav-header">
      <!-- 返回按钮行 -->
      <div class="back-row">
        <div class="back-button clickable" @click="handleBack">
          <ArrowLeftIcon />
          <span class="back-text">Back</span>
        </div>
      </div>
      
      <!-- 标题行 -->
      <div class="title-row">
        <div class="left-section">
          <div class="icon-button clickable" @click="handleRefresh">
            <img src="@/assets/refresh.png" 
                 class="refresh-icon" 
                 :class="{ 'rotating': isRefreshing }" 
                 alt="Refresh" />
          </div>
          <img :src="galleryStore.currentCollection?.imageUrl" class="avatar" alt="Collection Avatar" />
          <span class="title-text">{{ galleryStore.currentCollection?.name }}</span>
          <div class="icon-button clickable" @click="copyAddress">
            <CopyIcon class="icon-default" />
            <CopyIconHover class="icon-hover" />
          </div>
          <div class="icon-button clickable" @click="openMagicEdenCollection">
            <MisatoMeIcon class="icon-default" />
            <MisatoMeHover class="icon-hover" />
          </div>
          
        </div>
        <div class="right-section">
          <div class="owned-filter clickable" @click="toggleOwned">
            <component :is="isOwned ? selectedIcon : unselectIcon" class="owned-icon" />
            <span class="owned-text">Owned</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 原有的滚动内容区域 -->
    <n-scrollbar>
      <div class="nft-grid">
        <TransitionGroup name="nft-refresh" :key="refreshKey">
          <div v-for="nft in filteredNFTs" 
               :key="nft.id" 
               class="nft-card clickable"
               @click="openNftLink(nft.contract, nft.id)">
            <div class="nft-image-wrapper">
              <img :src="nft.image" 
                   class="nft-image" 
                   @error="handleImageError"
                   alt="NFT Image">
            </div>
            <div class="nft-info">
              <p class="nft-name">{{ nft.name }}</p>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useNFTStore, useWalletStore } from '@/stores'
import defaultNftImage from '@/assets/misato-avatar.png'
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg?component'
import RefreshIcon from '@/assets/icons/refresh-r.svg?component'
import RefreshIconHover from '@/assets/icons/refresh-r.svg?component'
import CopyIcon from '@/assets/icons/copy.svg?component'
import CopyIconHover from '@/assets/icons/copy.svg?component'
import MisatoMeIcon from '@/assets/icons/misato_me.svg?component'
import MisatoMeHover from '@/assets/icons/misato_me.svg?component'
import { useMessage } from 'naive-ui'
import { useGalleryStore } from '@/stores'
import selectedIcon from '@/assets/icons/selected.svg?component'
import unselectIcon from '@/assets/icons/unselect.svg?component'

const message = useMessage()
const nftStore = useNFTStore()
const walletStore = useWalletStore()
const galleryStore = useGalleryStore()
const isOwned = ref(false)
const isRefreshing = ref(false)
const refreshKey = ref(0)

// 添加测试地址常量
const TEST_WALLET_ADDRESS = '0x006383a4fc4de3761c1603ab6281501e5e82618f'

// 移除旧的 filteredNFTs 计算属性
const filteredNFTs = computed(() => {
  // 直接返回 store 中的 NFTs，不需要额外过滤
  return nftStore.nfts
})

onMounted(async () => {
  if (galleryStore.currentCollection) {
    isRefreshing.value = true
    try {
      await nftStore.fetchNFTs(galleryStore.currentCollection.contract)
    } finally {
      isRefreshing.value = false
    }
  }
})

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(nftStore.CONTRACT_ADDRESS)
    message.success('Copy success')
  } catch (err) {
    console.error('Copy error:', err)
    message.error('Copy failed')
  }
}

const openNftLink = (contract: string, tokenId: string) => {
  const url = `https://magiceden.io/item-details/base/${contract}/${tokenId}`
  window.open(url, '_blank')
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  if (target) target.src = defaultNftImage
}

const handleBack = () => {
  galleryStore.setCurrentView('featured')
}

const openMagicEdenCollection = () => {
  if (galleryStore.currentCollection) {
    const { chain, symbol } = galleryStore.currentCollection
    const url = `https://magiceden.io/collections/${chain}/${symbol}`
    window.open(url, '_blank')
  }
}

const toggleOwned = async () => {
  if (!walletStore.isConnected) {
    message.warning('Please connect your wallet first')
    return
  }
  
  isRefreshing.value = true
  try {
    isOwned.value = !isOwned.value
    
    if (isOwned.value && galleryStore.currentCollection) {
      const ownerAddress = import.meta.env.DEV 
        ? TEST_WALLET_ADDRESS 
        : walletStore.userWalletAddress
        
      await nftStore.fetchOwnedNFTs(
        ownerAddress,
        galleryStore.currentCollection.contract
      )
    } else if (galleryStore.currentCollection) {
      await nftStore.fetchNFTs(galleryStore.currentCollection.contract)
    }
    
    // 强制更新视图
    refreshKey.value++
  } finally {
    isRefreshing.value = false
  }
}

const handleRefresh = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await nftStore.fetchNFTs(galleryStore.currentCollection?.contract)
  } finally {
    // 即使数据相同，也给用户一个短暂的视觉反馈
    setTimeout(() => {
      refreshKey.value++
      isRefreshing.value = false
    }, 100)
  }
}
</script>

<style scoped>
.gallery-container {
  height: 100%;
  display: flex;
  padding: 0 0 0 8px;
  flex-direction: column;
  position: relative;
  z-index: 2;
  pointer-events: none;
}

.nav-header {
  padding: 16px 24px;
}

.back-row {
  margin-bottom: 12px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #8076FF;
  margin-left: -4px;
  cursor: pointer;
  padding: 4px 8px;
  transition: all 0.2s ease;
  width: fit-content;
}

.back-button:hover {
  background: rgba(128, 118, 255, 0.1);
  box-shadow: 0 2px 4px rgba(128, 118, 255, 0.2);
  border-radius: 4px;
}

.back-button svg {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
}

.back-text {
  color: #8076FF;
  font-family: '04b03';
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 32px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.5s ease;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-left: 16px;
}

.title-text {
  color: var(--Text-Secondary, #8076FF);
  font-family: '04b03';
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
}

.misato-frens-icon {
  color: var(--brand-secondary);
  display: flex;
  align-items: center;
  width: 214px !important;
  height: 16px !important;
}

.misato-frens-icon :deep(svg) {
  width: 214px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.misato-frens-icon:deep(.n-icon) {
  width: 214px !important;
  height: 16px !important;
  font-size: 32px !important;
}

.contract-code {
  font-size: 14px;
  color: #666;
}

.right-section :deep(.n-checkbox) {
  --n-label-color: #FA75FF;
  --n-color-checked: #FF00FF;
  font-family: 'PPNeueBit', monospace;
}

.right-section :deep(.n-checkbox .n-checkbox__label) {
  font-family: '04b03';
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}

.nft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 16px;
  justify-content: space-between;
  margin-left: 24px;
}

.icon-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;           
  transition: background-color 0.2s;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.07);
}

.icon-button svg {
  width: 24px;
  height: 24px;
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

:deep(.n-button) {
  --n-color: transparent !important;
  --n-color-hover: transparent !important;
  --n-color-pressed: transparent !important;
  --n-border: none !important;
  --n-border-hover: none !important;
  --n-border-pressed: none !important;
}

.nft-card {
  width: 200px;
  height: 252px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 3px solid #39EDFF;
  background: #E8C4EA;
  box-shadow: 4px 4px 0px 0px #FB59F5;
  border-radius: 0px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.nft-card:hover {
  border: 3px solid #2C0CB9;
  background: #FFF;
  box-shadow: 4px 4px 0px 0px #FB59F5;
}

.nft-image-wrapper {
  width: 200px;
  height: 200px;
  overflow: hidden;
}

.nft-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nft-info {
  padding: 16px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nft-name {
  color: #2C0CB9;
  font-family: '04b03';
  font-size: 15px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.owned-filter {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.owned-filter:hover {
  background: rgba(255, 255, 255, 0.07);
}

.owned-icon {
  width: 16px;
  height: 16px;
}

.owned-text {
  color: var(--Text-Secondary, #8076FF);
  font-family: '04b03';
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 16px;
  text-align: left;
}

/* NFT卡片刷新动画 */
.nft-refresh-enter-active,
.nft-refresh-leave-active {
  transition: all 0.3s ease;
}

.nft-refresh-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.nft-refresh-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 确保卡片在网格中的位置变化是平滑的 */
.nft-refresh-move {
  transition: transform 0.3s ease;
}

/* 添加这些选择器来恢复特定元素的点击事件 */
.nav-header,
.nft-grid,
.back-button,
.icon-button,
.owned-filter,
.nft-card {
  pointer-events: auto;
}
</style> 