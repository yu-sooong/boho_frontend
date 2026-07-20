import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { initAnalytics, trackPageView } from './analytics'

const app = createApp(App)

app.config.errorHandler = (err, _instance, info) => {
  console.error('[buyu]', info, err)
}

app.use(createPinia())
app.use(router)
app.mount('#app')

initAnalytics()

router.afterEach((to) => {
  trackPageView(to.fullPath, typeof to.meta.title === 'string' ? to.meta.title : undefined)
})
