require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const userRoutes = require('./Routes/User.routes');



const app = express();
app.use(cors());
app.use(bodyParser.json());

const memoryStore = new session.MemoryStore();

app.use(session({
  secret: process.env.SESSION_SECRET || 'some-secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));


// Mount routes
app.use('/api/users', userRoutes());


// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to database');
    app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`));
  })
  .catch(err => console.error(err));
