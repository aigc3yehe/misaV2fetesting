import { defineStore } from 'pinia'
import type { Collection } from './collection'

type GalleryView = 'featured' | 'nft-gallery'

export const useGalleryStore = defineStore('gallery', {
  state: () => ({
    currentView: 'featured' as GalleryView,
    currentCollection: null as Collection | null
  }),
  
  actions: {
    setCurrentView(view: GalleryView) {
      this.currentView = view
    },
    
    setCurrentCollection(collection: Collection) {
      this.currentCollection = collection
    }
  }
}) 