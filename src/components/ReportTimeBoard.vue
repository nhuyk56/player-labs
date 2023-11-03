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

onMounted(async () => {
  const tokenS1 = await svcGetAuth()
  const content = await svcGetContent()
  const dataChunks = await svcGetChunks(content, tokenS1)
  const tokenS2 = dataChunks.meta.sessionToken
  const chunks = dataChunks.data?.map(m => ({
    "t": m.t,
    "lang": "vi",
    "se": { "o": 0, "l": m.t.length },
    "wo": []
  }))
  for (const chunk of chunks) {
    const audio = await svcGetChunkAudio(chunk, tokenS2)
    console.log(audio)
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
      <audio controls></audio>
    </div>
    <div class="justify-between mt-5 flex">
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
