<template>
  <div class="unity-wrapper">
    <!-- 星空背景 -->
    <div id="stars" ref="starsRef">
      <div id="stars2"></div>
      <div id="stars3"></div>
    </div>
    
    <!-- Unity 容器 -->
    <div id="unity-container" class="unity-desktop">
      <!-- 加载进度条 -->
      <div id="unity-loading-bar" ref="loadingBarRef" v-show="loading">
        <div id="unity-progress-bar-full" :style="{ width: `${loadingProgress}%` }"></div>
        <p id="loadingtext" class="loading-text">
          玩命正在加载：{{ loadingProgress.toFixed(2) }}%
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
  if (loadingBarRef.value) loadingBarRef.value.style.display = 'none'
  if (starsRef.value) starsRef.value.style.opacity = '0'
  if (unityCanvas.value) unityCanvas.value.style.opacity = '1'

  // 判断是否是移动设备
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  instance.SendMessage('PlatformSystem', 'NotificationPlatform', mobile ? "0" : "1")
}

onMounted(() => {
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
    dataUrl: `${buildUrl}/9d8e06c17a6184867211faff66d8798f.data.br`,
    frameworkUrl: `${buildUrl}/72c69d1ad07615e4ab8bc8a2a60e6360.framework.js.br`,
    codeUrl: `${buildUrl}/36ec552cb44c01f6bd144785805801d0.wasm.br`,
    streamingAssetsUrl: "StreamingAssets",
    companyName: "lkz",
    productName: "数字人",
    productVersion: "1.2",
    showBanner: unityShowBanner,
    cacheControl: (url: string) => {
      if (url.endsWith('.br') || url.endsWith('.gz')) {
        return 'public, max-age=2592000' // 30天缓存
      }
      if (url.endsWith('.html') || url.endsWith('.json')) {
        return 'no-store, no-cache, must-revalidate'
      }
      return ''
    }
  }

  const script = document.createElement("script")
  script.src = `${buildUrl}/44b09deef429ef689c60cc2fb7e6c8a0.loader.js`
  script.onload = () => {
    // @ts-ignore
    createUnityInstance(unityCanvas.value, config, (progress: number) => {
      progress += 0.7
      progress = Math.min(1, Math.max(0, progress))
      loadingProgress.value = progress * 100
    }).then((unityInstance: any) => {
      window.unityInstance = unityInstance
      UnityStartCallback(unityInstance)
    }).catch((message: string) => {
      console.error('Unity 加载失败:', message)
      unityShowBanner(message, 'error')
    })
  }
  document.body.appendChild(script)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.unity-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #1F1F20;
  aspect-ratio: 16 / 9;
}

#unity-canvas {
  width: 100%;
  height: 100%;
  background: #1F1F20;
  opacity: 0;
  transition: opacity 1s;
  image-rendering: -webkit-optimize-contrast;
  -webkit-font-smoothing: antialiased;
}

#unity-loading-bar {
  position: absolute;
  left: 20%;
  top: 90%;
  width: 60%;
  height: 5px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 10px;
  transition: opacity 1s;
  z-index: 10;
}

#unity-progress-bar-full {
  position: absolute;
  left: 0%;
  top: 0%;
  width: 0%;
  height: 100%;
  background-color: #ccc;
  border-radius: 10px;
  transition: width 400ms linear;
}

.loading-text {
  margin-top: 15px;
  color: white;
  font-size: 12px;
  white-space: nowrap;
  text-align: center;
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

/* 星空背景样式 */
#stars {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #1F1F20;
  transition: opacity 1s;
  z-index: 1;
}

#stars2 {
  width: 100%;
  height: 100%;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==);
  animation: animStar 100s linear infinite;
}

#stars3 {
  width: 100%;
  height: 100%;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==);
  animation: animStar 150s linear infinite;
}

@keyframes animStar {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-2000px);
  }
}

#unity-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.unity-desktop {
  width: 100%;
  height: 100%;
}

.unity-mobile {
  width: 100%;
  height: 100%;
}
</style> 