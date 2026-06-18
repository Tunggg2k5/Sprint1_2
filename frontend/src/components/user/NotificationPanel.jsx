import { X } from "lucide-react";

export default function NotificationPanel({ notifications, onClose, onMarkRead, popoverRef, userInitial }) {
  return (
    <div className="notification-popover" ref={popoverRef}>
      <div className="notification-popover-head">
        <div>
          <p className="eyebrow">Hoạt động mới</p>
          <strong>Thông báo hệ thống</strong>
        </div>
        <button className="icon-button" onClick={onClose} title="Đóng" type="button">
          <X size={18} />
        </button>
      </div>
      <div className="notification-popover-list">
        {notifications.length ? (
          notifications.map((item) => (
            <button
              className={`notification-card ${item.isRead ? "read" : ""}`}
              key={item._id}
              onClick={() => onMarkRead(item)}
              type="button"
            >
              <span className="notification-avatar">{userInitial}</span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.message}</small>
                <em>{new Date(item.createdAt).toLocaleString("vi-VN")}</em>
              </span>
            </button>
          ))
        ) : (
          <div className="notification-empty">Chưa có thông báo mới.</div>
        )}
      </div>
    </div>
  );
}
