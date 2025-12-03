const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 1. 내 취향 태그 조회
router.get('/me/preferences', userController.getMyPreferences);

// 2. 내 취향 태그 설정/수정
router.post('/me/preferences', userController.setMyPreferences);

// 3. 내 위시리스트 조회
router.get('/me/wishlist', userController.getMyWishlist);

// 4. 내 위시리스트 추가
router.post('/me/wishlist', userController.addToWishlist);

// 5. 내 위시리스트 삭제
router.delete('/me/wishlist/:placeId', userController.deleteFromWishlist);

// 6. 내가 작성한 리뷰 조회
router.get('/me/reviews', userController.getMyReviews);

// 7. 내 계정 설정 조회
router.get('/me/settings', userController.getMySettings);

// 8. 내 계정 정보 수정
router.put('/me/settings', userController.updateMySettings);

// 9. 회원 탈퇴
router.delete('/me', userController.deleteAccount);

module.exports = router;