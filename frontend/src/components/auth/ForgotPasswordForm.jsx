import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../../utils/api.js";
import { firstError, validateEmail, validatePassword } from "../../utils/validation.js";

export default function ForgotPasswordForm() {
  const [step, setStep] = useState("email");
  const [form, setForm] = useState({ email: "", otp: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function requestOtp(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setDevOtp("");

    const validationError = validateEmail(form.email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/request-otp", { email: form.email });
      setMessage(res.data.message || "Nếu email tồn tại, SmileCare sẽ gửi mã OTP đặt lại mật khẩu.");
      setDevOtp(res.data.devOtp || "");
      setStep("otp");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = firstError(
      validateEmail(form.email),
      /^\d{6}$/.test(form.otp.trim()) ? "" : "OTP gồm 6 chữ số.",
      validatePassword(form.newPassword),
      form.newPassword === form.confirmPassword ? "" : "Mật khẩu nhập lại không khớp."
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/reset", {
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword
      });
      setMessage(res.data.message || "Đã đặt lại mật khẩu.");
      setError("");
      setDevOtp("");
      setForm((current) => ({ ...current, otp: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="eyebrow">Quên mật khẩu</p>
      <h2>Đặt lại mật khẩu bằng email</h2>

      {step === "email" ? (
        <form className="stack forgot-password-contact" onSubmit={requestOtp}>
          <div className="alert info">
            Nhập email đã cập nhật trong tài khoản. SmileCare sẽ gửi mã OTP để xác minh.
          </div>

          <label className="field">
            <span>Email</span>
            <div className="input-icon">
              <Mail size={18} />
              <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
            </div>
          </label>

          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}

          <button className="button primary full" disabled={loading}>
            {loading ? "Đang gửi OTP..." : "Gửi OTP"}
          </button>
        </form>
      ) : (
        <form className="stack forgot-password-contact" onSubmit={resetPassword}>
          <div className="alert info">
            Kiểm tra email và nhập OTP để đặt mật khẩu mới. Nếu chưa cập nhật email trong tài khoản, vui lòng đăng nhập hoặc liên hệ lễ tân để bổ sung email.
          </div>

          <label className="field">
            <span>Email</span>
            <div className="input-icon">
              <Mail size={18} />
              <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
            </div>
          </label>

          <label className="field">
            <span>OTP</span>
            <div className="input-icon">
              <ShieldCheck size={18} />
              <input value={form.otp} onChange={(event) => update("otp", event.target.value)} inputMode="numeric" maxLength={6} required />
            </div>
          </label>

          <label className="field">
            <span>Mật khẩu mới</span>
            <div className="input-icon">
              <LockKeyhole size={18} />
              <input type="password" value={form.newPassword} onChange={(event) => update("newPassword", event.target.value)} required />
            </div>
          </label>

          <label className="field">
            <span>Nhập lại mật khẩu mới</span>
            <div className="input-icon">
              <LockKeyhole size={18} />
              <input type="password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} required />
            </div>
          </label>

          {devOtp && <div className="alert info">OTP dev: {devOtp}</div>}
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}

          <button className="button primary full" disabled={loading}>
            {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
          </button>
          <button type="button" className="button ghost full" onClick={() => setStep("email")}>
            Gửi lại OTP
          </button>
        </form>
      )}

      <p className="muted">
        Đã nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
      </p>
    </>
  );
}
