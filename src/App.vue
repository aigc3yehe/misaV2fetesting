<script setup lang="ts">
import Chat from './components/Chat.vue'
import UnityGame from './components/UnityGame.vue'
import Home from './views/Home.vue'
</script>

<template>
  <!-- <Home /> -->
  <n-dialog-provider> 
    <n-message-provider>
      <router-view></router-view>
    </n-message-provider>
  </n-dialog-provider>
  <!-- <n-message-provider>
    <Chat />
  </n-message-provider> -->
</template>

<style>
/* 重置默认样式 */
:root {
  --sl-color-gray-950: #131316;
  --sl-color-gray-900: #18181b;
  --sl-color-gray-800: #27272a;
  --sl-color-gray-700: #3f3f46;
  --sl-color-gray-600: #52525b;
  --brand-primary: #FA75FF;
  --brand-secondary: #B050B3;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
}

body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch;
}

#app {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: transparent;
  position: relative;
}

/* 添加触摸设备的滚动优化 */
@supports (-webkit-touch-callout: none) {
  html, body {
    height: -webkit-fill-available;
  }
  
  .home {
    min-height: -webkit-fill-available;
  }
}
</style>
