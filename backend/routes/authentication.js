const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../config/mongoConfig.js');

const JWT_SECRET = process.env.JWT_SECRET
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function verifyJWT(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: 'username already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    await user.save();
    const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { username: user.username, _id: user._id } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'username and password required' });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ _id: user._id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { username: user.username, _id: user._id, newPassword: user.newPassword, email:user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'No Google token provided' });
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const username = payload.username;
    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username, password: '' });
      await user.save();
    }
    const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { username: user.username, _id: user._id } });
  } catch (err) {
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

router.post('/change-password', verifyJWT, async (req, res) => {
 const {newPassword} = req.body;
 if (!newPassword)
   return res.status(400).json({ error: 'New password required' });
  try{
    const hash = await bcrypt.hash(newPassword, 10);
   const result = await User.updateOne(
      { _id: req.user._id },
      { $set: { password: hash, newPassword: false } }
    );
    res.json({ message: 'Password changed successfully' });
    console.log('Password changed successfully', result);

  }catch (err) {
    res.status(500).json({ error: 'Server error' });
  console.error('Error changing password:', err);
  }
});

module.exports = {
  router,
  verifyJWT,
};