using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IAdminService
{
    Task<PagedResult<UserProfileDto>> GetUsersAsync(string? search, int page, int pageSize);
    Task ChangeUserRoleAsync(ulong userId, string role);
    Task SetUserBlockAsync(ulong userId, bool isBlocked);
    Task<List<GenreDto>> GetGenresAsync();
    Task<GenreDto> CreateGenreAsync(CreateGenreDto dto);
    Task<GenreDto> UpdateGenreAsync(ulong id, UpdateGenreDto dto);
    Task DeleteGenreAsync(ulong id);
    Task<AdminAnalyticsDto> GetAnalyticsAsync();
}

public class AdminService : IAdminService
{
    private readonly CoopProjectContext _db;

    public AdminService(CoopProjectContext db) => _db = db;

    // GET /admin/users
    public async Task<PagedResult<UserProfileDto>> GetUsersAsync(string? search, int page, int pageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Users.Where(u => u.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(u => u.Email.ToLower().Contains(s) || (u.Nickname != null && u.Nickname.ToLower().Contains(s)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserProfileDto(
                u.Id,
                u.Nickname,
                u.Image,
                u.Privacy,
                u.Role,
                u.Email,
                u.Phone,
                u.CreatedAt))
            .ToListAsync();

        return new PagedResult<UserProfileDto>(items, page, pageSize, total);
    }

    // PATCH /admin/users/{id}/role
    public async Task ChangeUserRoleAsync(ulong userId, string role)
    {
        if (role is not ("user" or "moderator" or "admin"))
            throw new BadRequestException("Роль может быть только user, moderator или admin");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null)
            ?? throw new NotFoundException("Пользователь не найден");

        user.Role = role;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    // PATCH /admin/users/{id}/block
    public async Task SetUserBlockAsync(ulong userId, bool isBlocked)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null)
            ?? throw new NotFoundException("Пользователь не найден");

        user.IsBlocked = isBlocked;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    // Жанры (CRUD)
    public async Task<List<GenreDto>> GetGenresAsync() =>
        await _db.MusicGenres
            .OrderBy(g => g.Name)
            .Select(g => new GenreDto(g.Id, g.Name))
            .ToListAsync();

    public async Task<GenreDto> CreateGenreAsync(CreateGenreDto dto)
    {
        var trimmed = dto.Name.Trim();
        if (await _db.MusicGenres.AnyAsync(g => g.Name.ToLower() == trimmed.ToLower()))
            throw new ConflictException("Такой жанр уже существует");

        var genre = new MusicGenre { Name = trimmed };
        _db.MusicGenres.Add(genre);
        await _db.SaveChangesAsync();

        return new GenreDto(genre.Id, genre.Name);
    }

    public async Task<GenreDto> UpdateGenreAsync(ulong id, UpdateGenreDto dto)
    {
        var genre = await _db.MusicGenres.FindAsync(id)
            ?? throw new NotFoundException("Жанр не найден");

        var trimmed = dto.Name.Trim();
        if (await _db.MusicGenres.AnyAsync(g => g.Name.ToLower() == trimmed.ToLower() && g.Id != id))
            throw new ConflictException("Жанр с таким именем уже существует");

        genre.Name = trimmed;
        await _db.SaveChangesAsync();

        return new GenreDto(genre.Id, genre.Name);
    }

    public async Task DeleteGenreAsync(ulong id)
    {
        var genre = await _db.MusicGenres.FindAsync(id)
            ?? throw new NotFoundException("Жанр не найден");

        _db.MusicGenres.Remove(genre);
        await _db.SaveChangesAsync();
    }

    // GET /admin/analytics
    public async Task<AdminAnalyticsDto> GetAnalyticsAsync()
    {
        var totalUsers = await _db.Users.CountAsync(u => u.DeletedAt == null);
        var totalTracks = await _db.Musics.CountAsync(m => m.DeletedAt == null && m.Status == "approved");
        var totalListens = await _db.UserListeneds.CountAsync();
        var pendingTracks = await _db.Musics.CountAsync(m => m.DeletedAt == null && m.Status == "pending");
        var pendingComplaints = await _db.Complaints.CountAsync(c => c.Status == "pending");

        return new AdminAnalyticsDto(totalUsers, totalTracks, totalListens, pendingTracks, pendingComplaints);
    }
}
