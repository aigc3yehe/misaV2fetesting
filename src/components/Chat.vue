<template>
  <div class="chat-wrapper">
    <n-config-provider :theme="theme" class="config-provider">
      <n-split direction="horizontal" default-size="650px" :max="0.75" min="650px" class="main-container">
        <template #1>
          <n-card title="MISATO Studio" class="chat-card">
            <!-- 消息区域和输入区域的容器 -->
            <div class="chat-container">
              <!-- 消息列表区域 -->
              <n-scrollbar ref="scrollbarRef" class="messages-container">
                <div class="chat-messages">
                  <div v-for="message in messages" :key="message.id" 
                       :class="['message', message.role === 'user' ? 'user' : 'assistant']">
                    <div class="message-wrapper">
                      <n-avatar v-if="message.role === 'user'" round :src="userAvatar" class="avatar" />
                      <n-avatar v-else round :src="botAvatar" class="avatar" />
                      <div class="message-content">
                        <div class="message-sender">{{ 
                          message.role === 'user' ? 'You' : '$MISATO' 
                        }}</div>
                        <div class="message-content-wrapper">
                          <n-card v-if="message.type === 'text'" 
                                  :bordered="false" 
                                  size="small" 
                                  :class="['message-content-card', isShortMessage(message.content) ? 'no-wrap' : '']">
                            <MDRenderer :content="message.content" />
                          </n-card>
                          <div v-else-if="message.type === 'image'" class="message-image-container">
                            <img :src="message.content" class="message-image" @click="openImagePreview(message.content)" 
                                 alt="Generated NFT" />
                          </div>
                          <div v-else-if="message.type === 'error'" class="error-message-container">
                            <n-card :bordered="false" size="small" class="error-card">
                              <MDRenderer :content="message.content" />
                            </n-card>
                            <n-button v-if="isLastMessage(message)" 
                                      circle 
                                      size="small" 
                                      type="warning" 
                                      class="retry-button" 
                                      @click="retryMessage(messages[messages.length-2].content)">
                              <template #icon>
                                <n-icon><refresh-icon /></n-icon>
                              </template>
                            </n-button>
                          </div>
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
                  :placeholder="inputPlaceholder"
                  @keypress.enter.prevent="sendMessage"
                  class="chat-input"
                  :autofocus="true"
                  :disabled="processingState !== 'idle'"
                  ref="inputRef"
                />
                <n-button type="primary" @click="sendMessage" :disabled="!inputMessage.trim()">
                  Send
                </n-button>
              </div>
            </div>
          </n-card>
        </template>

        <template #2>
          <n-card class="chat-card">
            <!-- 自定义标题区域 -->
            <template #header>
              <div class="gallery-header">
                <div class="gallery-title">
                  <span>MISATO Frens</span>
                  <n-button circle size="small" @click="fetchNFTs">
                    <template #icon>
                      <n-icon><refresh-icon /></n-icon>
                    </template>
                  </n-button>
                </div>
                <div class="contract-address">
                  <n-text code>{{ address }}</n-text>
                  <n-button circle size="tiny" @click="copyAddress" class="copy-button">
                    <template #icon>
                      <n-icon><copy-icon /></n-icon>
                    </template>
                  </n-button>
                </div>
              </div>
            </template>
            
            <n-scrollbar>
              <div v-if="isLoadingNFTs" class="flex justify-center items-center h-40">
                <n-spin size="large" />
              </div>
              <div v-else class="nft-grid">
                <n-card v-for="nft in nfts" 
                        :key="nft.id" 
                        class="nft-card"
                        @click="openNftLink(nft.contract, nft.id)">
                  <div class="nft-image-wrapper">
                    <img :src="nft.image" 
                         class="nft-image" 
                         @error="(e: Event) => {
                           const target = e.target as HTMLImageElement;
                           if (target) target.src = defaultNftImage;
                         }"
                         alt="NFT Image">
                  </div>
                  <div class="nft-info">
                    <p class="nft-name">
                      <span class="name-text">{{ nft.name }}</span>
                      <span class="nft-token-id">#{{ nft.id }}</span>
                    </p>
                    <n-text code class="nft-id">{{ formatAddress(nft.contract) }}</n-text>
                  </div>
                </n-card>
              </div>
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
import { ref, computed, nextTick, defineComponent, onMounted, h, watch } from 'vue';
import { darkTheme, NInput, NAvatar, useMessage } from 'naive-ui'
import { marked } from 'marked';
import { 
  RefreshOutline as RefreshIcon, 
  Copy as CopyIcon
} from '@vicons/ionicons5'
import defaultNftImage from '@/assets/misato-avatar.png'
import type { ScrollbarInst } from 'naive-ui'
import { v4 as uuidv4 } from 'uuid'; 

