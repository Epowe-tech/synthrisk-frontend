// SYNTH sign-in, on Cognito.
//
// Your user pool only lets admins create users (AllowAdminCreateUserOnly),
// so there is no self sign-up here. That matches SYNTH's rule: orgs are
// provisioned, never self-serve. New users get a temporary password by
// email and set their own on first sign-in ("newpassword" mode).
//
// Modes: login | forgot (request a code) | reset (code + new password) | newpassword
import { useState } from "react";
import { signIn, confirmSignIn, resetPassword, confirmResetPassword, fetchUserAttributes } from "aws-amplify/auth";
import { Logo } from "./synth/Shell.jsx";

// Mirrors the user pool's password policy so people see the rules before
// Cognito rejects the password.
export const PASSWORD_RULES = [
  ["8+ characters", (p) => p.length >= 8],
  ["an uppercase letter", (p) => /[A-Z]/.test(p)],
  ["a lowercase letter", (p) => /[a-z]/.test(p)],
  ["a number", (p) => /[0-9]/.test(p)],
  ["a symbol", (p) => /[^A-Za-z0-9]/.test(p)],
];
export const passwordOk = (p) => PASSWORD_RULES.every(([, test]) => test(p || ""));

function NewPasswordFields({ pw, pw2, setPw, setPw2, onEnter }) {
  const mismatch = pw2.length > 0 && pw !== pw2;
  return (
    <>
      <label>New password</label>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
      <ul className="pwrules">
        {PASSWORD_RULES.map(([label, test]) => <li key={label} className={test(pw) ? "ok" : ""}>{test(pw) ? "✓" : "·"} {label}</li>)}
      </ul>
      <label>Confirm password</label>
      <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={onEnter} autoComplete="new-password" />
      {mismatch && <div className="err">Passwords do not match</div>}
    </>
  );
}

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const switchMode = (m) => { setMode(m); setError(""); setInfo(""); setPw(""); setPw2(""); setCode(""); };
  const newPwReady = passwordOk(pw) && pw === pw2;

  const finish = async () => onLogin(await fetchUserAttributes());

  const run = (fn) => async () => {
    setBusy(true); setError("");
    try { await fn(); } catch (err) { setError(friendly(err)); }
    setBusy(false);
  };

  const doLogin = run(async () => {
    if (!email || !password) throw new Error("Enter your email and password.");
    const { isSignedIn, nextStep } = await signIn({ username: email.trim(), password });
    if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
      switchMode("newpassword");
      setInfo("Welcome. Set your own password to finish activating your account.");
    } else if (isSignedIn) {
      await finish();
    } else {
      throw new Error(`This account needs a sign-in step this app doesn't support yet (${nextStep.signInStep}).`);
    }
  });

  const doNewPassword = run(async () => {
    if (!newPwReady) return;
    const { isSignedIn, nextStep } = await confirmSignIn({
      challengeResponse: pw,
      options: name.trim() ? { userAttributes: { name: name.trim() } } : undefined,
    });
    if (isSignedIn) await finish();
    else { switchMode("login"); throw new Error(`Additional step required: ${nextStep.signInStep}. Sign in again.`); }
  });

  const doForgot = run(async () => {
    if (!email) throw new Error("Enter your email address.");
    try {
      await resetPassword({ username: email.trim() });
    } catch (err) {
      // Same answer whether or not the email exists (no account enumeration).
      if (err?.name !== "UserNotFoundException") throw err;
    }
    switchMode("reset");
    setInfo(`If ${email.trim()} has an account, a 6-digit code is on its way.`);
  });

  const doReset = run(async () => {
    if (!code) throw new Error("Enter the code from the email.");
    if (!newPwReady) return;
    await confirmResetPassword({ username: email.trim(), confirmationCode: code.trim(), newPassword: pw });
    switchMode("login");
    setPassword("");
    setInfo("Password updated. Sign in with your new password.");
  });

  const enter = (fn) => (e) => { if (e.key === "Enter") fn(); };

  return (
    <div className="syn auth">
      <div className="authbox">
        <Logo />
        <div className="tagline">Carrier Placement Intelligence for Independent Agents</div>
        <div className="tagline2">Stop submitting blind. Start placing smart.</div>
        <div className="card">
          {info && <div className="okmsg">{info}</div>}

          {mode === "login" && (
            <>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={enter(doLogin)} autoComplete="current-password" />
              <button className="btn mt full" disabled={busy} onClick={doLogin}>{busy ? "Signing in…" : "Sign in"}</button>
              <div className="flex spread mt">
                <button className="linkbtn" onClick={() => switchMode("forgot")}>Forgot password?</button>
                <span className="small dim">New here? Your admin sends you an invite.</span>
              </div>
            </>
          )}

          {mode === "newpassword" && (
            <>
              <label>Your name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First Last" />
              <NewPasswordFields pw={pw} pw2={pw2} setPw={setPw} setPw2={setPw2} onEnter={enter(doNewPassword)} />
              <button className="btn mt full" disabled={busy || !newPwReady} onClick={doNewPassword}>{busy ? "Saving…" : "Set password and continue"}</button>
            </>
          )}

          {mode === "forgot" && (
            <>
              <div className="small dim">Enter your email and we'll send a code to reset your password.</div>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={enter(doForgot)} />
              <button className="btn mt full" disabled={busy} onClick={doForgot}>{busy ? "Sending…" : "Send reset code"}</button>
              <div className="mt"><button className="linkbtn" onClick={() => switchMode("login")}>← Back to sign in</button></div>
            </>
          )}

          {mode === "reset" && (
            <>
              <label>Code from the email</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="123456" />
              <NewPasswordFields pw={pw} pw2={pw2} setPw={setPw} setPw2={setPw2} onEnter={enter(doReset)} />
              <button className="btn mt full" disabled={busy || !newPwReady} onClick={doReset}>{busy ? "Saving…" : "Reset password"}</button>
              <div className="flex spread mt">
                <button className="linkbtn" onClick={() => switchMode("login")}>← Back to sign in</button>
                <button className="linkbtn" onClick={doForgot}>Send a new code</button>
              </div>
            </>
          )}

          <div className="err">{error}</div>
        </div>
      </div>
    </div>
  );
}

// Turns Cognito error names into plain sentences. Sign-in failures share
// one message so the screen never reveals whether an email has an account.
function friendly(err) {
  switch (err?.name) {
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return "Incorrect email or password.";
    case "CodeMismatchException": return "That code is not right. Check the email and try again.";
    case "ExpiredCodeException": return "That code has expired. Send a new one.";
    case "InvalidPasswordException": return "That password does not meet the rules above.";
    case "LimitExceededException":
    case "TooManyRequestsException": return "Too many attempts. Wait a few minutes and try again.";
    case "PasswordResetRequiredException": return "Your password must be reset. Use “Forgot password?”.";
    default: return err?.message || "Something went wrong. Try again.";
  }
}
