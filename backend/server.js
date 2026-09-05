require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Entry = require('./models/Entry');
const Task = require('./models/Task');
const Media = require('./models/Media');
const { authMiddleware, superadminMiddleware, JWT_SECRET } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Seed superadmin user and migrate existing data
async function seedInitialUserAndMigrate() {
  try {
    let adicoreUser = await User.findOne({ username: 'adicore' });
    if (!adicoreUser) {
      const hashedPassword = await bcrypt.hash('c38410a3', 10);
      adicoreUser = new User({
        username: 'adicore',
        password: hashedPassword,
        displayName: 'עדי לוי',
        role: 'superadmin',
        status: 'active'
      });
      await adicoreUser.save();
      console.log('✅ Initial superadmin user "adicore" initialized successfully.');
    }

    // Attach any existing orphan documents to adicore
    const entryUpdate = await Entry.updateMany({ userId: { $exists: false } }, { userId: adicoreUser._id });
    const taskUpdate = await Task.updateMany({ userId: { $exists: false } }, { userId: adicoreUser._id });
    const mediaUpdate = await Media.updateMany({ userId: { $exists: false } }, { userId: adicoreUser._id });

    if (entryUpdate.modifiedCount || taskUpdate.modifiedCount || mediaUpdate.modifiedCount) {
      console.log(`✅ Migrated existing data to adicore: ${entryUpdate.modifiedCount} entries, ${taskUpdate.modifiedCount} tasks, ${mediaUpdate.modifiedCount} media.`);
    }
  } catch (error) {
    console.error('Error during initial user seed and migration:', error);
  }
}

const DEFAULT_MONGODB_URI = "mongodb+srv://adi050levy_db_user:tv5qEqbB3Mrs1gCa@cluster0.2pttjzc.mongodb.net/yoman?retryWrites=true&w=majority";

let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  try {
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('Connected to MongoDB Atlas');
    await seedInitialUserAndMigrate();
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    throw err;
  }
}

// Ensure database connection on each request (crucial for serverless on Vercel)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({ 
      error: 'שגיאת תקשורת עם מסד הנתונים', 
      details: err.message 
    });
  }
});

// ==========================================
// 1. Authentication Routes
// ==========================================

// Public user registration (always defaults to role: 'user', only adicore remains superadmin)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'שם משתמש וסיסמה הם שדות חובה' });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'שם משתמש חייב להכיל לפחות 3 תווים באנגלית' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'סיסמה חייבת להכיל לפחות 4 תווים' });
    }

    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ error: 'שם משתמש זה כבר קיים במערכת, אנא בחר שם אחר' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Role is strictly locked to 'user' for public registration
    const newUser = new User({
      username: cleanUsername,
      password: hashedPassword,
      displayName: displayName?.trim() || cleanUsername,
      role: 'user',
      status: 'active'
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        displayName: newUser.displayName,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'שגיאה בהרשמה למערכת', details: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'נא להזין שם משתמש וסיסמה' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = typeof password === 'string' ? password.trim() : password;
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'חשבון זה מושבת. פנה למנהל המערכת.' });
    }

    let isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch && typeof password === 'string' && password !== cleanPassword) {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName || user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'שגיאה בהתחברות למערכת', details: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      displayName: req.user.displayName || req.user.username,
      role: req.user.role
    }
  });
});

// ==========================================
// 2. Multi-Tenant Journal Entries Routes
// ==========================================

app.get('/api/entries', authMiddleware, async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

app.post('/api/entries', authMiddleware, async (req, res) => {
  try {
    const newEntry = new Entry({
      ...req.body,
      userId: req.user._id
    });
    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(400).json({ error: 'Failed to save entry', details: error.message });
  }
});

app.put('/api/entries/:id', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user._id };
    const updatedEntry = await Entry.findOneAndUpdate(
      filter, 
      { content: req.body.content },
      { new: true }
    );
    if (!updatedEntry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update entry', details: error.message });
  }
});

app.delete('/api/entries/:id', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user._id };
    const deleted = await Entry.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete entry' });
  }
});

// ==========================================
// 3. Multi-Tenant Tasks Routes
// ==========================================

