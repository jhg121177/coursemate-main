const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// 1. AI 맞춤 관광 코스 추천
// 경로: /api/recommendations
router.get('/', recommendationController.getRecommendations);

// 2. 다른 관광 코스 선택 (재추천)
// 경로: /api/recommendations/retry
router.get('/retry', recommendationController.getRetryRecommendations);

module.exports = router;