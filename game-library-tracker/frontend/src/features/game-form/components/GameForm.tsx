import type { useGameForm } from '../hooks/useGameForm';
import { GENRES } from '../constants';

type GameFormHook = ReturnType<typeof useGameForm>;

interface Props {
  form: GameFormHook;
  error?: string;
}

export default function GameForm({ form, error }: Props) {
  const { fields, setName, setSteam, setEpic, setSwitch, setGenre, setFavorite, setNotes } = form;

  return (
    <>
      <label className="form-label">
        게임 이름 *
        <input
          className="form-input"
          value={fields.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예) Cyberpunk 2077"
          autoFocus
        />
      </label>

      <div className="form-label">보유 플랫폼</div>
      <div className="platform-checks">
        <label className="check-label steam-check">
          <input
            type="checkbox"
            checked={fields.steam}
            onChange={(e) => setSteam(e.target.checked)}
          />
          Steam
        </label>
        <label className="check-label epic-check">
          <input
            type="checkbox"
            checked={fields.epic}
            onChange={(e) => setEpic(e.target.checked)}
          />
          Epic Games
        </label>
        <label className="check-label switch-check">
          <input
            type="checkbox"
            checked={fields.switch}
            onChange={(e) => setSwitch(e.target.checked)}
          />
          Nintendo Switch
        </label>
      </div>

      <label className="form-label">
        장르
        <select
          className="form-input form-select"
          value={fields.genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">장르 선택</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <label className="check-label favorite-check">
        <input
          type="checkbox"
          checked={fields.favorite}
          onChange={(e) => setFavorite(e.target.checked)}
        />
        ★ 즐겨찾기
      </label>

      <label className="form-label">
        메모
        <input
          className="form-input"
          value={fields.notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="선택 사항"
        />
      </label>

      {error && <p className="form-error">{error}</p>}
    </>
  );
}
