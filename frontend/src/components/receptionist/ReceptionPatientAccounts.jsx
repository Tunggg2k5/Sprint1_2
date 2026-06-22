import EmptyState from "../EmptyState.jsx";

export default function ReceptionPatientAccounts({
  loading,
  onResetPassword,
  patients,
  resetPasswords,
  search,
  setResetPasswords,
  setSearch
}) {
  return (
    <section className="reception-page">
      <div className="section-title reception-title">
        <div>
          <span className="eyebrow">Lễ tân</span>
          <h1>Tài khoản bệnh nhân</h1>
          <p>Tìm bệnh nhân theo tên hoặc số điện thoại để hỗ trợ tài khoản.</p>
        </div>
      </div>

      <div className="reception-toolbar">
        <label>
          <span>Tìm theo SĐT hoặc tên</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ví dụ: 0911 hoặc Nguyễn Văn An" />
        </label>
      </div>

      {loading ? <div className="panel">Đang tải dữ liệu...</div> : null}
      {!loading && !patients.length ? <EmptyState title="Chưa có kết quả" text="Nhập số điện thoại hoặc tên để tìm bệnh nhân." /> : null}

      <div className="reception-list">
        {patients.map((patient) => (
          <article className="reception-card" key={patient._id}>
            <div className="reception-card-main">
              <div>
                <strong>{patient.fullName}</strong>
                <p>{patient.phone}</p>
                <span>{patient.address || "Chưa cập nhật địa chỉ"}</span>
              </div>
              <span className={`status status-${patient.status}`}>{patient.status || "active"}</span>
            </div>
            <div className="reception-inline-form">
              <input
                value={resetPasswords[patient._id] || ""}
                onChange={(event) => setResetPasswords((current) => ({ ...current, [patient._id]: event.target.value }))}
                placeholder="Mật khẩu tạm: Password123!"
              />
              <button className="button secondary" onClick={() => onResetPassword(patient)}>Reset mật khẩu</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
