const express = require('express');
const app = express();
app.use(express.json());

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let contacts = [
  { id: 1, name: 'Ana García',   email: 'ana@example.com',  phone: '555-0001', favorite: false, createdAt: '2024-01-10T08:00:00.000Z' },
  { id: 2, name: 'Luis Pérez',   email: 'luis@example.com', phone: '555-0002', favorite: true,  createdAt: '2024-01-11T09:00:00.000Z' },
  { id: 3, name: 'Eva Martínez', email: 'eva@example.com',  phone: null,       favorite: false, createdAt: '2024-01-12T10:00:00.000Z' },
];
let nextId = 4;

function resetContacts() {
  contacts = [
    { id: 1, name: 'Ana García',   email: 'ana@example.com',  phone: '555-0001', favorite: false, createdAt: '2024-01-10T08:00:00.000Z' },
    { id: 2, name: 'Luis Pérez',   email: 'luis@example.com', phone: '555-0002', favorite: true,  createdAt: '2024-01-11T09:00:00.000Z' },
    { id: 3, name: 'Eva Martínez', email: 'eva@example.com',  phone: null,       favorite: false, createdAt: '2024-01-12T10:00:00.000Z' },
  ];
  nextId = 4;
}

// get all contacts
app.get('/api/contacts', (req, res) => {
  let result = contacts;

  if (req.query.search) {
    let searchTerm = req.query.search.toLowerCase();
    result = contacts.filter(function(c) {
      return c.name.toLowerCase().includes(searchTerm) || c.email.toLowerCase().includes(searchTerm);
    });
  }

  if (req.query.favorite == 'true') {
    result = result.filter(function(c) {
      return c.favorite == true;
    });
  }

  res.json(result);
});

// get one contact
app.get('/api/contacts/:id', (req, res) => {
  let id = Number(req.params.id);
  let contact = null;

  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i].id == id) {
      contact = contacts[i];
    }
  }

  if (contact == null) {
    return res.status(404).json({ status: 404, error: 'Contacto no encontrado.' });
  }

  res.json(contact);
});

// create contact
app.post('/api/contacts', (req, res) => {
  let name = req.body.name;
  let email = req.body.email;
  let phone = req.body.phone;

  if (!name || name == '') {
    return res.status(400).json({ status: 400, error: 'El campo name es requerido.' });
  }

  if (!email || email == '') {
    return res.status(400).json({ status: 400, error: 'El formato del email es inválido.' });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ status: 400, error: 'El formato del email es inválido.' });
  }

  let duplicate = false;
  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i].email.toLowerCase() == email.toLowerCase()) {
      duplicate = true;
    }
  }

  if (duplicate == true) {
    return res.status(409).json({ status: 409, error: 'Ya existe un contacto con ese email.' });
  }

  let newContact = {
    id: nextId,
    name: name,
    email: email.toLowerCase(),
    phone: phone || null,
    favorite: false,
    createdAt: new Date().toISOString(),
  };

  nextId++;
  contacts.push(newContact);
  console.log('contact created:', newContact);
  res.status(201).json(newContact);
});

// update contact
app.put('/api/contacts/:id', (req, res) => {
  let id = Number(req.params.id);
  let contact = contacts.find(c => c.id == id);

  if (!contact) {
    return res.status(404).json({ status: 404, error: 'Contacto no encontrado.' });
  }

  if (req.body.email != undefined) {
    let newEmail = req.body.email;

    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ status: 400, error: 'El formato del email es inválido.' });
    }

    let emailTaken = false;
    for (let i = 0; i < contacts.length; i++) {
      if (contacts[i].email.toLowerCase() == newEmail.toLowerCase() && contacts[i].id != id) {
        emailTaken = true;
      }
    }

    if (emailTaken) {
      return res.status(409).json({ status: 409, error: 'Ya existe un contacto con ese email.' });
    }

    contact.email = newEmail.toLowerCase();
  }

  if (req.body.name != undefined) {
    if (req.body.name == '' || req.body.name.trim() == '') {
      return res.status(400).json({ status: 400, error: 'El campo name no puede estar vacío.' });
    }
    contact.name = req.body.name;
  }

  if (req.body.phone != undefined) {
    contact.phone = req.body.phone || null;
  }

  res.json(contact);
});

// toggle favorite
app.patch('/api/contacts/:id/favorite', (req, res) => {
  let id = Number(req.params.id);
  let contact = contacts.find(c => c.id == id);

  if (!contact) {
    return res.status(404).json({ status: 404, error: 'Contacto no encontrado.' });
  }

  if (contact.favorite == false) {
    contact.favorite = true;
  } else {
    contact.favorite = false;
  }

  res.json(contact);
});

// delete contact
app.delete('/api/contacts/:id', (req, res) => {
  let id = Number(req.params.id);
  let index = -1;

  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i].id == id) {
      index = i;
    }
  }

  if (index == -1) {
    return res.status(404).json({ status: 404, error: 'Contacto no encontrado.' });
  }

  contacts.splice(index, 1);
  res.json({ message: 'Contacto eliminado.' });
});

app.use((req, res) => {
  res.status(404).json({ status: 404, error: 'Ruta no encontrada.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 500, error: 'Error interno del servidor.' });
});

module.exports = { app, resetContacts };
