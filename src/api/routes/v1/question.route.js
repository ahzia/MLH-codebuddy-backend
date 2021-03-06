const express = require('express');
const controller = require('../../controllers/question.controller');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();
router.param('questionId', controller.load);

router
  .route('/')
  .get(controller.list)
  .post(authorize(), controller.create);

router
  .route('/:questionId')
  .get(controller.get)
  .put(controller.replace)
  .patch(controller.update)
  .delete(controller.remove);

module.exports = router;
