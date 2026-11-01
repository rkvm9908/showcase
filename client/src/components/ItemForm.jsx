import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

export default function ItemForm({ type, item, categories, onClose, onSaved, onAuthError }) {
  const isProject = type === "projects";
  const fields = isProject
    ? ["title", "category", "description", "tech", "link"]
    : ["title", "category", "issuer", "date", "description"];

  const [f, setF] = useState(Object.fromEntries(fields.map((k) => [k, item?.[k] || ""])));
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const isPdf = file?.type === "application/pdf";

  // Image select pannina mattum preview (PDF-ku <img> work aagaadhu)
  const preview = useMemo(
    () => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  // PDF select pannina pazhaya thumbnail maraiyum
  const shownImage = preview || (!file && !removeImage && item?.image) || null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fields.forEach((k) => fd.append(k, k === "category" ? f[k].trim() || "General" : f[k]));
    if (file) fd.append("image", file);
    if (removeImage) fd.append("removeImage", "true");
    try {
      await api(item ? `/${type}/${item._id}` : `/${type}`, {
        method: item ? "PUT" : "POST",
        form: fd,
      });
      onSaved();
    } catch (e) {
      if (e.status === 401) onAuthError();
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <form className="sheet wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{item ? "Edit" : "Add"} {isProject ? "project" : "certification"}</h3>

        <label>Title
          <input required value={f.title} onChange={set("title")} />
        </label>

        <div className="two">
          <label>Category
            <input list="cats" value={f.category} onChange={set("category")} placeholder="Machine Learning" />
          </label>
          {isProject ? (
            <label>Technologies (comma-la pirichu)
              <input value={f.tech} onChange={set("tech")} placeholder="Python, Flask, XGBoost" />
            </label>
          ) : (
            <label>Issuer
              <input value={f.issuer} onChange={set("issuer")} placeholder="Google Cloud" />
            </label>
          )}
        </div>

        {isProject ? (
          <label>Project link (https://…)
            <input value={f.link} onChange={set("link")} />
          </label>
        ) : (
          <label>Date / validity
            <input value={f.date} onChange={set("date")} placeholder="Valid till Feb 2029" />
          </label>
        )}

        <label>Description
          <textarea value={f.description} onChange={set("description")} />
        </label>
        <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>

        {shownImage && <img className="preview" src={shownImage} alt="Preview" />}
        {isPdf && (
          <p className="meta">📄 {file.name} (first page thumbnail-a save pannina varum)</p>
        )}

        <label>{isProject ? "Image" : "Image or PDF"} (max 5 MB)
          <input
            type="file"
            accept={isProject ? "image/*" : "image/*,application/pdf"}
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </label>

        {item?.image && !file && (
          <label className="inline">
            <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
            Current {item.file ? "PDF / thumbnail" : "image"} remove pannanum
          </label>
        )}

        {err && <p className="error">{err}</p>}
        <div className="row">
          <button className="primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}