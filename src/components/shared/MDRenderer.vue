<template>
  <div class="markdown-body" v-html="renderedContent" @click="handleClick"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  content: string
}>()

const renderedContent = computed(() => {
  return marked.parse(props.content, {
    breaks: false,
    gfm: true
  })
})

const handleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.tagName === 'IMG') {
    const imgSrc = (target as HTMLImageElement).src
    if (imgSrc) {
      // 阻止事件冒泡
      event.preventDefault()
      event.stopPropagation()
      // 触发图片预览事件
      emit('preview-image', imgSrc)
    }
  }
}

const emit = defineEmits<{
  (e: 'preview-image', src: string): void
}>()
</script>

<style>
.markdown-body {
  font-size: 14px;
  line-height: 1.6;
}

.markdown-body img {
  max-width: 300px;
  height: auto;
  border-radius: 8px;
  cursor: zoom-in;
  transition: transform 0.2s ease;
}

.markdown-body img:hover {
  transform: scale(1.02);
}
</style> 