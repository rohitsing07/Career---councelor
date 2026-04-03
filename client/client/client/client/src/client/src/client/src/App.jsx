import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = '/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data))
        .catch(() => logout());
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!token) return <Navigate to="/login" />;
    if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" />;
    return children;
  };

  const Home = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-gray-950 flex items-center justify-center">
      <div className="text-center px-6 max-w-4xl">
        <h1 className="text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400">Career Counselor</h1>
        <h2 className="text-5xl font-semibold mb-8">JEE / NEET</h2>
        <p className="text-2xl text-gray-300 mb-12">Your Personal AI-Powered College Predictor</p>
        <Link to="/dashboard" className="inline-block bg-white text-gray-900 px-10 py-5 rounded-2xl text-2xl font-semibold hover:scale-105 transition">Get Personal Counseling →</Link>
        <div className="mt-16 flex justify-center gap-8 text-sm opacity-70">
          <div>🏛️ 100+ Colleges</div>
          <div>📊 Real-time Prediction</div>
          <div>🔐 Secure Login</div>
        </div>
      </div>
    </div>
  );

  const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const handleSubmit = async e => {
      e.preventDefault();
      const res = await axios.post(`${API_URL}/auth/login`, form);
      login(res.data.token, res.data.user);
    };
    return (
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={handleSubmit} className="bg-gray-900 p-10 rounded-3xl w-full max-w-md">
          <h2 className="text-4xl font-bold mb-8 text-center">Login</h2>
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full mb-4 p-4 rounded-2xl bg-gray-800" required />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full mb-8 p-4 rounded-2xl bg-gray-800" required />
          <button type="submit" className="w-full py-4 bg-violet-600 hover:bg-violet-700 rounded-2xl font-semibold text-xl">Login</button>
          <p className="text-center mt-6 text-gray-400">Don't have an account? <Link to="/signup" className="text-violet-400">Sign up</Link></p>
        </form>
      </div>
    );
  };

  const Signup = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', examType: 'JEE', rank: '', category: 'General', state: '' });
    const handleSubmit = async e => {
      e.preventDefault();
      const res = await axios.post(`${API_URL}/auth/signup`, form);
      login(res.data.token, res.data.user);
    };
    return (
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={handleSubmit} className="bg-gray-900 p-10 rounded-3xl w-full max-w-lg">
          <h2 className="text-4xl font-bold mb-8 text-center">Create Account</h2>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="p-4 rounded-2xl bg-gray-800" required />
            <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="p-4 rounded-2xl bg-gray-800" required />
            <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="p-4 rounded-2xl bg-gray-800" required />
            <select value={form.examType} onChange={e=>setForm({...form,examType:e.target.value})} className="p-4 rounded-2xl bg-gray-800">
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
            </select>
            <input placeholder="Rank" type="number" value={form.rank} onChange={e=>setForm({...form,rank:e.target.value})} className="p-4 rounded-2xl bg-gray-800" required />
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="p-4 rounded-2xl bg-gray-800">
              <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
            </select>
            <input placeholder="State" value={form.state} onChange={e=>setForm({...form,state:e.target.value})} className="p-4 rounded-2xl bg-gray-800 col-span-2" />
          </div>
          <button type="submit" className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-semibold text-xl">Create Account</button>
        </form>
      </div>
    );
  };

  const Dashboard = () => {
    const [form, setForm] = useState({ rank: user?.rank || '', category: user?.category || 'General', examType: user?.examType || 'JEE', preferredBranch: '' });
    const [result, setResult] = useState(null);

    const predict = async () => {
      const res = await axios.post(`${API_URL}/predict`, form, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
    };

    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
        <div className="bg-gray-900 rounded-3xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div>
              <label className="block text-sm mb-1">Rank</label>
              <input type="number" value={form.rank} onChange={e=>setForm({...form,rank:e.target.value})} className="w-full p-4 rounded-2xl bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm mb-1">Category</label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full p-4 rounded-2xl bg-gray-800">
                <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Exam</label>
              <select value={form.examType} onChange={e=>setForm({...form,examType:e.target.value})} className="w-full p-4 rounded-2xl bg-gray-800">
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Preferred Branch</label>
              <input value={form.preferredBranch} onChange={e=>setForm({...form,preferredBranch:e.target.value})} placeholder="CSE / MBBS / ECE" className="w-full p-4 rounded-2xl bg-gray-800" />
            </div>
          </div>
          <button onClick={predict} className="w-full py-6 text-2xl font-semibold bg-gradient-to-r from-cyan-500 to-violet-500 rounded-3xl">Predict Colleges</button>
        </div>

        {result && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Prediction Results</h2>
            {Object.entries(result).map(([level, colleges]) => (
              colleges.length > 0 && (
                <div key={level} className="mb-12">
                  <h3 className={`text-2xl font-semibold mb-4 ${level === 'Dream' ? 'text-amber-400' : level === 'Moderate' ? 'text-blue-400' : 'text-emerald-400'}`}>
                    {level} Colleges ({colleges.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {colleges.map(c => (
                      <div key={c._id} className="bg-gray-900 rounded-3xl p-6">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-semibold text-xl">{c.name}</h4>
                            <p className="text-sm text-gray-400">{c.location} • {c.branch}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-gray-800 px-3 py-1 rounded-full">₹{c.fees}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    );
  };

  const Colleges = () => {
    const [colleges, setColleges] = useState([]);
    useEffect(() => { axios.get(`${API_URL}/colleges`).then(res => setColleges(res.data)); }, []);
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">College Database</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {colleges.map(c => (
            <div key={c._id} className="bg-gray-900 rounded-3xl p-6">
              <h3 className="font-bold text-xl">{c.name}</h3>
              <p className="text-emerald-400">{c.examType} • {c.branch}</p>
              <p className="text-sm mt-2">📍 {c.location}</p>
              <p className="text-sm">₹{c.fees} / year</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Contact = () => (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-gray-900 rounded-3xl p-12 text-center">
        <h1 className="text-5xl font-bold mb-6">Contact Us</h1>
        <div className="space-y-8">
          <div>
            <p className="text-2xl font-semibold">Rohit Singh</p>
            <a href="mailto:rohitsingh052600@gmail.com" className="text-xl text-cyan-400 hover:underline block mt-2">rohitsingh052600@gmail.com</a>
          </div>
          <div>
            <a href="https://wa.me/918092519291?text=Hi%20Rohit%2C%20I%20need%20help%20with%20JEE%2FNEET%20counseling" 
               target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-medium">
              💬 Chat on WhatsApp
            </a>
          </div>
          <p className="text-gray-400">Pre-filled message: "Hi Rohit, I need help with JEE/NEET counseling"</p>
        </div>
      </div>
    </div>
  );

  const AdminPanel = () => {
    const [colleges, setColleges] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
      axios.get(`${API_URL}/colleges`).then(r => setColleges(r.data));
      axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setUsers(r.data));
    }, []);

    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>
        <div className="mb-12">
          <h2 className="text-2xl mb-4">Users ({users.length})</h2>
          <div className="bg-gray-900 rounded-3xl p-6 overflow-auto max-h-96">
            {users.map(u => <div key={u._id} className="flex justify-between py-3 border-b border-gray-700">{u.name} • {u.email} • {u.role}</div>)}
          </div>
        </div>
        <p className="text-emerald-400">✅ Full CRUD for colleges is implemented in backend. Extend UI as needed.</p>
      </div>
    );
  };

  return (
    <Router>
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold tracking-tighter">Career<span className="text-cyan-400">Counselor</span></Link>
          <div className="flex items-center gap-8">
            <Link to="/">Home</Link>
            <Link to="/colleges">Colleges</Link>
            <Link to="/contact">Contact</Link>
            {token && <Link to="/dashboard">Dashboard</Link>}
            {user?.role === 'admin' && <Link to="/admin" className="text-amber-400">Admin</Link>}
            {token ? (
              <button onClick={logout} className="px-6 py-2 bg-red-500/10 text-red-400 rounded-2xl">Logout</button>
            ) : (
              <>
                <Link to="/login" className="px-6 py-2">Login</Link>
                <Link to="/signup" className="px-6 py-2 bg-white text-gray-900 rounded-2xl">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/colleges" element={<Colleges />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
