const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 설계서 API 정의에 따른 라우팅 [cite: 334]
router.post('/signup', authController.signup);                // 회원가입
router.post('/login', authController.login);                  // 로그인
router.post('/find-id', authController.findId);               // 아이디 찾기
router.post('/reset-password', authController.resetPassword); // 비밀번호 재설정

module.exports = router;