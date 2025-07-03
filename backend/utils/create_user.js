const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const { User } = require('../config/mongoConfig.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alphafold', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const username = (await prompt('Username : ')).trim();
  const password = await prompt('Password: ');
  const email = (await prompt('Email: ')).trim();

  if (!username || !password) {
    console.log('username and password are required.');
    process.exit(1);
  }

  const existing = await User.findOne({ username });
  if (existing) {
    console.log('User with this username already exists.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash,email, newPassword: true });
  await user.save();
  console.log('User created:', user.username);

  mongoose.disconnect();
  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
  rl.close();
});