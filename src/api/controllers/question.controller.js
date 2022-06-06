const httpStatus = require('http-status');
const { omit } = require('lodash');
const Question = require('../models/question.model');
const { authorizeGCPAndCreateEvent } = require('../services/googleAuthConfigure');
/**
 * Load question and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const question = await Question.get(id);
    req.locals = { question };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get question
 * @public
 */
exports.get = (req, res) => res.json(req.locals.question.transform());
/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const logedinUser = req.user.transform();
    const { email } = logedinUser;
    const event = await authorizeGCPAndCreateEvent(email, req.body);
    req.body.meetLink = event.hangoutLink;
    req.body.user = req.user;
    const question = new Question(req.body);
    const savedQuestion = await question.save();
    res.redirect(savedQuestion.meetLink);
  } catch (error) {
    next(error);
  }
};

/**
 * Replace existing question
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { question } = req.locals;
    const newQuestion = new Question(req.body);
    // const ommitRole = user.role !== 'admin' ? 'role' : '';
    const newQuestionObject = omit(newQuestion.toObject(), '_id');

    await question.updateOne(newQuestionObject, { override: true, upsert: true });
    const savedQuestion = await Question.findById(question._id);

    res.json(savedQuestion.transform());
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing question
 * @public
 */
exports.update = (req, res, next) => {
  // const ommitRole = req.locals.user.role !== 'admin' ? 'role' : '';
  const updatedQuestion = omit(req.body);
  const question = Object.assign(req.locals.user, updatedQuestion);

  question.save()
    .then((savedQuestion) => res.json(savedQuestion.transform()))
    .catch((e) => next(Question.checkDuplicateEmail(e)));
};

/**
 * Get question list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const questions = await Question.list(req.query);
    const transformedQuestions = questions.map((question) => question.transform());
    res.json(transformedQuestions);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete question
 * @public
 */
exports.remove = (req, res, next) => {
  const { question } = req.locals;

  question.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch((e) => next(e));
};
