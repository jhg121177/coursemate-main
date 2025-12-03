const mariadb = require('mariadb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// DB 연결 정보 (app.js와 동일한 설정 사용)
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

// JWT 비밀키 (실무에서는 .env에 넣어야 함)
const JWT_SECRET = 'my_super_secret_key_1234';

// 1. 회원가입 로직
exports.signup = async (req, res) => {
  let conn;
  try {
    // 클라이언트가 보낸 데이터 받기 [cite: 335]
    const { email, password, name, gender, age } = req.body;

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);
    // 사용자 ID 생성 (간단히 현재 시간 + 랜덤숫자)
    const userId = 'USER' + Date.now();

    conn = await pool.getConnection();
    
    // DB에 사용자 정보 저장
    const query = `
      INSERT INTO USER (USER_ID, EMAIL, PASSWORD, NAME, GENDER, AGE)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await conn.query(query, [userId, email, hashedPassword, name, gender, age]);

    res.status(200).json({
      result_code: 200,
      result_msg: "회원가입 성공",
      userId: userId
    });

  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(200).json({ result_code: 102, result_msg: "이미 존재하는 이메일입니다." });
    }
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 2. 로그인 로직
exports.login = async (req, res) => {
  let conn;
  try {
    const { email, password } = req.body; // [cite: 336]

    conn = await pool.getConnection();
    
    // 이메일로 사용자 찾기
    const rows = await conn.query("SELECT * FROM USER WHERE EMAIL = ?", [email]);
    
    if (rows.length === 0) {
      return res.status(200).json({ result_code: 101, result_msg: "존재하지 않는 사용자입니다." });
    }

    const user = rows[0];

    // 비밀번호 비교 (입력한 비번 vs DB 암호화된 비번)
    const isMatch = await bcrypt.compare(password, user.PASSWORD);

    if (!isMatch) {
      return res.status(200).json({ result_code: 101, result_msg: "비밀번호가 일치하지 않습니다." });
    }

    // 로그인 성공 -> 토큰(JWT) 발급
    const token = jwt.sign(
      { userId: user.USER_ID, email: user.EMAIL },
      JWT_SECRET,
      { expiresIn: '1h' } // 1시간 유효
    );

    res.status(200).json({
      result_code: 200,
      result_msg: "로그인 성공",
      token: token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 3. 아이디 찾기
exports.findId = async (req, res) => {
  let conn;
  try {
    // 설계서 기준: 이름과 연락처(여기서는 이메일로 대체)로 조회
    const { name, email } = req.body; 

    conn = await pool.getConnection();
    
    // 이름과 이메일이 일치하는 사용자 조회
    const rows = await conn.query("SELECT USER_ID FROM USER WHERE NAME = ? AND EMAIL = ?", [name, email]);

    if (rows.length === 0) {
      return res.status(200).json({ result_code: 201, result_msg: "일치하는 사용자 정보를 찾을 수 없습니다." });
    }

    res.status(200).json({
      result_code: 200,
      result_msg: "아이디 찾기 성공",
      userId: rows[0].USER_ID // 설계서에는 email을 리턴한다고 되어있으나 문맥상 USER_ID가 맞음
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 4. 비밀번호 재설정 (로그인 전 분실 시)
exports.resetPassword = async (req, res) => {
  let conn;
  try {
    const { email, new_password } = req.body;

    // 새 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(new_password, 10);

    conn = await pool.getConnection();

    // 이메일이 존재하는지 확인
    const userCheck = await conn.query("SELECT * FROM USER WHERE EMAIL = ?", [email]);
    if (userCheck.length === 0) {
      return res.status(200).json({ result_code: 403, result_msg: "이메일이 일치하지 않습니다." });
    }

    // 비밀번호 업데이트 실행
    await conn.query("UPDATE USER SET PASSWORD = ? WHERE EMAIL = ?", [hashedPassword, email]);

    res.status(200).json({
      result_code: 200,
      result_msg: "비밀번호 변경(재설정) 성공"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};