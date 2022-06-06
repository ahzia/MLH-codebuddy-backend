const httpStatus = require('http-status');
const { omit } = require('lodash');
const Room = require('../models/room.model');

/**
 * Load room and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const room = await Room.get(id);
    req.locals = { room };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get room
 * @public
 */
exports.get = (req, res) => res.json(req.locals.room.transform());
/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const room = new Room(req.body);
    const savedRoom = await room.save();
    res.status(httpStatus.CREATED);
    res.json(savedRoom.transform());
  } catch (error) {
    next(Room.checkDuplicateEmail(error));
  }
};

/**
 * Replace existing room
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { room } = req.locals;
    const newRoom = new Room(req.body);
    // const ommitRole = user.role !== 'admin' ? 'role' : '';
    const newRoomObject = omit(newRoom.toObject(), '_id');

    await room.updateOne(newRoomObject, { override: true, upsert: true });
    const savedRoom = await Room.findById(room._id);

    res.json(savedRoom.transform());
  } catch (error) {
    next(Room.checkDuplicateEmail(error));
  }
};

/**
 * Update existing room
 * @public
 */
exports.update = (req, res, next) => {
  // const ommitRole = req.locals.user.role !== 'admin' ? 'role' : '';
  const updatedRoom = omit(req.body);
  const room = Object.assign(req.locals.user, updatedRoom);

  room.save()
    .then((savedRoom) => res.json(savedRoom.transform()))
    .catch((e) => next(Room.checkDuplicateEmail(e)));
};

/**
 * Get room list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const rooms = await Room.list(req.query);
    const transformedRooms = rooms.map((room) => room.transform());
    res.json(transformedRooms);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete room
 * @public
 */
exports.remove = (req, res, next) => {
  const { room } = req.locals;

  room.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch((e) => next(e));
};
