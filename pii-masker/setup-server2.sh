#!/bin/bash
# ============================================
# PII Masker — 서버 파일 Part 2 (13~19번)
# 실행법: bash setup-server2.sh
# ============================================

echo "📦 서버 파일 Part 2 생성 시작..."

# ---- 13. patterns.ts ----
cat > server/src/services/detector/patterns.ts << 'ENDOFFILE'
export const RRN_PATTERNS = {
  withHyphen: /\d{6}-[1-4]\d{6}/g,
  partialMasked: /\d{6}-[1-4]\d{0,6}[*]{1,6}/g,
  noHyphen: /\d{13}/g,
};
export const RRN_CONTEXT_KEYWORDS = ["주민등록번호","주민번호","주민등록","주민no","resident registration","rrn"];

export const PHONE_PATTERNS = {
  withHyphen: /0\d{1,2}-\d{3,4}-\d{4}/g,
  withSpace: /0\d{1,2}\s\d{3,4}\s\d{4}/g,
  withParens: /\(0\d{1,2}\)\s?\d{3,4}-?\d{4}/g,
  noSeparator: /0\d{9,10}/g,
};
export const PHONE_CONTEXT_KEYWORDS = ["전화","연락처","휴대폰","핸드폰","전화번호","tel","phone","mobile","h.p","hp","연락","휴대전화"];

export const DOB_PATTERNS = {
  fourDigitYear: /(19|20)\d{2}[.\-\/년]\s?\d{1,2}[.\-\/월]\s?\d{1,2}일?/g,
  twoDigitYear: /\d{2}[.\-\/]\d{1,2}[.\-\/]\d{1,2}/g,
  eightDigits: /(19|20)\d{6}/g,
};
export const DOB_CONTEXT_KEYWORDS = ["생년월일","생일","출생일","dob","birth","date of birth","출생","생년"];

const PROVINCES = "서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원도|충청북도|충청남도|전라북도|전라남도|경상북도|경상남도|제주특별자치도";

export const ADDRESS_PATTERNS = {
  oldStyle: new RegExp(`(${PROVINCES})\\s?\\S{1,10}[시군구]\\s?\\S{1,10}[동읍면리]\\s?[\\d\\-]+`, "g"),
  roadStyle: new RegExp(`(${PROVINCES})\\s?\\S{1,10}[시군구]\\s?\\S{1,20}[로길]\\s?[\\d\\-]+`, "g"),
  zipCode: /\d{5}|\d{3}-\d{3}/g,
};

export const NAME_CONTEXT_KEYWORDS = ["성명","이름","담당자","입주자","신청인","보호자","대표자","작성자","수급자","대리인","보증인","name","본인"];
export const NAME_CONTEXT_PATTERN = /(?:성명|이름|담당자|입주자|신청인|보호자|대표자|작성자|수급자|대리인|보증인|본인)\s*[:：]?\s*([가-힣]{2,4})/g;
ENDOFFILE
echo "  ✅ patterns.ts"

# ---- 14. surname.dict.ts ----
cat > server/src/services/detector/surname.dict.ts << 'ENDOFFILE'
export const KOREAN_SURNAMES = new Set([
  "김","이","박","최","정","강","조","윤","장","임","한","오","서","신","권","황","안","송","류","홍",
  "전","고","문","양","손","배","백","허","유","남","심","노","하","곽","성","차","주","우","구","민",
  "진","나","지","엄","변","천","방","공","염","여","원","석","선","설","마","길","연","위","표","명",
  "기","반","왕","금","옥","육","인","맹","제","모","탁","국","어","은","편","용","예","경","봉","사",
  "부","황보","남궁","제갈","사공","독고","동방","선우","두","소","섭","피","감","채","도","담","빈","수","탄","범","란",
]);

