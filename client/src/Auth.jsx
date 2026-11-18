
import { useState } from "react";
import API_BASE_URL from "./api";
import "./Auth.css";

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");
    setLoading(true);

    const endpoint = isLogin ? "login" : "register";

    const body = isLogin
      ? { email, password }
      : { name, email, password };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (isLogin) {
        onAuthSuccess(data.user);
      } else {
        setMessage("Account created successfully! You can now sign in.");
        setMessageType("success");
        setIsLogin(true);
        setPassword("");
        setName("");
      }
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsLogin(!isLogin);
    setMessage("");
    setMessageType("");
    setPassword("");
    setShowPassword(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow-one"></div>
      <div className="auth-glow auth-glow-two"></div>

      <div className="auth-layout">
        <section className="auth-brand">
          <div className="brand-logo">
            <span className="brand-logo-icon">S</span>
            <span>SupportDesk</span>
          </div>

          <div className="brand-content">
            <span className="brand-tag">
              <span className="status-dot"></span>
              CUSTOMER SUPPORT PLATFORM
            </span>

            <h1>
              Support that
              <br />
              <span>moves you forward.</span>
            </h1>

            <p>
              One simple workspace to manage conversations,
              resolve issues and deliver better customer experiences.
            </p>

            <div className="brand-features">
              <div className="brand-feature">
                <span className="feature-check">✓</span>
                Smart ticket management
              </div>

              <div className="brand-feature">
                <span className="feature-check">✓</span>
                Real-time support workflows
              </div>

              <div className="brand-feature">
                <span className="feature-check">✓</span>
                Organized team collaboration
              </div>
            </div>
          </div>

          <p className="brand-footer">
            © 2026 SupportDesk. All rights reserved.
          </p>
        </section>

        <section className="auth-form-section">
          <div className="auth-card">
            <div className="auth-card-top">
              <div className="mobile-brand">
                <span className="brand-logo-icon">S</span>
                SupportDesk
              </div>

              <div className="auth-icon">
                {isLogin ? "↗" : "✦"}
              </div>

              <span className="auth-eyebrow">
                {isLogin ? "WELCOME BACK" : "GET STARTED"}
              </span>

              <h2>
                {isLogin ? "Sign in to your account" : "Create your account"}
              </h2>

              <p className="auth-subtitle">
                {isLogin
                  ? "Enter your details to access your workspace."
                  : "Join SupportDesk and get your support workspace started."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="auth-field">
                  <label htmlFor="auth-name">Full name</label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="auth-email">Email address</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="auth-password">Password</label>

                <div className="password-wrapper">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    minLength={8}
                    required
                  />

                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {!isLogin && (
                  <span className="password-hint">
                    Use at least 8 characters.
                  </span>
                )}
              </div>

              {message && (
                <div
                  className={`auth-message ${messageType}`}
                  role="alert"
                >
                  <span>{messageType === "success" ? "✓" : "!"}</span>
                  {message}
                </div>
              )}

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in to workspace"
                    : "Create account"}

                {!loading && <span>→</span>}
              </button>
            </form>

            <div className="auth-divider">
              <span></span>
              <p>SECURE WORKSPACE ACCESS</p>
              <span></span>
            </div>

            <p className="auth-switch">
              {isLogin
                ? "New to SupportDesk?"
                : "Already have an account?"}

              <button type="button" onClick={switchMode}>
                {isLogin ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="auth-bottom-note">
            Designed for better support experiences.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Auth;