// 添加新的接口定义
interface ChatMessage {
  id: number;
  type: 'text' | 'image' | 'error';
  content: string;
  time?: string;
  role: string;
}

interface NFT {
  id: string;
  name: string;
  image: string;
  contract: string;
}

const toastMessage = useMessage()

// 方式2: 如果图片放在 src/assets 目录下
import userAvatarImg from '@/assets/user-avatar.png'
import botAvatarImg from '@/assets/misato-avatar.png'

const userAvatar = userAvatarImg
const botAvatar = botAvatarImg

const theme = ref(darkTheme)
//const address = "0x091734AE3AAc8ed61e9341Bf2fDfe33E5e1D74CF"
const address = "0x54C8d8d2838DE32327403FeeB41F7A91D02c02ec" // 新地址，晚点切换

const inputMessage = ref('')
const messages = ref<ChatMessage[]>([
  {
    id: 1,
    type: 'text',
    content: '\\### MISATO just opened her own studio! You can ask her about NFT purchases. Minting fee 0.002eth, total supply 500',
    role: 'system'
  }
])

// 添加 Alchemy 配置
const config = {
  apiKey: "goUyG3r-JBxlrxzsqIoyv0b_W-LwScsN",
  //network: Network.BASE_MAINNET,
};

const baseUrl = 'https://base-mainnet.g.alchemy.com/nft/v3';
const apiKey = 'goUyG3r-JBxlrxzsqIoyv0b_W-LwScsN';

// 更新 NFT 相关状态
const nfts = ref<NFT[]>([]);
const isLoadingNFTs = ref(false);
const nftError = ref('');

// 添加新的变量
const backendUrl = '/api';

// 添加处理状态枚举
type ProcessingState = 'idle' | 'thinking' | 'generating' | 'minting';

// 更新状态管理
const processingState = ref<ProcessingState>('idle');

// 更新 placeholder 计算属性
const inputPlaceholder = computed(() => {
  switch (processingState.value) {
    case 'thinking':
      return 'MISATO is thinking...';
    case 'generating':
      return 'MISATO is generating image...';
    case 'minting':
      return 'MISATO is minting NFT...';
    default:
      return 'Type a message, press Enter to send...';
  }
});

// 添加获取 NFT 的函数
const fetchNFTs = async () => {
  isLoadingNFTs.value = true;
  try {
    
    let pageKey = null;
    let allNfts: any[] = [];

    do {
      const queryParams: URLSearchParams = new URLSearchParams({
        contractAddress: address,
        withMetadata: 'true',
        //startToken: '1',
        limit: '500',
        ...(pageKey && { pageKey })
      });

      const response = await fetch(
        `${baseUrl}/${apiKey}/getNFTsForContract?${queryParams}`
      );
      
      const data = await response.json();
      
      const newNfts = data.nfts.map((nft: any) => ({
        id: nft.tokenId,
        name: nft.name || nft.raw?.metadata?.name || `MISATO Frens #${nft.tokenId}`,
        image: nft.image?.originalUrl || nft.raw?.metadata?.image || nft.image?.cachedUrl || 'default-nft-image.png',
        description: nft.description || nft.raw?.metadata?.description || 'No description available',
        contract: nft.contract.address
      }));
      
      allNfts = [...allNfts, ...newNfts];
      pageKey = data.pageKey;
    } while (pageKey);

    nfts.value = allNfts.sort((a, b) => Number(b.id) - Number(a.id));
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    nftError.value = 'Failed to load NFTs';
  } finally {
    isLoadingNFTs.value = false;
  }
};

// 在组件载时获取NFT列表
onMounted(() => {
  userUuid.value = getOrCreateUuid();
  fetchNFTs();
});

const scrollbarRef = ref<ScrollbarInst | null>(null)

// 在发送消息后滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    setTimeout(() => {
      const scrollbar = scrollbarRef.value
      if (scrollbar) {
        // 直接使用 scrollTo 方法，不传入 behavior 选项
        scrollbar.scrollTo({
          top: 999999 // 使用一个足够大的值确保滚动到底部
        })
      }
    }, 100) // 稍微增加延迟时间以确保内容已渲染
  })
}

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

    // 添加图片点击事件处理
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const imgSrc = (target as HTMLImageElement).src;
        if (imgSrc) {
          openImagePreview(imgSrc);
        }
      }
    };

    return () => h('div', {
      innerHTML: renderedContent.value,
      class: 'markdown-body',
      onClick: handleClick
    });
  }
});

// 添加时间格式化函数
const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 添加 UUID 相关的常量和状态
const UUID_STORAGE_KEY = 'misato_user_uuid';
const userUuid = ref('');

// 添加获取或生成 UUID 的函数
const getOrCreateUuid = (): string => {
  const storedUuid = localStorage.getItem(UUID_STORAGE_KEY);
  if (storedUuid) {
    return storedUuid;
  }
  
  const newUuid = uuidv4();
  localStorage.setItem(UUID_STORAGE_KEY, newUuid);
  return newUuid;
};

