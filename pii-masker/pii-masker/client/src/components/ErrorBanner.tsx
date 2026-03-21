interface BannerProps {
  messages: string[];
  type: "error" | "warning";
}

export function ErrorBanner({ messages, type }: BannerProps) {
  if (messages.length === 0) return null;

  const styles = {
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };
  const icon = type === "error" ? "❌" : "⚠️";

  return (
    <div className={`border rounded-lg p-3 ${styles[type]}`}>
      {messages.map((msg, i) => (
        <p key={i} className="text-sm">
          {icon} {msg}
        </p>
      ))}
    </div>
  );
}