export const PLACE_NAMES = new Set([
  "서울","부산","대구","인천","광주","대전","울산","세종","경기","강원","충북","충남","전북","전남","경북","경남","제주",
  "강남","서초","송파","마포","영등포","종로","중구","용산","강동","강서","강북","관악","구로","금천","노원","도봉",
  "동대문","동작","성북","성동","양천","은평","중랑","수원","성남","고양","용인","안양","안산","화성","평택",
  "역삼","삼성","논현","신사","청담","압구정","반포","잠실","홍대","신촌","이태원","명동","종각","합정","상수","건대",
]);

export const COMMON_NOUNS = new Set([
  "기관","시설","센터","학교","병원","사무","관리","복지","지원","상담","교육","운영","서비스","프로그램","사업",
  "사항","내용","결과","기간","일시","장소","목적","방법","대상","비고","합계","소계","구분","항목","분류","번호",
  "현황","사유","조치","계획","진행","완료","예정","보류","부장","과장","대리","사원","팀장","원장","소장","국장",
  "확인","처리","검토","승인","요청","접수","통보","안내","필요","가능","불가","해당","관련","기타","전체","일부",
]);

export function evaluateAsName(text: string): { isName: boolean; confidence: number } {
  if (text.length < 2 || text.length > 4) return { isName: false, confidence: 0 };
  if (PLACE_NAMES.has(text) || COMMON_NOUNS.has(text)) return { isName: false, confidence: 0 };
  const firstChar = text[0];
  const twoChar = text.substring(0, 2);
  let surnameMatch = false, nameLen = 0;
  if (KOREAN_SURNAMES.has(twoChar) && text.length >= 3) { surnameMatch = true; nameLen = text.length - 2; }
  else if (KOREAN_SURNAMES.has(firstChar)) { surnameMatch = true; nameLen = text.length - 1; }
  if (!surnameMatch) return { isName: false, confidence: 0 };
  const namePart = text.substring(text.length - nameLen);
  if (!/^[가-힣]+$/.test(namePart)) return { isName: false, confidence: 0 };
  let conf = 0.6;
  if (new Set(["김","이","박","최","정","강","조","윤","장","임"]).has(firstChar)) conf += 0.05;
  if (text.length === 3) conf += 0.05;
  return { isName: true, confidence: Math.min(conf, 1.0) };
}
ENDOFFILE
echo "  ✅ surname.dict.ts"

# ---- 15. pii.detector.ts ----
cat > server/src/services/detector/pii.detector.ts << 'ENDOFFILE'
import { v4 as uuid } from "uuid";
import { ParsedSegment, DetectedPII, PIIType } from "../parser/parser.interface";
import { RRN_PATTERNS, RRN_CONTEXT_KEYWORDS, PHONE_PATTERNS, PHONE_CONTEXT_KEYWORDS, DOB_PATTERNS, DOB_CONTEXT_KEYWORDS, ADDRESS_PATTERNS, NAME_CONTEXT_PATTERN, NAME_CONTEXT_KEYWORDS } from "./patterns";
import { evaluateAsName } from "./surname.dict";

interface MatchRange { segIdx: number; start: number; end: number; }
class RangeTracker {
  private ranges: MatchRange[] = [];
  add(si: number, s: number, e: number) { this.ranges.push({ segIdx: si, start: s, end: e }); }
  overlaps(si: number, s: number, e: number): boolean {
    return this.ranges.some(r => r.segIdx === si && s < r.end && e > r.start);
  }
}

function hasNearbyKw(text: string, pos: number, kws: string[], win = 30): boolean {
  const before = text.substring(Math.max(0, pos - win), pos).toLowerCase();
  return kws.some(kw => before.includes(kw.toLowerCase()));
}

function findAll(regex: RegExp, text: string) {
  const res: { match: string; start: number; end: number }[] = [];
  const r = new RegExp(regex.source, regex.flags);
  let m: RegExpExecArray | null;
  while ((m = r.exec(text)) !== null) res.push({ match: m[0], start: m.index, end: m.index + m[0].length });
  return res;
}

