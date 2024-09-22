const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/smart-brain', { useNewUrlParser: true, useUnifiedTopology: true });

// Define Schemas
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  joined: { type: Date, default: Date.now },
  entries: { type: Number, default: 0 }
});

const LoginSchema = new mongoose.Schema({
  email: String,
  hash: String
});

// Create Models
const User = mongoose.model('User', UserSchema);
const Login = mongoose.model('Login', LoginSchema);

const app = express();

app.use(cors());
app.use(express.json());

app.post('/signin', async (req, res) => {
  try {
    const data = await Login.findOne({ email: req.body.email });
    if (data) {
      const isValid = bcrypt.compareSync(req.body.password, data.hash);
      if (isValid) {
        const user = await User.findOne({ email: req.body.email });
        return res.json(user);
      } else {
        return res.status(400).json('wrong credentials');
      }
    } else {
      return res.status(400).json('wrong credentials');
    }
  } catch (err) {
    res.status(400).json('wrong credentials');
  }
});

app.post('/register', async (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);
  try {
    const login = await Login.create({ email, hash });
    const user = await User.create({ email: login.email, name });
    res.json(user);
  } catch (err) {
    res.status(400).json('unable to register');
  }
});

app.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(400).json('Not found');
    }
  } catch (err) {
    res.status(400).json('error getting user');
  }
});

app.put('/image', async (req, res) => {
  const { id } = req.body;
  try {
    const user = await User.findByIdAndUpdate(id, { $inc: { entries: 1 } }, { new: true });
    res.json(user.entries);
  } catch (err) {
    res.status(400).json('unable to get entries');
  }
});

const seedUser = async () => {
  try {
    const name = 'Srikar C';
    const email = 'srikar@gmail.com';
    const password = '0000';
    
    const hash = bcrypt.hashSync(password);
    
    const login = await Login.create({ email, hash });
    
    await User.create({ email: login.email, name });

    console.log(`User ${name} seeded successfully!`);
  } catch (err) {
    console.error('Error seeding user:', err);
  }
};

seedUser();

app.listen(3001, () => {
  console.log('app is running on port 3001');
});
