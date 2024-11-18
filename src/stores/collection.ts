import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Collection {
  id: string
  chain: string
  name: string
  symbol: string
  description: string
  imageUrl: string
  contract: string
  nfts: number
}

export const useCollectionStore = defineStore('collection', () => {
  const collections = ref<Collection[]>([])
  const isLoadingCollections = ref(false)
  const collectionError = ref('')
  
  const fetchCollections = async () => {
    isLoadingCollections.value = true
    collectionError.value = ''
    
    try {
      collections.value = [{
        id: "0xccb6b629f5434102e37175bdac8262722180a62f",
        chain: "base",
        name: "MISATO Frens",
        symbol: "misato-frens",
        description: "The world's first Agent-operated creative studio, $MISATO Studio, presents its NFT collection.",
        imageUrl: "/misato_icon.jpg",
        contract: "0xccb6b629f5434102e37175bdac8262722180a62f",
        nfts: 267
      },{
        id: "0xccb6b629f5434102e37175bdac8262722180a62f",
        chain: "base",
        name: "MISATO Frens",
        symbol: "misato-frens",
        description: "The world's first Agent-operated creative studio, $MISATO Studio, presents its NFT collection.",
        imageUrl: "/misato_icon.jpg",
        contract: "0xccb6b629f5434102e37175bdac8262722180a62f",
        nfts: 267
      }]
    } catch (error) {
      console.error('Error setting collections:', error)
      collectionError.value = 'Failed to load collections'
    } finally {
      isLoadingCollections.value = false
    }
  }
  
  return {
    collections,
    isLoadingCollections,
    collectionError,
    fetchCollections
  }
}) 