// 添加新的状态来存储当前的 requestId
const currentRequestId = ref<string | null>(null);

// 更新 sendMessage 函数
const sendMessage = async () => {
  if (!inputMessage.value.trim() || processingState.value !== 'idle') return;
  
  const message = inputMessage.value.trim();
  inputMessage.value = '';
  processingState.value = 'thinking';
  
  const conversation_history = messages.value
    .filter(msg => msg.role === 'assistant' || msg.role === 'user')
    .map(msg => ({ 
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
        conversation_history,
        user_uuid: userUuid.value,
        request_id: currentRequestId.value
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
      currentRequestId.value = result.request_id;
      processingState.value = 'generating';
      pollImageStatus(result.request_id);
    } else {
      processingState.value = 'idle';
    }
    
    // 处理铸造成功的情况
    if (result.status === 'success') {
      // 延迟5秒后刷新NFT列表
      setTimeout(async () => {
        await fetchNFTs();
        toastMessage.success('NFT minted successfully!');
      }, 5000);
    }

  } catch (error) {
    console.error('Error:', error);
    messages.value.push({
      id: Date.now() + 1,
      type: 'error',
      role: 'system',
      content: 'Sorry, an error occurred while processing the message. Please try again.',
      time: formatTime(new Date())
    });
    scrollToBottom();
    processingState.value = 'idle';
  } finally {
    scrollToBottom();
  }
};

// 更新图片状态轮询函数
const pollImageStatus = async (requestId: string) => {
  processingState.value = 'generating';
  
  const progressMessageId = Date.now();
  
  messages.value.push({
    id: progressMessageId,
    type: 'text',
    role: 'system',
    content: '🎨 Generating image...',
    time: formatTime(new Date())
  });
  
  const checkStatus = async () => {
    let currentStatus = null;
    
    try {
      const response = await fetch(`${backendUrl}/generation-status/${requestId}`);
      const result = await response.json();
      currentStatus = result.status; // 保存状态供 finally 块使用

      if (result.status === 'completed') {
        // 移除进度消息
        messages.value = messages.value.filter(m => m.id !== progressMessageId);
        
        // 检查文本内容中是否包含图片
        const hasMarkdownImage = result.content && (
          result.content.includes('![') || // 检查 Markdown 图片语法
          /https?:\/\/[^\s<>"]+?\/[^\s<>"]+?\.(png|jpg|jpeg|gif|webp)/i.test(result.content) // 检查普通图片链接
        );

        // 如果有文本内容，添加文本消息
        if (result.content) {
          messages.value.push({
            id: Date.now(),
            type: 'text',
            role: 'assistant', 
            content: result.content,
            time: formatTime(new Date())
          });
        }
        
        // 只有当文本内容中没有图片时，才添加单独的图片消息
        if (!hasMarkdownImage && result.urls?.[0]) {
          messages.value.push({
            id: Date.now(),
            type: 'image',
            role: 'assistant',
            content: result.urls[0],
            time: formatTime(new Date())
          });
        }
        
        processingState.value = 'idle';
        scrollToBottom();
      } else if (result.status === 'failed') {
        // 移除进度消息
        messages.value = messages.value.filter(m => m.id !== progressMessageId);
        
        processingState.value = 'idle';
        messages.value.push({
          id: Date.now(),
          type: 'error',
          role: 'system',
          content: `Image generation failed: ${result.error || 'Unknown error'}`,
          time: formatTime(new Date())
        });
      } else {
        setTimeout(checkStatus, 2000);
        return;
      }
    } catch (error) {
      console.error('Error checking image status:', error);
      messages.value = messages.value.filter(m => m.id !== progressMessageId);
      
      messages.value.push({
        id: Date.now(),
        type: 'error',
        role: 'system',
        content: 'Error checking image generation status',
        time: formatTime(new Date())
      });
    } finally {
      // 使用保存的状态来决定是否重置 processingState
      if (currentStatus === 'completed' || currentStatus === 'failed') {
        processingState.value = 'idle';
      }
    }
  };

  await checkStatus();
};

// 更新判断短消息的函数
const isShortMessage = (content: string) => {
  // 移除 markdown 语法标记
  const plainText = content.replace(/[#*`_~]/g, '');
  // 如果文本长度小于15个字符，并且不包含换行符中文字符，则认为是短消息
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

// 添加地址格式化函数
const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 添加复制函数
const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(address);
    toastMessage.success('copy success');
  } catch (err) {
    console.error('copy error:', err);
  }
};

// 添加打开NFT链接的方法
const openNftLink = (contract: string, tokenId: string) => {
  const url = `https://magiceden.io/item-details/base/${contract}/${tokenId}`;
  window.open(url, '_blank');
};

// 更新重试函数
const retryMessage = async (originalMessage: string) => {
  if (processingState.value !== 'idle') return;
  
  messages.value.pop();
  processingState.value = 'thinking';
  
  const conversation_history = messages.value.map(msg => ({ 
    role: msg.role, 
    content: msg.content 
  }));

  try {
    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: originalMessage,
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

    if (result.request_id) {
      pollImageStatus(result.request_id);
    }
  } catch (error) {
    messages.value.push({
      id: Date.now() + 1,
      type: 'error',
      role: 'system',
      content: 'Sorry, an error occurred while processing the message. Please try again.',
      time: formatTime(new Date())
    });
  } finally {
    processingState.value = 'idle';
    scrollToBottom();
  }
};

// 添加判断是否为最后一条消息的方法
const isLastMessage = (message: ChatMessage) => {
  return message === messages.value[messages.value.length - 1];
};

// 添加输入框引用
const inputRef = ref<any>(null);

// 修改 processingState 的 watch
watch(processingState, (newState) => {
  if (newState === 'idle') {
    // 使用 nextTick 确保 DOM 更新后再设置焦点
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});
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

/* 确保分割面板占器 */
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
  height: calc(100% - 40px); /* 减去片题的高度 */
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
  overflow: auto; /* 允许消息区域动 */
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
  background: var(--sl-color-gray-800, #27272a) !important;
  border-top-left-radius: 2px !important;
}

.message.user .message-content :deep(.n-card) {
  background: var(--sl-color-gray-800, #27272a) !important;
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

/* 添加 markdown 图片样式 */
.message-content :deep(.markdown-body img) {
  max-width: 300px; /* 限制最大宽度 */
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
  cursor: zoom-in;
  transition: transform 0.2s ease;
}

.message-content :deep(.markdown-body img:hover) {
  transform: scale(1.02);
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
  max-width: 300px; /* 限制图片容的最大宽度 */
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
  background: var(--sl-color-gray-800, #27272a) !important;
  border-radius: 12px !important;
  padding: 6px 6px !important;
  width: fit-content;
  min-width: 60px;
}

/* 调整 markdown 内容的间距 */
.message-content-card :deep(.markdown-body) {
  padding: 2px 0;  /* 添加上下内边距 */
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
  padding: 2px 0;  /* 保持与普通消息一致的内边距 */
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

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 28px; /* 与网格的左padding保持一致 */
}

.gallery-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
}

.contract-address {
  font-size: 14px;
  color: var(--n-text-color-3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-button {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.copy-button:hover {
  opacity: 1;
}

/* 调整复制按钮大小 */
.copy-button:deep(.n-button) {
  width: 20px;
  height: 20px;
  font-size: 14px;
}

.nft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 16px;
  padding: 16px;
  justify-content: start; /* 改为左对齐 */
  padding-left: 28px; /* 根据实际标题的padding调整此值 */
}

.nft-card {
  width: 200px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.nft-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nft-card:deep(.n-card__content) {
  padding: 0 !important;
}

.nft-image-wrapper {
  width: 200px;
  height: 200px;
}

.nft-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.nft-info {
  padding: 12px; /* 只在信息区域添加内边距 */
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nft-name {
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nft-token-id {
  color: var(--n-text-color-3);
  font-weight: normal;
  margin-left: 8px;
  flex-shrink: 0;
}

.nft-id {
  font-size: 12px;
}

/* 调整刷新按钮大小以匹配更大的标题 */
:deep(.n-button.n-button--circle) {
  width: 28px;
  height: 28px;
  font-size: 18px;
}

/* 调整时间显示的对齐方式 */
.message-time {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 4px;
}

.message.user .message-time {
  padding-right: 44px; /* 头像宽度(36px) + gap(8px) */
  text-align: right;
}

.message.assistant .message-time {
  padding-left: 44px; /* 头像宽度(36px) + gap(8px) */
  text-align: left;
}

/* 添加错误消息相关样式 */
.error-message-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-card {
  background: var(--n-color-error-1) !important;
}

.retry-button {
  flex-shrink: 0;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.retry-button:hover {
  opacity: 1;
}

/* 调整系统消息样式 */
.message.system .message-content :deep(.n-card) {
  background: var(--n-color-warning-1) !important;
}

/* 添加发送按钮样式 */
.input-container .n-button {
  align-self: flex-end;
  margin-bottom: 2px; /* 微调按钮位置以对齐输入框 */
}

/* 调整图标大小 */
.input-container .n-button :deep(.n-icon) {
  font-size: 18px;
}

/* 整加载动画大小 */
.input-container .n-button :deep(.n-spin) {
  font-size: 18px;
  width: 18px;
  height: 18px;
}
</style>