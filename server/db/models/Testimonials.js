const Sequelize = require('sequelize');
const db = require('../db');
const { TEXT, INTEGER } = Sequelize;

const Testimonial = db.define('testimonial', {
    reviewTitle: {
        type: TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    numberOfStars: {
        type: INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    reviewBody: {
        type: TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    }
});

module.exports = Testimonial
