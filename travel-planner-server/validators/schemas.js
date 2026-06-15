const Joi = require('joi');

// JOI validation schemas
// A schema describes the SHAPE and RULES that incoming data must follow.
// If the data breaks a rule, JOI produces a clear error message
// (e.g. "email must be a valid email") before our route logic ever runs.

// Rules for registering a new user
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'string.empty': 'Password is required'
    })
});

// Rules for logging in
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Rules for creating a trip
const tripSchema = Joi.object({
    destination: Joi.string().min(2).max(100).required().messages({
        'string.empty': 'Destination is required'
    }),
    startDate: Joi.date().required().messages({
        'date.base': 'Start date must be a valid date',
        'any.required': 'Start date is required'
    }),
    // endDate must be the same day or AFTER startDate (Joi.ref points to another field)
    endDate: Joi.date().min(Joi.ref('startDate')).required().messages({
        'date.min': 'End date must be after the start date',
        'any.required': 'End date is required'
    }),
    // budget is optional; if present it must be a positive number
    budget: Joi.number().positive().allow('', null).optional()
});

// Rules for creating an activity inside a trip
const activitySchema = Joi.object({
    day: Joi.number().integer().min(1).required().messages({
        'number.base': 'Day must be a number',
        'any.required': 'Day is required'
    }),
    time: Joi.string().required().messages({
        'string.empty': 'Time is required'
    }),
    title: Joi.string().min(2).max(100).required().messages({
        'string.empty': 'Title is required'
    }),
    // Must match one of the allowed types in the Activity model
    type: Joi.string().valid('Transport', 'Lodging', 'Food', 'Attraction', 'Other').required(),
    notes: Joi.string().allow('', null).optional()
});

module.exports = {
    registerSchema,
    loginSchema,
    tripSchema,
    activitySchema
};