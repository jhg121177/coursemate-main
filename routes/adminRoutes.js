const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 1. 관리자 로그인
router.post('/login', adminController.adminLogin);

// 2. 대시보드 통계
router.get('/dashboard', adminController.getDashboardStats);

// 3. 회원 관리
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/status', adminController.changeUserStatus);

// 4. 관광지 관리
router.post('/places', adminController.createPlace);
router.delete('/places/:id', adminController.deletePlace);

// 5. 리뷰 관리
router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:reviewId', adminController.deleteReviewAdmin);

// 6. 문의 답변
router.post('/inquiries/:id/answer', adminController.answerInquiry);

// 7. AI 모델 관리
router.post('/ai/train', adminController.triggerAITrain);

module.exports = router;