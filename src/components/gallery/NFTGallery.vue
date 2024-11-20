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
          <div class="icon-button clickable copy-button" @click="copyAddress">
            <CopyIcon class="icon-default" />
          </div>
          <div class="icon-button clickable me-button" @click="openMagicEdenCollection">
            <MisatoMeIcon class="icon-default" />
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

    <!-- 添加一个包装div作为容器 -->
    <div ref="containerRef" class="list-container">
      <n-virtual-list
        class="virtual-list"
        :items="gridRows"
        :item-size="268"
        key-field="id"
        :scrollbar-props="{
          trigger: 'hover',
          size: 6
        }"
      >
        <template #default="{ item: row }">
          <div class="nft-grid-row" :style="{ gap: `${gapWidth}px` }">
            <template v-for="nft in row.items" :key="nft.isFiller ? nft.id : `${nft.contract}-${nft.id}`">
              <!-- 真实NFT卡片 -->
              <div 
                v-if="!nft.isFiller"
                class="nft-card clickable"
                @click="openNftLink(nft.contract, nft.id)"
              >
                <div class="nft-image-wrapper">
                  <LazyImage
                    :key="`img-${nft.contract}-${nft.id}`"
                    :src="nft.image"
                    :alt="nft.name"
                    class="nft-image"
                    @error="handleImageError"
                  />
                </div>
                <div class="nft-info">
                  <p class="nft-name">{{ nft.name }}</p>
                </div>
              </div>
              <!-- 空白填充卡片 -->
              <div 
                v-else
                class="nft-card filler"
              ></div>
            </template>
          </div>
        </template>
      </n-virtual-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, defineComponent, h, watchEffect } from 'vue'
import { useNFTStore, useWalletStore } from '@/stores'
import defaultNftImage from '@/assets/misato-avatar.png'
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg?component'
import CopyIcon from '@/assets/icons/copy.svg?component'
import MisatoMeIcon from '@/assets/icons/misato_me.svg?component'
import { useMessage } from 'naive-ui'
import { useGalleryStore } from '@/stores'
import selectedIcon from '@/assets/icons/selected.svg?component'
import unselectIcon from '@/assets/icons/unselect.svg?component'
import { NVirtualList } from 'naive-ui'

const message = useMessage()
const nftStore = useNFTStore()
const walletStore = useWalletStore()
const galleryStore = useGalleryStore()
const isOwned = ref(false)
const isRefreshing = ref(false)
const refreshKey = ref(0)
const containerRef = ref<HTMLElement | null>(null)
const itemsPerRow = ref(5)
const gapWidth = ref(16)

// 移除旧的 filteredNFTs 计算属性
const filteredNFTs = computed(() => {
  // 直接返回 store 中的 NFTs，不需要额外过滤
  return nftStore.nfts
})

// 计算每行可显示的卡片数量和间距
const calculateLayout = () => {
  if (!containerRef.value) return
  
  const containerWidth = containerRef.value.clientWidth - 48 // 减去左右padding (24px * 2)
  const cardWidth = 200 // 卡片固定宽度
  const minGap = 16 // 最小间距
  
  // 计算能放下的卡片数量
  const count = Math.floor((containerWidth + minGap) / (cardWidth + minGap))
  itemsPerRow.value = Math.max(1, count)
  
  // 计算实际间距
  const totalGapWidth = containerWidth - (cardWidth * itemsPerRow.value)
  const gaps = itemsPerRow.value - 1 // 间隙数量
  if (gaps > 0) {
    gapWidth.value = Math.floor(totalGapWidth / gaps)
  }
}

// 监听容器大小变化
onMounted(() => {
  const resizeObserver = new ResizeObserver(calculateLayout)
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  
  // 初始计算
  calculateLayout()

  onUnmounted(() => {
    resizeObserver.disconnect()
  })
})

