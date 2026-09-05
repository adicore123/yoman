const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  url: { 
    type: String, 
    required: true, 
    trim: true 
  },
  platform: { 
    type: String, 
    enum: ['youtube', 'facebook', 'instagram', 'tiktok', 'other'], 
    default: 'other' 
  },
  category: { 
    type: String, 
    enum: ['inspiration', 'calm', 'motivation', 'healing', 'general'], 
    default: 'inspiration' 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  isFavorite: { 
    type: Boolean, 
    default: false 
  },
  displayDate: { 
    type: String, 
    default: '' 
  },
  displayTime: { 
    type: String, 
    default: '' 
  },
  timestamp: { 
    type: String, 
    default: () => new Date().toISOString() 
  }
}, {
  timestamps: true
});

mediaSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Media', mediaSchema);
