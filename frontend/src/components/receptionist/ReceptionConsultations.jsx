import EmptyState from "../EmptyState.jsx";
import { formatDateTime } from "../../utils/format.js";
import { statusLabel } from "../../utils/reception.js";

export default function ReceptionConsultations({ consultations, loading, onDelete, onUpdateStatus }) {
  return (
    <section className="reception-page">
      <div className="section-title reception-title">
        <div>
          <span className="eyebrow">Lễ tân</span>
          <h1>Tư vấn</h1>
          <p>Danh sách yêu cầu tư vấn từ khách. Nút X dùng để xóa khỏi hệ thống.</p>
        </div>
      </div>

      {loading ? <div className="panel">Đang tải dữ liệu...</div> : null}
      {!loading && !consultations.length ? <EmptyState title="Chưa có yêu cầu tư vấn" text="Yêu cầu tư vấn mới sẽ hiển thị tại đây." /> : null}

      <div className="reception-list">
        {consultations.map((request) => (
          <article className="reception-card consultation-card" key={request._id}>
            <div className="reception-card-main">
              <div>
                <strong>{request.fullName || "Khách hàng"}</strong>
                <p>{request.phone}</p>
                <span>{request.service?.name || "Chưa chọn dịch vụ"} - {formatDateTime(request.createdAt)}</span>
                {request.message ? <small>{request.message}</small> : null}
              </div>
              <span className={`status status-${request.status}`}>{statusLabel(request.status)}</span>
            </div>
            <div className="reception-card-actions">
              <button className="button secondary" onClick={() => onUpdateStatus(request, "contacted")}>Đã liên hệ</button>
              <button className="button danger consultation-delete" onClick={() => onDelete(request)}>X</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
