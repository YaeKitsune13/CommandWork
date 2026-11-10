using api.Data;
using api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IDiscoveryService
{
    Task<SearchResultDto> SearchAsync(string? query, ulong? currentUserId = null, int limit = 10);
    Task<List<ChartItemDto>> GetChartsAsync(string? period, ulong? genreId, int limit, ulong? currentUserId = null);
    Task<List<TrackResponseDto>> GetRecommendationsAsync(ulong? currentUserId, int limit);
}

public class DiscoveryService : IDiscoveryService
{
    private readonly CoopProjectContext _db;

    public DiscoveryService(CoopProjectContext db) => _db = db;

    public async Task<SearchResultDto> SearchAsync(string? query, ulong? currentUserId = null, int limit = 10)
    {
        if (string.IsNullOrWhiteSpace(query))
            return new SearchResultDto(new(), new(), new(), new());

        limit = Math.Clamp(limit, 1, 50);
        var q = query.Trim().ToLower();

        var tracks = await _db.Musics
            .AsNoTracking()
            .Include(m => m.Owner)
            .Include(m => m.Album)
            .Include(m => m.Genres)
            .Include(m => m.UserLikes)
            .Where(m => m.DeletedAt == null && m.Status == "approved" &&
                        (m.Name.ToLower().Contains(q) || m.Owner.Nickname.ToLower().Contains(q)))
            .Take(limit)
            .ToListAsync();

        var users = await _db.Users
            .AsNoTracking()
            .Where(u => u.DeletedAt == null && !u.IsBlocked && u.Nickname.ToLower().Contains(q))
            .Take(limit)
            .Select(u => new UserBriefDto(u.Id, u.Nickname, u.Image))
            .ToListAsync();

        var albums = await _db.Albums
            .AsNoTracking()
            .Include(a => a.Owner)
            .Include(a => a.Musics)
            .Where(a => a.Name.ToLower().Contains(q) || a.Owner.Nickname.ToLower().Contains(q))
            .Take(limit)
            .ToListAsync();

        var playlists = await _db.Playlists
            .AsNoTracking()
            .Include(p => p.User)
            .Include(p => p.PlaylistTracks).ThenInclude(t => t.Music)
            .Where(p => p.DeletedAt == null && p.Privacy == "public" && p.Name.ToLower().Contains(q))
            .Take(limit)
            .ToListAsync();

        return new SearchResultDto(
            tracks.Select(m => TrackService.ToDto(m, currentUserId)).ToList(),
            users,
            albums.Select(a => AlbumService.ToDto(a, withTracks: false)).ToList(),
            playlists.Select(p => PlaylistsService.ToDto(p, withDetails: false, currentUserId)).ToList()
        );
    }

    public async Task<List<ChartItemDto>> GetChartsAsync(string? period, ulong? genreId, int limit, ulong? currentUserId = null)
    {
        limit = Math.Clamp(limit, 1, 100);

        var fromDate = period?.ToLower() switch
        {
            "day" => DateTime.UtcNow.AddDays(-1),
            "week" => DateTime.UtcNow.AddDays(-7),
            "month" => DateTime.UtcNow.AddMonths(-1),
            _ => DateTime.MinValue
        };

        var query = _db.UserListeneds
            .Where(l => l.ListenedAt >= fromDate && l.Music.DeletedAt == null && l.Music.Status == "approved");

        if (genreId.HasValue)
            query = query.Where(l => l.Music.Genres.Any(g => g.Id == genreId.Value));

        var top = await query
            .GroupBy(l => l.MusicId)
            .Select(g => new { MusicId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        var musicIds = top.Select(t => t.MusicId).ToList();
        var musicInfo = await _db.Musics
            .AsNoTracking()
            .Where(m => musicIds.Contains(m.Id))
            .Include(m => m.Owner)
            .Include(m => m.Album)
            .Include(m => m.Genres)
            .Include(m => m.UserLikes)
            .ToDictionaryAsync(m => m.Id);

        var result = new List<ChartItemDto>();
        var rank = 1;

        foreach (var item in top)
        {
            if (musicInfo.TryGetValue(item.MusicId, out var m))
            {
                result.Add(new ChartItemDto(
                    rank++,
                    item.Count,
                    TrackService.ToDto(m, currentUserId)));
            }
        }

        return result;
    }

    public async Task<List<TrackResponseDto>> GetRecommendationsAsync(ulong? currentUserId, int limit)
    {
        limit = Math.Clamp(limit, 1, 50);

        var baseTracks = _db.Musics
            .AsNoTracking()
            .Include(m => m.Owner)
            .Include(m => m.Album)
            .Include(m => m.Genres)
            .Include(m => m.UserLikes)
            .Where(m => m.DeletedAt == null && m.Status == "approved");

        if (currentUserId is null)
        {
            var popular = await baseTracks
                .OrderByDescending(m => m.UserListeneds.Count)
                .Take(limit)
                .ToListAsync();

            return popular.Select(m => TrackService.ToDto(m, null)).ToList();
        }

        var uid = currentUserId.Value;

        var preferredGenreIds = await _db.UserListeneds
            .Where(l => l.UserId == uid)
            .SelectMany(l => l.Music.Genres.Select(g => g.Id))
            .Distinct()
            .Take(10)
            .ToListAsync();

        var listenedTrackIds = await _db.UserListeneds
            .Where(l => l.UserId == uid)
            .Select(l => l.MusicId)
            .Distinct()
            .ToListAsync();

        var recommended = await baseTracks
            .Where(m => !listenedTrackIds.Contains(m.Id))
            .Where(m => m.Genres.Any(g => preferredGenreIds.Contains(g.Id)))
            .OrderByDescending(m => m.UserLikes.Count(ul => ul.Type == "like"))
            .Take(limit)
            .ToListAsync();

        if (recommended.Count < limit)
        {
            var existingIds = recommended.Select(r => r.Id).ToList();
            var fallback = await baseTracks
                .Where(m => !existingIds.Contains(m.Id))
                .OrderByDescending(m => m.UserListeneds.Count)
                .Take(limit - recommended.Count)
                .ToListAsync();

            recommended.AddRange(fallback);
        }

        return recommended.Select(m => TrackService.ToDto(m, uid)).ToList();
    }
}
