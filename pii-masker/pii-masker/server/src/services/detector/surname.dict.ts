// ============================================
// 한국 성씨 사전 (상위 286개)
// + 지명/일반명사 제외 사전
// ============================================

// --- 한국 성씨 (빈도순 상위) ---
export const KOREAN_SURNAMES = new Set([
  // 상위 50 (전체 인구 약 90% 커버)
  "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임",
  "한", "오", "서", "신", "권", "황", "안", "송", "류", "홍",
  "전", "고", "문", "양", "손", "배", "백", "허", "유", "남",
  "심", "노", "하", "곽", "성", "차", "주", "우", "구", "민",
  "진", "나", "지", "엄", "변", "천", "방", "공", "염", "여",
  // 추가 (51~100)
  "원", "석", "선", "설", "마", "길", "연", "위", "표", "명",
  "기", "반", "왕", "금", "옥", "육", "인", "맹", "제", "모",
  "탁", "국", "어", "은", "편", "용", "예", "경", "봉", "사",
  "부", "황보", "남궁", "제갈", "사공", "독고", "동방", "선우",
  // 2자 성씨
  "司空", "皇甫",
  // 귀화계
  "두", "소", "섭", "피", "감", "채",
  "도", "담", "빈", "수", "탄", "범", "란",
]);

// --- 지명 제외 사전 (이름과 혼동 방지) ---
export const PLACE_NAMES = new Set([
  // 광역시/도
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
  // 주요 구/시
  "강남", "서초", "송파", "마포", "영등포", "종로", "중구", "용산",
  "강동", "강서", "강북", "관악", "구로", "금천", "노원", "도봉",
  "동대문", "동작", "성북", "성동", "양천", "은평", "중랑",
  "수원", "성남", "고양", "용인", "안양", "안산", "화성", "평택",
  // 주요 동/지역명
  "역삼", "삼성", "논현", "신사", "청담", "압구정", "반포", "잠실",
  "홍대", "신촌", "이태원", "명동", "종각", "합정", "상수", "건대",
]);

// --- 일반 명사 제외 사전 (한글 2~4자 중 이름이 아닌 것) ---
export const COMMON_NOUNS = new Set([
  // 기관/시설
  "기관", "시설", "센터", "학교", "병원", "사무", "관리", "복지",
  "지원", "상담", "교육", "운영", "서비스", "프로그램", "사업",
  // 문서 용어
  "사항", "내용", "결과", "기간", "일시", "장소", "목적", "방법",
  "대상", "비고", "합계", "소계", "구분", "항목", "분류", "번호",
  "현황", "사유", "조치", "계획", "진행", "완료", "예정", "보류",
  // 직책/호칭
  "부장", "과장", "대리", "사원", "팀장", "원장", "소장", "국장",
  // 일반 동사/형용사 어근
  "확인", "처리", "검토", "승인", "요청", "접수", "통보", "안내",
  "필요", "가능", "불가", "해당", "관련", "기타", "전체", "일부",
]);

// 호출마다 재생성하지 않도록 모듈 레벨 상수로 분리
const TOP_SURNAMES = new Set(["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"]);

/**
 * 한국 성씨 기반 이름 후보인지 판별
 * @param text 한글 2~4자 텍스트
 * @returns { isName: boolean, confidence: number }
 */
export function evaluateAsName(text: string): {
  isName: boolean;
  confidence: number;
} {
  // 길이 필터
  if (text.length < 2 || text.length > 4) {
    return { isName: false, confidence: 0 };
  }

  // 제외 사전 체크
  if (PLACE_NAMES.has(text) || COMMON_NOUNS.has(text)) {
    return { isName: false, confidence: 0 };
  }

  // 첫 글자가 성씨인지 확인
  const firstChar = text[0];
  const twoCharSurname = text.substring(0, 2);

  let surnameMatch = false;
  let namePartLength = 0;

  // 2자 성씨 우선 체크
  if (KOREAN_SURNAMES.has(twoCharSurname) && text.length >= 3) {
    surnameMatch = true;
    namePartLength = text.length - 2;
  } else if (KOREAN_SURNAMES.has(firstChar)) {
    surnameMatch = true;
    namePartLength = text.length - 1;
  }

  if (!surnameMatch) {
    return { isName: false, confidence: 0 };
  }

  // 이름 부분이 1~3자 한글인지
  const namePart = text.substring(text.length - namePartLength);
  const isKorean = /^[가-힣]+$/.test(namePart);

  if (!isKorean) {
    return { isName: false, confidence: 0 };
  }

  // 기본 신뢰도 0.6 (사전 매칭)
  let confidence = 0.6;

  // 흔한 성씨면 +0.05 (김이박최정 등)
  if (TOP_SURNAMES.has(firstChar)) {
    confidence += 0.05;
  }

  // 3자 이름(성1+이름2)이면 가장 전형적 → +0.05
  if (text.length === 3) {
    confidence += 0.05;
  }

  return { isName: true, confidence: Math.min(confidence, 1.0) };
}