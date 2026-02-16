'use client';

import { useState, useEffect } from 'react';

interface Monitor {
    id: string;
    type: string;
    name: string;
    config: any;
    enabled: boolean;
    createdAt: string;
}

interface Alert {
    id: string;
    monitorId: string;
    type: string;
    title: string;
    description: string;
    read: boolean;
    createdAt: string;
}

export default function ScoutPage() {
    const [monitors, setMonitors] = useState<Monitor[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMonitor, setNewMonitor] = useState({ type: 'github', name: '', repo: '', url: '' });

    const fetchScouts = async () => {
        try {
            const res = await fetch('/api/scouts');
            const data = await res.json();
            setMonitors(data.monitors || []);
            setAlerts(data.alerts || []);
        } catch (err) {
            console.error('Failed to fetch scouts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScouts();
        const interval = setInterval(fetchScouts, 15000);
        return () => clearInterval(interval);
    }, []);

    const addMonitor = async () => {
        if (!newMonitor.name) return;
        const config: any = { checkInterval: 3600 };
        if (newMonitor.type === 'github') {
            if (!newMonitor.repo) return;
            config.repo = newMonitor.repo;
        } else {
            if (!newMonitor.url) return;
            config.url = newMonitor.url;
        }

        try {
            await fetch('/api/scouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: newMonitor.type, name: newMonitor.name, config }),
            });
            setNewMonitor({ type: 'github', name: '', repo: '', url: '' });
            setShowAddForm(false);
            fetchScouts();
        } catch (err) {
            console.error('Failed to add monitor:', err);
        }
    };

    const toggleMonitor = async (id: string, enabled: boolean) => {
        try {
            await fetch('/api/scouts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, enabled }),
            });
            fetchScouts();
        } catch (err) {
            console.error('Failed to toggle monitor:', err);
        }
    };

    const deleteMonitor = async (id: string) => {
        try {
            await fetch('/api/scouts', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            fetchScouts();
        } catch (err) {
            console.error('Failed to delete monitor:', err);
        }
    };

    const triggerCron = async () => {
        try {
            const res = await fetch('/api/cron/scout');
            const data = await res.json();
            alert(`Checked ${data.checked} monitors, ${data.alerts} new alerts`);
            fetchScouts();
        } catch (err) {
            console.error('Failed to trigger cron:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'never';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch { return dateStr; }
    };

    const unreadCount = alerts.filter(a => !a.read).length;

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>
                        ð­ Scout
                    </h1>
                    <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>
                        {monitors.length} monitors Â· {unreadCount} unread alerts
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={triggerCron}
                        style={{
                            padding: '8px 16px', background: '#1e1e2e', color: '#888',
                            border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
                        }}
                    >
                        Run Now
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        style={{
                            padding: '8px 16px', background: '#6366f1', color: '#fff',
                            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
                        }}
                    >
                        + Add Monitor
                    </button>
                </div>
            </div>

            {/* Add Monitor Form */}
            {showAddForm && (
                <div style={{
                    background: '#1e1e2e', border: '1px solid #333', borderRadius: '12px',
                    padding: '16px', marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <select
                            value={newMonitor.type}
                            onChange={(e) => setNewMonitor({ ...newMonitor, type: e.target.value })}
                            style={{
                                padding: '8px 12px', background: '#12121a', border: '1px solid #444',
                                borderRadius: '6px', color: '#fff', fontSize: '14px'
                            }}
                        >
                            <option value="github">GitHub Repo</option>
                            <option value="web">Web Page</option>
                        </select>
                        <input
                            placeholder="Monitor name"
                            value={newMonitor.name}
                            onChange={(e) => setNewMonitor({ ...newMonitor, name: e.target.value })}
                            style={{
                                flex: 1, padding: '8px 12px', background: '#12121a',
                                border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '14px'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {newMonitor.type === 'github' ? (
                            <input
                                placeholder="owner/repo (e.g. vercel/next.js)"
                                value={newMonitor.repo}
                                onChange={(e) => setNewMonitor({ ...newMonitor, repo: e.target.value })}
                                style={{
                                    flex: 1, padding: '8px 12px', background: '#12121a',
                                    border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '14px'
                                }}
                            />
                        ) : (
                            <input
                                placeholder="https://example.com/page"
                                value={newMonitor.url}
                                onChange={(e) => setNewMonitor({ ...newMonitor, url: e.target.value })}
                                style={{
                                    flex: 1, padding: '8px 12px', background: '#12121a',
                                    border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '14px'
                                }}
                            />
                        )}
                        <button
                            onClick={addMonitor}
                            style={{
                                padding: '8px 16px', background: '#22c55e', color: '#fff',
                                border: 'none', borderRadius: '6px', cursor: 'pointer'
                            }}
                        >
                            Create
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Loading scouts...</div>
            ) : (
                <div>
                    {/* Monitors */}
                    <h2 style={{ color: '#ccc', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                        Monitors
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                        {monitors.length === 0 ? (
                            <div style={{ color: '#666', textAlign: 'center', padding: '40px', background: '#1e1e2e', borderRadius: '12px' }}>
                                No monitors set up yet. Add one above or tell Kimi to monitor something!
                            </div>
                        ) : monitors.map((m) => (
                            <div key={m.id} style={{
                                background: '#1e1e2e', border: '1px solid #333', borderRadius: '10px',
                                padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        background: m.enabled ? '#22c55e' : '#666'
                                    }} />
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 500 }}>{m.name}</div>
                                        <div style={{ color: '#666', fontSize: '12px' }}>
                                            {m.type === 'github' ? m.config.repo : m.config.url}
                                            {' Â· '}Last check: {formatDate(m.config.lastCheck)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                                        background: m.type === 'github' ? '#6366f120' : '#eab30820',
                                        color: m.type === 'github' ? '#818cf8' : '#eab308',
                                        textTransform: 'uppercase'
                                    }}>{m.type}</span>
                                    <button
                                        onClick={() => toggleMonitor(m.id, !m.enabled)}
                                        style={{
                                            padding: '4px 12px', fontSize: '12px', cursor: 'pointer',
                                            background: m.enabled ? '#1e1e2e' : '#22c55e20',
                                            color: m.enabled ? '#888' : '#22c55e',
                                            border: '1px solid ' + (m.enabled ? '#333' : '#22c55e40'),
                                            borderRadius: '6px'
                                        }}
                                    >
                                        {m.enabled ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                        onClick={() => deleteMonitor(m.id)}
                                        style={{
                                            padding: '4px 12px', fontSize: '12px', cursor: 'pointer',
                                            background: '#ef444420', color: '#ef4444',
                                            border: '1px solid #ef444440', borderRadius: '6px'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Alerts */}
                    <h2 style={{ color: '#ccc', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                        Recent Alerts {unreadCount > 0 && (
                            <span style={{
                                padding: '2px 8px', background: '#ef444420', color: '#ef4444',
                                borderRadius: '10px', fontSize: '13px', marginLeft: '8px'
                            }}>{unreadCount} new</span>
                        )}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {alerts.length === 0 ? (
                            <div style={{ color: '#666', textAlign: 'center', padding: '40px', background: '#1e1e2e', borderRadius: '12px' }}>
                                No alerts yet. Scouts will notify you when changes are detected.
                            </div>
                        ) : alerts.slice().reverse().slice(0, 20).map((a) => (
                            <div key={a.id} style={{
                                background: a.read ? '#1e1e2e' : '#1e1e3e',
                                border: '1px solid ' + (a.read ? '#333' : '#6366f140'),
                                borderRadius: '10px', padding: '14px 18px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ color: '#fff', fontWeight: 500 }}>
                                        {!a.read && <span style={{ color: '#6366f1', marginRight: '6px' }}>â</span>}
                                        {a.title}
                                    </span>
                                    <span style={{ color: '#555', fontSize: '12px' }}>{formatDate(a.createdAt)}</span>
                                </div>
                                <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{a.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
