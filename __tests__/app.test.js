const request = require('supertest');
const { app, resetContacts } = require('../src/app');

// Reinicia los contactos antes de cada test para evitar contaminación de estado
beforeEach(() => {
  resetContacts();
});

// 1. GET /api/contacts devuelve status 200 y un array
test('GET /api/contacts devuelve 200 y un array', async () => {
  const res = await request(app).get('/api/contacts');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

// 2. GET /api/contacts/:id devuelve el contacto correcto
test('GET /api/contacts/:id devuelve el contacto correcto', async () => {
  const created = await request(app)
    .post('/api/contacts')
    .send({ name: 'Ana', email: 'ana@mail.com' });

  const res = await request(app).get(`/api/contacts/${created.body.id}`);
  expect(res.status).toBe(200);
  expect(res.body.name).toBe('Ana');
  expect(res.body.email).toBe('ana@mail.com');
});

// 3. GET /api/contacts/:id devuelve 404 para un ID inexistente
test('GET /api/contacts/:id devuelve 404 para ID inexistente', async () => {
  const res = await request(app).get('/api/contacts/9999');
  expect(res.status).toBe(404);
});

// 4. POST /api/contacts crea el contacto y devuelve 201 con el objeto creado
test('POST /api/contacts crea el contacto y devuelve 201', async () => {
  const res = await request(app)
    .post('/api/contacts')
    .send({ name: 'Luis', email: 'luis@mail.com', phone: '123456789' });

  expect(res.status).toBe(201);
  expect(res.body).toMatchObject({
    name: 'Luis',
    email: 'luis@mail.com',
    phone: '123456789',
  });
  expect(res.body.id).toBeDefined();
});

// 5. POST /api/contacts devuelve 400 si falta el name
test('POST /api/contacts devuelve 400 si falta name', async () => {
  const res = await request(app)
    .post('/api/contacts')
    .send({ email: 'sin-nombre@mail.com' });

  expect(res.status).toBe(400);
});

// 6. POST /api/contacts devuelve 400 si el email no tiene @
test('POST /api/contacts devuelve 400 si el email no tiene @', async () => {
  const res = await request(app)
    .post('/api/contacts')
    .send({ name: 'Pedro', email: 'emailsinArroba' });

  expect(res.status).toBe(400);
});

// 7. PUT /api/contacts/:id actualiza correctamente los campos enviados
test('PUT /api/contacts/:id actualiza correctamente los campos', async () => {
  const created = await request(app)
    .post('/api/contacts')
    .send({ name: 'Maria', email: 'maria@mail.com' });

  const res = await request(app)
    .put(`/api/contacts/${created.body.id}`)
    .send({ phone: '987654321' });

  expect(res.status).toBe(200);
  expect(res.body.phone).toBe('987654321');
  expect(res.body.name).toBe('Maria'); // campo no modificado se conserva
});

// 8. DELETE /api/contacts/:id elimina el contacto y devuelve confirmación
test('DELETE /api/contacts/:id elimina el contacto y devuelve confirmación', async () => {
  const created = await request(app)
    .post('/api/contacts')
    .send({ name: 'Carlos', email: 'carlos@mail.com' });

  const res = await request(app).delete(`/api/contacts/${created.body.id}`);
  expect(res.status).toBe(200);
  expect(res.body.message).toBe('Contacto eliminado.');
});

// 9. DELETE /api/contacts/:id devuelve 404 para ID inexistente
test('DELETE /api/contacts/:id devuelve 404 para ID inexistente', async () => {
  const res = await request(app).delete('/api/contacts/9999');
  expect(res.status).toBe(404);
});
