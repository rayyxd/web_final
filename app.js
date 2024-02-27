const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const mustacheExpress = require('mustache-express');
const axios = require('axios');

const app = express();

// Установка Mustache Express в качестве движка представлений
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname); // Указываем папку, где хранятся шаблоны

// Подключение к базе данных MongoDB
mongoose.connect('mongodb://localhost:27017/myapp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Определение модели пользователя
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    country: { type: String, required: true },
    gender: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Определение модели проекта
const projectSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;


// Используйте middleware для инициализации сессии
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Middleware для разбора данных формы
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});
// Обработчик POST запроса для регистрации пользователя
app.post('/register', async (req, res) => {
    try {
        // Получаем данные о пользователе из запроса
        const { username, password, firstName, lastName, age, country, gender } = req.body;

        // Проверяем, существует ли пользователь с таким именем
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // Проверяем, что пароль не пустой
        if (!password) {
            return res.status(400).send('Password is required');
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создаем нового пользователя
        const newUser = new User({
            username,
            password: hashedPassword,
            firstName,
            lastName,
            age,
            country,
            gender
        });

        // Сохраняем пользователя в базе данных
        await newUser.save();

        // После успешной регистрации установим сессию
        req.session.user = newUser; // newUser - это созданный пользователь

        // Отправляем успешный ответ
        //res.status(201).send('User created successfully');
        res.redirect('/account');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Обработчик GET запроса для страницы входа
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});
// Обработчик POST запроса для входа пользователя
app.post('/login', async (req, res) => {
    try {
        // Получаем данные о пользователе из запроса
        const { username, password } = req.body;

        // Находим пользователя в базе данных
        const user = await User.findOne({ username });

        // Проверяем, существует ли пользователь и соответствует ли введенный пароль хэшу в базе данных
        if (user && await bcrypt.compare(password, user.password)) {
            // Если аутентификация успешна, устанавливаем сессию для пользователя и перенаправляем на страницу аккаунта
            req.session.user = user;
            res.redirect('/account');
        } else {
            // Если аутентификация не удалась, отправляем ошибку
            res.status(401).send('Invalid username or password');
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


// Обработчик маршрута для страницы аккаунта
app.get('/account', async (req, res) => {
    try {
        // Проверяем, есть ли сессия пользователя и определен ли пользователь в сессии
        if (req.session && req.session.user) {
            const user = req.session.user;
            // Загрузка проектов пользователя из базы данных
            const projects = await Project.find({ author: user._id });

            // Рендерим страницу аккаунта и передаем данные пользователя и его проекты
            res.render('account', { user: user, projects: projects });
        } else {
            // Если сессия отсутствует, перенаправляем пользователя на страницу входа
            res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Обработчик GET-запроса для выхода из аккаунта
app.get('/logout', (req, res) => {
    // Удаляем сессию пользователя
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Server Error');
        }
        // После успешного выхода из аккаунта перенаправляем на страницу логина
        res.redirect('/login');
    });
});



// Обработчик POST-запроса для создания проекта
app.post('/projects', async (req, res) => {
    try {
        // Получаем данные о проекте из запроса
        const { title, description } = req.body;

        // Получаем идентификатор текущего пользователя из сессии
        const userId = req.session.user._id;

        // Создаем новый проект с автором, взятым из сессии
        const project = new Project({ author: userId, title, description });

        // Сохраняем проект в базе данных
        await project.save();

        // Отправляем успешный ответ
        //res.status(201).send('Project created successfully');
        res.redirect('/account')
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Обработчик GET-запроса для получения всех проектов
app.get('/projects', async (req, res) => {
    try {
        // Получаем все проекты из базы данных
        const projects = await Project.find({ author: req.session.user._id });

        // Отправляем проекты в качестве ответа
        res.json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Обработчик POST-запроса для удаления проекта
app.post('/projects/:projectId/delete', async (req, res) => {
    try {
        const projectId = req.params.projectId;
        // Находим проект по его ID и удаляем его из базы данных
        await Project.findByIdAndDelete(projectId);
        // Отправляем успешный ответ
        res.redirect('/account');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Обработчик GET-запроса для получения случайного факта
app.get('/random-fact', async (req, res) => {
    try {
        const response = await axios.get('https://api.api-ninjas.com/v1/facts?limit=1', {
            headers: {
                'X-Api-Key': 'k6SK66MCsONdbT9b2yj0rQ==heNZo9SOJbsTA8uh'
            }
        });

        const data = response.data;
        res.json(data);
    } catch (error) {
        console.error('Request failed:', error);
        res.status(500).send('Failed to fetch random fact');
    }
});










// Обработчик GET запроса для корневого URL
app.get('/', (req, res) => {
    res.send('Welcome to the main page!');
});


// Прослушиваем порт 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
