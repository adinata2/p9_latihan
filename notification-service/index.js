const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://localhost';

async function startWorker() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = 'order_processing';

    await channel.assertQueue(queue, { durable: true });
    
    channel.prefetch(1); 
    console.log(`Menunggu pesanan masuk di antrean: ${queue}...`);

    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const orderData = JSON.parse(msg.content.toString());
        console.log(`[x] Pesanan Diterima Dapur! Memproses Order ID: ${orderData.orderId}`);
        
        setTimeout(() => {
          console.log(`[v] Order ID: ${orderData.orderId} selesai dimasak dan siap dikirim.`);
          channel.ack(msg); 
        }, 5000);
      }
    });
  } catch (error) {
    console.error('Gagal terhubung ke RabbitMQ', error);
  }
}

startWorker();