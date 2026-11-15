export function startExpirationJob(
  expire: () => Promise<void>,
  interval = 5000,
) {
  let running = false
  const timer = setInterval(() => {
    if (running) return
    running = true
    void expire()
      .catch(console.error)
      .finally(() => {
        running = false
      })
  }, interval)
  timer.unref()
  return () => clearInterval(timer)
}
