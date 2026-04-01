import { useState } from "react";
import { signIn, signUp, confirmSignUp, resetPassword, getCurrentUser, confirmSignIn, fetchUserAttributes } from "aws-amplify/auth";

const C = {
  bg: "#08090d", surface: "#0e1118", border: "#1c2030",
  text: "#e8eaf0", textMid: "#7a8299", textDim: "#3a4055",
  accent: "#3d8ef8", green: "#22c98a", amber: "#f5a623", red: "#ff5555",
};

// ── OUTSIDE component — prevents focus loss on every keystroke ──
const LoginInputField = ({ label, type = "text", k, placeholder, suffix, value, onChange, onKeyDown, showPassword }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: 1, color: C.textMid, marginBottom: 7, textTransform: "uppercase" }}>{label}</label>
    <div style={{ position: "relative" }}>
      <input
        type={type === "password" ? (showPassword ? "text" : "password") : type}
        value={value} placeholder={placeholder}
        onChange={e => onChange(k, e.target.value)} onKeyDown={onKeyDown}
        style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: suffix ? "11px 44px 11px 14px" : "11px 14px", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color 0.2s" }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border}
      />
      {suffix && (
        <button onClick={suffix.action} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
          {suffix.label}
        </button>
      )}
    </div>
  </div>
);

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup | confirm | forgot
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", name: "", inviteCode: "", confirmationCode: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const VALID_INVITE_CODES = ["SYNTH2026", "EPOWE001"];
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(""); };
  const switchMode = (m) => { setMode(m); setError(""); setSuccess(""); };

  // ── SIGN IN ──────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      const { isSignedIn, nextStep } = await signIn({ username: form.email, password: form.password });
      if (isSignedIn) {
        const cognitoUser = await getCurrentUser();
        const attrs = await fetchUserAttributes();
        onLogin({ id: cognitoUser.userId, email: attrs.email || form.email, name: attrs.name || form.email.split("@")[0], role: "producer" });
      } else if (nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setMode("newpassword");
        setSuccess("Please set a new permanent password to continue.");
      } else if (nextStep?.signInStep === "CONFIRM_SIGN_UP") {
        setPendingEmail(form.email); setMode("confirm");
        setSuccess("Please check your email for a confirmation code.");
      }
    } catch (err) {
      if (err.name === "UserNotConfirmedException") { setPendingEmail(form.email); setMode("confirm"); setError("Please confirm your email first."); }
      else if (err.name === "NotAuthorizedException") setError("Incorrect email or password.");
      else if (err.name === "UserNotFoundException") setError("No account found with that email.");
      else setError(err.message || "Sign in failed. Please try again.");
    }
    setLoading(false);
  };

  // ── SIGN UP ──────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password || !form.inviteCode) { setError("All fields are required."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords don't match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!VALID_INVITE_CODES.includes(form.inviteCode.toUpperCase())) { setError("Invalid invite code. Contact your administrator."); return; }
    setLoading(true);
    try {
      await signUp({ username: form.email, password: form.password, options: { userAttributes: { email: form.email, name: form.name } } });
      setPendingEmail(form.email); setMode("confirm");
      setSuccess("Account created! Check your email for a 6-digit confirmation code.");
    } catch (err) {
      if (err.name === "UsernameExistsException") setError("An account with this email already exists.");
      else if (err.name === "InvalidPasswordException") setError("Password needs uppercase, numbers, and symbols.");
      else setError(err.message || "Sign up failed. Please try again.");
    }
    setLoading(false);
  };

  // ── CONFIRM EMAIL ────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!form.confirmationCode) { setError("Enter the confirmation code from your email."); return; }
    setLoading(true);
    try {
      await confirmSignUp({ username: pendingEmail || form.email, confirmationCode: form.confirmationCode });
      setSuccess("Email confirmed! You can now sign in.");
      switchMode("login");
    } catch (err) {
      if (err.name === "CodeMismatchException") setError("Incorrect code. Check your email and try again.");
      else if (err.name === "ExpiredCodeException") setError("Code expired. Request a new one.");
      else setError(err.message || "Confirmation failed.");
    }
    setLoading(false);
  };

  // ── FORGOT PASSWORD ──────────────────────────────────────────────
  const handleForgot = async () => {
    if (!form.email) { setError("Enter your email address."); return; }
    setLoading(true);
    try {
      await resetPassword({ username: form.email });
      setSuccess(`Reset code sent to ${form.email}. Check your inbox.`);
    } catch (err) { setError(err.message || "Could not send reset email."); }
    setLoading(false);
  };

  // ── SET NEW PASSWORD (first login) ──────────────────────────────
  const handleNewPassword = async () => {
    if (!form.newPassword || form.newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (form.newPassword !== form.confirmPassword) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: form.newPassword,
        options: {
          userAttributes: {
            name: form.name || form.email.split("@")[0],
          },
        },
      });
      if (isSignedIn) {
        const cognitoUser = await getCurrentUser();
        const attrs = await fetchUserAttributes();
        onLogin({ id: cognitoUser.userId, email: attrs.email || form.email, name: attrs.name || form.email.split("@")[0], role: "producer" });
      }
    } catch (err) {
      setError(err.message || "Failed to set new password.");
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    ({ login: handleLogin, signup: handleSignup, confirm: handleConfirm, forgot: handleForgot, newpassword: handleNewPassword })[mode]?.();
  };

  const submitAction = { login: handleLogin, signup: handleSignup, confirm: handleConfirm, forgot: handleForgot, newpassword: handleNewPassword }[mode];
  const submitLabel = { login: "Sign In →", signup: "Create Account →", confirm: "Confirm Email →", forgot: "Send Reset Link →", newpassword: "Set Password →" }[mode];
  const headerTitle = { login: "Welcome back", signup: "Create account", confirm: "Confirm your email", forgot: "Reset password", newpassword: "Set your password" }[mode];
  const headerSub = { login: "Sign in to your agent account", signup: "You'll need an invite code from your admin", confirm: `Enter the 6-digit code sent to ${pendingEmail || form.email}`, forgot: "We'll send a reset link to your email", newpassword: "Your account requires a new permanent password" }[mode];

  return (
    <div style={{ width: "100vw", height: "100vh", background: C.bg, display: "flex", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: C.text, position: "fixed", top: 0, left: 0, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes gridMove { from { transform:translateY(0);} to { transform:translateY(60px);} }
        @keyframes pulse { 0%,100%{opacity:0.4;} 50%{opacity:0.8;} }
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        .login-card { animation: fadeIn 0.4s ease forwards; }
        input::placeholder { color: ${C.textDim}; }
        button:hover:not(:disabled) { opacity: 0.88; }
      `}</style>

      {/* Animated background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: 0.4, animation: "gridMove 8s linear infinite" }} />
        <div style={{ position: "absolute", top: "20%", left: "60%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}18 0%, transparent 70%)`, animation: "pulse 4s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "30%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.green}12 0%, transparent 70%)`, animation: "pulse 5s ease-in-out infinite 1s" }} />
      </div>

      {/* Left panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 56px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, ${C.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 0 20px ${C.accent}44` }}>⬡</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 3, color: C.text, fontFamily: "'Syne', monospace" }}>SYNTHRISK</div>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5 }}>AGENCY PLATFORM</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: C.accent, marginBottom: 20, textTransform: "uppercase" }}>Risk Intelligence Platform</div>
          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, color: C.text, fontFamily: "'Syne', sans-serif", marginBottom: 24 }}>
            Built for<br />
            <span style={{ background: `linear-gradient(90deg, ${C.accent}, ${C.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>modern</span><br />
            agents.
          </div>
          <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, maxWidth: 380 }}>Submit, score, and market commercial risks — all from one platform built for speed and precision.</div>
          <div style={{ display: "flex", gap: 10, marginTop: 32, flexWrap: "wrap" }}>
            {["⬡ Risk Scoring", "◫ Pipeline Management", "◈ Market Matching", "◉ Account Tracking"].map(f => (
              <div key={f} style={{ padding: "6px 14px", borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, fontSize: 12, color: C.textMid, fontWeight: 500 }}>{f}</div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 40 }}>
          {[{ n: "v1.0", l: "Platform" }, { n: "AWS", l: "Powered" }, { n: "SOC2", l: "Ready" }].map(s => (
            <div key={s.l}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "monospace" }}>{s.n}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ width: "38vw", minWidth: 400, maxWidth: 520, background: C.surface, borderLeft: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 44px", position: "relative", zIndex: 1, overflowY: "auto" }}>
        <div className="login-card" style={{ width: "100%" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>{headerTitle}</div>
            <div style={{ fontSize: 13, color: C.textMid }}>{headerSub}</div>
          </div>

          {success && <div style={{ background: C.green + "18", border: `1px solid ${C.green}44`, borderRadius: 8, padding: "11px 14px", marginBottom: 20, fontSize: 13, color: C.green, display: "flex", gap: 8 }}><span>✓</span>{success}</div>}
          {error && <div style={{ background: C.red + "18", border: `1px solid ${C.red}44`, borderRadius: 8, padding: "11px 14px", marginBottom: 20, fontSize: 13, color: C.red, display: "flex", gap: 8 }}><span>⚠</span>{error}</div>}

          {mode === "signup" && <LoginInputField label="Full Name" k="name" placeholder="Demetri Powell" value={form.name} onChange={set} onKeyDown={handleKeyDown} showPassword={showPassword} />}
          {mode !== "confirm" && <LoginInputField label="Email" type="email" k="email" placeholder="agent@yourcompany.com" value={form.email} onChange={set} onKeyDown={handleKeyDown} showPassword={showPassword} />}
          {(mode === "login" || mode === "signup") && (
            <LoginInputField label="Password" type="password" k="password" placeholder="••••••••" value={form.password} onChange={set} onKeyDown={handleKeyDown} showPassword={showPassword} suffix={{ label: showPassword ? "Hide" : "Show", action: () => setShowPassword(s => !s) }} />
          )}
          {mode === "signup" && <>
            <LoginInputField label="Confirm Password" type="password" k="confirmPassword" placeholder="••••••••" value={form.confirmPassword} onChange={set} onKeyDown={handleKeyDown} showPassword={showPassword} />
            <LoginInputField label="Invite Code" k="inviteCode" placeholder="SYNTH2026" value={form.inviteCode} onChange={set} onKeyDown={handleKeyDown} showPassword={showPassword} />
          </>}
          {mode === "confirm" && <LoginInputField label="Confirmation Code" k="confirmationCode" placeholder="123456" value={form.confirmationCode} onChange={set} onKeyDown={handleKeyDown} showPassword={showPassword} />}
          {mode === "newpassword" && <>
            <LoginInputField label="Your Name" k="name" placeholder="Demetri Powell" value={form.name} onChange={set} onKeyDown={handleKeyDown} showPassword={showPassword} />
            <LoginInputField label="New Password" type="password" k="newPassword" placeholder="Min 8 characters" value={form.newPassword} onChange={set} onKeyDown={handleKeyDown} showPassword={showPassword} suffix={{ label: showPassword ? "Hide" : "Show", action: () => setShowPassword(s => !s) }} />
            <LoginInputField label="Confirm New Password" type="password" k="confirmPassword" placeholder="Repeat new password" value={form.confirmPassword} onChange={set} onKeyDown={handleKeyDown} showPassword={showPassword} />
          </>}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: -8, marginBottom: 20 }}>
              <button onClick={() => switchMode("forgot")} style={{ background: "none", border: "none", color: C.textMid, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Forgot password?</button>
            </div>
          )}

          <button onClick={submitAction} disabled={loading}
            style={{ width: "100%", background: loading ? C.border : `linear-gradient(90deg, ${C.accent}, #2563eb)`, border: "none", color: "#fff", padding: "13px", borderRadius: 8, fontSize: 14, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: loading ? "none" : `0 0 24px ${C.accent}44`, transition: "all 0.2s", marginBottom: 20 }}>
            {loading ? <><div style={{ width: 16, height: 16, border: "2px solid #ffffff44", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Processing...</> : submitLabel}
          </button>

          <div style={{ textAlign: "center", fontSize: 13, color: C.textMid }}>
            {mode === "login" && <>Don't have an account? <button onClick={() => switchMode("signup")} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>Request access</button></>}
            {mode === "signup" && <>Already have an account? <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>Sign in</button></>}
            {mode === "confirm" && <>Already confirmed? <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>Sign in</button></>}
            {mode === "forgot" && <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>← Back to sign in</button>}
          </div>

          <div style={{ marginTop: 28, padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5, marginBottom: 6, fontWeight: 700 }}>LIVE AUTH — AWS COGNITO</div>
            <div style={{ fontSize: 11, color: C.textMid, lineHeight: 1.6 }}>
              Create a real account using Request Access.<br />
              Admin invite code: <span style={{ color: C.accent, fontFamily: "monospace" }}>SYNTH2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
