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
          <div class="icon-button clickable" @click="nftStore.fetchNFTs(galleryStore.currentCollection?.contract)">
            <RefreshIcon class="icon-default" />
            <RefreshIconHover class="icon-hover" />
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
          <n-checkbox class="clickable">Owned</n-checkbox>
        </div>
      </div>
    </div>

    <!-- 原有的滚动内容区域 -->
    <n-scrollbar>
      <div v-if="nftStore.isLoadingNFTs" class="loading-container">
        <n-spin size="large" />
      </div>
      <div v-else class="nft-grid">
        <div v-for="nft in nftStore.nfts" 
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
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNFTStore } from '@/stores'
import defaultNftImage from '@/assets/misato-avatar.png'
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg?component'
import RefreshIcon from '@/assets/icons/refresh-r.svg?component'
import RefreshIconHover from '@/assets/icons/refresh-r.svg?component'
import CopyIcon from '@/assets/icons/copy.svg?component'
import CopyIconHover from '@/assets/icons/copy.svg?component'
import MisatoMeIcon from '@/assets/icons/misato_me.svg?component'
import MisatoMeHover from '@/assets/icons/misato_me.svg?component'
import MisatoFrensIcon from '@/assets/icons/MISATO_frens.svg?component'
import { useMessage } from 'naive-ui'
import { useGalleryStore } from '@/stores'

const message = useMessage()
const nftStore = useNFTStore()
const galleryStore = useGalleryStore()

onMounted(() => {
  if (galleryStore.currentCollection) {
    nftStore.fetchNFTs(galleryStore.currentCollection.contract)
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
</script>

<style scoped>
.gallery-container {
  height: 100%;
  display: flex;
  padding: 0 0 0 8px;
  flex-direction: column;
  background: #131313;
}

.nav-header {
  padding: 16px 24px;
}

.back-row {
  margin-bottom: 16px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #707A8A;
  font-family: 'PPNeueBit', monospace;
  font-size: 16px;
  cursor: pointer;
  width: fit-content;
  padding: 4px 8px;
  margin-left: -8px;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.back-button:hover {
  background: rgba(250, 117, 255, 0.1);
}

.back-button svg {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
}

.back-text {
  line-height: 16px;
  display: inline-block;
  margin-bottom: 4px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
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

.title-text {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 400;
  line-height: 24px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}

.contract-code {
  font-size: 14px;
  color: #666;
}

.right-section :deep(.n-checkbox) {
  --n-label-color: #FA75FF;
  font-family: 'PPNeueBit', monospace;
}

.nft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 16px;
  justify-content: space-between;
  margin-left: 24px;
  background: #131313;
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
  height: 272px;
  background: #1B1B1B;
  border-radius: 16px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.nft-card:hover {
  border: 2px solid #FA75FF;
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
  padding: 12px;
}

.nft-name {
  color: #fff;
  font-size: 20px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 其他样式保持不变... */
</style> 