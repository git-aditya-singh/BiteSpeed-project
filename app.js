require('dotenv').config();
const express = require('express');
const sequelize = require('./database');
const Contact = require('./models/Contact');
const { Op } = require('sequelize');

const app = express();
app.use(express.json());

async function generateContactResponse(primaryContactId) {
    // Retrieve the primary contact
    const primaryContact = await Contact.findByPk(primaryContactId);

    //Retrieve all secondary contacts linked to the primary contact
    const secondaryContacts = await Contact.findAll({
        where: {
            linkedId: primaryContactId,
            linkPrecedence: 'secondary'
        }
    });

    // Create the response object
    const response = {
        contact: {
            primaryContactId: primaryContact.id,
            emails: [primaryContact.email, ...secondaryContacts.map(contact => contact.email).filter(email => email)],
            phoneNumbers: [primaryContact.phoneNumber, ...secondaryContacts.map(contact => contact.phoneNumber).filter(phoneNumber => phoneNumber)],
            secondaryContactIds: secondaryContacts.map(contact => contact.id)
        }
    };
    return response;
}

app.post('/identify', async (req, res) => {
    const { email, phoneNumber } = req.body;
    
    
});

sequelize.sync().then(() => {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
});
