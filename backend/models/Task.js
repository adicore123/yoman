const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  category: { 
    type: String, 
    enum: ['therapy', 'medical', 'personal'], 
    default: 'personal' 
  },
  completed: { 
    type: Boolean, 
    default: false 
  },
  completedAt: { 
    type: String, 
    default: null 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  notes: { 
    type: String, 
    default: '' 
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
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    index: true 
  }
}, {
  timestamps: true
});

taskSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Task', taskSchema);
