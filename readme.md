Proyek FitEat - Backend Microservices
Dokumentasi ini berisi panduan lengkap mengenai arsitektur, instalasi, konfigurasi database, dan daftar API untuk sistem FitEat. Sistem ini dikembangkan menggunakan arsitektur microservices untuk menangani layanan katering sehat.

dibuat oleh: Muhammad Rafi Adinata
NIM: 2410511012
Kelas: Informatika A

1. Arsitektur Sistem
Sistem ini terdiri dari empat layanan utama yang berjalan secara terpisah namun saling terintegrasi:

API Gateway (Port 7012): Satu-satunya pintu masuk bagi klien. Menangani rate limiting, keamanan (JWT), dan meneruskan permintaan ke service yang tepat.

Auth Service (Port 7001): Layanan khusus untuk mengelola data pengguna (Registrasi & Login).

Katering Service (Port 7002): Layanan inti untuk manajemen Menu dan Pesanan (Order).

Notification Service: Layanan asinkron (Worker) yang menerima data pesanan dari RabbitMQ untuk disimulasikan di bagian dapur.

Alur Komunikasi:
Client ➔ Gateway (7012) ➔ Auth/Katering Service ➔ RabbitMQ ➔ Notification Service

2. Teknologi Utama
Bahasa: Node.js (Express.js)

Database: MySQL

ORM: Prisma

Antrean Pesan: RabbitMQ (amqplib)

Keamanan: JSON Web Token (JWT) & Bcrypt

Manajemen Proses: PM2

3. Panduan Instalasi & Jalankan
Instalasi Dependensi
Masuk ke folder utama proyek dan jalankan perintah berikut untuk menginstal semua library di setiap folder:

cd api-gateway && npm install && cd ..
cd auth-service && npm install && cd ..
cd katering-service && npm install && cd ..
cd notification-service && npm install && cd ..
# Instal PM2 secara lokal untuk manajemen proses
npm install pm2

Konfigurasi Database (SQL Manual)
CREATE DATABASE IF NOT EXISTS fiteat_db;
USE fiteat_db;

CREATE TABLE `User` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) UNIQUE NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) DEFAULT 'customer'
) ENGINE=InnoDB;

CREATE TABLE `Menu` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `calories` INT NOT NULL,
    `price` INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `Order` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `userId` INT NOT NULL,
    `menuId` INT NOT NULL,
    `status` VARCHAR(191) DEFAULT 'pending',
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Order_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `Menu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

4. Deployment di Server (PM2)
npx pm2 start api-gateway/index.js --name "gateway_makan"
npx pm2 start auth-service/index.js --name "auth_makan"
npx pm2 start katering-service/index.js --name "katering_makan"
npx pm2 start notification-service/index.js --name "notification_makan"

Cek Status: npx pm2 status

Cek Log (Notifikasi Dapur): npx pm2 logs

5. Dokumentasi API (Endpoint)
Seluruh permintaan akses dilakukan melalui IP Server dengan Port 7012. Berikut adalah daftar endpoint yang tersedia:

Registrasi Pengguna Gunakan method POST ke /auth/register. Endpoint ini bersifat Public dan digunakan untuk mendaftarkan akun baru baik sebagai Admin maupun Customer.

Login Pengguna Gunakan method POST ke /auth/login. Endpoint ini bersifat Public untuk mendapatkan token JWT yang digunakan sebagai akses autentikasi.

Melihat Daftar Menu Gunakan method GET ke /api/menus. Endpoint ini dapat diakses oleh Semua User yang telah memiliki token valid untuk melihat daftar katering yang tersedia.

Menambahkan Menu Baru Gunakan method POST ke /api/menus. Endpoint ini hanya dapat diakses oleh user dengan role Admin Only. Diperlukan Header Authorization (Bearer Token).

Membuat Pesanan (Order) Gunakan method POST ke /api/orders. Endpoint ini hanya dapat diakses oleh user dengan role Customer Only. Setelah pesanan dibuat, sistem akan mengirimkan pesan ke bagian notifikasi dapur via RabbitMQ.

Format Header Authorization: Pastikan menyertakan Authorization: Bearer <TOKEN_JWT> pada setiap request ke endpoint yang diproteksi.