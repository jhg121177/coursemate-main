const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');

// GET /api/places (목록 조회)
router.get('/', placeController.getPlaces);

// GET /api/places/:id (상세 조회)
// :id 부분은 변수처럼 동작합니다.
router.get('/:id', placeController.getPlaceDetail);

module.exports = router;