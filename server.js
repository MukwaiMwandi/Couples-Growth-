const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const coupleRoutes = require('./routes/couples');
const quantumRoutes = require('./routes/quantum');
const aiRoutes = require('./routes/ai');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum-couple', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/couples', coupleRoutes);
app.use('/api/quantum', quantumRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io for real-time features
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ["GET", "POST"]
  }
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join-couple', (coupleId) => {
    socket.join(coupleId);
    console.log(`Socket joined couple room: ${coupleId}`);
  });
  
  socket.on('new-entry', (data) => {
    io.to(data.coupleId).emit('entry-added', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

module.exports = { app, io };
