<script setup>
import { ref } from 'vue'
// import PopupImportExcel from './ImportExcel.popup.vue'
// const showPopupImportExcel = ref(false)
</script>
<template>
  <div class="container m-auto">
    <nav class="border-gray-200 px-2 sm:px-4 py-2.5 rounded dark:bg-gray-900">
      <div class="container flex flex-wrap items-center justify-between mx-auto">
        <a class="flex items-center">
          <!-- <img src="/9thwonder.svg" class="h-9 mr-3 sm:h-12" alt="9thwonder Logo" /> -->
          <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">TEST</span>
        </a>
        <!-- <n-button color="#EC4899" round @click="showPopupImportExcel = true">
          <template #icon>
            <n-icon>
              <cloud-upload-outline />
            </n-icon>
          </template>
          Import Excels
        </n-button> -->
      </div>
    </nav>
  </div>
  <!-- <PopupImportExcel :show="showPopupImportExcel" @hide="showPopupImportExcel = false"></PopupImportExcel> -->
</template>
