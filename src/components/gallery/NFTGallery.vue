<template>
  <n-card class="gallery-card">
    <template #header>
      <div class="gallery-header">
        <div class="gallery-title">
          <span>MISATO Frens</span>
          <n-button circle size="small" @click="nftStore.fetchNFTs">
            <template #icon>
              <n-icon><RefreshIcon /></n-icon>
            </template>
          </n-button>
        </div>
        <div class="contract-address">
          <n-text code>{{ nftStore.CONTRACT_ADDRESS }}</n-text>
          <n-button circle size="tiny" @click="copyAddress" class="copy-button">
            <template #icon>
              <n-icon><CopyIcon /></n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </template>

    <n-scrollbar>
      <div v-if="nftStore.isLoadingNFTs" class="loading-container">
        <n-spin size="large" />
      </div>
      <div v-else class="nft-grid">
        <n-card v-for="nft in nftStore.nfts" 
                :key="nft.id" 
                class="nft-card"
                @click="openNftLink(nft.contract, nft.id)">
          <div class="nft-image-wrapper">
            <img :src="nft.image" 
                 class="nft-image" 
                 @error="handleImageError"
                 alt="NFT Image">
          </div>
          <div class="nft-info">
            <p class="nft-name">
              <span class="name-text">{{ nft.name }}</span>
            </p>
          </div>
        </n-card>
      </div>
    </n-scrollbar>
  </n-card>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNFTStore } from '@/stores'
import { RefreshOutline as RefreshIcon, Copy as CopyIcon } from '@vicons/ionicons5'
import defaultNftImage from '@/assets/misato-avatar.png'
import { useMessage } from 'naive-ui'

const message = useMessage()
const nftStore = useNFTStore()

onMounted(() => {
  nftStore.fetchNFTs()
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
</script>

<style scoped>
.gallery-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.nft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 16px;
  padding: 16px;
  justify-content: start;
  padding-left: 28px;
}

/* 其他样式保持不变... */
</style> 