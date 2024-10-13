const express = require('express');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');

const app = express();
const db = new sqlite3.Database('database.db');

// Создание таблицы пользователей, если её нет
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT UNIQUE,
    email_confirmed INTEGER DEFAULT 0,
    avatar TEXT
)`);

// Создание таблицы объявлений, если её нет
db.run(`CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    price REAL,
    image TEXT,
    date_posted DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
)`);

// Создание таблицы изображений объявлений, если её нет
db.run(`CREATE TABLE IF NOT EXISTS ad_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id INTEGER,
    image_path TEXT,
    FOREIGN KEY(ad_id) REFERENCES ads(id)
)`);

// Настройка сессий
app.use(session({
    store: new SQLiteStore(),
    secret: 'secret_key', // секретный ключ
    resave: false,
    saveUninitialized: false
}));

// Парсинг данных форм
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Статические папки
app.use(express.static(path.join(__dirname, 'public')));
app.use('/avatars', express.static(path.join(__dirname, 'avatars')));
app.use('/ad-images', express.static(path.join(__dirname, 'ad-images')));
// Статическая раздача папки images
app.use('/images', express.static(path.join(__dirname, 'images')));


// Настройка транспортера для отправки писем
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gmail', //  email
        pass: 'pass'   //  пароль от  email
    }
});

// Функция для отправки письма подтверждения
function sendConfirmationEmail(email, userId) {
    const confirmationLink = `http://localhost:3000/confirm-email?userId=${userId}`;

    const mailOptions = {
        from: 'gmail', // email
        to: email,
        subject: 'Подтверждение электронной почты',
        text: `Пожалуйста, подтвердите вашу электронную почту, перейдя по ссылке: ${confirmationLink}`
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.error('Ошибка при отправке письма:', error);
        } else {
            console.log('Письмо отправлено: ' + info.response);
        }
    });
}

// Настройка хранения загруженных файлов для аватарок
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'avatars/');
    },
    filename: function (req, file, cb) {
        cb(null, 'avatar_' + req.session.userId + path.extname(file.originalname));
    }
});

const uploadAvatar = multer({ storage: avatarStorage });

// Настройка хранения загруженных файлов для объявлений (несколько изображений)
const adImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'ad-images/');
    },
    filename: function (req, file, cb) {
        cb(null, 'ad_' + Date.now() + '_' + file.originalname);
    }
});

const uploadAdImages = multer({ storage: adImageStorage });

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Маршрут для предоставления объявлений
app.get('/ads', (req, res) => {
    db.all(`
        SELECT ads.*, users.username,
        (
            SELECT image_path FROM ad_images WHERE ad_images.ad_id = ads.id LIMIT 1
        ) AS image
        FROM ads
        JOIN users ON ads.user_id = users.id`, (err, ads) => {
        if (err) {
            console.error(err);
            res.json([]);
        } else {
            res.json(ads);
        }
    });
});


// Страница входа
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error(err);
            return res.send('Ошибка сервера');
        }
        if (!user) {
            return res.send('Неверное имя пользователя или пароль');
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                req.session.userId = user.id;
                res.redirect('/');
            } else {
                res.send('Неверное имя пользователя или пароль');
            }
        });
    });
});

// Страница регистрации
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.post('/register', (req, res) => {
    const { username, password, first_name, last_name, phone, email } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error(err);
            return res.send('Ошибка шифрования пароля');
        }

        db.run(`INSERT INTO users (username, password, first_name, last_name, phone, email) VALUES (?, ?, ?, ?, ?, ?)`,
            [username, hash, first_name, last_name, phone, email], function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.send('Пользователь с таким именем или email уже существует');
                    } else {
                        console.error(err);
                        return res.send('Ошибка базы данных');
                    }
                }
                req.session.userId = this.lastID;
                // Отправка письма для подтверждения электронной почты
                sendConfirmationEmail(email, req.session.userId);
                res.redirect('/');
            });
    });
});

// Выход из аккаунта
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        res.redirect('/login');
    });
});

// Страница профиля
app.get('/profile', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'profile.html'));
    } else {
        res.redirect('/login');
    }
});

// Страница товара
app.get('/product/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// API для получения данных товара по ID
app.get('/api/product/:id', (req, res) => {
    const adId = req.params.id;

    db.get(`SELECT ads.*, users.username, users.phone, users.email FROM ads JOIN users ON ads.user_id = users.id WHERE ads.id = ?`, [adId], (err, ad) => {
        if (err) {
            console.error(err);
            res.json({});
        } else {
            db.all(`SELECT image_path FROM ad_images WHERE ad_id = ?`, [adId], (err, images) => {
                if (err) {
                    console.error(err);
                    res.json({});
                } else {
                    ad.images = images.map(img => img.image_path);
                    res.json(ad);
                }
            });
        }
    });
});


// Обработка обновления профиля
app.post('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    const { first_name, last_name, phone } = req.body;

    db.run(`UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?`,
        [first_name, last_name, phone, req.session.userId], function(err) {
            if (err) {
                console.error(err);
                return res.send('Ошибка при обновлении профиля');
            }
            res.redirect('/profile');
        });
});

// Маршрут для загрузки аватарки
app.post('/upload-avatar', uploadAvatar.single('avatar'), (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    const avatarPath = '/avatars/' + req.file.filename;

    db.run(`UPDATE users SET avatar = ? WHERE id = ?`, [avatarPath, req.session.userId], function(err) {
        if (err) {
            console.error(err);
            return res.send('Ошибка при сохранении аватарки');
        }
        res.redirect('/profile');
    });
});

// API для получения информации о пользователе
app.get('/api/userinfo', (req, res) => {
    if (req.session.userId) {
        db.get('SELECT username, first_name, last_name, phone, avatar FROM users WHERE id = ?', [req.session.userId], (err, user) => {
            if (err) {
                console.error(err);
                res.json({});
            } else {
                res.json(user);
            }
        });
    } else {
        res.json({});
    }
});

// Маршрут для подтверждения электронной почты
app.get('/confirm-email', (req, res) => {
    const userId = req.query.userId;

    db.run('UPDATE users SET email_confirmed = 1 WHERE id = ?', [userId], function(err) {
        if (err) {
            console.error(err);
            return res.send('Ошибка при подтверждении электронной почты');
        }
        res.send('Электронная почта успешно подтверждена. Теперь вы можете использовать все функции сайта.');
    });
});

// Маршрут для отображения страницы добавления объявления
app.get('/add-ad', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'add-ad.html'));
    } else {
        res.redirect('/login');
    }
});

// Обработка добавления объявления
app.post('/add-ad', uploadAdImages.array('images', 10), (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    const { title, description, price } = req.body;

    db.run(`INSERT INTO ads (user_id, title, description, price) VALUES (?, ?, ?, ?)`,
        [req.session.userId, title, description, price], function(err) {
            if (err) {
                console.error(err);
                return res.send('Ошибка при добавлении объявления');
            }

            const adId = this.lastID;

            // Сохранение путей к изображениям
            if (req.files && req.files.length > 0) {
                const stmt = db.prepare(`INSERT INTO ad_images (ad_id, image_path) VALUES (?, ?)`);
                req.files.forEach(file => {
                    const imagePath = '/ad-images/' + file.filename;
                    stmt.run(adId, imagePath);
                });
                stmt.finalize();
            }

            res.redirect('/');
        });
});


// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
