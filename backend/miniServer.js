const express = require('express');
const cors = require('cors');
const path = require('path');
const autoDockVinaRoutes = require('./routes/autoDockVina');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/vina', autoDockVinaRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'running', routes: ['/vina/upload', '/vina/dock', '/vina/upload-dock'] });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
