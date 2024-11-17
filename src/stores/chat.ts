import { defineStore } from 'pinia'
import { ref } from 'vue'

interface ChatMessage {
  id: number
  content: string
  role: 'user' | 'assistant' | 'system'
  type: 'text' | 'image' | 'error'
  time?: string
  show_status?: 'send_eth'
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([
    {
      id: 1,
      type: 'text',
      content: '\\### MISATO just opened her own studio! You can ask her about NFT purchases. Minting fee 0.002eth, total supply 500',
      role: 'system',
    },
    {
      id: 1,
      type: 'text',
      content: 'To ensure that the account has sufficient funds, please select a payment method.',
      role: 'system',
      show_status: 'send_eth'
    },
    {
      id: 1,
      type: 'text',
      content: 'To ensure that the account ',
      role: 'system',
      show_status: 'send_eth'
    },
    {
      id: 1,
      type: 'error',
      content: 'To ensure that the account has sufficient funds, please select a payment method.',
      role: 'system'
    }
  ])

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

      await addMessage({
        id: Date.now() + 1,
        type: 'text',
        role: 'assistant',
        content: result.content,
        time: formatTime(new Date())
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

  return {
    messages,
    processingState,
    currentRequestId,
    addMessage,
    removeMessage,
    removeLastMessage,
    sendMessage,
    pollImageStatus,
    retryMessage
  }
}) 