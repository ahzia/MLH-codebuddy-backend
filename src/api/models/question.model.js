const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const APIError = require('../errors/api-error');

/**
 * User Schema
 * @private
 */
const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    maxlength: 128,
    index: true,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    maxlength: 512,
    index: true,
    trim: true,
    required: true,
  },
  priority: {
    type: String,
    maxlength: 10,
    trim: true,
    required: true,
  },
  tokens: {
    type: Number,
    trim: true,
    required: true,
  },
  estimatedTime: {
    type: Number,
    trim: true,
    required: true,
  },
  tags: {
    type: [],
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  meetLink: {
    type: String,
    trim: true,
    required: true,
  },
}, {
  timestamps: true,
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
// questionSchema.pre('save', async function save(next) {
//   try {
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });

/**
 * Methods
 */
questionSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'title', 'description', 'priority', 'tokens', 'estimatedTime', 'tags', 'user', 'meetLink', 'createdAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

/**
 * Statics
 */
questionSchema.statics = {
  /**
   * Get question
   *
   * @param {ObjectId} id - The objectId of question.
   * @returns {Promise<question, APIError>}
   */
  async get(id) {
    let question;

    if (mongoose.Types.ObjectId.isValid(id)) {
      question = await this.findById(id).exec();
    }
    if (question) {
      return question;
    }

    throw new APIError({
      message: 'question does not exist',
      status: httpStatus.NOT_FOUND,
    });
  },

  /**
   * List questions in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of questions to be skipped.
   * @param {number} limit - Limit number of questions to be returned.
   * @returns {Promise<question[]>}
   */
  list({
    page = 1, perPage = 30, title, description, priority, user,
  }) {
    const options = omitBy({
      title, description, priority, user,
    }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },
};

/**
 * @typedef question
 */
module.exports = mongoose.model('question', questionSchema);