function add(type: PIIType, orig: string, conf: number, seg: ParsedSegment, si: number, s: number, e: number, tr: RangeTracker, res: DetectedPII[]) {
  if (tr.overlaps(si, s, e)) return;
  tr.add(si, s, e);
  res.push({ id: uuid(), type, originalText: orig, maskedText: `[${type}]`, confidence: conf, segment: seg, startIndex: s, endIndex: e, excluded: false });
}

export function detectPII(segments: ParsedSegment[]): DetectedPII[] {
  const results: DetectedPII[] = [];
  const tr = new RangeTracker();
  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si], text = seg.text;
    if (!text || !text.trim()) continue;

    // 1. 주민등록번호
    for (const m of findAll(RRN_PATTERNS.withHyphen, text)) {
      const front = m.match.substring(0, 6);
      const mm = parseInt(front.substring(2, 4)), dd = parseInt(front.substring(4, 6));
      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) add("주민등록번호", m.match, 0.99, seg, si, m.start, m.end, tr, results);
    }
    for (const m of findAll(RRN_PATTERNS.partialMasked, text)) add("주민등록번호", m.match, 0.95, seg, si, m.start, m.end, tr, results);
    for (const m of findAll(RRN_PATTERNS.noHyphen, text)) { if (hasNearbyKw(text, m.start, RRN_CONTEXT_KEYWORDS)) add("주민등록번호", m.match, 0.85, seg, si, m.start, m.end, tr, results); }

    // 2. 전화번호
    for (const { regex, conf } of [{ regex: PHONE_PATTERNS.withHyphen, conf: 0.95 }, { regex: PHONE_PATTERNS.withSpace, conf: 0.93 }, { regex: PHONE_PATTERNS.withParens, conf: 0.93 }])
      for (const m of findAll(regex, text)) add("전화번호", m.match, conf, seg, si, m.start, m.end, tr, results);
    for (const m of findAll(PHONE_PATTERNS.noSeparator, text)) { if (hasNearbyKw(text, m.start, PHONE_CONTEXT_KEYWORDS)) add("전화번호", m.match, 0.80, seg, si, m.start, m.end, tr, results); }

    // 3. 생년월일
    for (const m of findAll(DOB_PATTERNS.fourDigitYear, text)) add("생년월일", m.match, 0.90, seg, si, m.start, m.end, tr, results);
    for (const m of findAll(DOB_PATTERNS.twoDigitYear, text)) { if (hasNearbyKw(text, m.start, DOB_CONTEXT_KEYWORDS)) add("생년월일", m.match, 0.75, seg, si, m.start, m.end, tr, results); }
    for (const m of findAll(DOB_PATTERNS.eightDigits, text)) { if (hasNearbyKw(text, m.start, DOB_CONTEXT_KEYWORDS)) add("생년월일", m.match, 0.80, seg, si, m.start, m.end, tr, results); }

    // 4. 주소
    for (const m of findAll(ADDRESS_PATTERNS.oldStyle, text)) add("주소", m.match, 0.88, seg, si, m.start, m.end, tr, results);
    for (const m of findAll(ADDRESS_PATTERNS.roadStyle, text)) add("주소", m.match, 0.88, seg, si, m.start, m.end, tr, results);

    // 5. 이름
    const ctxR = new RegExp(NAME_CONTEXT_PATTERN.source, NAME_CONTEXT_PATTERN.flags);
    let cm: RegExpExecArray | null;
    while ((cm = ctxR.exec(text)) !== null) {
      const name = cm[1], ns = cm.index + cm[0].indexOf(name);
      add("이름", name, 0.9, seg, si, ns, ns + name.length, tr, results);
    }
    if (seg.source === "excel" && seg.location.header) {
      const h = seg.location.header.toLowerCase();
      if (NAME_CONTEXT_KEYWORDS.some(kw => h.includes(kw.toLowerCase())) && /^[가-힣]{2,4}$/.test(text.trim())) {
        add("이름", text.trim(), 0.9, seg, si, 0, text.length, tr, results); continue;
      }
    }
    const knR = /[가-힣]{2,4}/g;
    let nm: RegExpExecArray | null;
    while ((nm = knR.exec(text)) !== null) {
      const c = nm[0], s = nm.index, e = s + c.length;
      if (tr.overlaps(si, s, e)) continue;
      const ev = evaluateAsName(c);
      if (ev.isName) {
        let cf = ev.confidence;
        const nearby = text.substring(Math.max(0, s - 100), Math.min(text.length, e + 100));
        if (new RegExp(RRN_PATTERNS.withHyphen.source).test(nearby) || new RegExp(PHONE_PATTERNS.withHyphen.source).test(nearby)) cf = Math.min(cf + 0.15, 1.0);
        add("이름", c, cf, seg, si, s, e, tr, results);
      }
    }
  }
  return results;
}
ENDOFFILE
echo "  ✅ pii.detector.ts"

