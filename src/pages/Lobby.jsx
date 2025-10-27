import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from '../api/axiosConfig';

// --- КОНСТАНТЫ ---
const GAMES = ["All games", "CS2", "Dota 2", "Valorant", "Fortnite", "Custom Game"];

// РЕЖИМЫ ДЛЯ ДРУГИХ ИГР (универсальные)
const GENERIC_MODES = ["All modes", "1v1", "2v2", "3v3", "5v5", "Free-for-all"];

// 🆕 РЕЖИМЫ ДЛЯ DOTA 2 (отдельная константа)
const DOTA2_MODES = [
  { label: "All Pick", value: "All Pick", gameMode: 22, slots: 10 },
  { label: "Captains Mode", value: "Captains Mode", gameMode: 2, slots: 10 },
  { label: "Random Draft", value: "Random Draft", gameMode: 3, slots: 10 },
  { label: "Single Draft", value: "Single Draft", gameMode: 4, slots: 10 },
  { label: "All Random", value: "All Random", gameMode: 5, slots: 10 },
  { label: "Captains Draft", value: "Captains Draft", gameMode: 9, slots: 10 },
  { label: "Least Played", value: "Least Played", gameMode: 12, slots: 10 },
  { label: "Mid Only", value: "Mid Only", gameMode: 21, slots: 10 },
  { label: "1v1 Solo Mid", value: "1v1 Solo Mid", gameMode: 21, slots: 2 }, // 🎯 ОСОБЫЙ РЕЖИМ
  { label: "Turbo", value: "Turbo", gameMode: 23, slots: 10 },
  { label: "Reverse Captain Mode", value: "Reverse Captain Mode", gameMode: 8, slots: 10 },
  { label: "All Random Deathmatch", value: "All Random Deathmatch", gameMode: 16, slots: 10 },
];

const REGIONS = ["All regions", "EU", "NA", "ASIA", "RU"];

// 🆕 РЕГИОНЫ ДЛЯ DOTA 2
const DOTA2_REGIONS = [
  { label: "US West", value: "US West", region: 1 },
  { label: "US East", value: "US East", region: 2 },
  { label: "Europe West", value: "Europe West", region: 3 },
  { label: "Singapore", value: "Singapore", region: 4 },
  { label: "Dubai", value: "Dubai", region: 5 },
  { label: "Stockholm", value: "Stockholm", region: 6 },
  { label: "Brazil", value: "Brazil", region: 7 },
  { label: "Austria", value: "Austria", region: 8 },
  { label: "Australia", value: "Australia", region: 9 },
  { label: "South Africa", value: "South Africa", region: 10 },
  { label: "Chile", value: "Chile", region: 11 },
  { label: "Peru", value: "Peru", region: 12 },
  { label: "Argentina", value: "Argentina", region: 13 },
  { label: "India", value: "India", region: 14 },
  { label: "Japan", value: "Japan", region: 15 }
];

const PRICE_OPTIONS = [
  { value: "all", label: "Any price" },
  { value: "lt1", label: "< $1", min: 0, max: 1 },
  { value: "1-5", label: "$1 - $5", min: 1, max: 5 },
  { value: "5-20", label: "$5 - $20", min: 5, max: 20 },
  { value: "gt20", label: "> $20", min: 20, max: Infinity },
];

// 🆕 КОНФИГУРАЦИЯ РЕЖИМОВ ДЛЯ ДРУГИХ ИГР
const MODE_CONFIG = {
  '1v1': { maxPlayers: 2, teams: { A: 1, B: 1 } },
  '2v2': { maxPlayers: 4, teams: { A: 2, B: 2 } },
  '3v3': { maxPlayers: 6, teams: { A: 3, B: 3 } },
  '5v5': { maxPlayers: 10, teams: { A: 5, B: 5 } },
  'Free-for-all': { maxPlayers: 16, teams: { FFA: 16 } },
};

// 🆕 КОНФИГУРАЦИЯ ДЛЯ DOTA 2 (по количеству слотов)
const DOTA2_MODE_CONFIG = {
  2: { maxPlayers: 2, teams: { Radiant: 1, Dire: 1 } },   // 1v1 Solo Mid
  10: { maxPlayers: 10, teams: { Radiant: 5, Dire: 5 } }, // Все остальные режимы
};

