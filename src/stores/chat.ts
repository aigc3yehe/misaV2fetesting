import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useWalletStore } from './wallet'

interface ChatMessage {
  id: number
  content: string
  role: 'user' | 'assistant' | 'system'
  type: 'text' | 'image' | 'error'
  time?: string
  show_status?: 'send_eth'
  payment_info?: {
    recipient_address: string
    price: string
    network: string
    chainId: number
  }
}

// 首先添加新的接口定义
interface PaymentResponse {
  status: string
  content: string
  conversation: any
  recipient_address: string
  price: string
  network: string
  chainId: number
}

export const useChatStore = defineStore('chat', () => {
  const walletStore = useWalletStore()

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }
  
  // 初始欢迎消息
  const initialMessages = [
    {
      id: 1,
      type: 'text' as const,
      content: '\\### MISATO just opened her own studio! You can ask her about NFT purchases. Minting fee 0.002eth, total supply 500',
      role: 'system' as const,
      time: undefined,
      show_status: undefined
    }/* ,
    {
      id: 2,
      type: 'text' as const,
      role: 'assistant' as const,
      content: "When you complete the payment, please say 'payed' to me, and I will help you verify.\nPlease note:\n1. On-chain confirmation takes some time, please wait a moment after payment before notifying me.\n2. If I don't detect the successful payment hash, you can manually copy and paste it to me.",
      time: formatTime(new Date()),
      show_status: 'send_eth' as const,
      payment_info: {
        recipient_address: "0x900709432a8F2C7E65f90aA7CD35D0afe4eB7169",
        price: "0.001",
        network: "Base Sepolia",
        chainId: 84532
      }
    } */
  ]

  const messages = ref<ChatMessage[]>(initialMessages)

  

  const addMessage = async (message: ChatMessage) => {
    messages.value.push({
      ...message,
      time: formatTime(new Date())
    })
  }

  const removeMessage = (messageId: number) => {
    messages.value = messages.value.filter(m => m.id !== messageId)
  }

  const removeLastMessage = () => {
    messages.value.pop()
  }

  const currentRequestId = ref<string | null>(null)
  const processingState = ref<'idle' | 'thinking' | 'generating' | 'minting'>('idle')

  const sendMessage = async (messageText: string, options?: { pay_fee_hash?: string }) => {
    if (!messageText.trim() || processingState.value !== 'idle') return
    
    processingState.value = 'thinking'
    
    const conversation_history = messages.value
      .filter(msg => msg.role === 'assistant' || msg.role === 'user')
      .map(msg => ({ 
        role: msg.role, 
        content: msg.content 
      }))

    await addMessage({
      id: Date.now(),
      type: 'text',
      role: 'user',
      content: messageText,
      time: formatTime(new Date())
    })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversation_history,
          user_uuid: walletStore.userUuid,
          wallet_address: walletStore.userWalletAddress,
          request_id: currentRequestId.value,
          pay_fee_hash: options?.pay_fee_hash // 添加支付哈希
        })
      })

      const result = await response.json()
      
      // 处理支付相关的响应
      if ((result.status === 'paying' || result.status?.status === 'paying') && 
          (result.recipient_address || result.status?.recipient_address) && 
          (result.price || result.status?.price)) {
        
        // 获取正确的值
        const recipientAddress = result.recipient_address || result.status?.recipient_address
        const price = result.price || result.status?.price
        const network = result.network || result.status?.network
        const chainId = result.chainId || result.status?.chainId
        const content = result.content || result.status?.content
        
        await addMessage({
          id: Date.now() + 1,
          type: 'text',
          role: 'assistant',
          content: content,
          time: formatTime(new Date()),
          show_status: 'send_eth',
          payment_info: {
            recipient_address: recipientAddress,
            price: price,
            network: network,
            chainId: chainId
          }
        })
        processingState.value = 'idle'
        return
      }
      
      if (result.status === 'full') {
        connectionState.value = 'queuing'
        if (result.position) {
          queuePosition.value = result.position
        }
        processingState.value = 'idle'
        return
      }
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      // 将 AI 回复分段发送到 Unity
      const sentences = result.content.split(/[.,!?。！？]/g).filter(Boolean)
      const lastIndex = sentences.length - 1

      // 添加消息到聊天记录
      await addMessage({
        id: Date.now() + 1,
        type: 'text',
        role: 'assistant',
        content: result.content,
        time: formatTime(new Date())
      })

      // 逐句发送到 Unity 进行语音播放前进行数字转换
      sentences.forEach((sentence: string, index: number) => {
        const cleanSentence = sentence.trim()
        if (cleanSentence) {
          window.unityInstance?.SendMessage(
            'JSCall', 
            'AddVoice', 
            JSON.stringify({
              content: convertNumberToWords(cleanSentence), // 添加数字转换
              finish: index === lastIndex
            })
          )
        }
      })

      if (result.request_id) {
        currentRequestId.value = result.request_id
        processingState.value = 'generating'
        pollImageStatus(result.request_id)
      } else {
        processingState.value = 'idle'
      }

    } catch (error) {
      console.error('Error:', error)
      await addMessage({
        id: Date.now() + 1,
        type: 'error',
        role: 'system',
        content: 'Sorry, an error occurred while processing the message. Please try again.',
        time: formatTime(new Date())
      })
      processingState.value = 'idle'
    }
  }

  const retryMessage = async (messageText: string) => {
    removeLastMessage()
    await sendMessage(messageText)
  }

  const pollImageStatus = async (requestId: string) => {
    processingState.value = 'generating'
    
    const progressMessageId = Date.now()
    await addMessage({
      id: progressMessageId,
      type: 'text',
      role: 'system',
      content: '🎨 Generating image...',
      time: formatTime(new Date())
    })
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/generation-status/${requestId}`)
        const result = await response.json()

        if (result.status === 'completed') {
          removeMessage(progressMessageId)
          
          // 添加消息并发送到 Unity
          const content = result.content
          await addMessage({
            id: Date.now() + 1,
            type: 'text',
            role: 'assistant',
            content: content,
            time: formatTime(new Date())
          })

          // 过滤掉图片标记后发送到 Unity
          const cleanContent = content.replace(/!\[.*?\]\(.*?\)/g, '')
          const sentences = cleanContent.split(/[.,!?。！？]/g).filter(Boolean)
          const lastIndex = sentences.length - 1

          sentences.forEach((sentence: string, index: number) => {
            const cleanSentence = sentence.trim()
            if (cleanSentence) {
              window.unityInstance?.SendMessage(
                'JSCall', 
                'AddVoice', 
                JSON.stringify({
                  content: convertNumberToWords(cleanSentence), // 添加数字转换
                  finish: index === lastIndex
                })
              )
            }
          })
          
          processingState.value = 'idle'
          
        } else if (result.status === 'failed') {
          removeMessage(progressMessageId)
          const errorMessage = {
            id: Date.now() + 1,
            type: 'error' as const,
            role: 'system' as const,
            content: 'Image generation failed, please try again.',
            time: formatTime(new Date())
          }
          await addMessage(errorMessage)

          // 发送错误消息到 Unity
          window.unityInstance?.SendMessage(
            'JSCall',
            'AddVoice',
            JSON.stringify({
              content: errorMessage.content,
              finish: true
            })
          )

          processingState.value = 'idle'
          currentRequestId.value = null
        } else {
          setTimeout(checkStatus, 2000)
        }
      } catch (error) {
        console.error('Error polling status:', error)
        removeMessage(progressMessageId)
        const errorMessage = {
          id: Date.now() + 1,
          type: 'error' as const,
          role: 'system' as const,
          content: 'Error checking image generation status',
          time: formatTime(new Date())
        }
        await addMessage(errorMessage)

        // 发送错误消息到 Unity
        window.unityInstance?.SendMessage(
          'JSCall',
          'AddVoice',
          JSON.stringify({
            content: errorMessage.content,
            finish: true
          })
        )

        processingState.value = 'idle'
        currentRequestId.value = null
      }
    }
    
    checkStatus()
  }

  // 修改重置消息的方法
  const resetMessages = () => {
    messages.value = [...initialMessages]
  }

  // 添加排队相关状态
  const queuePosition = ref(0)
  const connectionState = ref<'not-connected' | 'queuing' | 'ready'>('not-connected')

  // 检查连接状态的方法
  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/initial-connection/${walletStore.userUuid}`)
      const data = await response.json()
      
      if (data.status === 'yes') {
        // 从排队状态切换回来
        if (connectionState.value === 'queuing') {
          // 获取最后一条消息
          const lastMessage = messages.value[messages.value.length - 1]
          
          // 如果最后一条是用户消息，则重新发送
          if (lastMessage && lastMessage.role === 'user') {
            removeMessage(lastMessage.id)
            await sendMessage(lastMessage.content)
          }
        }
        
        connectionState.value = 'ready'
      } else if (data.status === 'full') {
        connectionState.value = 'queuing'
        queuePosition.value = data.position
      }
    } catch (err) {
      console.error('Failed to check connection status:', err)
      connectionState.value = 'not-connected'
    }
  }

  // 监听钱包连接状态
  watch(() => walletStore.isConnected, async (newValue) => {
    if (newValue) {
      // 钱包连接后开始检查连接状态
      console.log('钱包连接后开始检查连接状态isConnected', walletStore.isConnected)
      await checkConnectionStatus()
    } else {
      connectionState.value = 'not-connected'
      resetMessages()
    }
  }, { immediate: true })

  const convertNumberToWords = (text: string): string => {
    const numberWords: { [key: string]: string } = {
      '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
      '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
      '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen',
      '14': 'fourteen', '15': 'fifteen', '16': 'sixteen',
      '17': 'seventeen', '18': 'eighteen', '19': 'nineteen',
      '20': 'twenty', '30': 'thirty', '40': 'forty', '50': 'fifty',
      '60': 'sixty', '70': 'seventy', '80': 'eighty', '90': 'ninety'
    }

    return text.replace(/\b\d*\.?\d+\b/g, (match) => {
      // 处理小数
      if (match.includes('.')) {
        const [intPart, decPart] = match.split('.')
        const intWords = intPart === '' ? 'zero' : 
                        intPart === '0' ? 'zero' : 
                        convertNumber(intPart)
        
        const decWords = decPart.split('')
          .map(digit => numberWords[digit])
          .join(' ')
        
        return `${intWords} point ${decWords}`
      }
      
      // 处理整数
      return convertNumber(match)
    })

    // 处理数字的辅助函数
    function convertNumber(num: string): string {
      const number = parseInt(num)
      
      // 处理 0-99 的数字
      if (number >= 0 && number < 100) {
        if (numberWords[num]) {
          return numberWords[num]
        }
        if (number > 20) {
          const tens = Math.floor(number / 10) * 10
          const ones = number % 10
          return ones > 0 
            ? `${numberWords[tens.toString()]}-${numberWords[ones.toString()]}` 
            : numberWords[tens.toString()]
        }
      }
      
      // 对于其他数字，逐个读出
      return num.split('')
        .map(digit => numberWords[digit])
        .join(' ')
    }
  }

  return {
    messages,
    processingState,
    currentRequestId,
    addMessage,
    removeMessage,
    removeLastMessage,
    sendMessage,
    pollImageStatus,
    retryMessage,
    resetMessages,  // 导出重置方法以便需要时手动调用
    connectionState,
    queuePosition,
    checkConnectionStatus
  }
}) 