# ---- 16. pii.masker.ts ----
cat > server/src/services/masker/pii.masker.ts << 'ENDOFFILE'
import { ParsedSegment, DetectedPII } from "../parser/parser.interface";

export function applyMasking(segments: ParsedSegment[], items: DetectedPII[]): ParsedSegment[] {
  const map = new Map<number, DetectedPII[]>();
  items.forEach(item => {
    if (item.excluded) return;
    let idx = segments.indexOf(item.segment);
    if (idx === -1) idx = segments.findIndex(s => s.text === item.segment.text && s.location.page === item.segment.location.page && s.location.row === item.segment.location.row);
    if (idx === -1) return;
    if (!map.has(idx)) map.set(idx, []);
    map.get(idx)!.push(item);
  });
  return segments.map((seg, idx) => {
    const its = map.get(idx);
    if (!its || its.length === 0) return { ...seg };
    const sorted = [...its].sort((a, b) => b.startIndex - a.startIndex);
    let t = seg.text;
    for (const it of sorted) t = t.substring(0, it.startIndex) + it.maskedText + t.substring(it.endIndex);
    return { ...seg, text: t };
  });
}
ENDOFFILE
echo "  ✅ pii.masker.ts"

# ---- 17. pdf.overlay.ts ----
cat > server/src/services/generator/pdf.overlay.ts << 'ENDOFFILE'
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as fs from "fs";
import * as path from "path";
import { DetectedPII } from "../parser/parser.interface";

const FONT_PATH = path.resolve(__dirname, "..", "..", "..", "fonts", "NotoSansKR-Regular.subset.ttf");

export async function overlayMaskPdf(buf: Buffer, items: DetectedPII[]): Promise<Buffer> {
  const doc = await PDFDocument.load(buf);
  doc.registerFontkit(fontkit);
  let font: any;
  try {
    if (!fs.existsSync(FONT_PATH)) throw new Error("NO_FONT");
    font = await doc.embedFont(fs.readFileSync(FONT_PATH));
  } catch { font = await doc.embedFont(StandardFonts.Helvetica); }

  const pages = doc.getPages();
  for (const item of items.filter(i => !i.excluded)) {
    const loc = item.segment.location;
    const pi = (loc.page || 1) - 1;
    if (pi >= pages.length) continue;
    const page = pages[pi];
    const { height: ph } = page.getSize();
    if (loc.x != null && loc.y != null && loc.width && loc.height) {
      const py = ph - loc.y - loc.height;
      page.drawRectangle({ x: loc.x - 2, y: py - 2, width: loc.width + 4, height: loc.height + 4, color: rgb(1, 1, 1) });
      page.drawText(item.maskedText, { x: loc.x, y: py + 2, size: Math.min(loc.height * 0.7, 12), font, color: rgb(0.8, 0, 0) });
    }
  }
  return Buffer.from(await doc.save());
}
ENDOFFILE
echo "  ✅ pdf.overlay.ts"

