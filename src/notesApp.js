const express = require('express');
const app = express();
app.use(express.json());

let notes = [
  { id: 1, text: 'Comprar leche', done: false },
  { id: 2, text: 'Estudiar Jest',  done: false },
];
let nextId = 3;

// GET todas las notas
app.get('/api/notes', (req, res) => {
  res.json(notes);
});

// GET una nota por ID
app.get('/api/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === Number(req.params.id));
  if (!note) return res.status(404).json({ error: 'Nota no encontrada.' });
  res.json(note);
});

// POST crear una nota
app.post('/api/notes', (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'El campo text es requerido.' });
  }
  const newNote = { id: nextId++, text: text.trim(), done: false };
  notes.push(newNote);
  res.status(201).json(newNote);
});

module.exports = app;   // sin app.listen()