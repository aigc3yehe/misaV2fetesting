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
              <div v-if="message.type === 'text'" 
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
                  <n-button class="eth-button" @click="sendEth" icon-placement="right">
                    Send ETH
                    <template #icon>
                      <n-icon><ETHIcon /></n-icon>
                    </template>
                  </n-button>
                  <n-button class="eth-button" @click="checkPayment">
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
      <n-input
        v-model:value="inputMessage"
        type="textarea"
        size="large"
        :autosize="{ minRows: 1, maxRows: 3 }"
        :placeholder="inputPlaceholder"
        @keypress.enter.prevent="sendMessage"
        class="chat-input"
        :disabled="chatStore.processingState !== 'idle'"
        :theme-overrides="inputThemeOverrides"
        ref="inputRef"
      >
        <template #suffix>
          <n-button quaternary circle class="send-button" @click="sendMessage" :disabled="!inputMessage.trim()">
            <template #icon>
              <n-icon>
                <SendIcon v-if="!inputMessage.trim()" />
                <SendIconHover v-else />
              </n-icon>
            </template>
          </n-button>
        </template>
      </n-input>
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
import { ref, computed, nextTick, watch } from 'vue'
import { useMessage } from 'naive-ui'
import type { ScrollbarInst } from 'naive-ui'
import { v4 as uuidv4 } from 'uuid'
import { useChatStore } from '@/stores'
import MDRenderer from '@/components/shared/MDRenderer.vue'
import SendIcon from '@/assets/icons/send.svg?component'
import SendIconHover from '@/assets/icons/send-hover.svg?component'
import ETHIcon from '@/assets/icons/ETH.svg?component'
import SmallRefreshIcon from '@/assets/icons/small-refresh.svg?component'

const message = useMessage()
const chatStore = useChatStore()
const inputMessage = ref('')
const scrollbarRef = ref<ScrollbarInst | null>(null)
const inputRef = ref<any>(null)

// 添加对消息列表的监听
watch(
  () => chatStore.messages,
  () => {
    scrollToBottom()
  },
  { deep: true }
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

// 简化后的发送消息方法
const sendMessage = async () => {
  if (!inputMessage.value.trim() || chatStore.processingState !== 'idle') return
  
  const messageText = inputMessage.value.trim()
  inputMessage.value = ''
  
  await chatStore.sendMessage(messageText)
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
  backgroundColor: '#58FFD066',
  color: '#58FFD066',
  colorFocus: '#58FFD066',
  colorHover: '#58FFD066',
  textAreaColor: '#58FFD066',
  borderRadius: '16px',
  border: '1px solid #4AC5A0',
  textColor: '#58FFD0',
  placeholderColor: 'rgba(88, 255, 208, 0.5)',
  fontFamily: "'PPNeueBit', monospace",
  fontSize: '32px',
  fontSizeTextArea: '32px',
  padding: '8px 16px',
  heightMedium: '40px',
  lineHeight: '20px',
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

// 添加图片预览相关方法
const openImagePreview = (imageUrl: string) => {
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageUrl.value = ''
}

const sendEth = () => {
  // 实现发送 ETH 的逻辑
}

const checkPayment = () => {
  // 实现检查支付状态的逻辑
}
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
  padding: 16px;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 16px;
  padding-right: 18px;
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
  display: inline-block;
  padding: 12px;
  border-radius: 16px;
  font-size: 14px;
  word-break: break-word;
}

.message.assistant .message-bubble {
  background: #FA75FF66;
  border: 1px solid #B050B3;
  color: #FA75FF;
}

.message.user .message-bubble {
  background: #58FFD066;
  border: 1px solid #4AC5A0;
  color: #58FFD0;
}

.message-bubble.error {
  background-color: var(--n-color-error-1);
}

.message-image-container {
  max-width: 512px;
}

.message-image {
  max-width: 300px;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
  cursor: zoom-in;
  transition: transform 0.2s ease;
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
  width: 157px !important;
  height: 36px;
  padding: 4px;
  gap: 2px;
  background: #FFF14966 !important;
  border: 1px solid #CCC134 !important;
  border-radius: 8px;
  font-family: 'PPNeueBit', monospace;
  font-size: 16px;
  font-weight: 700;
  line-height: 12px;
  text-align: center;
  color: #FFF149 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.retry-button:hover {
  background: #FFF14980 !important;
  color: #FFF149 !important;
}

.retry-button .n-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.message-text {
  margin-bottom: 1px;
}

.message-time {
  font-size: 12px;
  color: #FFFFFFB8;
  margin-top: 0px;
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

.input-container {
  padding: 16px;
}

.chat-input {
  :deep(.n-input__suffix) {
    margin-left: 12px;
    display: flex;
    align-items: center;
  }
}

/* 自定义滚动条样式 */
:deep(.n-scrollbar-rail) {
  background-color: transparent !important;
}

:deep(.n-scrollbar-rail.vertical) {
  width: 6px !important;
}

:deep(.n-scrollbar-rail__scrollbar) {
  width: 6px !important;
  background-color: #FA75FF !important;
  border-radius: 3px !important;
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
  -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
  -webkit-text-fill-color: #58FFD0 !important;
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
  width: 157px !important;
  height: 36px;
  padding: 4px;
  gap: 2px;
  background: #FFF14966 !important;
  border: 1px solid #CCC134 !important;
  border-radius: 8px;
  font-family: 'PPNeueBit', monospace;
  font-size: 16px;
  font-weight: 700;
  line-height: 12px;
  text-align: center;
  color: #FFF149 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eth-button:hover {
  background: #FFF14980 !important;
  color: #FFF149 !important;
}

.eth-button :deep(.n-button__icon) {
  font-size: 12px;
  margin-left: 4px;
}

.eth-button .n-icon {
  width: 12px;
  height: 12px;
}

.message-bubble.eth-status {
  width: 322px;
}
</style> 