<script setup>
// import PopupImportExcel from './ImportExcel.popup.vue'
import { read, utils, writeFileXLSX } from 'xlsx';
import { ref, onMounted } from 'vue'
import moment from 'moment'
import { useLoadingBar, useNotification } from 'naive-ui'
import Emitter from 'tiny-emitter/instance'
import {
  getAuth as svcGetAuth,
  getChunks as svcGetChunks,
  getChunkAudio as svcGetChunkAudio,
  getSources as svcGetSources,
  getChapters as svcGetChapters,
  getContent as svcGetContent,
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
const formData = ref({})
const sourcesOptions = ref([])
const chaptersOptions = ref([])

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
      const currentChapterIndex = chaptersOptions.value.findIndex(ch => ch.id === formData.value.chapter_id)
      const chapterFound = chaptersOptions.value[currentChapterIndex + 1]
      formData.value.chapter_id = chapterFound.id
      handlerChapterPlay(chapterFound)
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

const handlerGetSources = async () => {
  const sources = await svcGetSources()
  console.log(sources, 'sources')
  sourcesOptions.value = sources.map(s => ({ label: s.web.title, value: s.id }))
}

const handlerChangeSource = async () => {
  const chapters = await svcGetChapters({ source_id: formData.value.source_id })
  Object.keys(chapters).forEach(index => {
    const chapter = chapters[index]
    chaptersOptions.value.push({ label: chapter.name, value: chapter.id, ...chapter })
  })
}

const handlerChapterChange = async () => {
  const chapterFound = chaptersOptions.value.find(ch => ch.id === formData.value.chapter_id)
  handlerChapterPlay(chapterFound)
}

const handlerChapterPlay = async (chapter) => {
  srcMp3.value = ''
  player.value.src = ''
  const _chapter = chapter || chaptersOptions[0]
  stageMessageAudio.value = 'Đang cấp quyền...'
  const tokenS1 = await svcGetAuth()
  stageMessageAudio.value = 'Đang cấp content...'
  const { content } = await svcGetContent({ source_id: _chapter.source_id, index: _chapter.index, enable_fanfic: 0, refresh: 1 })
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
}

onMounted(() => {
  handlerGetSources()
  registerEventAudio()
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
      <n-select v-model:value="formData.source_id" filterable placeholder="Select a source" :options="sourcesOptions"
        @update:value="handlerChangeSource" />
    </div>
    <div class="flex-initial w-full mx-auto mt-2">
      <n-select v-model:value="formData.chapter_id" filterable placeholder="Select a chapter"
        @update:value="handlerChapterChange" :options="chaptersOptions" />
    </div>
    <div class="flex-initial w-full mx-auto">
      <audio controls class="hidden" ref="player"></audio>
      <n-slider v-model:value="slideValue" :step="1" :min="0" :max="slideValueMax" @update:value="handlerSeeking"
        :formatTooltip="formatTime" :disabled="!srcMp3" />
      <div class="flex justify-between text-xs">
        <div>{{ formatTime(currentTimeAudio) }}</div>
        <div>{{ stageMessageAudio }}</div>
        <div>{{ formatTime(durationTimeAudio) }}</div>
      </div>
      <div class="flex justify-center text-xs" :disabled="!srcMp3">
        <n-button tertiary circle @click="player.play()" v-if="player.paused">
          <template #icon>
            <n-icon>
              <Play />
            </n-icon>
          </template>
        </n-button>
        <n-button tertiary circle @click="player.pause()" v-else>
          <template #icon>
            <n-icon>
              <Pause />
            </n-icon>
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
