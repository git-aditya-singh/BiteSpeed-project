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
    // Find existing contacts with the provided email or phoneNumber
    const existingContacts = await Contact.findAll({
        where: {
            [Op.or]: [{ email }, { phoneNumber }]
        }
    });

    if (existingContacts.length === 0) {
        // If no existing contacts, create a new primary contact
        const newContact = await Contact.create({
            phoneNumber,
            email,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return res.status(200).json(await generateContactResponse(newContact.id));
    }
    let primaryContact;
    const primaryContacts = existingContacts.filter(contact => contact.linkPrecedence === 'primary');

    if (primaryContacts.length === 2) {
        const [c1, c2] = primaryContacts;
        const primaryContactToKeep = new Date(c1.createdAt) < new Date(c2.createdAt) ? c1 : c2;
        const primaryContactToUpdate = primaryContactToKeep === c1 ? c2 : c1;

        await primaryContactToUpdate.update({
            linkPrecedence: 'secondary',
            linkedId: primaryContactToKeep.id,
            updatedAt: new Date()
        });

        primaryContact = primaryContactToKeep;
    } else if (primaryContacts.length === 1) {
        primaryContact = primaryContacts[0];
    } else {
        primaryContact = await Contact.findByPk(existingContacts[0].linkedId);
    }
    // Check if the new email or phoneNumber is already in the contact
    const emailExists = existingContacts.some(contact => contact.email === email);
    const phoneNumberExists = existingContacts.some(contact => contact.phoneNumber === phoneNumber);
    
    // If either email or phoneNumber is new, create a secondary contact
    if ((!emailExists && email) || (!phoneNumberExists && phoneNumber)) {
        await Contact.create({
            phoneNumber,
            email,
            linkedId: primaryContact.id,
            linkPrecedence: 'secondary',
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    const response = await generateContactResponse(primaryContact.id);
    return res.status(200).json(response);
});

sequelize.sync().then(() => {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
});
