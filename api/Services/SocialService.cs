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
    Task<List<FollowUserItemDto>> GetFollowersAsync(ulong userId);
    Task<List<FollowUserItemDto>> GetFollowingAsync(ulong userId);
}

public class SocialService : ISocialService
{
    private readonly CoopProjectContext _db;

    public SocialService(CoopProjectContext db) => _db = db;

    // POST /users/{id}/follow
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

        // Если профиль закрыт — заявка в статусе pending, иначе сразу accepted
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

    // DELETE /users/{id}/follow
    public async Task UnfollowAsync(ulong targetUserId, ulong currentUserId)
    {
        var follow = await _db.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == currentUserId && f.FollowingId == targetUserId)
            ?? throw new NotFoundException("Подписка или заявка не найдена");

        _db.Follows.Remove(follow);
        await _db.SaveChangesAsync();
    }

    // PUT /users/{id}/followers/{followerId}
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

    public async Task<List<FollowUserItemDto>> GetFollowersAsync(ulong userId)
    {
        return await _db.Follows
            .Where(f => f.FollowingId == userId && f.Status == "accepted")
            .Select(f => new FollowUserItemDto(
                f.Follower.Id,
                f.Follower.Nickname,
                f.Follower.Image,
                f.Status,
                f.CreatedAt))
            .ToListAsync();
    }

    public async Task<List<FollowUserItemDto>> GetFollowingAsync(ulong userId)
    {
        return await _db.Follows
            .Where(f => f.FollowerId == userId && f.Status == "accepted")
            .Select(f => new FollowUserItemDto(
                f.Following.Id,
                f.Following.Nickname,
                f.Following.Image,
                f.Status,
                f.CreatedAt))
            .ToListAsync();
    }
}
