import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const MAX = 8;

export default function WorkForm({ item, onClose, onSaved, onAuthError }) {
  const [f, setF] = useState({
    title: item?.title || "",
    kind: item?.kind || "ui",
    tools: item?.tools || "",
    link: item?.link || "",
    description: item?.description || "",
  });
  const [existing, setExisting] = useState(item?.images || []);
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const previews = useMemo(() => files.map((x) => URL.createObjectURL(x)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const total = existing.length + files.length;

  const addFiles = (e) => {
    const picked = [...e.target.files];
    e.target.value = "";
    const room = Math.max(MAX - total, 0);
    const ok = picked.filter((p) => p.type.startsWith("image/") && p.size <= 5 * 1024 * 1024);
    const msgs = [];
    if (ok.length < picked.length) msgs.push("Image illaadha / 5 MB-ku mela irukkura files skip aachu.");
    if (ok.length > room) msgs.push(`Maximum ${MAX} images mattum.`);
    setErr(msgs.join(" "));
    setFiles([...files, ...ok.slice(0, room)]);
  };

  const makeCover = (i) => setExisting([existing[i], ...existing.filter((_, k) => k !== i)]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const fd = new FormData();
    ["title", "kind", "tools", "link", "description"].forEach((k) => fd.append(k, f[k]));
    fd.append("keep", JSON.stringify(existing.map((i) => i.id)));
    files.forEach((x) => fd.append("images", x));
    try {
      await api(item ? `/works/${item._id}` : "/works", { method: item ? "PUT" : "POST", form: fd });
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
        <h3>{item ? "Edit" : "Add"} 3D model / UI design</h3>

        <label>Title
          <input required value={f.title} onChange={set("title")} />
        </label>

        <div className="two">
          <label>Type
            <select value={f.kind} onChange={set("kind")}>
              <option value="ui">UI Design</option>
              <option value="3d">3D Model</option>
            </select>
          </label>
          <label>Tools (comma-la pirichu)
            <input value={f.tools} onChange={set("tools")} placeholder="Figma, Blender" />
          </label>
        </div>

        <label>Link (Figma / Sketchfab / Behance, optional)
          <input value={f.link} onChange={set("link")} placeholder="https://…" />
        </label>

        <label>Description
          <textarea value={f.description} onChange={set("description")} />
        </label>

        <label>Images ({total}/{MAX}) · first image dhaan cover</label>
        <div className="imgs">
          {existing.map((img, i) => (
            <div className="it" key={img.id}>
              {i === 0 && <span className="cover">Cover</span>}
              <img src={img.url} alt="" />
              <div className="acts">
                {i > 0 ? <button type="button" onClick={() => makeCover(i)}>Cover</button> : <span />}
                <button type="button" className="danger"
                        onClick={() => setExisting(existing.filter((_, k) => k !== i))}>✕</button>
              </div>
            </div>
          ))}
          {files.map((x, i) => (
            <div className="it" key={x.name + i}>
              <span className="cover new">New</span>
              <img src={previews[i]} alt="" />
              <div className="acts">
                <span />
                <button type="button" className="danger"
                        onClick={() => setFiles(files.filter((_, k) => k !== i))}>✕</button>
              </div>
            </div>
          ))}
        </div>
        {total < MAX && (
          <input type="file" accept="image/*" multiple onChange={addFiles} />
        )}

        {err && <p className="error">{err}</p>}
        <div className="row">
          <button className="primary" disabled={busy}>{busy ? "Uploading…" : "Save"}</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}