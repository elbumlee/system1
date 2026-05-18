interface Props {
  message: string;
  subMessage?: string;
}

export default function EmptyState({ message, subMessage }: Props) {
  return (
    <div className="table-empty">
      <p>{message}</p>
      {subMessage && <p className="table-empty-sub">{subMessage}</p>}
    </div>
  );
}
