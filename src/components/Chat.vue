<template>
  <div class="chat-wrapper">
    <n-config-provider :theme="theme" class="config-provider">
      <n-split direction="horizontal" default-size="650px" :max="0.75" min="650px" class="main-container">
        <template #1>
          <n-card title="AI Assistant" class="chat-card">
            <!-- 消息区域和输入区域的容器 -->
            <div class="chat-container">
              <!-- 消息列表区域 -->
              <n-scrollbar ref="scrollbarRef" class="messages-container">
                <div class="chat-messages">
                  <div v-for="message in messages" :key="message.id" 
                       :class="['message', message.role === 'user' ? 'user' : 'assistant']">
                    <div class="message-wrapper">
                      <n-avatar v-if="message.role === 'assistant'" round :src="botAvatar" class="avatar" />
                      <n-avatar v-else round :src="userAvatar" class="avatar" />
                      <div class="message-content">
                        <div class="message-sender">{{ message.role === 'user' ? 'You' : '$MISATO' }}</div>
                        <n-card v-if="message.type === 'text'" 
                                :bordered="false" 
                                size="small" 
                                :class="['message-content-card', isShortMessage(message.content) ? 'no-wrap' : '']">
                          <MDRenderer :content="message.content" />
                        </n-card>
                        <div v-else-if="message.type === 'image'" class="message-image-container">
                          <img :src="message.content" class="message-image" @click="openImagePreview(message.content)" 
                               alt="Generated NFT" @error="handleImageError" />
                        </div>
                      </div>
                    </div>
                    <div class="message-time">{{ message.time || 'just now' }}</div>
                  </div>
                </div>
              </n-scrollbar>
              
              <!-- 输入区域 -->
              <div class="input-container">
                <n-input
                  v-model:value="inputMessage"
                  type="textarea"
                  :autosize="{ minRows: 1, maxRows: 3 }"
                  placeholder="Type a message, press Enter to send..."
                  @keypress.enter.prevent="sendMessage"
                  class="chat-input"
                  :autofocus="true"
                />
                <n-button type="primary" @click="sendMessage" :disabled="!inputMessage.trim()">
                  Send
                </n-button>
              </div>
            </div>
          </n-card>
        </template>

        <template #2>
          <n-card title="NFT Gallery" class="chat-card">
            <n-scrollbar>
              <div v-if="isLoadingNFTs" class="flex justify-center items-center h-40">
                <n-spin size="large" />
              </div>
              <n-grid v-else cols="3" :x-gap="12" :y-gap="12">
                <n-grid-item v-for="nft in nfts" :key="nft.id">
                  <n-card>
                    <img :src="nft.image" style="width: 100%">
                    <p>{{ nft.name }}</p>
                  </n-card>
                </n-grid-item>
              </n-grid>
            </n-scrollbar>
          </n-card>
        </template>
      </n-split>
    </n-config-provider>
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
</template>

<script setup lang="ts">
import { ref, computed, nextTick, defineComponent, onMounted, h } from 'vue';
import { darkTheme, NInput, NAvatar } from 'naive-ui'
import type { GlobalTheme } from 'naive-ui'
import { marked } from 'marked';
import { Network } from 'alchemy-sdk';
import { Alchemy } from 'alchemy-sdk';

// 方式2: 如果图片放在 src/assets 目录下
import userAvatarImg from '@/assets/user-avatar.png'
import botAvatarImg from '@/assets/misato-avatar.png'

const userAvatar = userAvatarImg
const botAvatar = botAvatarImg

const theme = ref(darkTheme)
const address = "0xdAb3B7Ea12858B1ADE1367C8E429A4b6e56d851a"

const inputMessage = ref('')
const messages = ref([])

// 添加 Alchemy 配置
const config = {
  apiKey: "goUyG3r-JBxlrxzsqIoyv0b_W-LwScsN",
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(config);

// 更新 NFT 相关状态
const nfts = ref([]);
const isLoadingNFTs = ref(false);
const nftError = ref('');

// 添加获取 NFT 的函数
const fetchNFTs = async () => {
  isLoadingNFTs.value = true;
  try {
    const omitMetadata = false;
    
    const response = await alchemy.nft.getNftsForContract(address, {
      omitMetadata: omitMetadata
    });
    
    nfts.value = response.ownedNfts.map(nft => ({
      id: nft.tokenId,
      name: nft.title || 'Untitled NFT',
      image: nft.media[0]?.gateway || 'default-nft-image.png',
      description: nft.description || 'No description available',
      contract: nft.contract.address
    }));
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    nftError.value = 'Failed to load NFTs';
  } finally {
    isLoadingNFTs.value = false;
  }
};

// 在组件挂载时获取NFT列表
onMounted(() => {
  fetchNFTs();
});

const scrollbarRef = ref(null)

// 在发送消息后滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const scrollbar = scrollbarRef.value
    if (scrollbar) {
      const container = scrollbar.containerRef
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  })
}

// 添加新的接口定义
interface ChatMessage {
  id: number;
  type: 'text' | 'image';
  content: string;
  time?: string;
  role: string;
}

