export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (!process.env.DATABASE_URL) return
  const { startRecordJob } = await import("./lib/scan/record-job.ts")
  startRecordJob()
}