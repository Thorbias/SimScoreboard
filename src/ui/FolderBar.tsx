import { useApp } from '../app/AppContext';

export function FolderBar() {
  const app = useApp();
  const { t, scan, folder, canPickDirectory } = app;

  return (
    <section className="folder-bar" aria-label={t('folder.choose')}>
      <div className="folder-actions">
        {folder === 'needs-permission' && (
          <button
            className="primary"
            onClick={() => void app.reconnectFolder()}
          >
            {t('folder.reconnect')}
          </button>
        )}
        {canPickDirectory ? (
          <button
            className={folder === 'none' ? 'primary' : ''}
            onClick={() => void app.chooseFolder()}
          >
            {t(folder === 'none' ? 'folder.choose' : 'folder.change')}
          </button>
        ) : (
          <label className="button primary">
            {t('folder.chooseResults')}
            <input
              type="file"
              multiple
              hidden
              {...{ webkitdirectory: '' }}
              onChange={(e) => {
                void app.chooseFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        )}
        {scan.active && (
          <span className="progress">
            <progress value={scan.done} max={Math.max(scan.total, 1)} />
            {t('scan.progress', { done: scan.done, total: scan.total })}
          </span>
        )}
      </div>
      {folder === 'none' && <p className="hint">{t('folder.hint')}</p>}
      {folder === 'needs-permission' && (
        <p className="hint">{t('folder.reconnectHint')}</p>
      )}
      {scan.error && (
        <p className="notice error" role="alert">
          {t('scan.error', { message: scan.error })}
        </p>
      )}
      {scan.failed > 0 && (
        <p className="notice">{t('scan.failed', { n: scan.failed })}</p>
      )}
      {scan.empty && !scan.active && (
        <p className="notice">{t('folder.noResults')}</p>
      )}
    </section>
  );
}
