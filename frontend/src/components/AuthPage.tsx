import { FolderOpen, Search, Sparkles } from "lucide-react";

type AuthPageProps = {
  authMode: "login" | "signup";
  authError: string | null;
  onSubmit: (formData: FormData) => Promise<void> | void;
  onToggleMode: () => void;
};

export function AuthPage({ authMode, authError, onSubmit, onToggleMode }: AuthPageProps) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-copy">
          <div className="auth-brand">
            <span className="eyebrow">Copybara</span>
            <h1>Personal code archive for snippets you want to keep.</h1>
            <p>Folders on the left, code on the right, and enough structure to find things again later.</p>
          </div>
          <div className="auth-points">
            <div>
              <FolderOpen size={16} />
              <span>Folder-based archive with per-user categories</span>
            </div>
            <div>
              <Sparkles size={16} />
              <span>AI summary and suggested tags when needed</span>
            </div>
            <div>
              <Search size={16} />
              <span>Search, pinned snippets, and recents for quick retrieval</span>
            </div>
          </div>
        </div>
        <div className="auth-form-shell">
          <form
            key={authMode}
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(new FormData(event.currentTarget));
            }}
          >
            <div className="auth-form-copy">
              <h2>{authMode === "login" ? "Welcome back" : "Create your archive"}</h2>
              <p>
                {authMode === "login"
                  ? "Sign in to open your workspace."
                  : "Start with an account and keep your snippets organized."}
              </p>
            </div>
            <label className="auth-field">
              <span>Email</span>
              <input name="email" type="email" placeholder="you@example.com" required />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input name="password" type="password" placeholder="Enter password" required />
            </label>
            {authMode === "signup" && (
              <label className="auth-field">
                <span>Nickname</span>
                <input name="nickname" placeholder="How should we call you?" required />
              </label>
            )}
            {authError && <p className="error-text">{authError}</p>}
            <button className="primary-button auth-submit" type="submit">
              {authMode === "login" ? "Enter archive" : "Create account"}
            </button>
            <p className="auth-switch-text">
              {authMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button type="button" className="auth-switch-link" onClick={onToggleMode}>
                {authMode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