app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ completed: 1, createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const newTask = new Task({
      ...req.body,
      userId: req.user._id
    });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ error: 'Failed to save task', details: error.message });
  }
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user._id };
    const updatedTask = await Task.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update task', details: error.message });
  }
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user._id };
    const deletedTask = await Task.findOneAndDelete(filter);
    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete task', details: error.message });
  }
});

// ==========================================
// 4. Multi-Tenant Uplifting Media Routes
// ==========================================

app.get('/api/media', authMiddleware, async (req, res) => {
  try {
    const media = await Media.find({ userId: req.user._id }).sort({ isFavorite: -1, createdAt: -1 });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media', details: error.message });
  }
});

app.post('/api/media', authMiddleware, async (req, res) => {
  try {
    const newMedia = new Media({
      ...req.body,
      userId: req.user._id
    });
    const savedMedia = await newMedia.save();
    res.status(201).json(savedMedia);
  } catch (error) {
    res.status(400).json({ error: 'Failed to save media', details: error.message });
  }
});

app.put('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user._id };
    const updatedMedia = await Media.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMedia) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json(updatedMedia);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update media', details: error.message });
  }
});

app.delete('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user._id };
    const deletedMedia = await Media.findOneAndDelete(filter);
    if (!deletedMedia) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete media', details: error.message });
  }
});

// ==========================================
// 5. Superadmin Management Routes (/api/admin)
// ==========================================

// Global system statistics
app.get('/api/admin/stats', authMiddleware, superadminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalEntries = await Entry.countDocuments();
    const totalTasks = await Task.countDocuments();
    const totalMedia = await Media.countDocuments();

    res.json({
      totalUsers,
      activeUsers,
      totalEntries,
      totalTasks,
      totalMedia
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// List all users with item counts
app.get('/api/admin/users', authMiddleware, superadminMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    
    // Compute item counts for each user
    const usersWithStats = await Promise.all(users.map(async (u) => {
      const entriesCount = await Entry.countDocuments({ userId: u._id });
      const tasksCount = await Task.countDocuments({ userId: u._id });
      const mediaCount = await Media.countDocuments({ userId: u._id });

      return {
        id: u._id,
        username: u.username,
        displayName: u.displayName || u.username,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        stats: {
          entries: entriesCount,
          tasks: tasksCount,
          media: mediaCount
        }
      };
    }));

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (tenant)
app.post('/api/admin/users', authMiddleware, superadminMiddleware, async (req, res) => {
  try {
    const { username, password, displayName, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'שם משתמש וסיסמה הם שדות חובה' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ error: 'שם משתמש זה כבר קיים במערכת' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username: cleanUsername,
      password: hashedPassword,
      displayName: displayName?.trim() || cleanUsername,
      role: role || 'user',
      status: 'active'
    });

    await newUser.save();
    res.status(201).json({
      id: newUser._id,
      username: newUser.username,
      displayName: newUser.displayName,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
      stats: { entries: 0, tasks: 0, media: 0 }
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create user', details: error.message });
  }
});

// Update user / reset password / change role / toggle status
app.put('/api/admin/users/:id', authMiddleware, superadminMiddleware, async (req, res) => {
  try {
    const updates = {};
    if (req.body.displayName !== undefined) updates.displayName = req.body.displayName.trim();
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.status !== undefined) updates.status = req.body.status;
    
    if (req.body.password && req.body.password.trim()) {
      updates.password = await bcrypt.hash(req.body.password.trim(), 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: updatedUser._id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      role: updatedUser.role,
      status: updatedUser.status
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update user', details: error.message });
  }
});

// Delete user and cascade delete their tenant data
app.delete('/api/admin/users/:id', authMiddleware, superadminMiddleware, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'לא ניתן למחוק את חשבון ה-Superadmin המחובר' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cascade delete tenant's data
    await Entry.deleteMany({ userId: deletedUser._id });
    await Task.deleteMany({ userId: deletedUser._id });
    await Media.deleteMany({ userId: deletedUser._id });

    res.json({ success: true, message: 'User and all associated data deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete user' });
  }
});

if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
