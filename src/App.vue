<script setup>
import NavigationBar from './components/NavigationBar.vue'
import ReportTimeBoard from './components/ReportTimeBoard.vue'
import Loading from './components/Loading.vue'
</script>

<template>
  <n-notification-provider :max="3">
    <n-loading-bar-provider>
      <div class="flex flex-col w-full h-full items-center">
        <div class="flex-initial h-20 bg-blue-300 w-full flex items-center justify-center">
          <NavigationBar></NavigationBar>
        </div>
        <div class="flex-1 bg-gray-100 w-full flex justify-center">
          <ReportTimeBoard></ReportTimeBoard>
        </div>
      </div>
      <Loading></Loading>
    </n-loading-bar-provider>
  </n-notification-provider>
</template>

<style>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
.height-large .n-base-selection, .height-large.n-button{
  --n-height: 40px !important;
  --n-border-radius: 34px !important;
}
</style>
