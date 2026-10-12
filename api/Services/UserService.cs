using api.Data;
using api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(ulong id, ulong? viewerId, string? viewerRole);
    Task<UserProfileDto> UpdateProfileAsync(ulong id, UpdateProfileDto dto, ulong currentUserId, string currentRole);
    Task ChangePasswordAsync(ulong id, ChangePasswordDto dto, ulong currentUserId);
    Task<PagedResult<HistoryItemDto>> GetHistoryAsync(ulong id, ulong currentUserId, string currentRole, int page, int pageSize);
}

public class UserService : IUserService
{
    private readonly CoopProjectContext _db;
    private readonly PasswordHasher<User> _hasher = new();

    public UserService(CoopProjectContext db) => _db = db;

    // GET /users/{id}
    public async Task<UserProfileDto> GetProfileAsync(ulong id, ulong? viewerId, string? viewerRole)
    {
        var user = await FindActiveAsync(id);

        var isOwner = viewerId == id;
        var isStaff = viewerRole is "moderator" or "admin";

        if (user.Privacy == "private" && !isOwner && !isStaff)
            return new UserProfileDto(user.Id, user.Nickname, user.Image, user.Privacy,
                null, null, null, null);

        var seeContacts = isOwner || isStaff;
        return new UserProfileDto(user.Id, user.Nickname, user.Image, user.Privacy,
            user.Role,
            seeContacts ? user.Email : null,
            seeContacts ? user.Phone : null,
            user.CreatedAt);
    }

    // PUT /users/{id}
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
            user.Email = dto.Email;
        }

        if (dto.Phone is not null && dto.Phone != user.Phone)
        {
            if (await _db.Users.AnyAsync(u => u.Phone == dto.Phone && u.Id != id))
                throw new ConflictException("Телефон занят");
            user.Phone = dto.Phone;
        }

        if (dto.Nickname is not null && dto.Nickname != user.Nickname)
        {
            if (await _db.Users.AnyAsync(u => u.Nickname == dto.Nickname && u.Id != id))
                throw new ConflictException("Никнейм занят");
            user.Nickname = dto.Nickname;
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

        return new UserProfileDto(user.Id, user.Nickname, user.Image, user.Privacy,
            user.Role, user.Email, user.Phone, user.CreatedAt);
    }

    // PUT /users/{id}/password
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

    // GET /users/{id}/history
    public async Task<PagedResult<HistoryItemDto>> GetHistoryAsync(
        ulong id, ulong currentUserId, string currentRole, int page, int pageSize)
    {
        if (currentUserId != id && currentRole != "admin")
            throw new ForbiddenException("История доступна только владельцу");

        await FindActiveAsync(id);

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.UserListeneds
            .Where(h => h.UserId == id && h.Music.DeletedAt == null);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(h => h.ListenedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new HistoryItemDto(
                h.Id,
                h.MusicId,
                h.Music.Name,
                h.Music.Artist.Name,
                h.Music.DurationSec,
                h.ListenedAt))
            .ToListAsync();

        return new PagedResult<HistoryItemDto>(items, page, pageSize, total);
    }

    // Пользователь, который существует и не удалён
    private async Task<User> FindActiveAsync(ulong id) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.DeletedAt == null)
        ?? throw new NotFoundException("Пользователь не найден");
}
