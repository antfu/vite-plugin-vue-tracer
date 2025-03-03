import { createApp } from 'vue'
import App from './App.vue'

import '@unocss/reset/tailwind.css'
import 'vite-plugin-vue-tracer/client/overlay'
import './style.css'
import 'uno.css'

createApp(App).mount('#app')
