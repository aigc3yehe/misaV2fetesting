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
  const fetchNFTs = async (contractAddress: string | undefined) => {
    if (!contractAddress) return
    isLoadingNFTs.value = true
    nftError.value = ''
    
    try {
      let pageKey: string | null = null
      let allNfts: NFT[] = []

      do {
        const queryParams: URLSearchParams = new URLSearchParams({
          contractAddress: contractAddress,
          withMetadata: 'true',
          limit: '500',
          ...(pageKey && { pageKey })
        })

        const response: Response = await fetch(
          `${API_CONFIG.baseUrl}/${API_CONFIG.apiKey}/getNFTsForContract?${queryParams}`
        )
        
        interface NFTResponse {
          nfts: Array<{
            tokenId: string
            name?: string
            raw?: {
              metadata?: {
                name?: string
                image?: string
                description?: string
              }
            }
            image?: {
              originalUrl?: string
              cachedUrl?: string
            }
            description?: string
            contract: {
              address: string
            }
          }>
          pageKey?: string
        }
        
        const data: NFTResponse = await response.json()
        
        const newNfts = data.nfts.map((nft: any) => ({
          id: nft.tokenId,
          name: nft.name || nft.raw?.metadata?.name || `MISATO Frens #${nft.tokenId}`,
          image: nft.image?.originalUrl || nft.raw?.metadata?.image || nft.image?.cachedUrl,
          description: nft.description || nft.raw?.metadata?.description,
          contract: nft.contract.address
        }))
        
        allNfts = [...allNfts, ...newNfts]
        pageKey = data.pageKey || null
      } while (pageKey)

      nfts.value = allNfts.sort((a, b) => Number(b.id) - Number(a.id))
    } catch (error) {
      console.error('Error fetching NFTs:', error)
      nftError.value = 'Failed to load NFTs'
    } finally {
      isLoadingNFTs.value = false
    }
  }

  // 新增 action
  const fetchOwnedNFTs = async (ownerAddress: string, contractAddress: string) => {
    if (!ownerAddress || !contractAddress) return
    isLoadingNFTs.value = true
    nftError.value = ''
    
    try {
      const queryParams = new URLSearchParams({
        owner: ownerAddress,
        'contractAddresses': contractAddress
      })

      const response = await fetch(
        `${API_CONFIG.baseUrl}/${API_CONFIG.apiKey}/getNFTsForOwner?${queryParams}`
      )
      
      interface OwnedNFTResponse {
        ownedNfts: Array<{
          tokenId: string
          name?: string
          raw?: {
            metadata?: {
              name?: string
              image?: string
              description?: string
            }
          }
          image?: {
            originalUrl?: string
            cachedUrl?: string
          }
          description?: string
          contract: {
            address: string
          }
        }>
      }
      
      const data: OwnedNFTResponse = await response.json()
      
      const ownedNfts = data.ownedNfts.map(nft => ({
        id: nft.tokenId,
        name: nft.name || nft.raw?.metadata?.name || `MISATO Frens #${nft.tokenId}`,
        image: nft.image?.originalUrl || nft.raw?.metadata?.image || nft.image?.cachedUrl || '',
        description: nft.description || nft.raw?.metadata?.description,
        contract: nft.contract.address
      }))

      nfts.value = ownedNfts.sort((a, b) => Number(b.id) - Number(a.id))
    } catch (error) {
      console.error('Error fetching owned NFTs:', error)
      nftError.value = 'Failed to load owned NFTs'
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
    fetchNFTs,
    fetchOwnedNFTs
  }
}) 