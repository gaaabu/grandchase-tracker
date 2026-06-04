"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const DUNGEONS = [
  { id: 'crucible', name: 'Crucible', reqLevel: 30, reqTa: 0 },
  { id: 'sod', name: 'Sanctum of Destruction', reqLevel: 40, reqTa: 0 },
  { id: 'wl', name: 'Wizards Labyrinth', reqLevel: 85, reqTa: 0 },
  { id: 'berkas', name: 'Berkas Lair', reqLevel: 85, reqTa: 60000 },
  { id: 'tod', name: 'Tower of Disappearance', reqLevel: 85, reqTa: 0 },
  { id: 'loj', name: 'Land of Judgement', reqLevel: 0, reqTa: 0 },
  { id: 'infinity', name: 'Infinity Cloister', reqLevel: 85, reqTa: 100000 },
  { id: 'abyssal', name: 'Abyssal Path', reqLevel: 85, reqTa: 0 },
  { id: 'void_invasion', name: 'Void Invasion', reqLevel: 85, reqTa: 200000 },
  { id: 'void_taint', name: 'Void Taint', reqLevel: 85, reqTa: 200000 },
  { id: 'void_nightmare', name: 'Void Nightmare', reqLevel: 85, reqTa: 200000 }
];

export default function EditPage() {
  const [characters, setCharacters] = useState([]);
  const [clears, setClears] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDungeons, setOpenDungeons] = useState({});

  const [sortOption, setSortOption] = useState("default");
  const [filterOption, setFilterOption] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragCharacters, setDragCharacters] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-CA');

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    fetchClears();
  }, [dateString]);

  const fetchCharacters = async () => {
    const res = await fetch('/api/characters');
    if (res.ok) {
      setCharacters(await res.json());
    }
  };

  const fetchClears = async () => {
    const res = await fetch(`/api/dailies?date=${dateString}`);
    if (res.ok) {
      setClears(await res.json());
    }
  };

  const updateCharacter = async (id, field, value) => {
    const updatedChars = characters.map(c => c.id === id ? { ...c, [field]: value } : c);
    setCharacters(updatedChars);

    await fetch('/api/characters', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value })
    });
  };

  const toggleClear = async (charId, dungeonId) => {
    const isCleared = clears.some(c => c.character_id === charId && c.dungeon_name === dungeonId);

    if (isCleared) {
      setClears(clears.filter(c => !(c.character_id === charId && c.dungeon_name === dungeonId)));
    } else {
      setClears([...clears, { character_id: charId, dungeon_name: dungeonId, date: dateString }]);
    }

    await fetch('/api/dailies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        character_id: charId,
        dungeon_name: dungeonId,
        date: dateString,
        cleared: !isCleared
      })
    });
  };

  const toggleDungeons = (charId) => {
    setOpenDungeons(prev => ({ ...prev, [charId]: !prev[charId] }));
  };

  const openReorderModal = () => {
    setDragCharacters([...characters].sort((a, b) => a.sort_order - b.sort_order));
    setIsModalOpen(true);
  };

  const resetReorder = () => {
    const defaultSorted = [...dragCharacters].sort((a, b) => a.id - b.id);
    setDragCharacters(defaultSorted);
  };

  const saveReorder = async () => {
    const updated = dragCharacters.map((c, idx) => ({ id: c.id, sort_order: idx + 1 }));

    // Update local state immediately
    const charMap = new Map(updated.map(u => [u.id, u.sort_order]));
    const newChars = characters.map(c => ({ ...c, sort_order: charMap.get(c.id) }));
    setCharacters(newChars);
    setIsModalOpen(false);

    // Save to API
    await fetch('/api/characters', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
  };

  const onDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnter = (e, targetId) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      setDragCharacters(prev => {
        const items = [...prev];
        const draggedIndex = items.findIndex(c => c.id === draggedId);
        const targetIndex = items.findIndex(c => c.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return prev;

        const [draggedItem] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, draggedItem);
        return items;
      });
    }
  };

  const onDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDraggedId(null);
  };

  const filteredCharacters = characters.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    if (filterOption === "lv85plus" && c.level < 85) return false;
    if (filterOption === "lv84minus" && c.level >= 85) return false;

    const available = DUNGEONS.filter(d => c.level >= d.reqLevel && c.ta >= d.reqTa);
    const clearedIds = clears.filter(clear => clear.character_id === c.id).map(x => x.dungeon_name);
    const validClearedIds = clearedIds.filter(id => available.some(d => d.id === id));

    if (filterOption === "finishedAll") {
      if (available.length === 0 || validClearedIds.length !== available.length) return false;
    }
    if (filterOption === "notFinished") {
      if (available.length > 0 && validClearedIds.length === available.length) return false;
    }

    return true;
  });

  const sortedCharacters = [...filteredCharacters].sort((a, b) => {
    if (sortOption === "levelHigh") return b.level - a.level;
    if (sortOption === "levelLow") return a.level - b.level;

    if (sortOption === "clearsMost" || sortOption === "clearsLeast") {
      const getClears = (char) => {
        const available = DUNGEONS.filter(d => char.level >= d.reqLevel && char.ta >= d.reqTa);
        const clearedIds = clears.filter(c => c.character_id === char.id).map(c => c.dungeon_name);
        return clearedIds.filter(id => available.some(d => d.id === id)).length;
      };

      if (sortOption === "clearsMost") return getClears(b) - getClears(a);
      if (sortOption === "clearsLeast") return getClears(a) - getClears(b);
    }

    return a.sort_order - b.sort_order;
  });

  return (
    <main className="container">
      <header className="header" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h1 className="title" style={{ fontSize: '2rem' }}>Edit Dailies & Stats</h1>
      </header>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search characters..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="toolbar">
        <button onClick={openReorderModal} style={{ background: 'var(--accent-primary)' }}>
          Reorder Characters
        </button>

        <select value={sortOption} onChange={e => setSortOption(e.target.value)}>
          <option value="default">Sort: Default Order</option>
          <option value="levelHigh">Sort: Level (Highest)</option>
          <option value="levelLow">Sort: Level (Lowest)</option>
          <option value="clearsMost">Sort: Clears (Most)</option>
          <option value="clearsLeast">Sort: Clears (Least)</option>
        </select>

        <select value={filterOption} onChange={e => setFilterOption(e.target.value)}>
          <option value="all">Filter: All Characters</option>
          <option value="lv85plus">Filter: Level 85 & Above</option>
          <option value="lv84minus">Filter: Level 84 & Below</option>
          <option value="finishedAll">Filter: Finished All Dailies</option>
          <option value="notFinished">Filter: Not Finished Dailies</option>
        </select>

        {(sortOption !== 'default' || filterOption !== 'all' || searchQuery !== '') && (
          <button 
            onClick={() => { setSortOption('default'); setFilterOption('all'); setSearchQuery(''); }}
            style={{ background: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.5)', color: 'var(--status-danger)' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="characters-grid">
        {sortedCharacters.map((char, i) => (
          <div key={char.id} className="character-card" style={{ animationDelay: `${(i % 20) * 0.05}s`, position: 'relative', zIndex: openDungeons[char.id] ? 100 : 1 }}>
            <div className="char-portrait-container">
              <img
                src={`/images/characters/${char.name.toLowerCase().replace(/\s+/g, '_')}.webp`}
                alt={char.name}
                className="char-portrait"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="char-placeholder" style={{ display: 'none' }}>Portrait</div>
            </div>

            <div className="card-header">
              <span className="char-name">{char.name}</span>
            </div>

            <div className="char-stats">
              <div className="stat-row">
                <span className="stat-label">Level</span>
                <input
                  type="number"
                  className="stat-input lvl-input"
                  value={char.level === 0 ? '' : char.level}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') e.preventDefault();
                  }}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      updateCharacter(char.id, 'level', 0); // Temporary state for typing
                    } else {
                      let num = parseInt(e.target.value);
                      if (!isNaN(num)) {
                        if (num > 90) num = 90;
                        updateCharacter(char.id, 'level', num);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || e.target.value === '0') {
                      updateCharacter(char.id, 'level', 1);
                    }
                  }}
                  min="1" max="90"
                />
              </div>
              <div className="stat-row">
                <span className="stat-label">Total Attack</span>
                <input
                  type="number"
                  className="stat-input ta-input"
                  value={char.ta === -1 ? '' : char.ta}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') e.preventDefault();
                  }}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      updateCharacter(char.id, 'ta', -1); // -1 acts as temporary blank
                    } else {
                      let num = parseInt(e.target.value);
                      if (!isNaN(num)) {
                        updateCharacter(char.id, 'ta', num);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || char.ta === -1) {
                      updateCharacter(char.id, 'ta', 0);
                    }
                  }}
                  min="0"
                />
              </div>
              <div className="stat-row">
                <span className="stat-label">Awakened</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={char.awakened}
                    onChange={(e) => updateCharacter(char.id, 'awakened', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="missing-dungeons-wrapper" style={{ marginTop: '1.5rem' }}>
              <div className="missing-dungeons-dropdown" style={{ marginTop: 0, borderBottomLeftRadius: openDungeons[char.id] ? 0 : '8px', borderBottomRightRadius: openDungeons[char.id] ? 0 : '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="dropdown-header" onClick={() => toggleDungeons(char.id)}>
                  <span>Dungeons Checklist</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openDungeons[char.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {openDungeons[char.id] && (
                <div className="dropdown-content-absolute">
                  <div className="dungeons-list">
                    {DUNGEONS.map(dungeon => {
                      const isAvailable = char.level >= dungeon.reqLevel && char.ta >= dungeon.reqTa;
                      if (!isAvailable) return null;

                      const isCleared = clears.some(c => c.character_id === char.id && c.dungeon_name === dungeon.id);

                      return (
                        <div
                          key={dungeon.id}
                          className={`dungeon-item ${isCleared ? 'cleared' : ''}`}
                          onClick={() => toggleClear(char.id, dungeon.id)}
                        >
                          <span className="dungeon-name">{dungeon.name}</span>
                          <div className="checkbox-wrapper">
                            <svg viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                    {DUNGEONS.every(dungeon => char.level < dungeon.reqLevel || char.ta < dungeon.reqTa) && (
                      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem' }}>
                        No dungeons available.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Reorder Characters</h2>
            <div className="drag-grid">
              {dragCharacters.map(char => (
                <motion.div
                  layout
                  key={char.id}
                  className={`drag-item ${draggedId === char.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, char.id)}
                  onDragEnter={(e) => onDragEnter(e, char.id)}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onDragEnd={() => setDraggedId(null)}
                >
                  <img
                    src={`/images/characters/${char.name.toLowerCase().replace(/\s+/g, '_')}.webp`}
                    alt={char.name}
                    className="drag-portrait"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className="drag-name">{char.name}</span>
                </motion.div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="modal-btn btn-danger" onClick={resetReorder}>Reset to Default</button>
              <button className="modal-btn btn-primary" onClick={saveReorder}>Save Order</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
