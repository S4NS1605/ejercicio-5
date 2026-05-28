const express = require('express');
const app = express();
app.use(express.json());

let contacts = [];
let nextId = 1;

// Reinicia los datos a su estado inicial (útil para tests)
function resetContacts() {
  contacts = [];
  nextId = 1;
}

// GET /api/contacts — devuelve todos los contactos
app.get('/api/contacts', (req, res) => {
  res.json(contacts);
});

// GET /api/contacts/:id — devuelve un contacto por ID
app.get('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) return res.status(404).json({ error: 'Contacto no encontrado.' });
  res.json(contact);
});

// POST /api/contacts — crea un contacto
app.post('/api/contacts', (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El campo name es requerido.' });
  }
  if (!email || email.trim() === '') {
    return res.status(400).json({ error: 'El campo email es requerido.' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'El email debe contener @.' });
  }

  const newContact = {
    id: nextId++,
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : undefined,
  };
  contacts.push(newContact);
  res.status(201).json(newContact);
});

// PUT /api/contacts/:id — actualiza parcialmente un contacto existente
app.put('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) return res.status(404).json({ error: 'Contacto no encontrado.' });

  Object.assign(contact, req.body);
  res.json(contact);
});

// DELETE /api/contacts/:id — elimina un contacto
app.delete('/api/contacts/:id', (req, res) => {
  const index = contacts.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Contacto no encontrado.' });

  contacts.splice(index, 1);
  res.status(200).json({ message: 'Contacto eliminado.' });
});

module.exports = { app, resetContacts };
