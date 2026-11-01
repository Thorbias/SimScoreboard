import { useApp } from '../app/AppContext';

export function FavoriteButton({ id }: { id: string }) {
  const { t, favorites, toggleFavorite } = useApp();
  const active = favorites.includes(id);
  return (
    <button
      className="fav"
      aria-pressed={active}
      title={t(active ? 'fav.remove' : 'fav.add')}
      aria-label={t(active ? 'fav.remove' : 'fav.add')}
      onClick={() => void toggleFavorite(id)}
    >
      {active ? '★' : '☆'}
    </button>
  );
}
