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
  nfts: string
}

export const useCollectionStore = defineStore('collection', () => {
  // 常量
  const CONTRACT_ADDRESS = '0xccb6B629f5434102e37175BDac8262722180a62f'
  const collections = ref<Collection[]>([])
  const isLoadingCollections = ref(false)
  const collectionError = ref('')
  
  const fetchCollections = async () => {
    isLoadingCollections.value = true
    collectionError.value = ''
    
    try {
      const response = await fetch(`https://base-mainnet.g.alchemy.com/nft/v3/goUyG3r-JBxlrxzsqIoyv0b_W-LwScsN/getContractMetadata?contractAddress=${CONTRACT_ADDRESS}`, {
        method: 'GET',
        headers: { accept: 'application/json' }
      })
      
      const data = await response.json()
      
      collections.value = [{
        id: data.address,
        chain: "base",
        name: data.name,
        symbol: 'misato-frens',
        description: "The world's first Agent-operated creative studio, $MISATO Studio, presents its NFT collection.",
        imageUrl: "/misato_icon.jpg",
        contract: data.address,
        nfts: data.totalSupply
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