const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());

const JWT_SECRET = 'IJAHUSBB1653HSJAJ26AYAHW7';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Terlalu banyak request, coba lagi nanti.' }
});
app.use(limiter);

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Token tidak valid atau kedaluwarsa' });
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Akses ditolak, token tidak ditemukan' });
  }
};

app.use('/auth', createProxyMiddleware({ target: 'http://localhost:7001', changeOrigin: true }));

app.use('/api', authenticateJWT, createProxyMiddleware({ 
  target: 'http://localhost:7002', 
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    }
  }
}));

// Ubah port di sini menjadi 7012
app.listen(7012, () => console.log('API Gateway aktif di port 7012'));