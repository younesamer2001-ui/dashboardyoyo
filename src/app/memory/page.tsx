'use client';

import { useState, useEffect } from 'react';

interface Fact {
    id: string;
    entity: string;
    predicate: string;
    object: string;
    source: string;
    confidence: number;
    extractedAt: string;
}

interface Entity {
    id: string;
    type: string;
    name: string;
    description: string;
    mentionCount: number;
    lastMentioned: string;
}

interface Preference {
    id: string;
    category: string;
    key: string;
    value: string;
    confidence: number;
    learnedAt: string;
}

export default function MemoryPage() {
    const [facts, setFacts] = useState<Fact[]>([]);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'facts' | 'entities' | 'preferences'>('facts');
    const [loading, setLoading] = useState(true);

    // Add fact form
    const [showAddFact, setShowAddFact] = useState(false);
    const [newFact, setNewFact] = useState({ entity: '', predicate: '', object: '' });

    const fetchMemory = async () => {
        try {
            const url = search ? `/api/memory?q=${encodeURIComponent(search)}` : '/api/memory';
            const res = await fetch(url);
            const data = await res.json();
            setFacts(data.facts || []);
            setEntities(data.entities || []);
            setPreferences(data.preferences || []);
        } catch (err) {
            console.error('Failed to fetch memory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemory();
        const interval = setInterval(fetchMemory, 10000);
        return () => clearInterval(interval);
    }, [search]);

    const addFact = async () => {
        if (!newFact.entity || !newFact.predicate || !newFact.object) return;
        try {
            await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'fact',
                    data: { ...newFact, source: 'user_input', confidence: 0.9 }
                }),
            });
            setNewFact({ entity: '', predicate: '', object: '' });
            setShowAddFact(false);
            fetchMemory();
        } catch (err) {
            console.error('Failed to add fact:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'unknown';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch { return dateStr; }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>
                        ð§  Memory
                    </h1>
                    <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>
                        {facts.length} facts Â· {entities.length} entities Â· {preferences.length} preferences
                    </p>
                </div>
                <button
                    onClick={() => setShowAddFact(!showAddFact)}
                    style={{
                        padding: '8px 16px', background: '#6366f1', color: '#fff',
                        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
                    }}
                >
                    + Add Fact
                </button>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search memory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    width: '100%', padding: '12px 16px', background: '#1e1e2e',
                    border: '1px solid #333', borderRadius: '10px', color: '#fff',
                    fontSize: '15px', marginBottom: '16px', outline: 'none',
                    boxSizing: 'border-box'
                }}
            />

            {/* Add Fact Form */}
            {showAddFact && (
                <div style={{
                    background: '#1e1e2e', border: '1px solid #333', borderRadius: '12px',
                    padding: '16px', marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap'
                }}>
                    <input
                        placeholder="Entity (e.g. Younes)"
                        value={newFact.entity}
                        onChange={(e) => setNewFact({ ...newFact, entity: e.target.value })}
                        style={{
                            flex: 1, minWidth: '120px', padding: '8px 12px', background: '#12121a',
                            border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '14px'
                        }}
                    />
                    <input
                        placeholder="Predicate (e.g. likes)"
                        value={newFact.predicate}
                        onChange={(e) => setNewFact({ ...newFact, predicate: e.target.value })}
                        style={{
                            flex: 1, minWidth: '120px', padding: '8px 12px', background: '#12121a',
                            border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '14px'
                        }}
                    />
                    <input
                        placeholder="Object (e.g. dark mode)"
                        value={newFact.object}
                        onChange={(e) => setNewFact({ ...newFact, object: e.target.value })}
                        style={{
                            flex: 1, minWidth: '120px', padding: '8px 12px', background: '#12121a',
                            border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '14px'
                        }}
                    />
                    <button
                        onClick={addFact}
                        style={{
                            padding: '8px 16px', background: '#22c55e', color: '#fff',
                            border: 'none', borderRadius: '6px', cursor: 'pointer'
                        }}
                    >
                        Save
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {(['facts', 'entities', 'preferences'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            padding: '8px 20px',
                            background: tab === t ? '#6366f1' : '#1e1e2e',
                            color: tab === t ? '#fff' : '#888',
                            border: '1px solid ' + (tab === t ? '#6366f1' : '#333'),
                            borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                            textTransform: 'capitalize'
                        }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Loading memory...</div>
            ) : (
                <div>
                    {tab === 'facts' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {facts.length === 0 ? (
                                <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No facts stored yet. Chat with Kimi to auto-extract knowledge!
                                </div>
                            ) : facts.map((f) => (
                                <div key={f.id} style={{
                                    background: '#1e1e2e', border: '1px solid #333', borderRadius: '10px',
                                    padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <span style={{ color: '#818cf8', fontWeight: 600 }}>{f.entity}</span>
                                        <span style={{ color: '#666', margin: '0 8px' }}>{f.predicate}</span>
                                        <span style={{ color: '#e2e8f0' }}>{f.object}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                                        <div style={{
                                            width: '50px', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${(f.confidence || 0) * 100}%`, height: '100%',
                                                background: f.confidence > 0.7 ? '#22c55e' : '#eab308', borderRadius: '3px'
                                            }} />
                                        </div>
                                        <span style={{ color: '#666', fontSize: '12px' }}>{f.source}</span>
                                        <span style={{ color: '#555', fontSize: '12px' }}>{formatDate(f.extractedAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'entities' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                            {entities.length === 0 ? (
                                <div style={{ color: '#666', textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>
                                    No entities tracked yet.
                                </div>
                            ) : entities.map((e) => (
                                <div key={e.id} style={{
                                    background: '#1e1e2e', border: '1px solid #333', borderRadius: '12px',
                                    padding: '16px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>{e.name}</span>
                                        <span style={{
                                            padding: '2px 8px', background: '#6366f120', color: '#818cf8',
                                            borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase'
                                        }}>{e.type}</span>
                                    </div>
                                    <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px 0' }}>
                                        {e.description || 'No description'}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: '12px' }}>
                                        <span>Mentions: {e.mentionCount}</span>
                                        <span>{formatDate(e.lastMentioned)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'preferences' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {preferences.length === 0 ? (
                                <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No preferences learned yet. Kimi learns from your conversations!
                                </div>
                            ) : preferences.map((p) => (
                                <div key={p.id} style={{
                                    background: '#1e1e2e', border: '1px solid #333', borderRadius: '10px',
                                    padding: '14px 18px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div>
                                            <span style={{
                                                padding: '2px 8px', background: '#22c55e20', color: '#22c55e',
                                                borderRadius: '4px', fontSize: '11px', marginRight: '8px'
                                            }}>{p.category}</span>
                                            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{p.key}</span>
                                        </div>
                                        <span style={{ color: '#888', fontSize: '13px' }}>{formatDate(p.learnedAt)}</span>
                                    </div>
                                    <div style={{ color: '#a5b4fc', fontSize: '14px', marginBottom: '6px' }}>{p.value}</div>
                                    <div style={{
                                        width: '100%', height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(p.confidence || 0) * 100}%`, height: '100%',
                                            background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: '2px'
                                        }} />
                                    </div>
                                    <span style={{ color: '#555', fontSize: '11px' }}>
                                        Confidence: {((p.confidence || 0) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
