const express = require('express');
const { PrismaClient } = require('@prisma/client');
const amqp = require('amqplib');
const Joi = require('joi');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const RABBITMQ_URL = 'amqp://localhost';

const menuSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  calories: Joi.number().integer().min(0).required(),
  price: Joi.number().integer().min(0).required()
});

const checkRole = (role) => (req, res, next) => {
  if (req.headers['x-user-role'] !== role) {
    return res.status(403).json({ error: 'Anda tidak memiliki izin untuk tindakan ini' });
  }
  next();
};

app.get('/menus', async (req, res) => {
  const menus = await prisma.menu.findMany();
  res.json(menus);
});

app.post('/menus', checkRole('admin'), async (req, res) => {
  const { error } = menuSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const newMenu = await prisma.menu.create({ data: req.body });
    res.status(201).json({ message: 'Menu berhasil ditambahkan', menu: newMenu });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menambahkan menu' });
  }
});

app.post('/orders', checkRole('customer'), async (req, res) => {
  const { menuId } = req.body;
  const userId = parseInt(req.headers['x-user-id']);

  try {
    const newOrder = await prisma.order.create({
      data: { userId, menuId, status: 'pending' }
    });

    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = 'order_processing';

    await channel.assertQueue(queue, { durable: true });
    
    const messagePayload = JSON.stringify({ 
      orderId: newOrder.id, 
      userId, 
      menuId, 
      timestamp: new Date() 
    });
    
    channel.sendToQueue(queue, Buffer.from(messagePayload));
    setTimeout(() => { connection.close(); }, 500);

    res.status(201).json({ 
      message: 'Pesanan diterima dan sedang diproses di dapur', 
      orderId: newOrder.id 
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat pesanan' });
  }
});

app.listen(7002, () => console.log('Katering Service aktif di port 7002'));