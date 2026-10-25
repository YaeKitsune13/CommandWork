using api.Data;
using api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IDiscoveryService
{
    Task<SearchResultDto> SearchAsync(string query);
    Task<List<ChartItemDto>> GetChartsAsync(string? period, ulong? genreId, int limit);
    Task<List<TrackSearchDto>> GetRecommendationsAsync(ulong? currentUserId, int limit);
}

public class DiscoveryService : IDiscoveryService
{
    private readonly CoopProjectContext _db;

    public DiscoveryService(CoopProjectContext db) => _db = db;

    // GET /search?query=...
    public async Task<SearchResultDto> SearchAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return new SearchResultDto(new(), new(), new());

        var q = query.Trim().ToLower();

        var tracks = await _db.Musics
            .Where(m => m.DeletedAt == null && m.Status == "approved" && m.Name.ToLower().Contains(q))
            .Take(20)
            .Select(m => new TrackSearchDto(m.Id, m.Name, m.Artist.Name, m.Image, m.DurationSec))
            .ToListAsync();

        var artists = await _db.Artists
            .Where(a => a.Name.ToLower().Contains(q))
            .Take(10)
            .Select(a => new ArtistSearchDto(a.Id, a.Name, a.Image))
            .ToListAsync();

        var albums = await _db.Albums
            .Where(a => a.Name.ToLower().Contains(q))
            .Take(10)
            .Select(a => new AlbumSearchDto(a.Id, a.Name, a.Image, a.Artist.Name))
            .ToListAsync();

        return new SearchResultDto(tracks, artists, albums);
    }

    // GET /charts?period=week&genreId=1
    public async Task<List<ChartItemDto>> GetChartsAsync(string? period, ulong? genreId, int limit)
    {
        limit = Math.Clamp(limit, 1, 100);

        var fromDate = period?.ToLower() switch
        {
            "day" => DateTime.UtcNow.AddDays(-1),
            "week" => DateTime.UtcNow.AddDays(-7),
            "month" => DateTime.UtcNow.AddMonths(-1),
            _ => DateTime.MinValue // "all"
        };

        var query = _db.UserListeneds
            .Where(l => l.ListenedAt >= fromDate && l.Music.DeletedAt == null && l.Music.Status == "approved");

        if (genreId.HasValue)
        {
            query = query.Where(l => l.Music.Genres.Any(g => g.Id == genreId.Value));
        }

        var top = await query
            .GroupBy(l => l.MusicId)
            .Select(g => new { MusicId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        var musicIds = top.Select(t => t.MusicId).ToList();
        var musicInfo = await _db.Musics
            .Where(m => musicIds.Contains(m.Id))
            .Include(m => m.Artist)
            .ToDictionaryAsync(m => m.Id);

        var result = new List<ChartItemDto>();
        var rank = 1;

        foreach (var item in top)
        {
            if (musicInfo.TryGetValue(item.MusicId, out var m))
            {
                result.Add(new ChartItemDto(
                    rank++,
                    m.Id,
                    m.Name,
                    m.Artist.Name,
                    m.Image,
                    m.DurationSec,
                    item.Count));
            }
        }

        return result;
    }

    // GET /recommendations
    public async Task<List<TrackSearchDto>> GetRecommendationsAsync(ulong? currentUserId, int limit)
    {
        limit = Math.Clamp(limit, 1, 50);

        // Для неавторизованных отдаем просто популярные треки
        if (currentUserId is null)
        {
            return await _db.Musics
                .Where(m => m.DeletedAt == null && m.Status == "approved")
                .OrderByDescending(m => m.UserListeneds.Count)
                .Take(limit)
                .Select(m => new TrackSearchDto(m.Id, m.Name, m.Artist.Name, m.Image, m.DurationSec))
                .ToListAsync();
        }

        var uid = currentUserId.Value;

        // 1. Собираем жанры, которые юзер слушал или лайкал
        var preferredGenreIds = await _db.UserListeneds
            .Where(l => l.UserId == uid)
            .SelectMany(l => l.Music.Genres.Select(g => g.Id))
            .Distinct()
            .Take(10)
            .ToListAsync();

        // 2. Треки, которые юзер уже слушал
        var listenedTrackIds = await _db.UserListeneds
            .Where(l => l.UserId == uid)
            .Select(l => l.MusicId)
            .Distinct()
            .ToListAsync();

        // 3. Выбираем треки из любимых жанров, которые юзер ещё не слушал
        var recommended = await _db.Musics
            .Where(m => m.DeletedAt == null && m.Status == "approved")
            .Where(m => !listenedTrackIds.Contains(m.Id))
            .Where(m => m.Genres.Any(g => preferredGenreIds.Contains(g.Id)))
            .OrderByDescending(m => m.UserLikes.Count(ul => ul.Type == "like"))
            .Take(limit)
            .Select(m => new TrackSearchDto(m.Id, m.Name, m.Artist.Name, m.Image, m.DurationSec))
            .ToListAsync();

        // Если рекомендаций мало — добираем просто популярными треками
        if (recommended.Count < limit)
        {
            var fallback = await _db.Musics
                .Where(m => m.DeletedAt == null && m.Status == "approved")
                .Where(m => !recommended.Select(r => r.Id).Contains(m.Id))
                .OrderByDescending(m => m.UserListeneds.Count)
                .Take(limit - recommended.Count)
                .Select(m => new TrackSearchDto(m.Id, m.Name, m.Artist.Name, m.Image, m.DurationSec))
                .ToListAsync();

            recommended.AddRange(fallback);
        }

        return recommended;
    }
}
