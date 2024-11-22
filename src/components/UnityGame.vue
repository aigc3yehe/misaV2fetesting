<template>
  <div class="unity-wrapper" ref="wrapperRef">
    <!-- Unity 容器 -->
    <div id="unity-container">
      <!-- 加载进度条 -->
      <div id="unity-loading-bar" ref="loadingBarRef" v-show="loading">
        <div id="unity-progress-bar-full" :style="{ width: `${loadingProgress}%` }"></div>
        <p id="loadingtext" class="loading-text">
          Loading: {{ loadingProgress.toFixed(2) }}%
        </p>
      </div>

      <canvas id="unity-canvas" ref="unityCanvas"></canvas>
      
      <div id="unity-warning"></div>
      <div id="unity-footer"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const unityCanvas = ref<HTMLCanvasElement | null>(null)
const starsRef = ref<HTMLElement | null>(null)
const loadingBarRef = ref<HTMLElement | null>(null)
const loading = ref(true)
const loadingProgress = ref(0)
const wrapperRef = ref<HTMLElement | null>(null)

// 显示警告/错误信息
const unityShowBanner = (msg: string, type: 'error' | 'warning') => {
  const warningBanner = document.querySelector("#unity-warning")
  if (!warningBanner) return
  
  const div = document.createElement('div')
  div.innerHTML = msg
  
  if (type === 'error') {
    div.style.cssText = 'background: red; padding: 10px;'
  } else {
    div.style.cssText = 'background: yellow; padding: 10px;'
    setTimeout(() => {
      warningBanner.removeChild(div)
    }, 5000)
  }
  
  warningBanner.appendChild(div)
}

const handleResize = () => {
  if (unityCanvas.value) {
    unityCanvas.value.style.width = '100%'
    unityCanvas.value.style.height = '100%'
  }
}

// Unity 加载完成的回调
const UnityStartCallback = (instance: any) => {
  loading.value = false
  if (loadingBarRef.value) loadingBarRef.value.style.opacity = '0'
  if (starsRef.value) starsRef.value.style.opacity = '0'
  if (unityCanvas.value) unityCanvas.value.style.opacity = '1'
  if (wrapperRef.value) {
    wrapperRef.value.classList.add('loading-complete')
  }

  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  window.unityInstance.SendMessage('PlatformSystem', 'NotificationPlatform', mobile ? "0" : "1")
}

// 添加 Call 函数
const Call = () => {
  // 切换角色 vrm02 或 vrm01  
  //window.unityInstance.SendMessage('RolleManager', 'SwitchRole', "vrm02");
  // 添加语音
  window.unityInstance.SendMessage('JSCall', 'AddVoice', '{"content": "Escape reality with a conversation!","finish": false}')
  window.unityInstance.SendMessage('JSCall', 'AddVoice', '{"content": " I\'m Misato Katsuragi. How may I assist you?","finish": true}')
}

onMounted(() => {
  // 将回调函数挂载到 window 对象
  window.UnityStartCallback = UnityStartCallback
  
  // 检查移动设备
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (mobile) {
    const meta = document.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes'
    document.getElementsByTagName('head')[0].appendChild(meta)
    
    const container = document.querySelector("#unity-container")
    if (container) container.className = "unity-mobile"
    if (unityCanvas.value) unityCanvas.value.className = "unity-mobile"
  }

  handleResize()
  window.addEventListener('resize', handleResize)
  
  const buildUrl = "/Build"
  const config = {
    arguments: [],
    dataUrl: `${buildUrl}/7631b2dd1647e109e9d7d5d85755f62c.data.br`,
    frameworkUrl: `${buildUrl}/949032bf0d627d4f98a91e29f4d9b015.framework.js.br`,
    codeUrl: `${buildUrl}/34ff67de1cf5d0c93568e19a370a7975.wasm.br`,
    streamingAssetsUrl: "StreamingAssets",
    companyName: "yehe",
    productName: "Misato",
    productVersion: "1.2",
    showBanner: unityShowBanner,
  }

  const script = document.createElement("script")
  script.src = `${buildUrl}/f997d49c14851abac784b296cce53af5.loader.js`
  script.onload = () => {
    // @ts-ignore
    createUnityInstance(unityCanvas.value, config, (progress: number) => {
      progress += 0.7
      progress = Math.min(1, Math.max(0, progress))
      loadingProgress.value = progress * 100
    }).then((unityInstance: any) => {
      window.unityInstance = unityInstance
      UnityStartCallback(unityInstance)
      setTimeout(Call, 2000)
    }).catch((message: string) => {
      console.error('Unity 加载失败:', message)
      unityShowBanner(message, 'error')
    })
  }
  document.body.appendChild(script)
})

onUnmounted(() => {
  // 清理全局函数
  window.UnityStartCallback = undefined
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.unity-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #FBF7F1;
}

#unity-container {
  width: 100%;
  height: 100%;
  position: relative;
}

#unity-canvas {
  width: 100%;
  height: 100%;
  background: transparent;
  opacity: 0;
  image-rendering: -webkit-optimize-contrast;
  -webkit-font-smoothing: antialiased;
}

#unity-loading-bar {
  position: absolute;
  left: 50%;
  top: calc(50% - max(27vh, 231px));
  transform: translate(-50%, -50%);
  width: 240px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.4);
  border: 1px solid var(--brand-primary);
  border-radius: 2px;
  z-index: 10;
}

#unity-progress-bar-full {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 100%;
  background-color: var(--brand-primary);
  border-radius: 1px;
  transition: width 400ms ease-out;
}

.loading-text {
  position: absolute;
  width: 100%;
  top: 10px;
  text-align: center;
  font-family: '04b03', monospace;
  font-size: 14px;
  color: var(--brand-primary);
  text-shadow: 0 0 2px rgba(251, 89, 245, 0.3);
}

#unity-warning {
  position: absolute;
  left: 50%;
  top: 5%;
  transform: translate(-50%);
  background: white;
  padding: 10px;
  display: none;
  z-index: 10;
}

/* 添加新的背景样式 */
.unity-wrapper::before,
.unity-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.unity-wrapper::before {
  background-color: #FBF7F1;
  background-image: url('@/assets/icons/bg.svg');
  background-repeat: repeat;
  background-position: top center;
  background-size: contain;
  opacity: 1;
  z-index: 1;
  transition: opacity 0.3s ease;
}

/* 添加加载完成后的样式 */
.loading-complete::before {
  opacity: 0;
}
</style> 