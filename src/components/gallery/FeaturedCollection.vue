<template>
  <div class="featured-container">
    <div class="nav-header">
      <div class="title-row">
        <div class="left-section">
          <span class="title-text">Featured Collection</span>
        </div>
      </div>
    </div>
    
    <n-scrollbar>
      <div v-if="collectionStore.isLoadingCollections" class="loading-container">
        <n-spin size="large" />
      </div>
      <div v-else class="collection-grid">
        <div v-for="collection in collectionStore.collections"
             :key="collection.id"
             class="collection-card clickable" 
             @click="handleCollectionClick(collection)">
          <div class="collection-image-wrapper">
            <BaseIcon class="chain-icon" />
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
import { onMounted } from 'vue'
import { useGalleryStore, useCollectionStore } from '@/stores'
import BaseIcon from '@/assets/icons/base.svg?component'
import type { Collection } from '@/stores/collection'

const galleryStore = useGalleryStore()
const collectionStore = useCollectionStore()

onMounted(() => {
  collectionStore.fetchCollections()
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
}

.nav-header {
  padding: 16px 24px;
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
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 400;
  line-height: 32px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
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
  width: 320px;
  height: 400px;
  background: #1B1B1B;
  border-radius: 16px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.collection-card:hover {
  border: 2px solid #FA75FF;
}

.collection-image-wrapper {
  width: 320px;
  height: 320px;
  overflow: hidden;
  position: relative;
}

.chain-icon {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  z-index: 1;
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
  gap: 0px;
}

.collection-name {
  color: #FFFFFF;
  font-size: 20px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-nfts {
  color: #707A8A;
  font-size: 14px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clickable {
  cursor: pointer;
}
</style> 