// 将NFTs数组转换为网格行数组
const gridRows = computed(() => {
  const rows = []
  for (let i = 0; i < filteredNFTs.value.length; i += itemsPerRow.value) {
    const rowItems = filteredNFTs.value.slice(i, i + itemsPerRow.value)
    // 添加空白卡片填充最后一行
    const fillers = Array(itemsPerRow.value - rowItems.length).fill(null).map((_, index) => ({
      id: `filler-${i}-${index}`,
      isFiller: true
    }))
    rows.push({
      id: `row-${i}`,
      items: [...rowItems, ...fillers]
    })
  }
  return rows
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
      await nftStore.fetchOwnedNFTs(
        walletStore.userWalletAddress,
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

// LazyImage 组件优化
const LazyImage = defineComponent({
  name: 'LazyImage',
  props: {
    src: String,
    alt: String
  },
  setup(props) {
    const imgRef = ref<HTMLImageElement | null>(null)
    const isLoaded = ref(false)
    const observer = ref<IntersectionObserver | null>(null)
    const currentSrc = ref('')

    // 使用 watchEffect 来处理 src 变化
    watchEffect(() => {
      if (props.src && isLoaded.value) {
        currentSrc.value = props.src
      }
    })

    onMounted(() => {
      observer.value = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isLoaded.value && imgRef.value && props.src) {
            currentSrc.value = props.src
            isLoaded.value = true
            observer.value?.unobserve(entry.target)
          }
        })
      }, {
        rootMargin: '100% 0px',
        threshold: 0
      })

      if (imgRef.value) {
        observer.value.observe(imgRef.value)
      }
    })

    onUnmounted(() => {
      observer.value?.disconnect()
    })

    return () => h('img', {
      ref: imgRef,
      src: currentSrc.value,
      class: ['nft-image', { 'loaded': isLoaded.value }],
      alt: props.alt,
      loading: 'lazy'
    })
  }
})
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
  pointer-events: auto;
}

.back-row {
  margin-bottom: 12px;
  margin-left: -8px;
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
  display: block;
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
  display: block;
}

.title-text {
  color: var(--Text-Secondary, #8076FF);
  font-family: '04b03';
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  pointer-events: auto;
  cursor: pointer;
}

.icon-default {
  width: 24px;
  height: 24px;
  color: #8076FF;
  display: block;
}

.owned-filter {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  pointer-events: auto;
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

/* 虚拟列表样式 */
.list-container {
  flex: 1;
  height: calc(100vh - 140px);
  width: 100%;
}

.virtual-list {
  height: 100%;
  pointer-events: auto;
}

/* 自定义滚动条样式 */
:deep(.n-scrollbar-rail) {
  background-color: transparent !important;
}

:deep(.n-scrollbar-rail.vertical) {
  width: 6px !important;
}

:deep(.n-scrollbar-rail__scrollbar) {
  width: 6px !important;
  background-color: rgba(128, 118, 255, 0.6) !important;
  border-radius: 3px !important;
}

:deep(.n-scrollbar-rail__scrollbar:hover) {
  background-color: rgba(128, 118, 255, 0.8) !important;
}

:deep(.n-scrollbar-rail__track) {
  background-color: rgba(128, 118, 255, 0.1) !important;
}

.nft-grid-row {
  display: flex;
  padding: 16px 24px 0;
  justify-content: flex-start; /* 改为靠左对齐 */
}

.nft-grid-row:last-child {
  padding-bottom: 16px;
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
  border: 3px solid var(--Text-P, #2C0CB9);
  background: #FFF;
}

.nft-card:hover .nft-info {
  background: #FFF;
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
  opacity: 0;
  transition: opacity 0.3s ease;
  will-change: opacity;
}

.nft-image.loaded {
  opacity: 1;
}

.nft-info {
  padding: 16px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: #E8C4EA;
  transition: background 0.2s ease;
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
  text-align: center;
}

/* 确保所有可点击元素都有pointer-events */
.clickable {
  pointer-events: auto;
  cursor: pointer;
}

.copy-button {
  margin-left: 12px;
}

.me-button {
  margin-left: 12px;
}

/* 添加填充卡片样式 */
.nft-card.filler {
  border: none;
  background: transparent;
  box-shadow: none;
  pointer-events: none;
  visibility: hidden; /* 使用 visibility: hidden 而不是 display: none 以保持布局 */
}
</style> 