# ---- 18. pdf.generator.ts ----
cat > server/src/services/generator/pdf.generator.ts << 'ENDOFFILE'
import PDFDocument from "pdfkit";
import * as path from "path";
import * as fs from "fs";
import { ParsedSegment } from "../parser/parser.interface";

const FONT_PATH = path.resolve(__dirname, "..", "..", "..", "fonts", "NotoSansKR-Regular.subset.ttf");

export async function generateNewPdf(segs: ParsedSegment[], srcType: "excel" | "word"): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(FONT_PATH)) return reject(new Error("한글 폰트 없음: " + FONT_PATH));
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.registerFont("NotoSansKR", FONT_PATH);
    doc.font("NotoSansKR");
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(16).text("개인정보 마스킹 처리 결과", { align: "center" });
    doc.moveDown(1).fontSize(8).fillColor("#888").text("처리 일시: " + new Date().toLocaleString("ko-KR"), { align: "right" });
    doc.moveDown(1).fillColor("#000");
    if (srcType === "excel") {
      const sheets = new Map<string, ParsedSegment[]>();
      for (const s of segs) { const n = s.location.sheet || "Sheet1"; if (!sheets.has(n)) sheets.set(n, []); sheets.get(n)!.push(s); }
      for (const [name, ss] of sheets) {
        doc.fontSize(12).fillColor("#333").text("시트: " + name, { underline: true }).moveDown(0.5);
        const rows = new Map<number, Map<number, string>>();
        for (const s of ss) { const r = s.location.row || 0, c = s.location.col || 0; if (!rows.has(r)) rows.set(r, new Map()); rows.get(r)!.set(c, s.text); }
        for (const [_, cols] of Array.from(rows.entries()).sort(([a], [b]) => a - b)) {
          doc.fontSize(9).fillColor("#000").text(Array.from(cols.entries()).sort(([a], [b]) => a - b).map(([__, v]) => v).join("  |  "), { width: 500, lineGap: 3 });
        }
        doc.moveDown(1);
      }
    } else {
      for (const seg of segs) {
        const parts = seg.text.split(/(\[[^\]]+\])/g);
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i]; if (!p) continue;
          const last = i === parts.length - 1;
          if (/^\[.+\]$/.test(p)) doc.fontSize(10).fillColor("#C00").text(p, { continued: !last });
          else doc.fontSize(10).fillColor("#000").text(p, { continued: !last });
        }
        doc.moveDown(0.3);
      }
    }
    doc.end();
  });
}
ENDOFFILE
echo "  ✅ pdf.generator.ts"

# ---- 19. upload.route.ts ----
cat > server/src/routes/upload.route.ts << 'ENDOFFILE'
import { Router, Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { upload } from "../middleware/upload.middleware";
import { concurrencyLimit } from "../middleware/rateLimit.middleware";
import { jobStore } from "../store/jobStore";
import { deleteTmpFile } from "../utils/cleanup";
import { parseExcel } from "../services/parser/excel.parser";
import { parseWord } from "../services/parser/word.parser";
import { parsePdf } from "../services/parser/pdf.parser";
import { ocrParsePdf } from "../services/parser/ocr.parser";
import { detectPII } from "../services/detector/pii.detector";
import { applyMasking } from "../services/masker/pii.masker";
import { overlayMaskPdf } from "../services/generator/pdf.overlay";
import { generateNewPdf } from "../services/generator/pdf.generator";
import { JobData, SourceType, ParsedSegment, UploadResponse, PreviewResponse } from "../services/parser/parser.interface";

const router = Router();
function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => { fn(req, res, next).catch(next); };
}

