import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LibraryPage from './pages/LibraryPage';
import GameDetailPage from './pages/GameDetailPage';
import ScannerPage from './pages/ScannerPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/game/:id" element={<GameDetailPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
