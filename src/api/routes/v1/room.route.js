const express = require('express');
const controller = require('../../controllers/room.controller');

const router = express.Router();
router.param('roomId', controller.load);

router
  .route('/')
  .get(controller.list)
  .post(controller.create);

router
  .route('/:roomId')
  .get(controller.get)
  .put(controller.replace)
  .patch(controller.update)
  .delete(controller.remove);

module.exports = router;
