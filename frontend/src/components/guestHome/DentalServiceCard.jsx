import { Stethoscope } from "lucide-react";

export default function DentalServiceCard({ service }) {
  return (
    <article className={`smile-service-card tone-${service.accent}`} key={service._id || service.name}>
      <span className="smile-icon-bubble">
        <Stethoscope size={22} />
      </span>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
    </article>
  );
}
