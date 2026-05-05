import mongoose from 'mongoose'
import crypto from 'crypto'

const OtpTokenSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true },
  codeHash:  { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false },
})

OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

OtpTokenSchema.statics.hashCode = (code) =>
  crypto.createHash('sha256').update(code).digest('hex')

export default mongoose.models.OtpToken || mongoose.model('OtpToken', OtpTokenSchema)
