<script setup>
import { ref } from 'vue'
import Emitter from 'tiny-emitter/instance'
import { useLoadingBar } from 'naive-ui'

const loadingBar = useLoadingBar()
const isLoading = ref(false)
const setLoading = (v) => {
  isLoading.value = v
  if (v) {
    loadingBar.start()
  } else {
    loadingBar.finish()
  }
}
Emitter.on('setLoading', setLoading)
</script>

<template>
  <div aria-hidden="true" class="n-modal-mask" v-if="isLoading" style="z-index: 10000;"></div>
</template>
