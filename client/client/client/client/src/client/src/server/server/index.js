const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error(err));

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  examType: { type: String, enum: ['JEE', 'NEET'] },
  rank: Number,
  category: String,
  state: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});
const User = mongoose.model('User', userSchema);

const collegeSchema = new mongoose.Schema({
  name: String,
  examType: { type: String, enum: ['JEE', 'NEET'] },
  location: String,
  fees: Number,
  branch: String,
  cutoffs: {
    general: Number,
    obc: Number,
    sc: Number,
    st: Number
  }
});
const College = mongoose.model('College', collegeSchema);

// Seed colleges
const seedColleges = async () => {
  const count = await College.countDocuments();
  if (count === 0) {
    await College.insertMany([
      { name: "IIT Bombay", examType: "JEE", location: "Maharashtra", fees: 200000, branch: "CSE", cutoffs: { general: 100, obc: 200, sc: 500, st: 700 } },
      { name: "IIT Delhi", examType: "JEE", location: "Delhi", fees: 200000, branch: "CSE", cutoffs: { general: 150, obc: 300, sc: 600, st: 800 } },
      { name: "NIT Patna", examType: "JEE", location: "Bihar", fees: 150000, branch: "CSE", cutoffs: { general: 12000, obc: 15000, sc: 25000, st: 30000 } },
      { name: "NIT Trichy", examType: "JEE", location: "Tamil Nadu", fees: 150000, branch: "ECE", cutoffs: { general: 5000, obc: 7000, sc: 12000, st: 15000 } },
      { name: "AIIMS Delhi", examType: "NEET", location: "Delhi", fees: 10000, branch: "MBBS", cutoffs: { general: 50, obc: 100, sc: 500, st: 700 } },
      { name: "AIIMS Patna", examType: "NEET", location: "Bihar", fees: 10000, branch: "MBBS", cutoffs: { general: 800, obc: 1200, sc: 3000, st: 4000 } },
      { name: "IIT Madras", examType: "JEE", location: "Tamil Nadu", fees: 200000, branch: "CSE", cutoffs: { general: 200, obc: 400, sc: 800, st: 1000 } },
      { name: "JIPMER Puducherry", examType: "NEET", location: "Puducherry", fees: 20000, branch: "MBBS", cutoffs: { general: 300, obc: 500, sc: 1500, st: 2000 } },
      { name: "NIT Surathkal", examType: "JEE", location: "Karnataka", fees: 150000, branch: "CSE", cutoffs: { general: 3000, obc: 4000, sc: 8000, st: 10000 } },
      { name: "Maulana Azad Medical College", examType: "NEET", location: "Delhi", fees: 5000, branch: "MBBS", cutoffs: { general: 100, obc: 200, sc: 800, st: 1000 } }
    ]);
    console.log('✅ Colleges seeded');
  }
};
seedColleges();

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, examType, rank, category, state } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const role = (email === 'rohitsingh052600@gmail.com') ? 'admin' : 'user';
    const user = await User.create({ name, email, password: hashed, examType, rank, category, state, role });
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { name, email, examType, rank, category, state, role } });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { name: user.name, email: user.email, examType: user.examType, rank: user.rank, category: user.category, state: user.state, role: user.role } });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

app.get('/api/colleges', async (req, res) => { res.json(await College.find()); });

app.post('/api/colleges', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  res.json(await College.create(req.body));
});

app.put('/api/colleges/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  res.json(await College.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});

app.delete('/api/colleges/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  await College.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.get('/api/users', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  res.json(await User.find().select('-password'));
});

app.post('/api/predict', auth, async (req, res) => {
  const { rank, category, examType, preferredBranch } = req.body;
  const colleges = await College.find({ examType, branch: preferredBranch });
  const grouped = { Dream: [], Moderate: [], Safe: [] };

  colleges.forEach(c => {
    const cutoff = c.cutoffs[category.toLowerCase()] || c.cutoffs.general;
    if (rank > cutoff) return;
    const margin = cutoff - rank;
    let level = margin > 10000 ? 'Safe' : margin > 5000 ? 'Moderate' : 'Dream';
    grouped[level].push({ ...c.toObject(), margin });
  });

  res.json(grouped);
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