export const initialLobbies = [];

export default function Lobby() {
  // --- ХУКИ И СОСТОЯНИЯ ---
  const [lobbies, setLobbies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    game: "All games",
    mode: "All modes",
    region: "All regions",
    price: "all",
    search: ""
  });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "", 
    game: "CS2", 
    mode: "5v5", 
    region: "EU", 
    entryFee: 1, 
    lobbyType: 'public', 
    password: '',
    dotaGameMode: 22, // 🆕 ID режима для Dota 2
    dotaRegion: 3, 
  });

  const { user, joinLobbySession } = useAuth();
  const navigate = useNavigate();

    // 🆕 ДИНАМИЧЕСКИЙ СПИСОК РЕЖИМОВ (зависит от выбранной игры)
  const availableModes = useMemo(() => {
    if (createForm.game === "Dota 2") {
      return DOTA2_MODES;
    }
    return GENERIC_MODES;
  }, [createForm.game]);

    // 🆕 ДИНАМИЧЕСКИЙ СПИСОК РЕГИОНОВ
  const availableRegions = useMemo(() => {
    if (createForm.game === "Dota 2") {
      return DOTA2_REGIONS;
    }
    return REGIONS;
  }, [createForm.game]);

  // 🆕 useEffect: Сброс режима при смене игры
  useEffect(() => {
    if (createForm.game === "Dota 2") {
      // При переключении на Dota 2 - ставим первый режим из списка
      const firstDotaMode = DOTA2_MODES[0];
      const firstDotaRegion = DOTA2_REGIONS[0];
      setCreateForm(prev => ({
        ...prev,
        mode: firstDotaMode.value,
        dotaGameMode: firstDotaMode.gameMode,
        region: firstDotaRegion.value,        // 🆕
        dotaRegion: firstDotaRegion.region,   // 🆕
      }));
    } else {
      // При переключении на другую игру - ставим стандартный режим
      setCreateForm(prev => ({
        ...prev,
        mode: "5v5",
        dotaGameMode: 22, // На всякий случай
        region: "EU",   // 🆕
        dotaRegion: 3,  // 🆕
      }));
    }
  }, [createForm.game]);

    // --- 👇 ОБНОВЛЕННЫЙ useEffect 👇 ---
  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        const response = await axios.get('/api/lobbies');
        setLobbies(response.data);
      } catch (error) {
        console.error("Ошибка при обновлении лобби:", error);
      } finally {
        if (isLoading) setIsLoading(false);
      }
    };
    fetchLobbies();
    const intervalId = setInterval(fetchLobbies, 5000);
    return () => clearInterval(intervalId);
  }, [isLoading]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      game: "All games",
      mode: "All modes",
      region: "All regions",
      price: "all",
      search: ""
    });
  };

  const handleJoinAction = async (lobbyId, isSpectator = false) => {
      if (!user) {
        toast.error("Please log in to join a lobby.");
        navigate('/login');
        return;
      }
      
      try {
        // The API call remains the same
        await axios.put(`/api/lobbies/${lobbyId}/join`, { user, isSpectator });
        
        // --- 👇 THE FIX IS HERE 👇 ---
        // We now call joinLobbySession for EVERYONE who joins,
        // ensuring user.currentLobbyId is always set correctly.
        joinLobbySession(lobbyId);
        
        navigate(`/lobby/${lobbyId}`);

      } catch (error) {
        console.error("Failed to join lobby:", error);
        toast.error(error.response?.data?.message || "An error occurred.");
      }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!user) { 
      toast.error("Нужно войти в аккаунт"); 
      return; 
    }

    // 🆕 ОПРЕДЕЛЯЕМ КОНФИГУРАЦИЮ В ЗАВИСИМОСТИ ОТ ИГРЫ
    let config;
    if (createForm.game === "Dota 2") {
      // Для Dota 2 ищем конфигурацию по количеству слотов
      const selectedMode = DOTA2_MODES.find(m => m.value === createForm.mode);
      
      console.log('🔍 [Dota 2 Debug]');
      console.log('Selected mode:', createForm.mode);
      console.log('Found mode object:', selectedMode);
      console.log('Slots:', selectedMode?.slots);
      
      if (!selectedMode) {
        toast.error("Выбран неверный режим для Dota 2");
        return;
      }
      
      config = DOTA2_MODE_CONFIG[selectedMode.slots];
      console.log('Config:', config);
      
      if (!config) {
        console.error('❌ Config not found for slots:', selectedMode.slots);
        toast.error("Ошибка конфигурации режима");
        return;
      }
    } else {
      // Для других игр используем стандартную конфигурацию
      config = MODE_CONFIG[createForm.mode];
    }

    if (!config) { 
      toast.error("Выбран неверный режим"); 
      return; 
    }

    const entryFee = Number(createForm.entryFee);
    if (user.balance < entryFee) { 
      toast.error("Недостаточно средств для создания лобби!"); 
      return; 
    }

    // 🆕 ДОБАВЛЯЕМ dotaGameMode И dotaRegion в данные лобби
    const newLobbyData = {
      id: Date.now(),
      title: createForm.title || `${createForm.game} — ${createForm.mode}`,
      host: { id: user.id, email: user.email }, 
      game: createForm.game, 
      mode: createForm.mode, 
      region: createForm.region,
      type: createForm.lobbyType, 
      password: createForm.lobbyType === 'private' ? createForm.password : null,
      entryFee: entryFee, 
      maxPlayers: config.maxPlayers,
      status: 'waiting',
      players: 1,
      slots: Object.entries(config.teams).flatMap(([teamName, count]) => 
        Array(count).fill(null).map((_, i) => ({ team: teamName, position: i + 1, user: null }))
      ),
      spectators: [], 
      chat: [],
      bannedUsers: [],
      dotaGameMode: createForm.dotaGameMode,
      dotaRegion: createForm.dotaRegion,
    };
    
    console.log('📦 Created lobby data:', newLobbyData);
    console.log('📊 Slots created:', newLobbyData.slots);
    
    const firstSlotIndex = newLobbyData.slots.findIndex(s => s.user === null);
    if (firstSlotIndex !== -1) {
      newLobbyData.slots[firstSlotIndex].user = { 
        ...user, 
        isReady: false 
      };
    }

    try {
      const response = await axios.post('/api/lobbies', newLobbyData);
      const createdLobby = response.data;
      
      setLobbies(currentLobbies => [createdLobby, ...currentLobbies]);
      joinLobbySession(createdLobby.id);
      navigate(`/lobby/${createdLobby.id}`);
      setShowCreate(false);
    } catch (error) {
      console.error("Ошибка при создании лобби:", error);
      toast.error(error.response?.data?.message || "Не удалось создать лобби");
    }
  };

    // 🆕 ОБРАБОТЧИК СМЕНЫ РЕЖИМА (для Dota 2 обновляем dotaGameMode)
  const handleModeChange = (e) => {
    const selectedValue = e.target.value;
    
    if (createForm.game === "Dota 2") {
      const selectedMode = DOTA2_MODES.find(m => m.value === selectedValue);
      if (selectedMode) {
        setCreateForm(prev => ({
          ...prev,
          mode: selectedValue,
          dotaGameMode: selectedMode.gameMode,
        }));
      }
    } else {
      setCreateForm(prev => ({
        ...prev,
        mode: selectedValue,
      }));
    }
  };

    // 🆕 ОБРАБОТЧИК СМЕНЫ РЕГИОНА (для Dota 2 обновляем dotaRegion)
  const handleRegionChange = (e) => {
    const selectedValue = e.target.value;
    
    if (createForm.game === "Dota 2") {
      const selectedRegion = DOTA2_REGIONS.find(r => r.value === selectedValue);
      if (selectedRegion) {
        setCreateForm(prev => ({
          ...prev,
          region: selectedValue,
          dotaRegion: selectedRegion.region, // 🆕 Сохраняем числовой ID
        }));
      }
    } else {
      setCreateForm(prev => ({
        ...prev,
        region: selectedValue,
      }));
    }
  };

  const filteredLobbies = useMemo(() => {
    return lobbies.filter(lobby => {
      const { game, mode, region, search, price } = filters;
      if (game !== "All games" && lobby.game !== game) return false;
      if (mode !== "All modes" && lobby.mode !== mode) return false;
      if (region !== "All regions" && lobby.region !== region) return false;
      if (search && !lobby.title.toLowerCase().includes(search.toLowerCase())) return false;
      
      // Price filter logic
      const priceOption = PRICE_OPTIONS.find(p => p.value === price);
      if (priceOption && priceOption.min !== undefined) {
          if (lobby.entryFee < priceOption.min || lobby.entryFee >= priceOption.max) {
              return false;
          }
      }
      return true;
    });
  }, [lobbies, filters]);

  if (isLoading) {
    return <div className="p-8 text-center font-semibold text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6"> {/* Фон уже темный из index.css */}
      
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-dark-surface w-full max-w-xl p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white">Create lobby</h2>
            <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 gap-4">
              <label className="flex flex-col text-gray-300">Name
                <input value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} placeholder="Введите название" className="mt-1 px-3 py-2 bg-dark-bg border border-gray-600 rounded-md text-gray-200 focus:ring-brand-blue focus:border-brand-blue"/>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col text-gray-300">Game<select value={createForm.game} onChange={(e) => setCreateForm((p) => ({ ...p, game: e.target.value }))} className="mt-1 px-3 py-2 bg-dark-bg border border-gray-600 rounded-md text-gray-200">{GAMES.filter(g => g !== 'All games').map(g => (<option key={g} value={g}>{g}</option>))}</select></label>
                <label className="flex flex-col text-gray-300">
                  Mode
                  <select 
                    value={createForm.mode} 
                    onChange={handleModeChange}
                    className="mt-1 px-3 py-2 bg-dark-bg border border-gray-600 rounded-md text-gray-200"
                  >
                    {availableModes.map(m => (
                      <option key={m.value || m} value={m.value || m}>
                        {m.label || m}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col text-gray-300">
                  Region
                  <select 
                    value={createForm.region} 
                    onChange={handleRegionChange}
                    className="mt-1 px-3 py-2 bg-dark-bg border border-gray-600 rounded-md text-gray-200"
                  >
                    {availableRegions.map(r => (
                      <option key={r.value || r} value={r.value || r}>
                        {r.label || r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-gray-300">Enrty (USD)<input type="number" step="0.01" value={createForm.entryFee} onChange={(e) => setCreateForm((p) => ({ ...p, entryFee: e.target.value }))} className="mt-1 px-3 py-2 bg-dark-bg border border-gray-600 rounded-md text-gray-200"/></label>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-md font-semibold mb-2 text-white">Lobby Type</h3>
                <div className="flex items-center gap-6 mb-3 text-gray-300">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lobbyType" value="public" checked={createForm.lobbyType === 'public'} onChange={(e) => setCreateForm(p => ({...p, lobbyType: e.target.value}))}/>Public</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lobbyType" value="private" checked={createForm.lobbyType === 'private'} onChange={(e) => setCreateForm(p => ({...p, lobbyType: e.target.value}))}/>Private</label>
                </div>
                {createForm.lobbyType === 'private' && (<label className="flex flex-col text-gray-300">Password<input type="password" value={createForm.password} onChange={(e) => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="Введите пароль" className="mt-1 px-3 py-2 bg-dark-bg border border-gray-600 rounded-md text-gray-200"/></label>)}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 border-t border-gray-700 pt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-blue hover:bg-blue-400 text-white rounded-md">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="max-w-7xl mx-auto bg-dark-surface p-4 rounded-lg shadow-lg border border-gray-700 mb-6">
        {/* 👇 Основной flex-контейнер 👇 */}
        <div className="flex items-center gap-4">
          
          {/* --- Элемент №1: Кнопка "Создать лобби" --- */}
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-brand-blue hover:bg-blue-400 text-white font-semibold rounded-md shadow-sm transition-colors flex-shrink-0"
          >
            Create lobby
          </button>

          {/* --- Элемент №2: Поиск (с flex-grow) --- */}
          {/* `flex-grow` заставляет этот блок занять всё доступное пространство */}
          <div className="relative flex-grow">
            <input 
              name="search"
              value={filters.search} 
              onChange={handleFilterChange} 
              placeholder="Enter lobby name..." 
              className="w-full rounded-md border border-gray-600 bg-dark-bg px-4 py-2 pr-10 text-gray-200"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          {/* --- Элемент №3: Группа фильтров --- */}
          <div className="flex gap-3 flex-wrap items-center">
            {/* Фильтр по Игре */}
            <div className="relative">
              <select 
                name="game" 
                value={filters.game} 
                onChange={handleFilterChange}
                className="pl-3 pr-8 py-2 bg-dark-bg border border-gray-600 rounded-md text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {GAMES.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {/* Фильтр по Режиму */}
            <div className="relative">
              <select 
                name="mode" 
                value={filters.mode} 
                onChange={handleFilterChange}
                className="pl-3 pr-8 py-2 bg-dark-bg border border-gray-600 rounded-md text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {GENERIC_MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            
            {/* Фильтр по Региону */}
            <div className="relative">
              <select 
                name="region" 
                value={filters.region} 
                onChange={handleFilterChange}
                className="pl-3 pr-8 py-2 bg-dark-bg border border-gray-600 rounded-md text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {/* Фильтр по Цене */}
            <div className="relative">
              <select 
                name="price" 
                value={filters.price} 
                onChange={handleFilterChange}
                className="pl-3 pr-8 py-2 bg-dark-bg border border-gray-600 rounded-md text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {PRICE_OPTIONS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            <button onClick={clearFilters} className="px-4 py-2 border border-brand-blue hover:bg-gray-700 rounded-md text-sm text-gray-300">
              Reset
            </button>
          </div>
          
          {/* --- Элемент №4: Кнопка "Сбросить всё" (прижата вправо) --- */}
          {/* <div className="ml-auto">
            <button onClick={handleResetLobbies} className="px-4 py-2 border border-brand-red/50 text-brand-red rounded-md text-sm hover:bg-brand-red/10">
                Сбросить всё (Dev)
            </button>
          </div> */}
        </div>
      </section>

      <main className="max-w-7xl mx-auto">
        <div className="bg-dark-surface p-4 rounded-lg shadow-lg border border-gray-700">
          
          {/* --- 👇 ЗАГОЛОВОК ТАБЛИЦЫ С НОВЫМИ КЛАССАМИ 👇 --- */}
          <div 
            className="grid gap-4 items-center p-2 text-sm font-semibold text-white border-b border-gray-700"
            style={{ gridTemplateColumns: 'minmax(0, 1fr) repeat(5, minmax(0, 1fr)) minmax(0, 1fr) minmax(0, 0.5fr)' }}
          >
            {/* Ширину col-span-* убираем, она теперь задана в style */}
            <div>Name</div>
            <div className="text-center">Game</div>
            <div className="text-center">Mode</div>
            <div className="text-center">Region</div>
            <div className="text-center">Players</div>
            <div className="text-center">Spectators</div>
            <div className="text-center">Entry</div>
            <div className="text-center">Type</div>
          </div>

          {filteredLobbies.map((l) => (
            <div key={l.id} className="cursor-pointer" onClick={() => handleJoinAction(l.id, true)}>
              {/* --- 👇 СТРОКА ЛОББИ С НОВЫМИ КЛАССАМИ 👇 --- */}
              <div 
                className="grid gap-4 items-center py-4 px-2 border-b border-gray-800 hover:bg-gray-700/50 transition-colors"
                style={{ gridTemplateColumns: 'minmax(0, 1fr) repeat(5, minmax(0, 1fr)) minmax(0, 1fr) minmax(0, 0.5fr)' }}
              >
                {/* Ширину col-span-* убираем */}
                <div><span className="font-semibold text-gray-100">{l.title}</span></div>
                <div className="text-gray-300 text-center">{l.game}</div>
                <div className="text-gray-300 text-center">{l.mode}</div>
                <div className="text-gray-300 text-center">{l.region}</div>
                <div className="text-gray-300 text-center">{l.players}/{l.maxPlayers}</div>
                <div className="text-gray-300 text-center">{(l.spectators || []).length}</div>
                <div className="flex justify-center">
                  <button onClick={(e) => { e.stopPropagation(); handleJoinAction(l.id, false); }} className="px-3 py-2 bg-brand-green hover:bg-green-400 text-white rounded-md text-sm z-10 relative transition-colors">
                    ${l.entryFee}
                  </button>
                </div>
                <div className="flex justify-center items-center text-xl">
                  {l.type === 'private' ? (<span title="Приватное лобби">🔒</span>) : (<span title="Публичное лобби">🌐</span>)}
                </div>
              </div>
            </div> 
          ))}
        </div>
      </main>
    </div>
  );
}