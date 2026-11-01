import { useState } from "react";
import { api, setToken } from "../api";

export default function LoginModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      if (mode === "login") {
        const { token } = await api("/login", {
          method: "POST",
          body: { email, password },
        });
        setToken(token);
        onSuccess();
      } else {
        const r = await api("/forgot-password", {
          method: "POST",
          body: { email },
        });
        setMsg(r.message);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <form
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h3>{mode === "login" ? "Admin login" : "Forgot password"}</h3>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {mode === "login" && (
          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {err && <p className="error">{err}</p>}
        {msg && <p className="ok">{msg}</p>}
        <div className="row">
          <button className="primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Login"
                : "Send reset link"}
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
        <button
          type="button"
          className="linkbtn"
          onClick={() => {
            setMode(mode === "login" ? "forgot" : "login");
            setErr("");
            setMsg("");
          }}
        >
          {mode === "login" ? "Forgot password?" : "Back to login"}
        </button>
      </form>
    </div>
  );
}
