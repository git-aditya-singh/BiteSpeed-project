require('dotenv').config();
const express = require('express');
const sequelize = require('./database');
const Contact = require('./models/Contact');
const { Op } = require('sequelize');

const app = express();
app.use(express.json());

app.post('/identify', async (req, res) => {
    const { email, phoneNumber } = req.body;

    
});

sequelize.sync().then(() => {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
});
