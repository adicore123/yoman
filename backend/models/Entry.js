const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  title: { type: String, required: false },
  content: { type: String, required: true },
  mood: { type: String, required: false },
  intensity: { type: Number, required: false },
  tags: [String],
  pinned: { type: Boolean, default: false },
  displayDate: { type: String, required: false },
  displayTime: { type: String, required: false },
  timestamp: { type: String, required: true }
}, {
  timestamps: true
});

entrySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Entry', entrySchema);
