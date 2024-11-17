<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Page not found</p>
    <router-link to="/">Go Home</router-link>
  </div>
</template>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

h1 {
  font-size: 6rem;
  margin-bottom: 1rem;
}

a {
  color: var(--primary-color);
  text-decoration: none;
  margin-top: 1rem;
}
</style> 