const mariadb = require('mariadb');
const bcrypt = require('bcryptjs'); // 비밀번호 암호화용
require('dotenv').config();

// DB 연결 설정 (기존 설정과 동일하게 유지)
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});


// 1. 회원 목록 조회 (이름 검색 기능 포함)
exports.searchUsers = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { name } = req.query; // URL 쿼리로 검색어 받음 (?name=홍길동)

    let sql = "SELECT USER_ID, NAME, EMAIL, AGE, GENDER, IS_ACTIVE, JOIN_DATE FROM USER";
    let params = [];

    // 이름 검색어가 있으면 WHERE 절 추가
    if (name) {
      sql += " WHERE NAME LIKE ?";
      params.push(`%${name}%`);
    }

    sql += " ORDER BY JOIN_DATE DESC"; // 최신 가입순 정렬

    const rows = await conn.query(sql, params);
    res.status(200).json({ result_code: 200, result_msg: "회원 목록 조회 성공", users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 2. 회원 직접 추가 (관리자 권한)
exports.addUser = async (req, res) => {
  let conn;
  try {
    const { userId, password, name, email, age, gender } = req.body;
    conn = await pool.getConnection();

    // ID 중복 체크
    const check = await conn.query("SELECT USER_ID FROM USER WHERE USER_ID = ?", [userId]);
    if (check.length > 0) {
      return res.status(400).json({ result_code: 400, result_msg: "이미 존재하는 ID입니다." });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.query(
      "INSERT INTO USER (USER_ID, PASSWORD, NAME, EMAIL, AGE, GENDER, IS_ACTIVE, JOIN_DATE) VALUES (?, ?, ?, ?, ?, ?, 'Y', NOW())",
      [userId, hashedPassword, name, email, age, gender]
    );

    res.status(200).json({ result_code: 200, result_msg: "회원 추가 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 3. 회원 정보 수정 (관리자 권한)
exports.updateUser = async (req, res) => {
  let conn;
  try {
    const { userId } = req.params; // URL 파라미터로 ID 받음
    const { name, email, age, gender } = req.body; // 수정할 내용
    conn = await pool.getConnection();

    await conn.query(
      "UPDATE USER SET NAME = ?, EMAIL = ?, AGE = ?, GENDER = ? WHERE USER_ID = ?",
      [name, email, age, gender, userId]
    );

    res.status(200).json({ result_code: 200, result_msg: "회원 정보 수정 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 4. 회원 영구 삭제
exports.deleteUser = async (req, res) => {
  let conn;
  try {
    const { userId } = req.params;
    conn = await pool.getConnection();
    
    // 실제 삭제 쿼리
    await conn.query("DELETE FROM USER WHERE USER_ID = ?", [userId]);

    res.status(200).json({ result_code: 200, result_msg: "회원 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};


// 5. 공지사항 등록
exports.addNotice = async (req, res) => {
  let conn;
  try {
    const { title, content } = req.body;
    const noticeId = 'NOTI' + Date.now(); // ID 자동생성 예시
    conn = await pool.getConnection();

    await conn.query(
      "INSERT INTO NOTICE (NOTICE_ID, TITLE, CONTENT, REG_DATE) VALUES (?, ?, ?, NOW())",
      [noticeId, title, content]
    );

    res.status(200).json({ result_code: 200, result_msg: "공지사항 등록 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 6. 공지사항 수정
exports.editNotice = async (req, res) => {
  let conn;
  try {
    const { id } = req.params; // noticeId
    const { title, content } = req.body;
    conn = await pool.getConnection();

    await conn.query(
      "UPDATE NOTICE SET TITLE = ?, CONTENT = ? WHERE NOTICE_ID = ?",
      [title, content, id]
    );

    res.status(200).json({ result_code: 200, result_msg: "공지사항 수정 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 7. 공지사항 삭제
exports.removeNotice = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();

    await conn.query("DELETE FROM NOTICE WHERE NOTICE_ID = ?", [id]);

    res.status(200).json({ result_code: 200, result_msg: "공지사항 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 8. 전체 문의 내역 조회 (관리자용)
exports.getAllInquiries = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    // 문의 내역과 작성자 이름을 같이 조회
    const query = `
      SELECT i.INQUIRY_ID, i.TITLE, i.CONTENT, i.STATUS, i.REG_DATE, u.NAME as writer
      FROM INQUIRY i
      LEFT JOIN USER u ON i.USER_ID = u.USER_ID
      ORDER BY i.REG_DATE DESC
    `;
    const rows = await conn.query(query);
    res.status(200).json({ result_code: 200, inquiries: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 9. 문의 내역 삭제
exports.removeInquiry = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();
    await conn.query("DELETE FROM INQUIRY WHERE INQUIRY_ID = ?", [id]);
    res.status(200).json({ result_code: 200, result_msg: "문의 내역 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};