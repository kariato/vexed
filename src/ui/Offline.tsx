import { useEffect, useState } from 'react'
interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
export function Offline({ canUpdate }: { canUpdate: boolean }) {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const [install, setInstall] = useState<InstallEvent | null>(null)
  useEffect(() => {
    let active = true
    let verification = 0
    let current: ServiceWorkerRegistration | null = null
    const verify = async (worker: ServiceWorker) => {
      const request = ++verification
      const available = await new Promise<boolean>(resolve => {
        const channel = new MessageChannel()
        const timer = setTimeout(() => { channel.port1.close(); resolve(false) }, 4000)
        channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data?.ready === true) }
        worker.postMessage({ type: 'CHECK_OFFLINE', repair: navigator.onLine }, [channel.port2])
      }).catch(() => false)
      if (active && request === verification) { setReady(available); setFailed(!available) }
    }
    const online = () => { setOffline(!navigator.onLine); if (current?.active) void verify(current.active) }
    const visible = () => { if (!document.hidden) online() }
    document.addEventListener('visibilitychange', visible)
    const prompt = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent) }
    window.addEventListener('online', online); window.addEventListener('offline', online); window.addEventListener('beforeinstallprompt', prompt)
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL, updateViaCache: 'none' }).then(reg => {
        if (!active) return
        current = reg; setRegistration(reg)
        const check = () => { if (active) setWaiting(reg.waiting) }
        const watch = () => { const worker = reg.installing; worker?.addEventListener('statechange', () => { check(); if (worker.state === 'redundant' && active) setFailed(true) }) }
        check(); watch(); reg.addEventListener('updatefound', watch)
        navigator.serviceWorker.ready.then(registration => { if (active && registration.active) void verify(registration.active) })
      }).catch(() => { if (active) setFailed(true) })
    }
    return () => { active = false; document.removeEventListener('visibilitychange', visible); window.removeEventListener('online', online); window.removeEventListener('offline', online); window.removeEventListener('beforeinstallprompt', prompt) }
  }, [])
  const update = () => {
    if (!canUpdate || !waiting) return
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true })
    waiting.postMessage({ type: 'ACTIVATE_UPDATE' })
  }
  return <div className="offline-status"><p>{offline ? 'Offline' : 'Online'} · {ready ? 'All 59 puzzles and solutions ready offline' : failed ? 'Offline download unavailable; online play still works' : import.meta.env.PROD ? 'Preparing offline play…' : 'Offline caching is enabled in the production build'}</p>
    {waiting && <button className="secondary" disabled={!canUpdate} onClick={update}>Update available · Reload saved game</button>}
    {install ? <button className="secondary" onClick={async () => { await install.prompt(); await install.userChoice; setInstall(null) }}>Install Vexed</button> : <details><summary>Install on your tablet</summary><p>On iPad or iPhone, use Safari’s Share menu → Add to Home Screen. On Android, use your browser’s Install app or Add to Home screen menu. You can also play here without installing.</p></details>}
    {failed && <button className="secondary" onClick={() => location.reload()}>Retry offline download</button>}
    {registration && <button className="secondary update-check" onClick={() => { void registration.update().catch(() => setFailed(true)) }}>Check for updates</button>}
    {import.meta.env.PROD && <p><a href={import.meta.env.BASE_URL + 'vexed-source.tar.gz'}>Download application source & license</a></p>}
  </div>
}