router.post("/", concurrencyLimit, upload.single("file"), wrap(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "파일이 첨부되지 않았습니다." });
  const ext = path.extname(file.originalname).toLowerCase();
  const jobId = uuidv4(), fp = file.path, warns: string[] = [];
  try {
    const buf = fs.readFileSync(fp);
    let segs: ParsedSegment[] = [], src: SourceType = "pdf", ft: "xlsx"|"docx"|"pdf" = "pdf", origBuf: Buffer | undefined;
    if (ext === ".xlsx" || ext === ".xls") { ft = "xlsx"; src = "excel"; segs = await parseExcel(buf); }
    else if (ext === ".docx") { ft = "docx"; src = "word"; segs = await parseWord(buf); }
    else if (ext === ".pdf") {
      ft = "pdf"; origBuf = buf;
      const pr = await parsePdf(buf);
      if (pr.isImagePdf) {
        src = "ocr"; warns.push("이미지 PDF입니다. OCR 정확도가 낮을 수 있습니다.");
        try { const or = await ocrParsePdf(buf, pr.pageCount); segs = or.segments; if (or.avgConfidence < 0.7) warns.push("OCR 신뢰도가 낮습니다."); }
        catch (e: any) { warns.push("OCR 실패: " + e.message); }
      } else { src = "pdf"; segs = pr.segments; }
    }
    deleteTmpFile(fp);
    const pii = detectPII(segs);
    const job: JobData = { id: jobId, status: "ready", fileName: file.originalname, fileType: ft, sourceType: src, segments: segs, detectedPII: pii, originalPdfBuffer: origBuf, createdAt: Date.now() };
    jobStore.set(jobId, job);
    return res.json({ jobId, status: "ready", fileName: file.originalname, totalDetected: pii.length, warnings: warns.length > 0 ? warns : undefined } as UploadResponse);
  } catch (err: any) {
    deleteTmpFile(fp);
    if (err.message === "ENCRYPTED_PDF") return res.status(422).json({ error: "암호화된 PDF입니다." });
    console.error("[upload]", err);
    return res.status(500).json({ error: "파일 처리 중 오류가 발생했습니다." });
  }
}));

router.get("/preview/:jobId", (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "작업이 만료되었습니다." });
  return res.json({ jobId: job.id, status: job.status, fileName: job.fileName, items: job.detectedPII } as PreviewResponse);
});

router.patch("/preview/:jobId", (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "작업이 만료되었습니다." });
  const { updates, additions } = req.body;
  if (updates) for (const u of updates) { const it = job.detectedPII.find(d => d.id === u.id); if (it) it.excluded = u.excluded; }
  if (additions) for (const a of additions) { const seg = job.segments[a.segmentIndex]; if (!seg) continue; job.detectedPII.push({ id: uuidv4(), type: a.type, originalText: a.originalText, maskedText: "["+a.type+"]", confidence: 1.0, segment: seg, startIndex: a.startIndex, endIndex: a.endIndex, excluded: false }); }
  jobStore.set(job.id, job);
  return res.json({ success: true, totalDetected: job.detectedPII.length });
});

router.post("/download/:jobId", wrap(async (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "작업이 만료되었습니다." });
  job.status = "generating"; let pdf: Buffer;
  if ((job.sourceType === "pdf" || job.sourceType === "ocr") && job.originalPdfBuffer) pdf = await overlayMaskPdf(job.originalPdfBuffer, job.detectedPII);
  else { const masked = applyMasking(job.segments, job.detectedPII); pdf = await generateNewPdf(masked, job.fileType === "xlsx" ? "excel" : "word"); }
  const fn = "masked_" + path.parse(job.fileName).name + ".pdf";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="' + encodeURIComponent(fn) + '"');
  res.send(pdf);
  jobStore.delete(job.id);
}));

router.delete("/job/:jobId", (req, res) => { jobStore.delete(req.params.jobId); return res.json({ success: true }); });

export default router;
ENDOFFILE
echo "  ✅ upload.route.ts"

echo ""
echo "🎉 서버 파일 전체 (19/19) 생성 완료!"
echo "➡️ 다음: bash setup-client.sh 실행"