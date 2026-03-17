import { createApp } from 'vue'
import { Locale } from 'vant'
import zhTW from 'vant/es/locale/lang/zh-TW'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router, { installAuthGuard } from './router'
import { initDatabase } from './db'
import { useAuth } from './composables/useAuth'
import './styles/index.css'

Locale.use('zh-TW', zhTW)

// Auto-reload when new version detected
registerSW({
  onNeedRefresh() {
    console.log('[PWA] New version available, reloading...')
    window.location.reload()
  },
  onOfflineReady() {
    console.log('[PWA] Offline ready')
  },
})

async function bootstrap() {
  if (navigator.storage?.persist) {
    await navigator.storage.persist()
  }

  await initDatabase()

  const { userRole } = useAuth()
  installAuthGuard(() => userRole.value)

  const app = createApp(App)
  app.use(router)
  app.mount('#app')
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err)
  document.getElementById('app')!.innerHTML = `
    <div style="padding:2rem;font-family:system-ui;color:red">
      <h2>啟動失敗</h2>
      <pre style="white-space:pre-wrap">${err?.message || err}</pre>
    </div>
  `
})
