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
}

export const useChatStore = defineStore('chat', () => {
  const walletStore = useWalletStore()
  
  // 初始欢迎消息
  const initialMessage = {
    id: 1,
    type: 'text' as const,
    content: '\\### MISATO just opened her own studio! You can ask her about NFT purchases. Minting fee 0.002eth, total supply 500',
    role: 'system' as const,
    time: undefined,
    show_status: undefined
  }

  const messages = ref<ChatMessage[]>([initialMessage])

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

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

  const sendMessage = async (messageText: string) => {
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
          request_id: currentRequestId.value
        })
      })

      const result = await response.json()
      
      if (result.status === 'full') {
        await addMessage({
          id: Date.now() + 1,
          type: 'error',
          role: 'system',
          content: result.content,
          time: formatTime(new Date())
        })
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

      // 逐句发送到 Unity 进行语音播放
      sentences.forEach((sentence: string, index: number) => {
        const cleanSentence = sentence.trim()
        if (cleanSentence) {
          window.unityInstance?.SendMessage(
            'JSCall', 
            'AddVoice', 
            JSON.stringify({
              content: cleanSentence,
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
          
          await addMessage({
            id: Date.now() + 1,
            type: 'text',
            role: 'assistant',
            content: result.content,
            time: formatTime(new Date())
          })
          
          processingState.value = 'idle'
          
        } else if (result.status === 'failed') {
          removeMessage(progressMessageId)
          await addMessage({
            id: Date.now() + 1,
            type: 'error',
            role: 'system',
            content: 'Image generation failed, please try again.',
            time: formatTime(new Date())
          })
          processingState.value = 'idle'
          currentRequestId.value = null
        } else {
          setTimeout(checkStatus, 2000)
        }
      } catch (error) {
        console.error('Error polling status:', error)
        removeMessage(progressMessageId)
        await addMessage({
          id: Date.now() + 1,
          type: 'error',
          role: 'system',
          content: 'Error checking image generation status',
          time: formatTime(new Date())
        })
        processingState.value = 'idle'
        currentRequestId.value = null
      }
    }
    
    checkStatus()
  }

  // 添加重置消息的方法
  const resetMessages = () => {
    messages.value = [initialMessage]
  }

  // 监听钱包连接状态
  watch(() => walletStore.isConnected, (newValue) => {
    resetMessages()
  })

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
    resetMessages  // 导出重置方法以便需要时手动调用
  }
}) 