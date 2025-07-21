const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const readline = require('readline');
const { User } = require('../config/mongoConfig.js');
dotenv.config();

const uri = process.env.MONGO_URI;
console.log(uri)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log("MONGO_URI:", process.env.MONGO_URI); 
  // Connect to MongoDB
  await mongoose.connect('mongodb+srv://mishra_lab:Mishra_lab20251@cluster0.fgfn8nr.mongodb.net/myDatabase?retryWrites=true&w=majority', {
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