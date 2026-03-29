// admin/admin.js

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Model import
const User = require('../models/User');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Tag = require('../models/Tag');
const Settings = require('../models/Settings');

// Authentication Middleware
const authenticate = (req, res, next) => {
    const token = req.header('Authorization');
    // Check for token
    if (!token) return res.status(403).send('Access denied. No token provided.');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).send('Invalid token.');
        req.user = decoded;
        next();
    });
};

// User registration
router.post('/register', [
    check('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).send('User registered successfully.');
});

// User login
router.post('/login', [
    check('username').notEmpty().withMessage('Username is required'),
    check('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).send('Invalid credentials.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send('Invalid credentials.');

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// Brand management
router.route('/brands')
    .get(authenticate, async (req, res) => {
        const brands = await Brand.find();
        res.json(brands);
    })
    .post(authenticate, async (req, res) => {
        const newBrand = new Brand(req.body);
        await newBrand.save();
        res.status(201).send('Brand created.');
    });

// Product management
router.route('/products')
    .get(authenticate, async (req, res) => {
        const products = await Product.find();
        res.json(products);
    })
    .post(authenticate, async (req, res) => {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).send('Product created.');
    });

// Tag management
router.route('/tags')
    .get(authenticate, async (req, res) => {
        const tags = await Tag.find();
        res.json(tags);
    })
    .post(authenticate, async (req, res) => {
        const newTag = new Tag(req.body);
        await newTag.save();
        res.status(201).send('Tag created.');
    });

// Settings management
router.route('/settings')
    .get(authenticate, async (req, res) => {
        const settings = await Settings.findOne();
        res.json(settings);
    })
    .put(authenticate, async (req, res) => {
        await Settings.findOneAndUpdate({}, req.body);
        res.send('Settings updated.');
    });

module.exports = router;