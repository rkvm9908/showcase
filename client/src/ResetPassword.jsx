import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "./api";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const r = await api(`/reset-password/${token}`, {
        method: "POST",
        body: { password },
      });
      setMsg(r.message);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="modal static">
      <form className="sheet" onSubmit={submit}>
        <h3>Reset password</h3>
        <label>
          New password (min 8 characters)
          <input
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {err && <p className="error">{err}</p>}
        {msg && <p className="ok">{msg}</p>}
        <div className="row">
          <button className="primary">Update password</button>
          <Link to="/" className="linkbtn">
            Back to portfolio
          </Link>
        </div>
      </form>
    </div>
  );
}
