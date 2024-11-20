<template>
  <div class="featured-container">
    <div class="nav-header">
      <div class="title-row">
        <div class="left-section">
          <span class="title-text">Featured Collection</span>
          <div v-show="isRefreshing" class="icon-button">
            <img src="@/assets/refresh.png" 
                 class="refresh-icon rotating" 
                 alt="Refresh" />
          </div>
        </div>
      </div>
    </div>
    
    <n-scrollbar>
      <div class="collection-grid">
        <div v-for="collection in collectionStore.collections"
             :key="collection.id"
             class="collection-card clickable" 
             @click="handleCollectionClick(collection)">
          <div class="collection-image-wrapper">
            <div class="chain-badge">
              <BaseIcon class="chain-icon" />
              <span class="chain-text">Base</span>
            </div>
            <img :src="collection.imageUrl" 
                 class="collection-image" 
                 :alt="collection.name">
          </div>
          <div class="collection-info">
            <p class="collection-name">{{ collection.name }}</p>
            <p class="collection-nfts">{{ collection.nfts }} NFTs</p>
          </div>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onActivated, ref } from 'vue'
import { useGalleryStore, useCollectionStore } from '@/stores'
import BaseIcon from '@/assets/icons/base.svg?component'
import type { Collection } from '@/stores/collection'

const galleryStore = useGalleryStore()
const collectionStore = useCollectionStore()
const isFirstActivation = ref(true)
const isRefreshing = ref(false)

const handleRefresh = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await collectionStore.fetchCollections()
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 100)
  }
}

onMounted(() => {
  collectionStore.fetchCollections()
})

onActivated(() => {
  if (!isFirstActivation.value) {
    handleRefresh()
  }
  isFirstActivation.value = false
})

const handleCollectionClick = (collection: Collection) => {
  galleryStore.setCurrentCollection(collection)
  galleryStore.setCurrentView('nft-gallery')
}
</script>

<style scoped>
.featured-container {
  height: 100%;
  display: flex;
  padding: 0 0 0 8px;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.nav-header {
  padding: 24px 0 16px 24px;
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

.title-text {
  color: var(--Text-Secondary, #8076FF);
  font-family: '04b03';
  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  line-height: 32px;
  text-align: left;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 320px);
  gap: 16px;
  justify-content: space-between;
  margin: 0 24px;
  padding: 8px 0;
}

.collection-card {
  display: flex;
  width: 320px;
  height: 400px;
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

.collection-card:hover {
  border: 3px solid #2C0CB9;
  background: var(--Background-Secondary, #FFF);
  box-shadow: 4px 4px 0px 0px #FB59F5;
}

.collection-image-wrapper {
  width: 320px;
  height: 320px;
  overflow: hidden;
  position: relative;
  border-bottom: 2px solid #39EDFF;
}

.chain-badge {
  position: absolute;
  
  display: inline-flex;
  height: 28px;
  padding: 2px 10px 2px 2px;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  background: #39EDFF;
  z-index: 1;
}

.chain-icon {
  width: 24px;
  height: 24px;
}

.chain-text {
  color: #2C0CB9;
  font-family: '04b03';
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 16px;
}

.collection-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collection-name {
  color: #2C0CB9;
  font-family: '04b03';
  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-nfts {
  color: #2C0CB9;
  font-family: '04b03';
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clickable {
  cursor: pointer;
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

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
}
</style> 