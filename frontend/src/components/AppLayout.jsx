import {
  Bell,
  CalendarDays,
  CalendarPlus,
  DoorOpen,
  FileText,
  Home,
  ReceiptText,
  Stethoscope
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Feedback from "../components/Feedback.jsx";
import { useAuth } from "../redux/AuthContext.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { firstError, validateName, validatePassword, validatePhone } from "../utils/validation.js";
import ChangeUserPassword from "./user/ChangeUserPassword.jsx";
import EditUserProfile from "./user/EditUserProfile.jsx";
import NotificationPanel from "./user/NotificationPanel.jsx";
import ProfileDropdown from "./user/ProfileDropdown.jsx";

function navForRole(role) {
  if (role !== "patient") return [];

  return [
    { id: "home", to: "/dashboard?tab=home", label: "Trang chủ", icon: Home },
    { id: "services", to: "/dashboard?tab=home#services", label: "Dịch vụ", icon: Stethoscope, section: "services" },
    { id: "booking", to: "/dashboard?tab=booking", label: "Đặt lịch", icon: CalendarPlus },
    { id: "appointments", to: "/dashboard?tab=appointments", label: "Lịch hẹn", icon: CalendarDays },
    { id: "records", to: "/dashboard?tab=records", label: "Hồ sơ điều trị", icon: FileText },
    { id: "invoices", to: "/dashboard?tab=invoices", label: "Hóa đơn", icon: ReceiptText }
  ];
}

export default function AppLayout() {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const items = navForRole(user?.role);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "", gender: "unknown", address: "", bio: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [feedback, setFeedback] = useState({ message: "", error: "" });
  const fileInputRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const notificationPopoverRef = useRef(null);
  const accountButtonRef = useRef(null);
  const accountPopoverRef = useRef(null);

  const activeTab = new URLSearchParams(location.search).get("tab") || "home";
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const userInitial = useMemo(() => user?.fullName?.trim()?.[0]?.toUpperCase() || "S", [user?.fullName]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      fullName: user.fullName || "",
      phone: user.phone || "",
      gender: user.gender || "unknown",
      address: user.address || "",
      bio: user.bio || ""
    });
    loadNotifications();
  }, [user?._id, user?.fullName, user?.phone, user?.gender, user?.address, user?.bio]);

  useEffect(() => {
    setShowNotifications(false);
    setShowAccountMenu(false);
    setProfileOpen(false);
    setPasswordOpen(false);
  }, [user?._id, location.pathname]);

  useEffect(() => {
    function closeFloatingMenus(event) {
      const target = event.target;
      if (
        showNotifications &&
        !notificationPopoverRef.current?.contains(target) &&
        !notificationButtonRef.current?.contains(target)
      ) {
        setShowNotifications(false);
      }
      if (
        showAccountMenu &&
        !accountPopoverRef.current?.contains(target) &&
        !accountButtonRef.current?.contains(target)
      ) {
        setShowAccountMenu(false);
      }
    }

    document.addEventListener("mousedown", closeFloatingMenus);
    return () => document.removeEventListener("mousedown", closeFloatingMenus);
  }, [showAccountMenu, showNotifications]);

  if (location.pathname === "/" || location.pathname === "/dat-lich-hen") {
    return <Outlet />;
  }

  async function loadNotifications() {
    try {
      const res = await api.get("/auth/notifications");
      setNotifications(res.data.notifications || []);
    } catch (_error) {
      setNotifications([]);
    }
  }

  function clearFeedback() {
    setFeedback({ message: "", error: "" });
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  function scrollPageToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProfile(event) {
    event.preventDefault();
    const validationError = firstError(validateName(profileForm.fullName), validatePhone(profileForm.phone));
    if (validationError) {
      setFeedback({ message: "", error: validationError });
      return;
    }

    try {
      const res = await api.patch("/auth/me", profileForm);
      updateUser(res.data.user);
      setProfileOpen(false);
      setShowAccountMenu(false);
      setFeedback({ message: "Đã cập nhật thông tin cá nhân.", error: "" });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    const validationError = firstError(
      passwordForm.currentPassword ? "" : "Mật khẩu hiện tại là bắt buộc.",
      validatePassword(passwordForm.newPassword)
    );
    if (validationError) {
      setFeedback({ message: "", error: validationError });
      return;
    }

    try {
      await api.patch("/auth/change-password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordOpen(false);
      setShowAccountMenu(false);
      setFeedback({ message: "Đã đổi mật khẩu.", error: "" });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const avatarUrl = await fileToCompressedAvatar(file);
      const res = await api.patch("/auth/me", { avatarUrl });
      updateUser(res.data.user);
      setShowAccountMenu(false);
      setFeedback({ message: "Đã cập nhật avatar.", error: "" });
    } catch (error) {
      setFeedback({ message: "", error: error.message || getErrorMessage(error) });
    }
  }

  async function markNotificationRead(notification) {
    if (!notification?._id || notification.isRead) return;
    try {
      await api.patch(`/auth/notifications/${notification._id}/read`);
      await loadNotifications();
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function markAllNotificationsRead() {
    if (!unreadCount) return;
    const previousNotifications = notifications;
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    try {
      await api.patch("/auth/notifications/read-all");
    } catch (error) {
      setNotifications(previousNotifications);
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  return (
    <div className={`app-shell top-nav-shell role-shell role-${user?.role || "guest"}`}>
      <Feedback error={feedback.error} message={feedback.message} onClear={clearFeedback} />
      <header className="app-topnav sticky-top">
        <Link className="top-brand" onClick={scrollPageToTop} to={user?.role === "patient" ? "/dashboard?tab=home" : "/"}>
          <DoorOpen size={24} />
          <span>SmileCare</span>
        </Link>

        <nav className="top-nav-list" aria-label="Điều hướng bệnh nhân">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === "/dashboard" &&
              (item.section ? location.hash === `#${item.section}` : activeTab === item.id && location.hash !== "#services");

            return (
              <Link
                key={item.id}
                to={item.to}
                className={`top-nav-item ${active ? "active" : ""}`}
                onClick={item.id === "home" ? scrollPageToTop : undefined}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="top-user-box">
          {user ? (
            <>
              <button
                className="top-notification-button"
                onClick={() => {
                  setShowNotifications((value) => {
                    if (!value) markAllNotificationsRead();
                    return !value;
                  });
                  setShowAccountMenu(false);
                }}
                ref={notificationButtonRef}
                title="Thông báo"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span>{unreadCount}</span>}
              </button>
              <button
                className="top-avatar-button"
                onClick={() => {
                  setShowAccountMenu((value) => !value);
                  setShowNotifications(false);
                }}
                ref={accountButtonRef}
                title="Tài khoản"
              >
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName || "Avatar"} /> : <span>{userInitial}</span>}
              </button>
            </>
          ) : null}
        </div>

        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkRead={markNotificationRead}
            popoverRef={notificationPopoverRef}
            userInitial={userInitial}
          />
        )}

        {showAccountMenu && user && (
          <ProfileDropdown
            accountPopoverRef={accountPopoverRef}
            fileInputRef={fileInputRef}
            onChangePassword={() => {
              setPasswordOpen(true);
              setShowAccountMenu(false);
            }}
            onEditProfile={() => {
              setProfileOpen(true);
              setShowAccountMenu(false);
            }}
            onLogout={handleLogout}
            onUploadAvatar={uploadAvatar}
            user={user}
            userInitial={userInitial}
          />
        )}
      </header>

      <main className="content top-nav-content">
        <Outlet />
      </main>

      {profileOpen && (
        <EditUserProfile
          form={profileForm}
          onCancel={() => setProfileOpen(false)}
          onChange={setProfileForm}
          onSubmit={saveProfile}
        />
      )}

      {passwordOpen && (
        <ChangeUserPassword
          form={passwordForm}
          onCancel={() => setPasswordOpen(false)}
          onChange={setPasswordForm}
          onSubmit={changePassword}
        />
      )}
    </div>
  );
}

function fileToCompressedAvatar(file) {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Chỉ hỗ trợ file ảnh."));
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const maxSize = 360;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Không đọc được file ảnh."));
    };
    image.src = objectUrl;
  });
}
