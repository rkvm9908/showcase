import { useEffect, useState } from "react";

export default function DetailModal({ item, type, isAdmin, onClose, onEdit, onDelete }) {
  const images = item.images?.length ? item.images.map((i) => i.url) : item.image ? [item.image] : [];
  const many = images.length > 1;
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const go = (d) => setIdx((i) => (i + d + images.length) % images.length);

  useEffect(() => {
    const n = images.length;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (zoom) setZoom(false);
        else onClose();
      } else if (n > 1 && e.key === "ArrowRight") setIdx((i) => (i + 1) % n);
      else if (n > 1 && e.key === "ArrowLeft") setIdx((i) => (i - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, images.length, onClose]);

  const label =
    type === "projects" ? "Project" : type === "certificates" ? "Certification"
    : item.kind === "3d" ? "3D Model" : "UI Design";
  const techs = (item.tech || "").split(",").map((t) => t.trim()).filter(Boolean);
  const added = new Date(item.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet detail" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>

        {images.length > 0 && (
          <div className="media">
            <div className="stage">
              <img src={images[idx]} alt={item.title} onClick={() => setZoom(true)} title="Click to enlarge" />
              {many && (
                <>
                  <button className="nav-arrow prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
                  <button className="nav-arrow next" onClick={() => go(1)} aria-label="Next">›</button>
                  <span className="zoomhint">{idx + 1} / {images.length}</span>
                </>
              )}
            </div>
            {many && (
              <div className="thumbs">
                {images.map((u, i) => (
                  <button key={u} className={i === idx ? "on" : ""} onClick={() => setIdx(i)}>
                    <img src={u} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="info" style={images.length ? undefined : { gridColumn: "1 / -1" }}>
          <span className="kicker">{label} · {item.category}</span>
          <h2>{item.title}</h2>
          {item.issuer && (
            <p className="meta">{item.issuer}{item.date && ` · ${item.date}`}</p>
          )}
          {item.description && <p className="desc">{item.description}</p>}
          {techs.length > 0 && (
            <div className="chips-sm">{techs.map((t) => <span key={t}>{t}</span>)}</div>
          )}

          <div className="row">
            {type !== "certificates" && item.link && (
              <a className="btnlink" href={item.link} target="_blank" rel="noopener noreferrer">
                {type === "projects" ? "Open project ↗" : "View live ↗"}
              </a>
            )}
            {item.file && (
              <a className="btnlink" href={item.file} target="_blank" rel="noopener noreferrer">
                Open certificate PDF ↗
              </a>
            )}
          </div>

          <p className="meta">Added on {added}</p>
          {isAdmin && (
            <div className="row">
              <button onClick={onEdit}>Edit</button>
              <button className="danger" onClick={onDelete}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {zoom && (
        <div className="lightbox" onClick={(e) => { e.stopPropagation(); setZoom(false); }}>
          <button className="close" onClick={() => setZoom(false)} aria-label="Close image">✕</button>
          <img src={images[idx]} alt={item.title} />
        </div>
      )}
    </div>
  );
}