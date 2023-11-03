<script setup>
// import PopupImportExcel from './ImportExcel.popup.vue'
import { read, utils, writeFileXLSX } from 'xlsx';
import { ref, onMounted } from 'vue'
import moment from 'moment'
import { useLoadingBar, useNotification } from 'naive-ui'
import Emitter from 'tiny-emitter/instance'
import {
  getContent as svcGetContent,
  getAuth as svcGetAuth,
  getChunks as svcGetChunks,
  getChunkAudio as svcGetChunkAudio,
} from './service'
import {
  generateReportTimeBoard,
  downloadExcelReport
} from './helpers'

const notification = useNotification()
const srcMp3 = ref('')
const player = ref('')
const currentTimeAudio = ref('')
const stageMessageAudio = ref('')
const durationTimeAudio = ref('')
const slideValue = ref('')
const slideValueMax = ref(100)

const formatTime = (seconds = 0) => {
  const duration = moment.duration(seconds || Number(seconds) || 0, 'seconds');
  const formattedTime = moment.utc(duration.asMilliseconds()).format('mm:ss');
  return formattedTime;
}
const registerEventAudio = () => {
  const handlerChangeSrc = () => {
    durationTimeAudio.value = player.value.duration
    slideValueMax.value = player.value.duration
  }
  const handlerEnded = () => {
    if (player.value.src !== srcMp3.value) {
      const currentTime = player.value.duration
      player.value.src = srcMp3.value
      player.value.currentTime = currentTime
      player.value.play()
    } else {
      console.log('Next Audio')
    }
  }
  const handlerTimeupdate = () => {
    currentTimeAudio.value = player.value.currentTime
    slideValue.value = player.value.currentTime
  }
  player.value.addEventListener('loadedmetadata', handlerChangeSrc)
  player.value.addEventListener('ended', handlerEnded)
  player.value.addEventListener('timeupdate', handlerTimeupdate)
}

const handlerSeeking = (seekingValue) => {
  player.value.currentTime = seekingValue
}
onMounted(async () => {
  registerEventAudio()
  stageMessageAudio.value = 'Đang cấp quyền...'
  const tokenS1 = await svcGetAuth()
  stageMessageAudio.value = 'Đang cấp content...'
  const content = await svcGetContent()
  stageMessageAudio.value = 'Đang cấp chunks...'
  const dataChunks = await svcGetChunks(content, tokenS1)
  const tokenS2 = dataChunks.meta.sessionToken
  const chunks = dataChunks.data?.map(m => ({
    "t": m.t,
    "lang": "vi",
    "se": { "o": 0, "l": m.t.length },
    "wo": []
  }))
  const items = []
  for (let i = 0; i < chunks.length; i++) {
    stageMessageAudio.value = `Đang cấp chunk [${i + 1} / ${chunks.length}]...`
    const audio = await svcGetChunkAudio(chunks[i], tokenS2)
    items.push(audio)
    srcMp3.value = 'data:audio/mpeg;base64,' + items.join('')
    if (['', 0, undefined, null].includes(player.value.src)) {
      player.value.src = srcMp3.value
      player.value.play()
    }
    stageMessageAudio.value = `Hoàn tất`
  }
})

const templateTryCatch = async (fn) => {
  let res
  try {
    Emitter.emit('setLoading', true)
    res = await fn()
  } catch (error) {
    Emitter.emit('setLoading', false)
    console.log(error)
    notification.error({
      duration: 5000,
      title: `Oops!!!`,
      content: error.message
    })
  }
  Emitter.emit('setLoading', false)
  return res
}
</script>

<template>
  <div class="container flex flex-col pb-5">
    <h1 class="flex-initial text-center text-5xl">TEST</h1>
    <div class="flex-initial w-full mx-auto">
      <audio controls class="hidden" ref="player"></audio>
      <n-slider v-model:value="slideValue" :step="1" :min="0" :max="slideValueMax" @update:value="handlerSeeking"
        :formatTooltip="formatTime" :disabled="!srcMp3" />
      <div class="flex justify-between text-xs">
        <div>{{ formatTime(currentTimeAudio) }}</div>
        <div>{{ stageMessageAudio }}</div>
        <div>{{ formatTime(durationTimeAudio) }}</div>
      </div>
      <div class="flex justify-center text-xs">
        <n-button tertiary circle @click="player.play()" v-if="player.paused">
          <template #icon>
            <n-icon><Play /></n-icon>
          </template>
        </n-button>
        <n-button tertiary circle @click="player.pause()" v-else>
          <template #icon>
            <n-icon><Pause /></n-icon>
          </template>
        </n-button>
      </div>
    </div>
    <div class="flex-1 w-full mt-1 bg-white">
      <n-empty description="No Data" class="py-20">
        <template #extra>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<style scoped></style>
