import { Stethoscope } from "lucide-react";
import { formatMoney } from "../../utils/format.js";

export default function DentalServiceCard({ service }) {
  const priceLabel = getPriceLabel(service);

  return (
    <article className={`smile-service-card tone-${service.accent}`} key={service._id || service.name}>
      <span className="smile-icon-bubble">
        <Stethoscope size={22} />
      </span>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      {priceLabel && <small>{priceLabel}</small>}
    </article>
  );
}

function getPriceLabel(service) {
  const min = Number(service.priceMin || 0);
  const max = Number(service.priceMax || 0);
  const price = Number(service.price || 0);

  if (min > 0 && max > 0 && min !== max) {
    return `Khoảng giá: ${formatMoney(min)} - ${formatMoney(max)}`;
  }

  if (price > 0 || min > 0 || max > 0) {
    return `Giá tham khảo: ${formatMoney(price || min || max)}`;
  }

  return "";
}