// 添加新的变量
const backendUrl = 'http://45.32.110.109:8000';
const isProcessing = ref(false);

// 添加 Markdown 渲染组件
const MDRenderer = defineComponent({
  props: {
    content: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const renderedContent = computed(() => {
      return marked.parse(props.content, {
        breaks: false,
        gfm: true
      });
    });

    return () => h('div', {
      innerHTML: renderedContent.value,
      class: 'markdown-body'
    });
  }
});

// 添加时间格式化函数
const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 更新 sendMessage 函数
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isProcessing.value) return;
  
  const message = inputMessage.value.trim();
  inputMessage.value = '';
  isProcessing.value = true;
  
  const conversation_history = messages.value.map(msg => ({ 
    role: msg.role, 
    content: msg.content 
  }));

  messages.value.push({
    id: Date.now(),
    type: 'text',
    role: 'user',
    content: message,
    time: formatTime(new Date())
  });
  
  scrollToBottom();

  try {
    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_history
      })
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    messages.value.push({
      id: Date.now() + 1,
      type: 'text',
      role: 'assistant',
      content: result.content,
      time: formatTime(new Date())
    });

    scrollToBottom();

    if (result.request_id) {
      pollImageStatus(result.request_id);
    }
  } catch (error) {
    console.error('Error:', error);
    messages.value.push({
      id: Date.now() + 1,
      type: 'text',
      role: 'assistant',
      content: 'Sorry, an error occurred while processing the message. Please try again.'
    });
  } finally {
    isProcessing.value = false;
  }
};

// 添加图片状态轮询函数
const pollImageStatus = async (requestId: string) => {
  const checkStatus = async () => {
    try {
      const response = await fetch(`${backendUrl}/generation-status/${requestId}`);
      const result = await response.json();

      if (result.status === 'completed') {
        messages.value.push({
          id: Date.now(),
          type: 'image',
          role: 'assistant',
          content: result.urls[0],
          time: formatTime(new Date())
        });
        scrollToBottom();
      } else if (result.status === 'failed') {
        messages.value.push({
          id: Date.now(),
          type: 'text',
          role: 'assistant',
          content: `Image generation failed: ${result.error || 'Unknown error'}`
        });
      } else {
        setTimeout(checkStatus, 2000);
      }
    } catch (error) {
      console.error('Error checking image status:', error);
    }
  };

  await checkStatus();
};

