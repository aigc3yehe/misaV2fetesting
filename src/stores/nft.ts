import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface NFT {
  id: string
  name: string
  image: string
  contract: string
  description?: string
}

export const useNFTStore = defineStore('nft', () => {
  // 状态
  const nfts = ref<NFT[]>([])
  const isLoadingNFTs = ref(false)
  const nftError = ref('')
  
  // 常量
  const CONTRACT_ADDRESS = '0xccb6B629f5434102e37175BDac8262722180a62f'
  const API_CONFIG = {
    baseUrl: 'https://base-mainnet.g.alchemy.com/nft/v3',
    apiKey: 'goUyG3r-JBxlrxzsqIoyv0b_W-LwScsN'
  }

  // Actions
  const fetchNFTs = async () => {
    isLoadingNFTs.value = true
    nftError.value = ''
    
    try {
      let pageKey = null
      let allNfts: NFT[] = []

      do {
        const queryParams = new URLSearchParams({
          contractAddress: CONTRACT_ADDRESS,
          withMetadata: 'true',
          limit: '500',
          ...(pageKey && { pageKey })
        })

        const response = await fetch(
          `${API_CONFIG.baseUrl}/${API_CONFIG.apiKey}/getNFTsForContract?${queryParams}`
        )
        
        const data = await response.json()
        
        const newNfts = data.nfts.map((nft: any) => ({
          id: nft.tokenId,
          name: nft.name || nft.raw?.metadata?.name || `MISATO Frens #${nft.tokenId}`,
          image: nft.image?.originalUrl || nft.raw?.metadata?.image || nft.image?.cachedUrl,
          description: nft.description || nft.raw?.metadata?.description,
          contract: nft.contract.address
        }))
        
        allNfts = [...allNfts, ...newNfts]
        pageKey = data.pageKey
      } while (pageKey)

      nfts.value = allNfts.sort((a, b) => Number(b.id) - Number(a.id))
    } catch (error) {
      console.error('Error fetching NFTs:', error)
      nftError.value = 'Failed to load NFTs'
    } finally {
      isLoadingNFTs.value = false
    }
  }

  return {
    // 状态
    nfts,
    isLoadingNFTs,
    nftError,
    
    // 常量
    CONTRACT_ADDRESS,
    
    // Actions
    fetchNFTs
  }
}) 