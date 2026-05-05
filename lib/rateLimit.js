import { connectDB } from './mongodb'
import RateLimit from '@/models/RateLimit'

export async function isRateLimited(key, maxHits, windowMs) {
  await connectDB()
  const now = new Date()

  const result = await RateLimit.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { resetAt: new Date(now.getTime() + windowMs) },
    },
    { upsert: true, new: true }
  )

  if (result.resetAt < now) {
    await RateLimit.findOneAndReplace(
      { key },
      { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
      { upsert: true }
    )
    return false
  }

  return result.count > maxHits
}
