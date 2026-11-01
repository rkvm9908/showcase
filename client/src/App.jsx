import { useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";
import Card from "./components/Card";
import DetailModal from "./components/DetailModal";
import LoginModal from "./components/LoginModal";
import ItemForm from "./components/ItemForm";
import WorkForm from "./components/WorkForm";
import { GitHubIcon, LinkedInIcon, BehanceIcon, MailIcon } from "./components/Icons";

const fetchAll = () => Promise.all([api("/projects"), api("/certificates"), api("/works")]);
const TITLES = { all: "Everything", projects: "Projects", certificates: "Certifications", "3d": "3D Models", ui: "UI Designs" };
const LABELS = { projects: "project", certificates: "certification", works: "design" };
const NAV = ["all", "projects", "certificates", "3d", "ui"];

// Works-a Card / Detail use panra fields-ku map pannurom
const decorate = (w) => ({
  ...w,
  _type: "works",
  category: w.kind === "3d" ? "3D Models" : "UI Designs",
  image: w.images?.[0]?.url || "",
  tech: w.tools || "",
});
const matches = (i, t) =>
  t === "all" || (t === "3d" || t === "ui" ? i._type === "works" && i.kind === t : i._type === t);

export default function App() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [data, setData] = useState({ projects: [], certificates: [], works: [] });
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [editing, setEditing] = useState(null); // null | { type, item }
  const [viewing, setViewing] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const load = () =>
    fetchAll()
      .then(([projects, certificates, works]) => {
        setData({ projects, certificates, works });
        setError("");
      })
      .catch(() => setError("Could not load data. Is the server running?"));

  useEffect(() => {
    let ignore = false;
    fetchAll()
      .then(([projects, certificates, works]) => {
        if (!ignore) {
          setData({ projects, certificates, works });
          setError("");
        }
      })
      .catch(() => {
        if (!ignore) setError("Could not load data. Is the server running?");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    if (getToken()) {
      api("/me")
        .then(() => {
          if (!ignore) setIsAdmin(true);
        })
        .catch((e) => {
          if (e.status === 401) setToken(null);
        });
    }
    return () => {
      ignore = true;
    };
  }, []);

  const everything = [
    ...data.projects.map((i) => ({ ...i, _type: "projects" })),
    ...data.certificates.map((i) => ({ ...i, _type: "certificates" })),
    ...data.works.map(decorate),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const byType = everything.filter((i) => matches(i, typeFilter));
  const categories = ["All", ...new Set(byType.map((i) => i.category).filter(Boolean))];
  const q = query.trim().toLowerCase();
  const shown = byType
    .filter((i) => category === "All" || i.category === category)
    .filter(
      (i) =>
        !q ||
        [i.title, i.description, i.tech, i.issuer, i.category].some((v) =>
          (v || "").toLowerCase().includes(q)
        )
    );

  const counts = Object.fromEntries(NAV.map((t) => [t, everything.filter((i) => matches(i, t)).length]));

  const pickType = (t) => {
    setTypeFilter(t);
    setCategory("All");
    setQuery("");
  };

  const logout = () => {
    setToken(null);
    setIsAdmin(false);
    setEditing(null);
    setConfirming(null);
  };

  const doDelete = async () => {
    const item = confirming;
    setConfirming(null);
    try {
      await api(`/${item._type}/${item._id}`, { method: "DELETE" });
      load();
    } catch (e) {
      if (e.status === 401) logout();
      setError(e.message);
    }
  };

  return (
    <div className="app">
      <aside className="side glass">
        <div className="avatar">MR</div>
        <div>
          <h1>MATHUPRASANTH R. K.</h1>
          <p className="role">M.Sc. Information Technology</p>
        </div>

        <nav className="navlist">
          {NAV.map((t) => (
            <button key={t} className={`navbtn ${typeFilter === t ? "on" : ""}`} onClick={() => pickType(t)}>
              {t === "all" ? "All" : TITLES[t]} <span className="count">{counts[t]}</span>
            </button>
          ))}
        </nav>

        {isAdmin && <div className="adminpill">● Admin mode</div>}

        <div className="links">
          <a href="https://github.com/rkvm9908" target="_blank" rel="noopener noreferrer">
            <GitHubIcon /> GitHub
          </a>
          <a href="https://linkedin.com/in/mathuprasanth-r-k" target="_blank" rel="noopener noreferrer">
            <LinkedInIcon /> LinkedIn
          </a>
          <a href="https://www.behance.net/RKVM" target="_blank" rel="noopener noreferrer">
            <BehanceIcon /> Behance
          </a>
          <a href="mailto:mathuprasanth9908@gmail.com">
            <MailIcon /> Email
          </a>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <h2>{TITLES[typeFilter]}</h2>
          <input className="search" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
          {isAdmin && (
            <>
              <button className="primary" onClick={() => setEditing({ type: "projects", item: null })}>+ Project</button>
              <button className="primary" onClick={() => setEditing({ type: "certificates", item: null })}>+ Certification</button>
              <button className="primary" onClick={() => setEditing({ type: "works", item: null })}>+ 3D / UI</button>
            </>
          )}
        </div>

        <section className="stats">
          <div className="stat glass"><b>{data.projects.length}</b><span>Projects</span></div>
          <div className="stat glass"><b>{data.certificates.length}</b><span>Certifications</span></div>
          <div className="stat glass"><b>{data.works.length}</b><span>3D &amp; UI designs</span></div>
        </section>

        <div className="chips">
          {categories.map((c) => (
            <button key={c} className={`pill ${c === category ? "on" : ""}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        {loading && <p className="muted">Loading…</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && shown.length === 0 && <p className="muted">Nothing here yet.</p>}

        <section className="grid">
          {shown.map((item) => (
            <Card
              key={`${item._type}-${item._id}`}
              item={item}
              type={item._type}
              isAdmin={isAdmin}
              onOpen={() => setViewing(item)}
              onEdit={() => setEditing({ type: item._type, item })}
              onDelete={() => setConfirming(item)}
            />
          ))}
        </section>
      </main>

      <button id="fab" className={isAdmin ? "on" : ""} onClick={() => (isAdmin ? logout() : setShowLogin(true))}>
        {isAdmin ? "Logout" : "Admin login"}
      </button>

      {viewing && (
        <DetailModal
          key={`${viewing._type}-${viewing._id}`}
          item={viewing}
          type={viewing._type}
          isAdmin={isAdmin}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing({ type: viewing._type, item: viewing });
            setViewing(null);
          }}
          onDelete={() => {
            setConfirming(viewing);
            setViewing(null);
          }}
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setIsAdmin(true);
            setShowLogin(false);
          }}
        />
      )}

      {editing && editing.type === "works" && (
        <WorkForm
          item={editing.item}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onAuthError={logout}
        />
      )}

      {editing && editing.type !== "works" && (
        <ItemForm
          type={editing.type}
          item={editing.item}
          categories={[...new Set(data[editing.type].map((i) => i.category).filter(Boolean))]}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onAuthError={logout}
        />
      )}

      {confirming && (
        <div className="modal" onClick={() => setConfirming(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Delete pannanuma?</h3>
            <p>
              <b>"{confirming.title}"</b> ({LABELS[confirming._type]}) and adhoda ella images / PDF
              permanent-a delete aagidum.
            </p>
            <p className="muted">Idha thirumba edukka mudiyaadhu.</p>
            <div className="row">
              <button className="danger" onClick={doDelete}>Yes, delete</button>
              <button onClick={() => setConfirming(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}