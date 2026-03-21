import * as fs from "fs";
import * as path from "path";

// server/src/utils/cleanup.ts → server/tmp/
const TMP_DIR = path.resolve(__dirname, "..", "..", "tmp");

export function cleanupTmpOnStartup() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    console.log(`[cleanup] tmp 디렉토리 생성: ${TMP_DIR}`);
    return;
  }
  const files = fs.readdirSync(TMP_DIR);
  for (const file of files) {
    try {
      fs.unlinkSync(path.join(TMP_DIR, file));
    } catch {
      // 삭제 실패 무시
    }
  }
  console.log(`[cleanup] tmp 디렉토리 정리 완료 (${files.length}건)`);
}

export function deleteTmpFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // 삭제 실패 무시
  }
}