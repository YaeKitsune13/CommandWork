using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IUserService
{
    Task<PagedResult<UserBriefDto>> SearchUsersAsync(string? search, int page, int pageSize);
    Task<UserProfileDto> GetProfileAsync(ulong id, ulong? viewerId, string? viewerRole);
    Task<UserProfileDto> UpdateProfileAsync(ulong id, UpdateProfileDto dto, ulong currentUserId, string currentRole);
    Task ChangePasswordAsync(ulong id, ChangePasswordDto dto, ulong currentUserId);
    Task<PagedResult<HistoryItemDto>> GetHistoryAsync(ulong id, ulong currentUserId, string currentRole, int page, int pageSize);
    Task RecordListenAsync(ulong userId, ulong musicId, ulong currentUserId);
}

public class UserService : IUserService
{
    private readonly CoopProjectContext _db;
    private readonly PasswordHasher<User> _hasher = new();

    public UserService(CoopProjectContext db) => _db = db;

    public async Task<PagedResult<UserBriefDto>> SearchUsersAsync(string? search, int page, int pageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Users.AsNoTracking()
            .Where(u => u.DeletedAt == null && !u.IsBlocked);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(u => u.Nickname.ToLower().Contains(s));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserBriefDto(u.Id, u.Nickname, u.Image))
            .ToListAsync();

        return new PagedResult<UserBriefDto>(items, page, pageSize, total);
    }

    public async Task<UserProfileDto> GetProfileAsync(ulong id, ulong? viewerId, string? viewerRole)
    {
        var user = await FindActiveAsync(id);

        var isOwner = viewerId == id;
        var isStaff = viewerRole is "moderator" or "admin";

        string? followStatus = null;
        if (viewerId.HasValue && !isOwner)
        {
            followStatus = await _db.Follows
                .Where(f => f.FollowerId == viewerId.Value && f.FollowingId == id)
                .Select(f => f.Status)
                .FirstOrDefaultAsync();
        }

        var isAcceptedFollower = followStatus == "accepted";

        if (user.Privacy == "private" && !isOwner && !isStaff && !isAcceptedFollower)
        {
            return new UserProfileDto(
                user.Id, user.Nickname, user.Image, user.Privacy,
                null, null, null, null,
                Stats: null, FollowStatus: followStatus, IsMe: false, IsRestricted: true);
        }

        var tracksCount = await _db.Musics.CountAsync(m => m.OwnerId == id && m.DeletedAt == null && m.Status == "approved");
        var followersCount = await _db.Follows.CountAsync(f => f.FollowingId == id && f.Status == "accepted");
        var followingCount = await _db.Follows.CountAsync(f => f.FollowerId == id && f.Status == "accepted");

        var seeContacts = isOwner || isStaff;
        return new UserProfileDto(
            user.Id,
            user.Nickname,
            user.Image,
            user.Privacy,
            user.Role,
            seeContacts ? user.Email : null,
            seeContacts ? user.Phone : null,
            user.CreatedAt,
            new UserStatsDto(tracksCount, followersCount, followingCount),
            followStatus,
            IsMe: isOwner,
            IsRestricted: false,
            IsBlocked: user.IsBlocked);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(
        ulong id, UpdateProfileDto dto, ulong currentUserId, string currentRole)
    {
        if (currentUserId != id && currentRole != "admin")
            throw new ForbiddenException("Можно редактировать только свой профиль");

        var user = await FindActiveAsync(id);

        if (dto.Email is not null && dto.Email != user.Email)
        {
            if (!dto.Email.Contains('@'))
                throw new BadRequestException("Некорректный email");
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
                throw new ConflictException("Email занят");
            user.Email = dto.Email.Trim();
        }

        if (dto.Phone is not null && dto.Phone != user.Phone)
        {
            var phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();
            if (phone != null && await _db.Users.AnyAsync(u => u.Phone == phone && u.Id != id))
                throw new ConflictException("Телефон занят");
            user.Phone = phone;
        }

        if (dto.Nickname is not null && dto.Nickname != user.Nickname)
        {
            var nick = dto.Nickname.Trim();
            if (nick.Length < 2 || nick.Length > 100)
                throw new BadRequestException("Никнейм должен быть от 2 до 100 символов");
            if (await _db.Users.AnyAsync(u => u.Nickname == nick && u.Id != id))
                throw new ConflictException("Никнейм занят");
            user.Nickname = nick;
        }

        if (dto.Image is not null)
            user.Image = dto.Image;

        if (dto.Privacy is not null)
        {
            if (dto.Privacy is not ("public" or "private"))
                throw new BadRequestException("Приватность: public или private");
            user.Privacy = dto.Privacy;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetProfileAsync(id, currentUserId, currentRole);
    }

    public async Task ChangePasswordAsync(ulong id, ChangePasswordDto dto, ulong currentUserId)
    {
        if (currentUserId != id)
            throw new ForbiddenException("Менять пароль можно только себе");

        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
            throw new BadRequestException("Новый пароль минимум 6 символов");

        var user = await FindActiveAsync(id);

        var check = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.OldPassword);
        if (check == PasswordVerificationResult.Failed)
            throw new BadRequestException("Старый пароль неверен");

        user.PasswordHash = _hasher.HashPassword(user, dto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<PagedResult<HistoryItemDto>> GetHistoryAsync(
        ulong id, ulong currentUserId, string currentRole, int page, int pageSize)
    {
        if (currentUserId != id && currentRole != "admin")
            throw new ForbiddenException("История доступна только владельцу");

        await FindActiveAsync(id);

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.UserListeneds
            .AsNoTracking()
            .Include(h => h.Music).ThenInclude(m => m.Owner)
            .Include(h => h.Music).ThenInclude(m => m.Album)
            .Include(h => h.Music).ThenInclude(m => m.Genres)
            .Include(h => h.Music).ThenInclude(m => m.UserLikes)
            .Where(h => h.UserId == id && h.Music.DeletedAt == null);

        var total = await query.CountAsync();

        var records = await query
            .OrderByDescending(h => h.ListenedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = records.Select(h => new HistoryItemDto(
            h.Id,
            h.ListenedAt,
            TrackService.ToDto(h.Music, currentUserId)
        )).ToList();

        return new PagedResult<HistoryItemDto>(items, page, pageSize, total);
    }

    public async Task RecordListenAsync(ulong userId, ulong musicId, ulong currentUserId)
    {
        if (currentUserId != userId)
            throw new ForbiddenException("Можно записывать только свою историю");

        if (!await _db.Musics.AnyAsync(m => m.Id == musicId && m.DeletedAt == null && m.Status == "approved"))
            throw new NotFoundException("Трек не найден");

        var since = DateTime.UtcNow.AddSeconds(-30);
        if (await _db.UserListeneds.AnyAsync(l => l.UserId == userId && l.MusicId == musicId && l.ListenedAt >= since))
            return;

        _db.UserListeneds.Add(new UserListened
        {
            UserId = userId,
            MusicId = musicId,
            ListenedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    private async Task<User> FindActiveAsync(ulong id) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.DeletedAt == null)
        ?? throw new NotFoundException("Пользователь не найден");
}
