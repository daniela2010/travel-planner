// Validation middleware
// This is a "factory": you call validate(someSchema) and it RETURNS a
// middleware function. That lets us reuse the same logic for every route,
// just by passing in a different schema.
//
// Usage in a route:
//   app.post('/api/register', validate(registerSchema), (req, res) => { ... })
const validate = (schema) => {
    return (req, res, next) => {
        // Check the request body against the schema.
        // abortEarly: false  -> collect ALL errors, not just the first one.
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            // Join all the individual messages into one readable string.
            const messages = error.details.map((detail) => detail.message).join(', ');

            // Send a 400 (Bad Request) with the validation messages.
            return res.status(400).json({ message: messages });
        }

        // Data is valid -> continue to the actual route handler.
        next();
    };
};

module.exports = validate;