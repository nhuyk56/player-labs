import {
  CloudUploadOutline,
  SearchCircle,
  Search,
  CloudDownloadOutline,
  Play,
  Pause
} from '@vicons/ionicons5'
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App)
.component('CloudUploadOutline', CloudUploadOutline)
.component('SearchCircle', SearchCircle)
.component('Search', Search)
.component('CloudDownloadOutline', CloudDownloadOutline)
.component('Play', Play)
.component('Pause', Pause)
.mount('#app')
console.log('main.js')