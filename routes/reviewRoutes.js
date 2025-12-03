const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// 1. 특정 관광지의 리뷰 조회
// 경로: /api/places/:id/reviews
router.get('/places/:id/reviews', reviewController.getReviewsByPlace);

// 2. 리뷰 작성
// 경로: /api/places/:id/reviews
router.post('/places/:id/reviews', reviewController.createReview);

// 3. 관광지 사진 조회
// 경로: /api/places/:id/photos 
router.get('/places/:id/photos', reviewController.getPlacePhotos);

// 4. 리뷰 수정
// 경로: /api/reviews/:reviewId 
router.put('/reviews/:reviewId', reviewController.updateReview);

// 5. 리뷰 삭제
// 경로: /api/reviews/:reviewId (여기는 주소 체계가 다릅니다. app.js에서 처리 필요)
router.delete('/reviews/:reviewId', reviewController.deleteReview);

module.exports = router;