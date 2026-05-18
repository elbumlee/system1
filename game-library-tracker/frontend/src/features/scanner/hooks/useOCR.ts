import { useState } from 'react';
import { uploadImageForOCR, confirmOCRGames } from '../../../api/ocr';
import { useGameStore } from '../../../store/gameStore';
import type { OCRResult, Platform } from '../../../types';

export function useOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [platform, setPlatform] = useState<Platform>('steam');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const upsertGame = useGameStore((s) => s.upsertGame);

  async function handleFile(f: File) {
    setError('');
    setResult(null);
    setSelected(new Set());
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploading(true);
    try {
      const ocr = await uploadImageForOCR(f);
      setResult(ocr);
      setSelected(new Set(ocr.candidates));
      if (ocr.platform_hint !== 'unknown') {
        setPlatform(ocr.platform_hint as Platform);
      }
    } catch {
      setError('OCR 처리에 실패했습니다. 다른 이미지를 시도해 주세요.');
    } finally {
      setUploading(false);
    }
  }

  function toggleCandidate(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function toggleAll() {
    if (!result) return;
    if (selected.size === result.candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(result.candidates));
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setSelected(new Set());
    setError('');
  }

  async function confirm(): Promise<boolean> {
    if (!result || selected.size === 0) return false;
    setConfirming(true);
    setError('');
    try {
      const games = await confirmOCRGames({
        image_id: result.image_id,
        selected_names: Array.from(selected),
        platform,
      });
      games.forEach((g) => upsertGame(g));
      return true;
    } catch {
      setError('게임 추가에 실패했습니다.');
      return false;
    } finally {
      setConfirming(false);
    }
  }

  return {
    file,
    preview,
    uploading,
    result,
    selected,
    platform,
    confirming,
    error,
    handleFile,
    toggleCandidate,
    toggleAll,
    setPlatform,
    reset,
    confirm,
  };
}
