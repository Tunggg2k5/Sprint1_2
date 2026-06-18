import { Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublicBootstrap } from "../../utils/usePublicBootstrap.js";

export default function ForgotPasswordForm() {
  const { clinic, loading } = usePublicBootstrap();
  const receptionistPhone = clinic.receptionist?.phone || clinic.receptionistPhone || "";

  return (
    <>
      <p className="eyebrow">Quên mật khẩu</p>
      <h2>Liên hệ lễ tân</h2>

      <div className="forgot-password-contact">
        <div className="alert info">
          Lễ tân SmileCare sẽ xác minh thông tin và hỗ trợ cấp lại mật khẩu.
        </div>
        {loading ? (
          <div className="alert info">Đang tải số điện thoại lễ tân...</div>
        ) : receptionistPhone ? (
          <a className="receptionist-contact-link" href={`tel:${receptionistPhone}`}>
            <Phone size={22} />
            <span>
              Liên hệ lễ tân
              <strong>{receptionistPhone}</strong>
            </span>
          </a>
        ) : (
          <div className="alert error">Chưa có số điện thoại lễ tân trong hệ thống.</div>
        )}
      </div>

      <p className="muted">
        Đã nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
      </p>
    </>
  );
}
