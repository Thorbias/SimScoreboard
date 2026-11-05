import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useApp } from '../app/AppContext';
import { MIN_PASSWORD_LENGTH as MIN_LENGTH } from '../league/protect';
import { settle, snapshot, subscribe } from './passwordPrompt';

/** An eye, open while the password is hidden and struck through while shown. */
function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  );
}

export function PasswordDialog() {
  const { t } = useApp();
  const current = useSyncExternalStore(subscribe, snapshot);
  const dialog = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (current && !element.open) element.showModal();
    if (!current && element.open) element.close();
  }, [current]);

  if (!current) return <dialog ref={dialog} className="password-dialog" />;
  const { request } = current;
  const choosing = request.purpose === 'choose';

  const submit = () => {
    if (choosing) {
      if (password.length < MIN_LENGTH) {
        setProblem(t('league.password.tooShort', { n: MIN_LENGTH }));
        return;
      }
      if (password !== again) {
        setProblem(t('league.password.mismatch'));
        return;
      }
    } else if (!password) {
      return;
    }
    const answer = { password, remember };
    setVisible(false);
    setPassword('');
    setAgain('');
    setProblem(null);
    settle(answer);
  };

  const toggle = (
    <button
      type="button"
      className="password-toggle"
      onClick={() => setVisible((v) => !v)}
      title={t(visible ? 'league.password.hide' : 'league.password.show')}
      aria-label={t(visible ? 'league.password.hide' : 'league.password.show')}
      aria-pressed={visible}
    >
      <EyeIcon crossed={visible} />
    </button>
  );

  const cancel = () => {
    setVisible(false);
    setPassword('');
    setAgain('');
    setProblem(null);
    settle(null);
  };

  const shown = problem ?? request.error;

  return (
    <dialog
      ref={dialog}
      className="password-dialog"
      onCancel={(e) => {
        e.preventDefault();
        cancel();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h3>{t(`league.password.title.${request.purpose}`)}</h3>
        {request.leagueName && <p className="muted">{request.leagueName}</p>}
        {choosing && (
          <p className="hint">
            {t('league.password.chooseHint', { n: MIN_LENGTH })}
          </p>
        )}
        {shown && <p className="notice error">{shown}</p>}
        <label className="league-field">
          {t('league.password.label')}
          <span className="password-input">
            <input
              type={visible ? 'text' : 'password'}
              value={password}
              autoComplete={choosing ? 'new-password' : 'current-password'}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
            />
            {toggle}
          </span>
        </label>
        {choosing && (
          <label className="league-field">
            {t('league.password.again')}
            <span className="password-input">
              <input
                type={visible ? 'text' : 'password'}
                value={again}
                autoComplete="new-password"
                onChange={(e) => setAgain(e.target.value)}
              />
              {toggle}
            </span>
          </label>
        )}
        <label className="check">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          {t('league.password.remember')}
        </label>
        <p className="hint">{t('league.password.rememberHint')}</p>
        <p className="password-actions">
          <button className="primary" type="submit">
            {t('league.password.ok')}
          </button>{' '}
          <button type="button" onClick={cancel}>
            {t('league.password.cancel')}
          </button>
        </p>
      </form>
    </dialog>
  );
}
