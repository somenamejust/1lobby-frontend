// 🆕 НОВЫЙ КОМПОНЕНТ: src/components/MatchResultsModal.jsx

import React, { useEffect, useState } from 'react';

export default function MatchResultsModal({ lobby, onClose }) {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onClose();
    }
  }, [countdown, onClose]);

  if (!lobby || lobby.status !== 'finished') return null;

  const winningTeam = lobby.winner; // 'A' или 'B'

    // 🆕 Умное определение названия команды
  let winningTeamName = winningTeam;
  if (lobby.game === 'Dota 2') {
    winningTeamName = winningTeam; // Уже 'Radiant' или 'Dire'
  } else {
    winningTeamName = winningTeam === 'A' ? 'Team A' : 'Team B';
  }

  console.log('🎉 [MatchResultsModal] Открыто модальное окно');
  console.log('   Игра:', lobby.game);
  console.log('   Победитель:', lobby.winner);
  console.log('   Слоты:', lobby.slots.map(s => ({ team: s.team, user: s.user?.username })));

  const winners = lobby.slots.filter(s => s.user && s.team === lobby.winner).map(s => s.user);
  const losers = lobby.slots.filter(s => s.user && s.team !== lobby.winner).map(s => s.user);

  console.log('   Победители:', winners.map(w => w.username));
  console.log('   Проигравшие:', losers.map(l => l.username));

  const totalPrizePool = lobby.entryFee * losers.length;
  const prizePerWinner = winners.length > 0 ? totalPrizePool / winners.length : 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-dark-surface rounded-lg shadow-xl p-8 max-w-2xl w-full border border-gray-700">
        
        {/* Заголовок */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-white mb-2">🏆 Match Finished!</h2>
          <p className="text-xl text-gray-300">
            <span className={
              lobby.game === 'Dota 2' 
                ? (winningTeam === 'Radiant' ? 'text-green-400' : 'text-red-400')
                : (winningTeam === 'A' ? 'text-blue-400' : 'text-red-400')
            }>
              {winningTeamName}
            </span> won!
          </p>
        </div>

        {/* Информация о матче */}
        <div className="bg-dark-bg rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Match ID</p>
              <p className="text-white font-semibold">{lobby.matchId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Duration</p>
              <p className="text-white font-semibold">
                {lobby.duration ? Math.floor(lobby.duration / 60) : 0}m {lobby.duration ? lobby.duration % 60 : 0}s
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Prize Pool</p>
              <p className="text-brand-green font-bold text-xl">${totalPrizePool.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Per Winner</p>
              <p className="text-brand-green font-bold text-xl">${prizePerWinner.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Команды */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Победители */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-brand-green font-semibold mb-2 text-center">
              ✅ Winners (+${prizePerWinner.toFixed(2)})
            </h3>
            <div className="space-y-2">
              {winners.map(user => (
                <div key={user.id} className="flex items-center gap-2 bg-dark-bg p-2 rounded">
                  <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  <span className="text-white text-sm">{user.username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Проигравшие */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-brand-red font-semibold mb-2 text-center">
              ❌ Losers (-${lobby.entryFee})
            </h3>
            <div className="space-y-2">
              {losers.map(user => (
                <div key={user.id} className="flex items-center gap-2 bg-dark-bg p-2 rounded">
                  <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  <span className="text-white text-sm">{user.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Кнопка закрытия с таймером */}
        <div className="text-center">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-brand-blue hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
          >
            Return to Lobbies ({countdown}s)
          </button>
        </div>
      </div>
    </div>
  );
}