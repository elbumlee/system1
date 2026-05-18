import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = '게임 이름 검색...' }: Props) {
  return (
    <div className="search-box">
      <Search size={16} className="search-icon" />
      <input
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button className="search-clear" onClick={() => onChange('')}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
