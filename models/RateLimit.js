import mongoose from 'mongoose'

const RateLimitSchema = new mongoose.Schema({
  key:     { type: String, required: true, unique: true },
  count:   { type: Number, default: 1 },
  resetAt: { type: Date, required: true },
})

RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema)
