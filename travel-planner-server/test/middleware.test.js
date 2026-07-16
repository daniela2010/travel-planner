const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const authMiddleware = require('../middleware/Auth');
const errorHandler = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const AppError = require('../utils/AppError');

const createResponse = () => ({
    statusCode: 200,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

test('Joi validation rejects invalid request bodies', () => {
    const middleware = validate(Joi.object({ name: Joi.string().min(2).required() }));
    const res = createResponse();
    let nextCalled = false;

    middleware({ body: { name: '' } }, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 400);
    assert.equal(nextCalled, false);
    assert.match(res.body.message, /name/i);
});

test('Joi validation passes valid request bodies', () => {
    const middleware = validate(Joi.object({ name: Joi.string().min(2).required() }));
    const res = createResponse();
    let nextCalled = false;

    middleware({ body: { name: 'Daniela' } }, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(res.body, null);
});

test('auth middleware rejects requests without a bearer token', () => {
    const res = createResponse();
    authMiddleware({ headers: {} }, res, () => assert.fail('next should not be called'));

    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /token/i);
});

test('auth middleware verifies a valid JWT and attaches req.user', () => {
    process.env.JWT_SECRET = 'unit-test-secret';
    const token = jwt.sign({ id: 'user-1', name: 'Test User' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();
    let nextCalled = false;

    authMiddleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 'user-1');
});

test('global error handler translates invalid MongoDB ids to 400', () => {
    const res = createResponse();
    errorHandler({ name: 'CastError', message: 'Cast failed' }, {}, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Invalid id format');
});

test('global error handler preserves AppError status codes', () => {
    const res = createResponse();
    errorHandler(new AppError('Forbidden', 403), {}, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, 'Forbidden');
});

test('unknown API routes return a JSON 404 response', async (t) => {
    const app = require('../app');
    const server = app.listen(0, '127.0.0.1');
    t.after(() => new Promise((resolve) => server.close(resolve)));

    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/does-not-exist`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.match(body.message, /not found/i);
});
