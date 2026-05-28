const request = require('supertest');
const { app, resetContacts } = require('../src/app');

beforeEach(() => {
  resetContacts();
});

describe('Bloque A — Validación de email con regex', () => {
  test('POST devuelve 400 cuando el email es "@"', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: '@' });
    expect(res.status).toBe(400);
  });

  test('POST devuelve 400 cuando el email es "usuario@"', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: 'usuario@' });
    expect(res.status).toBe(400);
  });

  test('POST devuelve 400 cuando el email es "@dominio.com"', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: '@dominio.com' });
    expect(res.status).toBe(400);
  });

  test('POST devuelve 400 cuando el email es "sin-arroba"', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: 'sin-arroba' });
    expect(res.status).toBe(400);
  });

  test('POST devuelve 201 cuando el email tiene formato válido', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: 'usuario@dominio.com' });
    expect(res.status).toBe(201);
  });

  test('POST — el mensaje de error de email inválido contiene "email"', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: 'no-es-email' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });
});

describe('Bloque B — Detección de email duplicado', () => {
  test('POST devuelve 409 cuando el email ya existe', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Nuevo', email: 'ana@example.com' });
    expect(res.status).toBe(409);
  });

  test('POST 409 — el body tiene campo "error" con mensaje descriptivo', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Nuevo', email: 'ana@example.com' });
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  test('POST devuelve 409 cuando el email existe en mayúsculas (case-insensitive)', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Nuevo', email: 'ANA@EXAMPLE.COM' });
    expect(res.status).toBe(409);
  });

  test('POST duplicado — el número de contactos no aumenta', async () => {
    await request(app)
      .post('/api/contacts')
      .send({ name: 'Nuevo', email: 'ana@example.com' });

    const listRes = await request(app).get('/api/contacts');
    expect(listRes.body).toHaveLength(3);
  });
});

describe('Bloque C — Búsqueda y filtros (?search= y ?favorite=true)', () => {
  test('GET ?search=ana devuelve solo contactos que contienen "ana"', async () => {
    const res = await request(app).get('/api/contacts').query({ search: 'ana' });
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach(c => {
      const match =
        c.name.toLowerCase().includes('ana') ||
        c.email.toLowerCase().includes('ana');
      expect(match).toBe(true);
    });
  });

  test('GET ?search=ANA (mayúsculas) devuelve los mismos resultados que ?search=ana', async () => {
    const lower = await request(app).get('/api/contacts').query({ search: 'ana' });
    const upper = await request(app).get('/api/contacts').query({ search: 'ANA' });
    expect(upper.body).toHaveLength(lower.body.length);
    expect(upper.body.map(c => c.id)).toEqual(lower.body.map(c => c.id));
  });

  test('GET ?search=example devuelve todos los contactos con "@example.com"', async () => {
    const res = await request(app).get('/api/contacts').query({ search: 'example' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  test('GET ?search=xyznoexiste devuelve array vacío con status 200', async () => {
    const res = await request(app).get('/api/contacts').query({ search: 'xyznoexiste' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('GET ?favorite=true devuelve solo contactos con favorite: true', async () => {
    const res = await request(app).get('/api/contacts').query({ favorite: 'true' });
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every(c => c.favorite === true)).toBe(true);
  });

  test('GET ?favorite=true devuelve exactamente 1 contacto (Luis) con los datos de seed', async () => {
    const res = await request(app).get('/api/contacts').query({ favorite: 'true' });
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Luis Pérez');
  });

  test('GET sin query params devuelve todos los contactos', async () => {
    const res = await request(app).get('/api/contacts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });
});

describe('Bloque D — Toggle de favorito (PATCH)', () => {
  test('PATCH /favorite en Ana (false) devuelve el contacto con favorite: true', async () => {
    const res = await request(app).patch('/api/contacts/1/favorite');
    expect(res.status).toBe(200);
    expect(res.body.favorite).toBe(true);
  });

  test('PATCH /favorite dos veces sobre Ana regresa a favorite: false', async () => {
    await request(app).patch('/api/contacts/1/favorite');
    const res = await request(app).patch('/api/contacts/1/favorite');
    expect(res.status).toBe(200);
    expect(res.body.favorite).toBe(false);
  });

  test('PATCH /favorite en Luis (true) devuelve el contacto con favorite: false', async () => {
    const res = await request(app).patch('/api/contacts/2/favorite');
    expect(res.status).toBe(200);
    expect(res.body.favorite).toBe(false);
  });

  test('PATCH /favorite devuelve 404 para ID inexistente', async () => {
    const res = await request(app).patch('/api/contacts/9999/favorite');
    expect(res.status).toBe(404);
  });

  test('PATCH /favorite — el cambio persiste en un GET posterior', async () => {
    await request(app).patch('/api/contacts/1/favorite');

    const getRes = await request(app).get('/api/contacts/1');
    expect(getRes.status).toBe(200);
    expect(getRes.body.favorite).toBe(true);
  });
});

describe('Bloque E — PUT mejorado', () => {
  test('PUT actualizar solo el name devuelve 200 con el nombre cambiado', async () => {
    const res = await request(app)
      .put('/api/contacts/1')
      .send({ name: 'Ana Actualizada' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Ana Actualizada');
    expect(res.body.email).toBe('ana@example.com');
  });

  test('PUT con email de formato inválido devuelve 400', async () => {
    const res = await request(app)
      .put('/api/contacts/1')
      .send({ email: 'no-es-un-email' });
    expect(res.status).toBe(400);
  });

  test('PUT con email de otro contacto existente devuelve 409', async () => {
    const res = await request(app)
      .put('/api/contacts/1')
      .send({ email: 'luis@example.com' });
    expect(res.status).toBe(409);
  });

  test('PUT con el mismo email del propio contacto devuelve 200', async () => {
    const res = await request(app)
      .put('/api/contacts/1')
      .send({ email: 'ana@example.com' });
    expect(res.status).toBe(200);
  });

  test('PUT en ID inexistente devuelve 404', async () => {
    const res = await request(app)
      .put('/api/contacts/9999')
      .send({ name: 'Nadie' });
    expect(res.status).toBe(404);
  });
});

describe('Bloque F — Middleware de error y formato uniforme', () => {
  test('GET /api/ruta-que-no-existe devuelve 404 con Content-Type application/json', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('GET ruta inexistente — el body tiene campo "error" (no HTML)', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });

  test('GET /api/contacts/:id inexistente — el body tiene campo "status" igual a 404', async () => {
    const res = await request(app).get('/api/contacts/9999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('status', 404);
  });

  test('POST con email inválido — el body tiene campo "status" igual a 400', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: 'invalido' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('status', 400);
  });

  test('POST con email duplicado — el body tiene campo "status" igual a 409', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Nuevo', email: 'ana@example.com' });
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('status', 409);
  });
});
