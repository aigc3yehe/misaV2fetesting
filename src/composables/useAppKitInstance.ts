import { ref } from 'vue'

const appKitInstance = ref<any>(null)

export function useAppKitInstance() {
  const setInstance = (instance: any) => {
    appKitInstance.value = instance
  }

  return {
    appKitInstance,
    setInstance
  }
} 