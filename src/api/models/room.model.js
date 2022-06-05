const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const APIError = require('../errors/api-error');

/**
 * User Schema
 * @private
 */
const roomSchema = new mongoose.Schema({
  name: {
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
  picture: {
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
// roomSchema.pre('save', async function save(next) {
//   try {
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });

/**
 * Methods
 */
roomSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'name', 'description', 'picture', 'createdAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

/**
 * Statics
 */
roomSchema.statics = {
  /**
   * Get room
   *
   * @param {ObjectId} id - The objectId of room.
   * @returns {Promise<Room, APIError>}
   */
  async get(id) {
    let room;

    if (mongoose.Types.ObjectId.isValid(id)) {
      room = await this.findById(id).exec();
    }
    if (room) {
      return room;
    }

    throw new APIError({
      message: 'Room does not exist',
      status: httpStatus.NOT_FOUND,
    });
  },

  /**
   * List rooms in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of rooms to be skipped.
   * @param {number} limit - Limit number of rooms to be returned.
   * @returns {Promise<Room[]>}
   */
  list({
    page = 1, perPage = 30, name, description,
  }) {
    const options = omitBy({ name, description }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },
};

/**
 * @typedef Room
 */
module.exports = mongoose.model('Room', roomSchema);
