import { CloudUploadOutline, SearchCircle, Search, CloudDownloadOutline } from '@vicons/ionicons5'
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App)
.component('CloudUploadOutline', CloudUploadOutline)
.component('SearchCircle', SearchCircle)
.component('Search', Search)
.component('CloudDownloadOutline', CloudDownloadOutline)
.mount('#app')
console.log('main.js')