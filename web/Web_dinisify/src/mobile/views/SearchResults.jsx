import { useSearch } from '../../shared/hooks/useSearch';
import TrackCard from '../../shared/components/TrackCard';
import './SearchResults.css';
import { Link, useSearchParams } from 'react-router-dom';

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const { results, loading, error } = useSearch(query);

  if (!query.trim()) return <p className="search__hint">Введите запрос</p>;
  if (loading) return <p className="search__hint">Поиск...</p>;
  if (error) return <p className="search__error">{error}</p>;
  if (!results) return null;

  const { tracks, artists, albums } = results;
  const isEmpty = tracks.length === 0 && artists.length === 0 && albums.length === 0;

  if (isEmpty) return <p className="search__hint">Ничего не найдено</p>;

  return (
    <div className="search-results">
      {tracks.length > 0 && (
        <section className="search-results__section">
          <h2>Треки</h2>
          {tracks.map((t) => (
            <TrackCard key={t.id} track={t} />
          ))}
        </section>
      )}

      {artists.length > 0 && (
        <section className="search-results__section">
          <h2>Артисты</h2>
          <ul className="search-results__list">
            {artists.map((a) => (
              <li key={a.id} className="search-results__row">
                <span className="search-results__name">{a.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {albums.length > 0 && (
        <section className="search-results__section">
          <h2>Альбомы</h2>
          <ul className="search-results__list">
            {albums.map((a) => (
              <li key={a.id}>
                <Link to={`/albums/${a.id}`} className="search-results__row search-results__row--link">
                    <span className="search-results__name">{a.name}</span>
                    <span className="search-results__sub">{a.artistName}</span>
                </Link>
                </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}