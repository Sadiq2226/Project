require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const User = require('./models/user.js');
const Exam = require('./models/exam.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
}));

// Set the view engine to Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Helper function to generate JWT
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Middleware to verify JWT from cookies
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Student Login
app.route('/student_login')
    .get((req, res) => {
        res.render('student_login');
    })
    .post(async (req, res) => {
        const { studentId, password } = req.body;

        if (!studentId || !password) {
            return res.send('Student ID and password are required');
        }

        const user = await User.findOne({ studentId });
        if (user && await user.comparePassword(password)) {
            const token = generateToken(user);
            res.cookie('token', token, { httpOnly: true });
            res.redirect('/student_dashboard');
        } else {
            res.send('Invalid student ID or password');
        }
    });

// Admin Login
app.route('/admin_login')
    .get((req, res) => {
        res.render('admin_login');
    })
    .post(async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.send('Email and password are required');
        }

        const admin = await User.findOne({ email });
        if (admin && await admin.comparePassword(password)) {
            const token = generateToken(admin);
            res.cookie('token', token, { httpOnly: true });
            res.redirect('/admin_dashboard');
        } else {
            res.send('Invalid email or password');
        }
    });

// Admin Registration
app.route('/admin_register')
    .get((req, res) => {
        res.render('admin_register');
    })
    .post(async (req, res) => {
        const { name, email, password, confirm_password, institution } = req.body;

        if (password !== confirm_password) {
            return res.send('Passwords do not match');
        }

        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            return res.send('Admin with this email already exists');
        }

        const newAdmin = new User({ name, email, password, role: 'admin', institution });
        await newAdmin.save();
        res.redirect('/admin_login');
    });

// Student Registration
app.route('/student_register')
    .get((req, res) => {
        res.render('student_register');
    })
    .post(async (req, res) => {
        const { name, studentId, mobile, email, password, institution } = req.body;

        const existingUser = await User.findOne({ studentId });
        if (existingUser) {
            return res.send('User with this Student ID already exists');
        }

        const newUser = new User({
            name,
            studentId,
            mobile,
            email,
            password,
            role: 'student',
            institution
        });
        await newUser.save();
        res.redirect('/student_login');
    });

// Admin Dashboard
app.get('/admin_dashboard', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.sendStatus(403);
    }

    const students = await User.find({ role: 'student' });
    res.render('admin_dashboard', { students });
});

// Student Dashboard
app.get('/student_dashboard', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.sendStatus(403);
    }

    const student = await User.findById(req.user.id);
    res.render('student_dashboard', { student });
});

// Logout
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    req.session.destroy(err => {
        if (err) {
            console.error('Error during logout:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

// Create Exam
app.route('/create_exam')
    .get(authenticateJWT, (req, res) => {
        if (req.user.role !== 'admin') {
            return res.sendStatus(403);
        }
        res.render('create_exam');
    })
    .post(authenticateJWT, async (req, res) => {
        if (req.user.role !== 'admin') {
            return res.sendStatus(403);
        }

        const { examName, subject, date, questions } = req.body;

        if (!examName || !subject || !date || !questions) {
            return res.send('All fields are required');
        }

        // Handle questions as an array
        const questionsArray = Array.isArray(questions) ? questions : [questions];

        // Ensure the questions are in the correct format (array of objects)
        const formattedQuestions = questionsArray.map((question, index) => {
            return {
                questionText: question.questionText,
                correctAnswer: question.correctAnswer,
            };
        });

        const newExam = new Exam({
            examName,
            subject,
            examDate: new Date(date),
            duration: 60, // You can set a default duration or modify as needed
            questions: formattedQuestions,
            createdBy: req.user.id // Assuming the ID of the admin creating the exam
        });

        try {
            await newExam.save();
            res.redirect('/admin_dashboard');
        } catch (error) {
            console.error('Error creating exam:', error);
            res.status(500).send('Error creating exam');
        }
    });

// Fetch Exams from external API
app.get('/fetch_exams', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.sendStatus(403);
    }

    try {
        const response = await axios.get('https://api.sampleapis.com/fake-exams/exams'); // Replace with your actual API endpoint
        const exams = response.data;

        for (const exam of exams) {
            const newExam = new Exam(exam);
            await newExam.save();
        }
        res.status(201).send('Exams fetched and saved successfully');
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).send('Error fetching exams');
    }
});

// Real-time connection using Socket.IO
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