// 更新判断短消息的函数
const isShortMessage = (content: string) => {
  // 移除 markdown 语法标记
  const plainText = content.replace(/[#*`_~]/g, '');
  // 如果文本长度小于15个字符，并且不包含换行符和中文字符，则认为是短消息
  return plainText.length < 15 && 
         !plainText.includes('\n') && 
         !/[\u4e00-\u9fa5]/.test(plainText); // 检查是否包含中文
};

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
</script>

<style scoped>
/* 添加新的包装器样式 */
.chat-wrapper {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
}

/* 添加 config-provider 样式 */
:deep(.config-provider) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-container {
  width: 100%;
  height: 100%;
}

/* 确保分割面板占满容器 */
:deep(.n-split) {
  height: 100% !important;
}

:deep(.n-split-pane) {
  height: 100% !important;
}

/* 确保卡片占满面板 */
.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.n-card) {
  height: 100%;
}

:deep(.n-card-header) {
  flex-shrink: 0;
}

:deep(.n-card__content) {
  flex: 1;
  height: calc(100% - 40px); /* 减去卡片题的高度 */
}

/* 新增：包含消息区域和输入框的容器 */
.chat-container {
  height: calc(100% - 40px); /* 减去卡片标题高度 */
  max-height: calc(100vh - 32px - 40px); /* 设置最大高度，防止溢出 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止整体滚动 */
}

.messages-container {
  flex: 1;
  min-height: 0; /* 确保滚动正常工作 */
  overflow: auto; /* 允许消息区域滚动 */
}

.chat-messages {
  padding: 16px;
}

.input-container {
  padding: 16px;
  margin: 0 12px;
  border-top: 2px solid var(--n-border-color);
  background: var(--n-color-modal);
  display: flex;
  gap: 8px;
  width: calc(100% - 24px);
  flex-shrink: 0; /* 防止输入区域被压缩 */
}

.message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.message-content {
  background: transparent;
}

.message-content-card {
  display: inline-block;
  max-width: 100%;
  word-break: break-word;
}

.message-content-card.no-wrap {
  width: auto;
  max-width: 100%;
}

.message-content-card.no-wrap :deep(.markdown-body) {
  white-space: nowrap;
  display: inline-block;
  max-width: 100%; /* 确保不会溢出父容器 */
}

.message.assistant .message-content :deep(.n-card) {
  background: var(--sl-color-gray-800) !important;
  border-top-left-radius: 2px !important;
}

.message.user .message-content :deep(.n-card) {
  background: var(--sl-color-gray-800) !important;
  border-top-right-radius: 2px !important;
}

/* 输入框样式 */
.input-container .n-input {
  flex: 1;
}

:deep(.n-card-content) {
  height: 100%;
  padding: 0 !important;
}

:deep(.n-grid-item) {
  width: 100%;
}

.message-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.message.user .message-wrapper {
  flex-direction: row-reverse;
}

.message-time {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 4px;
  text-align: center;
}

.avatar {
  width: 36px;
  height: 36px;
}

.input-container {
  padding: 16px;
  border-top: 1px solid var(--n-border-color);
  background: var(--n-color-modal);
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
}

.chat-input :deep(.n-input__textarea-el) {
  padding: 8px 12px !important;
  caret-color: var(--n-text-color) !important;
  text-align: left !important;
  vertical-align: middle !important;
  direction: ltr !important;
}

.chat-input :deep(.n-input__placeholder) {
  text-align: left !important;
  position: absolute !important;
  left: 12px !important;
  right: auto !important;
  direction: ltr !important;
}

.messages-container {
  padding: 20px 0;
}

.chat-messages {
  padding: 0 20px;
}

/* 添加滚动条样式 */
:deep(.n-scrollbar-rail) {
  background-color: transparent !important;
}

:deep(.n-scrollbar-rail.vertical) {
  width: 6px !important;
}

:deep(.n-scrollbar-rail.vertical .n-scrollbar-rail__scrollbar) {
  width: 6px !important;
  border-radius: 3px !important;
}

/* 更新消息样式 */
.message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.message.user {
  align-items: flex-end;
}

.message.ai {
  align-items: flex-start;
}

.message-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.message.user .message-wrapper {
  flex-direction: row-reverse;
}

.message-content {
  background: var(--n-color-info-1);
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 70%;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
}

.message.ai .message-content {
  border-top-left-radius: 2px;
  background: var(--n-color-info-2);
}

.message.user .message-content {
  border-top-right-radius: 2px;
  background: var(--n-color-primary-2);
}

/* 确保卡片样式正确 */
:deep(.n-card) {
  background: transparent !important;
  padding: 0 !important;
}

:deep(.n-card-content) {
  padding: 0 !important;
}

.message-content :deep(.markdown-body) {
  display: inline;
  white-space: pre-wrap;
}

.message-content :deep(.markdown-body p) {
  display: inline;
  margin: 0;
}

/* 如果有多个段落，只在段落之间添加间距 */
.message-content :deep(.markdown-body p + p) {
  margin-top: 1em;
}

/* 临时调试样式 */
.message-container {
  padding: 0;
}

.message-content {
  padding: 0;
}

.message-content :deep(.markdown-body) {
  padding: 0;
}

.message-content :deep(.markdown-body p) {
  padding: 0;
  margin: 0;
}

.message-sender {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--n-text-color-2);
}

.message.user .message-sender {
  text-align: right;
}

.message.assistant .message-sender {
  text-align: left;
}

/* 调整消息内容的间距 */
.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 添加新的图片容器样式 */
.message-image-container {
  max-width: 300px; /* 限制图片容器的最大宽度 */
  margin: 8px 0;
}

.message-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  cursor: zoom-in; /* 改变鼠标式提示可点击 */
  transition: transform 0.2s ease;
}

.message-image:hover {
  transform: scale(1.02);
}

/* 更新消息内容样式 */
.message-content-card {
  display: inline-block;
  max-width: 100%;
}

.message-content-card.no-wrap :deep(.markdown-body) {
  white-space: nowrap;
  display: inline-block;
}

.message-content-card :deep(.markdown-body) {
  white-space: pre-wrap;
}

.message-content-card :deep(.markdown-body p) {
  display: inline;
  margin: 0;
}

/* 确保长文本时可以正常换行 */
.message-content-card:not(.no-wrap) {
  width: 100%;
}

/* 确保短文本不会占据太多空间 */
.message-content-card.no-wrap {
  width: auto;
  max-width: 100%;
}

/* 添加图片预览相关样式 */
.image-preview-container {
  width: 768px;
  height: 768px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为 contain 以保持图片比例 */
  border-radius: 8px;
}

/* 更新模态框样式 */
:deep(.n-modal) {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  padding: 0 !important;
}

:deep(.n-modal-body) {
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.n-modal-mask) {
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.75) !important;
}

/* 调整消息气泡的样式 */
.message-content :deep(.n-card) {
  background: var(--sl-color-gray-800) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  width: fit-content;
  min-width: 60px;
}

/* 调整 markdown 内容的间距 */
.message-content-card :deep(.markdown-body) {
  padding: 4px 0;  /* 添加上下内边距 */
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 短消息样式 */
.message-content-card.no-wrap {
  width: auto;
  max-width: 100%;
}

.message-content-card.no-wrap :deep(.markdown-body) {
  white-space: nowrap;
  display: inline-block;
  max-width: 100%;
  padding: 4px 0;  /* 保持与普通消息一致的内边距 */
}

/* 消息发送者名称的间距 */
.message-sender {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--n-text-color-2);
}

/* 调整消息容器的间距 */
.message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.message-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
</style>