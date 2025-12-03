const express = require('express');
const router = express.Router();

// 내가 만든 컨트롤러 불러오기
const adminCtrl = require('../controllers/jhg_adminController');
const placeCtrl = require('../controllers/jhg_placeController');
const reviewCtrl = require('../controllers/jhg_reviewController');
const userReviewCtrl = require('../controllers/jhg_userReviewController');
const tagCtrl = require('../controllers/jhg_tagController');



// ================= 관리자 기능 라우터 =================

// 회원 관리
router.get('/admin/users/search', adminCtrl.searchUsers);        // 회원 검색
router.post('/admin/users', adminCtrl.addUser);                  // 회원 추가
router.put('/admin/users/:userId', adminCtrl.updateUser);        // 회원 수정
router.delete('/admin/users/:userId', adminCtrl.deleteUser);     // 회원 삭제

// 커뮤니티(공지사항) 관리
router.post('/admin/notices', adminCtrl.addNotice);              // 공지 등록
router.put('/admin/notices/:id', adminCtrl.editNotice);          // 공지 수정
router.delete('/admin/notices/:id', adminCtrl.removeNotice);     // 공지 삭제

// 커뮤니티(문의) 관리
router.get('/admin/inquiries', adminCtrl.getAllInquiries);       // 문의 조회
router.delete('/admin/inquiries/:id', adminCtrl.removeInquiry);  // 문의 삭제

// 태그 및 리뷰 관리 (진도표: 리뷰 및 태그 관리)
router.get('/admin/tags', tagCtrl.getAllTags);                   // 태그 목록
router.post('/admin/tags', tagCtrl.createTag);                   // 태그 추가
router.put('/admin/tags/:tagId', tagCtrl.updateTag);             // 태그 수정
router.delete('/admin/tags/:tagId', tagCtrl.deleteTag);          // 태그 삭제
router.put('/admin/reviews/:reviewId', tagCtrl.adminUpdateReview); // 리뷰 관리(수정)



// ================= 사용자 기능 라우터 =================

// 여행지 검색 및 주요 여행지 선택
// 사용: /api/jhg/places?keyword=서울&sort=best
router.get('/places/search', placeCtrl.searchAndSortPlaces);

// 리뷰 목록 조회
// 주소: /api/jhg/places/:id/reviews
router.get('/places/:id/reviews', reviewCtrl.getReviews);

// 별점 통계 조회 (평균 별점, 분포)
// 주소: /api/jhg/places/:id/rating-summary
router.get('/places/:id/rating-summary', reviewCtrl.getRatingSummary);

// 사진 목록 조회
// 주소: /api/jhg/places/:id/photos
router.get('/places/:id/photos', reviewCtrl.getSpotPhotos);

// 블로그 리뷰 링크 조회
// 사용: /api/jhg/places/:id/blogs
router.get('/places/:id/blogs', reviewCtrl.getSpotBlogs);

// 사용자 후기 작성/수정/삭제
router.post('/places/:id/reviews', userReviewCtrl.createUserReview); // 작성
router.put('/reviews/:reviewId', userReviewCtrl.updateUserReview);   // 수정
router.delete('/reviews/:reviewId', userReviewCtrl.deleteUserReview); // 삭제

module.exports = router;