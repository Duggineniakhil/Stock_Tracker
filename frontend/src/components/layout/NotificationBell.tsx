
import { useEffect, useRef, useState } from 'react';
import { fetchAlerts, fetchUnreadAlertCount, markAlertAsRead, markAllAlertsAsRead } from '../../services/api';
import './NotificationBell.css';

interface AlertItem {
    id: number;
    priority: string;
    is_read: boolean;
    timestamp: string;
    symbol: string;
    message: string;
}

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const loadNotifications = async () => {
        try {
            const [alertsRes, countRes] = await Promise.all([
                fetchAlerts({ limit: 5 }),
                fetchUnreadAlertCount()
            ]);

            setAlerts(alertsRes?.data?.alerts || []);
            setUnreadCount(countRes?.data?.count || 0);
        } catch (err) {
            console.error('Failed to load notifications', err);
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: number) => {
        try {
            await markAlertAsRead(id);
            loadNotifications();
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAlertsAsRead();
            loadNotifications();
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    return (
        <div className="notif-wrapper" ref={dropdownRef}>
            <button className="notif-bell" onClick={() => setIsOpen(!isOpen)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notif-dropdown reveal">
                    <div className="notif-header">
                        <span className="syne">Notifications</span>
                        {unreadCount > 0 && (
                            <button className="mark-all" onClick={handleMarkAllRead}>Mark all read</button>
                        )}
                    </div>
                    <div className="notif-list">
                        {alerts.length > 0 ? (
                            alerts.map((alert) => (
                                <div 
                                    key={alert.id} 
                                    className={`notif-item ${!alert.is_read ? 'unread' : ''}`}
                                    onClick={() => handleMarkAsRead(alert.id)}
                                >
                                    <div className="notif-meta">
                                        <span className={`notif-priority ${alert.priority.toLowerCase()}`}>{alert.priority}</span>
                                        <span className="notif-time">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="notif-symbol">{alert.symbol}</div>
                                    <div className="notif-msg">{alert.message}</div>
                                </div>
                            ))
                        ) : (
                            <div className="notif-empty">No recent alerts</div>
                        )}
                    </div>
                    <div className="notif-footer">
                        <button className="view-all" onClick={() => { window.location.href = '/alerts'; setIsOpen(false); }}>
                            View all history
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
