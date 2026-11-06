using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface ILikeService
{
    Task<ReactionSummaryDto> SetReactionAsync(ulong musicId, ulong userId, string type);
    Task<ReactionSummaryDto> RemoveReactionAsync(ulong musicId, ulong userId);
    Task<ReactionSummaryDto> GetSummaryAsync(ulong musicId, ulong? userId);
    Task<PagedResult<TrackResponseDto>> GetLikedAsync(ulong userId, int page = 1, int pageSize = 20);
}

public class LikeService : ILikeService
{
    private readonly CoopProjectContext _db;
    public LikeService(CoopProjectContext db) => _db = db;

    public async Task<ReactionSummaryDto> SetReactionAsync(ulong musicId, ulong userId, string type)
    {
        type = type?.Trim().ToLowerInvariant() ?? "";
        if (type is not ("like" or "dislike"))
            throw new BadRequestException("Реакция должна быть like или dislike");

        await EnsureTrackAsync(musicId);

        var reaction = await _db.UserLikes.FirstOrDefaultAsync(l => l.UserId == userId && l.MusicId == musicId);
        if (reaction is null)
        {
            _db.UserLikes.Add(new UserLike
            {
                UserId = userId,
                MusicId = musicId,
                Type = type,
                CreatedAt = DateTime.UtcNow
            });
        }
        else if (reaction.Type != type)
        {
            reaction.Type = type;
            reaction.CreatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return await GetSummaryAsync(musicId, userId);
    }

    public async Task<ReactionSummaryDto> RemoveReactionAsync(ulong musicId, ulong userId)
    {
        await EnsureTrackAsync(musicId);

        var reaction = await _db.UserLikes.FirstOrDefaultAsync(l => l.UserId == userId && l.MusicId == musicId);
        if (reaction is not null)
        {
            _db.UserLikes.Remove(reaction);
            await _db.SaveChangesAsync();
        }

        return await GetSummaryAsync(musicId, userId);
    }

    public async Task<ReactionSummaryDto> GetSummaryAsync(ulong musicId, ulong? userId)
    {
        await EnsureTrackAsync(musicId);

        var counts = await _db.UserLikes
            .Where(l => l.MusicId == musicId)
            .GroupBy(l => l.Type)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync();

        string? mine = null;
        if (userId is not null)
        {
            var uid = userId.Value;
            mine = await _db.UserLikes
                .Where(l => l.MusicId == musicId && l.UserId == uid)
                .Select(l => l.Type)
                .FirstOrDefaultAsync();
        }

        return new ReactionSummaryDto(
            musicId,
            counts.FirstOrDefault(c => c.Type == "like")?.Count ?? 0,
            counts.FirstOrDefault(c => c.Type == "dislike")?.Count ?? 0,
            mine);
    }

    public async Task<PagedResult<TrackResponseDto>> GetLikedAsync(ulong userId, int page = 1, int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.UserLikes
            .AsNoTracking()
            .Include(l => l.Music).ThenInclude(m => m.Owner)
            .Include(l => l.Music).ThenInclude(m => m.Album)
            .Include(l => l.Music).ThenInclude(m => m.Genres)
            .Include(l => l.Music).ThenInclude(m => m.UserLikes)
            .Where(l => l.UserId == userId && l.Type == "like" && l.Music.DeletedAt == null && l.Music.Status == "approved");

        var total = await query.CountAsync();
        var likes = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = likes.Select(l => TrackService.ToDto(l.Music, userId)).ToList();
        return new PagedResult<TrackResponseDto>(items, page, pageSize, total);
    }

    private async Task EnsureTrackAsync(ulong musicId)
    {
        if (!await _db.Musics.AnyAsync(m => m.Id == musicId && m.DeletedAt == null))
            throw new NotFoundException("Трек не найден");
    }
}
