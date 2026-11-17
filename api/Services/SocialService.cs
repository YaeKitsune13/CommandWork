using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface ISocialService
{
    Task<FollowResponseDto> FollowAsync(ulong targetUserId, ulong currentUserId);
    Task UnfollowAsync(ulong targetUserId, ulong currentUserId);
    Task AcceptFollowAsync(ulong targetUserId, ulong followerId, ulong currentUserId);
    Task RejectOrRemoveFollowerAsync(ulong targetUserId, ulong followerId, ulong currentUserId);
    Task<PagedResult<FollowUserItemDto>> GetFollowersAsync(ulong userId, int page = 1, int pageSize = 20);
    Task<PagedResult<FollowUserItemDto>> GetFollowingAsync(ulong userId, int page = 1, int pageSize = 20);
    Task<PagedResult<FollowUserItemDto>> GetFollowRequestsAsync(ulong userId, ulong currentUserId, int page = 1, int pageSize = 20);
}

public class SocialService : ISocialService
{
    private readonly CoopProjectContext _db;

    public SocialService(CoopProjectContext db) => _db = db;

    public async Task<FollowResponseDto> FollowAsync(ulong targetUserId, ulong currentUserId)
    {
        if (targetUserId == currentUserId)
            throw new BadRequestException("Нельзя подписаться на самого себя");

        var targetUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == targetUserId && u.DeletedAt == null)
            ?? throw new NotFoundException("Пользователь не найден");

        if (targetUser.IsBlocked)
            throw new BadRequestException("Пользователь заблокирован");

        var existing = await _db.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == currentUserId && f.FollowingId == targetUserId);

        if (existing is not null)
        {
            if (existing.Status == "accepted")
                throw new ConflictException("Вы уже подписаны на этого пользователя");
            throw new ConflictException("Заявка на подписку уже ожидает подтверждения");
        }

        var status = targetUser.Privacy == "private" ? "pending" : "accepted";

        var follow = new Follow
        {
            FollowerId = currentUserId,
            FollowingId = targetUserId,
            Status = status,
            CreatedAt = DateTime.UtcNow
        };

        _db.Follows.Add(follow);
        await _db.SaveChangesAsync();

        return new FollowResponseDto(follow.FollowerId, follow.FollowingId, follow.Status, follow.CreatedAt);
    }

    public async Task UnfollowAsync(ulong targetUserId, ulong currentUserId)
    {
        var follow = await _db.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == currentUserId && f.FollowingId == targetUserId)
            ?? throw new NotFoundException("Подписка или заявка не найдена");

        _db.Follows.Remove(follow);
        await _db.SaveChangesAsync();
    }

    public async Task AcceptFollowAsync(ulong targetUserId, ulong followerId, ulong currentUserId)
    {
        if (targetUserId != currentUserId)
            throw new ForbiddenException("Подтверждать заявки может только владелец профиля");

        var follow = await _db.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == targetUserId)
            ?? throw new NotFoundException("Заявка на подписку не найдена");

        if (follow.Status == "accepted")
            throw new BadRequestException("Подписка уже принята");

        follow.Status = "accepted";
        await _db.SaveChangesAsync();
    }

    public async Task RejectOrRemoveFollowerAsync(ulong targetUserId, ulong followerId, ulong currentUserId)
    {
        if (targetUserId != currentUserId)
            throw new ForbiddenException("Управлять подписчиками может только владелец профиля");

        var follow = await _db.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == targetUserId)
            ?? throw new NotFoundException("Подписчик или заявка не найдены");

        _db.Follows.Remove(follow);
        await _db.SaveChangesAsync();
    }

    public async Task<PagedResult<FollowUserItemDto>> GetFollowersAsync(ulong userId, int page = 1, int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Follows.Where(f => f.FollowingId == userId && f.Status == "accepted");
        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FollowUserItemDto(
                new UserBriefDto(f.Follower.Id, f.Follower.Nickname, f.Follower.Image),
                f.Status,
                f.CreatedAt))
            .ToListAsync();

        return new PagedResult<FollowUserItemDto>(items, page, pageSize, total);
    }

    public async Task<PagedResult<FollowUserItemDto>> GetFollowingAsync(ulong userId, int page = 1, int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Follows.Where(f => f.FollowerId == userId && f.Status == "accepted");
        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FollowUserItemDto(
                new UserBriefDto(f.Following.Id, f.Following.Nickname, f.Following.Image),
                f.Status,
                f.CreatedAt))
            .ToListAsync();

        return new PagedResult<FollowUserItemDto>(items, page, pageSize, total);
    }

    public async Task<PagedResult<FollowUserItemDto>> GetFollowRequestsAsync(ulong userId, ulong currentUserId, int page = 1, int pageSize = 20)
    {
        if (userId != currentUserId)
            throw new ForbiddenException("Заявки в подписчики видит только владелец профиля");

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Follows.Where(f => f.FollowingId == userId && f.Status == "pending");
        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FollowUserItemDto(
                new UserBriefDto(f.Follower.Id, f.Follower.Nickname, f.Follower.Image),
                f.Status,
                f.CreatedAt))
            .ToListAsync();

        return new PagedResult<FollowUserItemDto>(items, page, pageSize, total);
    }
}
