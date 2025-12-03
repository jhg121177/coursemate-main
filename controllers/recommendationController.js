const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

// 🤖 가짜(Mock) AI 추천 함수 (지역 필터링 추가됨)
async function mockAIRecommendation(conn, userTags, region, excludeIds = []) {
  console.log(`[Mock AI] 추천 시작. 지역: ${region}, 태그: ${userTags}, 제외ID: ${excludeIds}`);

  // TOUR_SPOT 테이블의 ADDRESS 컬럼에서 지역명을 검색 (예: '%서울%')
  let query = "SELECT SPOT_ID FROM TOUR_SPOT WHERE ADDRESS LIKE ?";
  let params = [`%${region}%`];

  const rows = await conn.query(query, params);
  let candidateIds = rows.map(row => row.SPOT_ID);

  // 해당 지역에 관광지가 없으면 빈 배열 반환
  if (candidateIds.length === 0) {
    console.log(`[Mock AI] '${region}' 지역에 해당하는 관광지가 없습니다.`);
    return [];
  }

  // 2. 제외할 ID 필터링 (재추천 시 사용)
  if (excludeIds.length > 0) {
    candidateIds = candidateIds.filter(id => !excludeIds.includes(id));
  }

  // 3. 후보군 중에서 랜덤 추천 (최대 3개)
  const recommended = [];
  const count = Math.min(candidateIds.length, 3);

  // 배열 섞기 (Shuffle)
  for (let i = candidateIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidateIds[i], candidateIds[j]] = [candidateIds[j], candidateIds[i]];
  }

  // 상위 n개 선택 및 점수 부여
  for (let i = 0; i < count; i++) {
    recommended.push({
      spotId: candidateIds[i],
      matchScore: Number((0.95 - (i * 0.05)).toFixed(2))
    });
  }

  return recommended;
}

// 1. AI 맞춤 관광 코스 추천 (GET /api/recommendations)
exports.getRecommendations = async (req, res) => {
  let conn;
  try {
    const userId = req.query.userId || req.body.userId;
    const region = req.query.region; 

    if (!region) {
      return res.status(400).json({ result_code: 400, result_msg: "지역(region) 정보가 필요합니다." });
    }

    conn = await pool.getConnection();

    // 1) 사용자 취향 태그 조회
    const prefRows = await conn.query(
      "SELECT t.TAG_NAME FROM USER_PREFERENCE up JOIN TAG t ON up.TAG_ID = t.TAG_ID WHERE up.USER_ID = ?", 
      [userId]
    );
    const userTags = prefRows.map(row => row.TAG_NAME);

    // 2) AI 모델에 추천 요청 (지역 정보 함께 전달)
    const aiResults = await mockAIRecommendation(conn, userTags, region);

    if (aiResults.length === 0) {
      return res.status(200).json({ 
        result_code: 200, 
        result_msg: `선택하신 '${region}' 지역에 추천할 관광지가 없거나 데이터가 부족합니다.`, 
        course: [] 
      });
    }

    // 3) 추천받은 ID로 상세 정보 조회
    const course = [];
    for (const item of aiResults) {
      const spotRows = await conn.query("SELECT SPOT_ID, NAME, ADDRESS, AVG_RATING FROM TOUR_SPOT WHERE SPOT_ID = ?", [item.spotId]);
      if (spotRows.length > 0) {
        const spot = spotRows[0];
        const features = ["#분위기좋은", "#사진맛집"]; // Mock Features

        course.push({
          spotId: spot.SPOT_ID,
          spotName: spot.NAME,
          address: spot.ADDRESS, // 주소도 같이 보여주면 지역 확인 가능
          matchScore: item.matchScore,
          features: features
        });
      }
    }

    res.status(200).json({
      result_code: 200,
      result_msg: "AI 맞춤 관광 코스 추천 성공",
      course: course
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 2. 다른 관광 코스 선택(재추천) (GET /api/recommendations/retry)
exports.getRetryRecommendations = async (req, res) => {
  let conn;
  try {
    const userId = req.query.userId || req.body.userId;
    const region = req.query.region; 
    const excludeIdsStr = req.query.excludeIds || ""; 
    const excludeIds = excludeIdsStr.split(',').filter(id => id.trim() !== "");

    if (!region) {
      return res.status(400).json({ result_code: 400, result_msg: "지역(region) 정보가 필요합니다." });
    }

    conn = await pool.getConnection();

    const prefRows = await conn.query(
      "SELECT t.TAG_NAME FROM USER_PREFERENCE up JOIN TAG t ON up.TAG_ID = t.TAG_ID WHERE up.USER_ID = ?", 
      [userId]
    );
    const userTags = prefRows.map(row => row.TAG_NAME);

    // AI 재추천 요청 (지역 + 제외ID)
    const aiResults = await mockAIRecommendation(conn, userTags, region, excludeIds);

    const course = [];
    for (const item of aiResults) {
      const spotRows = await conn.query("SELECT SPOT_ID, NAME, ADDRESS, AVG_RATING FROM TOUR_SPOT WHERE SPOT_ID = ?", [item.spotId]);
      if (spotRows.length > 0) {
        const spot = spotRows[0];
        const features = ["#힐링", "#새로운"]; 

        course.push({
          spotId: spot.SPOT_ID,
          spotName: spot.NAME,
          address: spot.ADDRESS,
          matchScore: item.matchScore,
          features: features
        });
      }
    }

    res.status(200).json({
      result_code: 200,
      result_msg: "다른 관광 코스 재추천 성공",
      course: course
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};