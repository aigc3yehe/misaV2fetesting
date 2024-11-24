import { ref, onMounted, onUnmounted } from 'vue'

export function useDevice() {
  const isMobile = ref(false)
  
  const checkDevice = () => {
    const width = window.innerWidth
    isMobile.value = width <= 768
    /* console.log('当前窗口宽度:', width)
    console.log('是否为移动设备:', isMobile.value) */
  }
  
  onMounted(() => {
    console.log('useDevice mounted')
    checkDevice()
    window.addEventListener('resize', checkDevice)
  })
  
  onUnmounted(() => {
    console.log('useDevice unmounted')
    window.removeEventListener('resize', checkDevice)
  })
  
  return {
    isMobile
  }
} 