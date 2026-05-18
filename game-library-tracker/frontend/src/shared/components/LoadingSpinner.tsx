interface Props {
  message?: string;
}

export default function LoadingSpinner({ message = '불러오는 중...' }: Props) {
  return (
    <div className="table-empty">
      <span>{message}</span>
    </div>
  );
}
