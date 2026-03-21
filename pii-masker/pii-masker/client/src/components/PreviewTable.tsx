import type { DetectedPII } from "../types/pii";

interface PreviewProps {
  items: DetectedPII[];
  onToggleExclude: (id: string, excluded: boolean) => void;
}

function confidenceBadge(conf: number) {
  if (conf >= 0.85) return { color: "bg-green-100 text-green-800", label: conf.toFixed(2) };
  if (conf >= 0.6) return { color: "bg-yellow-100 text-yellow-800", label: conf.toFixed(2) };
  return { color: "bg-red-100 text-red-800", label: `⚠️ ${conf.toFixed(2)}` };
}

function typeBadge(type: string) {
  const colors: Record<string, string> = {
    주민등록번호: "bg-red-100 text-red-700",
    전화번호: "bg-blue-100 text-blue-700",
    생년월일: "bg-purple-100 text-purple-700",
    주소: "bg-green-100 text-green-700",
    이름: "bg-orange-100 text-orange-700",
  };
  return colors[type] || "bg-gray-100 text-gray-700";
}

export function PreviewTable({ items, onToggleExclude }: PreviewProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        탐지된 개인정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        ℹ️ 이름은 키워드 인접 또는 성씨 사전 기반으로 탐지됩니다.
        누락된 항목은 수동으로 추가해 주세요.
        신뢰도 0.6 미만 항목은 ⚠️ 표시됩니다.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium">유형</th>
              <th className="text-left p-3 font-medium">원본 텍스트</th>
              <th className="text-left p-3 font-medium">마스킹 결과</th>
              <th className="text-center p-3 font-medium">신뢰도</th>
              <th className="text-center p-3 font-medium">제외</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const badge = confidenceBadge(item.confidence);
              return (
                <tr
                  key={item.id}
                  className={`border-b hover:bg-gray-50 transition-colors
                    ${item.excluded ? "opacity-40 line-through" : ""}
                    ${item.confidence < 0.6 ? "bg-yellow-50" : ""}
                  `}
                >
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge(item.type)}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs max-w-[200px] truncate">
                    {item.originalText}
                  </td>
                  <td className="p-3 text-red-600 font-medium text-xs">
                    {item.maskedText}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${badge.color}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.excluded}
                      onChange={(e) => onToggleExclude(item.id, e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-right text-xs text-gray-400">
        총 {items.filter((i) => !i.excluded).length}건 마스킹 적용
        / {items.filter((i) => i.excluded).length}건 제외
      </div>
    </div>
  );
}