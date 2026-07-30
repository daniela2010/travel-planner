const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const authMiddleware = require('../middleware/Auth');
const errorHandler = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const AppError = require('../utils/AppError');
const Trip = require('../models/Trip');
const { activitySchema } = require('../validators/schemas');
const { createActivity } = require('../controllers/activitiesController');

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

test('activity validation trims text and enforces the HH:MM time format', () => {
    const middleware = validate(activitySchema);
    const validReq = {
        body: {
            day: '2',
            time: ' 09:30 ',
            title: ' Museum visit ',
            type: 'Attraction',
            notes: ' Buy tickets '
        }
    };
    const validRes = createResponse();
    let nextCalled = false;

    middleware(validReq, validRes, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(validReq.body.day, 2);
    assert.equal(validReq.body.time, '09:30');
    assert.equal(validReq.body.title, 'Museum visit');
    assert.equal(validReq.body.notes, 'Buy tickets');

    const invalidRes = createResponse();
    middleware({
        body: {
            day: 1,
            time: '25:90',
            title: 'Dinner',
            type: 'Food'
        }
    }, invalidRes, () => assert.fail('next should not be called'));

    assert.equal(invalidRes.statusCode, 400);
    assert.match(invalidRes.body.message, /HH:MM/);
});

test('activity creation rejects a day outside the trip date range', async () => {
    const originalFindById = Trip.findById;
    Trip.findById = async () => ({
        userId: { toString: () => 'user-1' },
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2026-08-03T00:00:00.000Z')
    });

    let receivedError;
    try {
        await createActivity({
            params: { tripId: 'trip-1' },
            user: { id: 'user-1' },
            body: {
                day: 4,
                time: '09:00',
                title: 'Too late',
                type: 'Other'
            }
        }, createResponse(), (error) => { receivedError = error; });
    } finally {
        Trip.findById = originalFindById;
    }

    assert.equal(receivedError.statusCode, 400);
    assert.match(receivedError.message, /between 1 and 3/);
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
