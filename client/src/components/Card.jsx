const labelOf = (type, item) =>
  type === "projects" ? "Project" : type === "certificates" ? "Certification"
  : item.kind === "3d" ? "3D Model" : "UI Design";

export default function Card({ item, type, isAdmin, onOpen, onEdit, onDelete }) {
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };
  const techs = (item.tech || "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3);
  const count = item.images?.length || 0;

  return (
    <article
      className="card glass"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      <div className={`thumb ${type === "certificates" ? "contain" : ""}`}>
        {item.image ? (
          <img src={item.image} alt={item.title} loading="lazy" />
        ) : (
          <span className="ph">{item.title.charAt(0).toUpperCase()}</span>
        )}
        <span className="tag">{item.category}</span>
        {item.file && <span className="tag pdf">PDF</span>}
        {count > 1 && <span className="tag pdf">{count} images</span>}
        {isAdmin && (
          <div className="quick">
            <button onClick={stop(onEdit)}>Edit</button>
            <button className="danger" onClick={stop(onDelete)}>Delete</button>
          </div>
        )}
      </div>

      <div className="card-body">
        <span className="kicker">{labelOf(type, item)}</span>
        <h3>{item.title}</h3>
        {item.issuer && (
          <p className="meta">{item.issuer}{item.date && ` · ${item.date}`}</p>
        )}
        {item.description && <p className="clamp">{item.description}</p>}
        {techs.length > 0 && (
          <div className="chips-sm">{techs.map((t) => <span key={t}>{t}</span>)}</div>
        )}
        <span className="more">View details →</span>
      </div>
    </article>
  );
}