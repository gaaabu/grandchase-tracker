"use client";

import { useState, useEffect } from 'react';

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

export default function SummaryPage() {
  const [characters, setCharacters] = useState([]);
  const [clears, setClears] = useState([]);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  
  const [sortOption, setSortOption] = useState("default");
  const [filterOption, setFilterOption] = useState("all");

  const [advFilterStatus, setAdvFilterStatus] = useState("none");
  const [advFilterDungeons, setAdvFilterDungeons] = useState([]);

  const [displayDate, setDisplayDate] = useState("");

  useEffect(() => {
    const currentDate = new Date();
    setDisplayDate(currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    fetchClears();
  }, []);

  const fetchCharacters = async () => {
    const res = await fetch('/api/characters');
    if (res.ok) {
      setCharacters(await res.json());
    }
  };

  const fetchClears = async () => {
    const res = await fetch('/api/dailies', { cache: 'no-store' });
    if (res.ok) {
      setClears(await res.json());
    }
  };

  const toggleDropdown = (charId) => {
    setOpenDropdowns(prev => ({ ...prev, [charId]: !prev[charId] }));
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

    if (advFilterStatus !== "none" && advFilterDungeons.length > 0) {
      if (advFilterStatus === "done") {
        // Must have cleared ALL selected dungeons
        const hasAll = advFilterDungeons.every(d => validClearedIds.includes(d));
        if (!hasAll) return false;
      } else if (advFilterStatus === "not_done") {
        // Must be missing AT LEAST ONE of the selected dungeons
        const missingAtLeastOne = advFilterDungeons.some(d => !validClearedIds.includes(d));
        if (!missingAtLeastOne) return false;
      }
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
      <header className="header">
        <h1 className="title">GrandChase Tracker</h1>
        <div className="date-display">{displayDate}</div>
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

        <select value={advFilterStatus} onChange={e => setAdvFilterStatus(e.target.value)}>
          <option value="none">Advanced Filter: Off</option>
          <option value="done">Status: Is Done</option>
          <option value="not_done">Status: Is Not Done</option>
        </select>

        {(sortOption !== 'default' || filterOption !== 'all' || searchQuery !== '' || advFilterStatus !== 'none') && (
          <button 
            onClick={() => { 
              setSortOption('default'); 
              setFilterOption('all'); 
              setSearchQuery(''); 
              setAdvFilterStatus('none');
              setAdvFilterDungeons([]);
            }}
            style={{ background: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.5)', color: 'var(--status-danger)' }}
          >
            Clear Filters
          </button>
        )}

        {advFilterStatus !== "none" && (
          <div className="adv-dungeon-pills">
            {DUNGEONS.map(d => (
              <button 
                key={d.id} 
                className={`pill-btn ${advFilterDungeons.includes(d.id) ? 'active' : ''}`}
                onClick={() => {
                  if (advFilterDungeons.includes(d.id)) {
                    setAdvFilterDungeons(prev => prev.filter(id => id !== d.id));
                  } else {
                    setAdvFilterDungeons(prev => [...prev, d.id]);
                  }
                }}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="characters-grid">
        {sortedCharacters.map((char, i) => {
          const availableDungeons = DUNGEONS.filter(d => char.level >= d.reqLevel && char.ta >= d.reqTa);
          const totalAvailable = availableDungeons.length;
          
          const clearedIds = clears.filter(c => c.character_id === char.id).map(c => c.dungeon_name);
          const validClearedIds = clearedIds.filter(id => availableDungeons.some(d => d.id === id));
          const totalCleared = validClearedIds.length;
          
          const missingDungeons = availableDungeons.filter(d => !validClearedIds.includes(d.id));
          
          const progressPercent = totalAvailable === 0 ? 100 : (totalCleared / totalAvailable) * 100;
          const isComplete = totalAvailable > 0 && totalCleared === totalAvailable;

          return (
            <div key={char.id} className="character-card" style={{ animationDelay: `${(i % 20) * 0.05}s`, position: 'relative', zIndex: openDropdowns[char.id] ? 100 : 1 }}>
              <div className="char-portrait-container" style={{borderColor: isComplete ? 'var(--success)' : 'var(--glass-border)'}}>
                <img 
                  src={`/images/characters/${char.name.toLowerCase().replace(/\\s+/g, '_')}.webp`} 
                  alt={char.name}
                  className="char-portrait"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="char-placeholder" style={{display: 'none'}}>Portrait</div>
              </div>

              <div className="card-header" style={{borderBottom: 'none', paddingBottom: 0, marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem'}}>
                <span className="char-name">{char.name}</span>
                <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                  <span className="badge">Lv. {char.level}</span>
                  <span className="badge">TA: {char.ta.toLocaleString()}</span>
                  {char.awakened && <span className="badge badge-accent">Awakened</span>}
                </div>
              </div>

              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, background: isComplete ? 'var(--success)' : 'var(--accent-gradient)' }}></div>
              </div>
              
              <div className="progress-text" style={{color: isComplete ? 'var(--success)' : 'var(--text-secondary)'}}>
                {totalAvailable === 0 ? 'No Dungeons Available' : `${totalCleared} / ${totalAvailable} Done`}
              </div>

              {missingDungeons.length > 0 && (
                <div className="missing-dungeons-wrapper">
                  <div className="missing-dungeons-dropdown" style={{marginTop: 0, borderBottomLeftRadius: openDropdowns[char.id] ? 0 : '8px', borderBottomRightRadius: openDropdowns[char.id] ? 0 : '8px'}}>
                    <div className="dropdown-header" onClick={() => toggleDropdown(char.id)}>
                      <span>Missing Dungeons ({missingDungeons.length})</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{transform: openDropdowns[char.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                  {openDropdowns[char.id] && (
                    <div className="dropdown-content-absolute">
                      {missingDungeons.map(md => (
                        <div key={md.id} className="missing-item">{md.name}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
