using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IAlbumService
{
    Task<AlbumResponseDto> CreateAsync(AlbumCreateDto dto, ulong userId);
    Task<AlbumResponseDto> GetAsync(ulong id, ulong? viewerId = null, string? viewerRole = null);
    Task<PagedResult<AlbumResponseDto>> GetAllAsync(string? search, ulong? ownerId, int page, int pageSize);
    Task<AlbumResponseDto> EditAsync(ulong id, AlbumEditDto dto, ulong currentUserId, string currentRole);
    Task DeleteAsync(ulong id, ulong currentUserId, string currentRole);
}

public class AlbumService : IAlbumService
{
    private readonly CoopProjectContext _db;
    private readonly string _webRoot;

    public AlbumService(CoopProjectContext db, IWebHostEnvironment env)
    {
        _db = db;
        _webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
    }

    public async Task<AlbumResponseDto> CreateAsync(AlbumCreateDto dto, ulong userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null)
            ?? throw new NotFoundException("Пользователь не найден");

        string? imageUrl = null;
        if (dto.Image is { Length: > 0 })
            imageUrl = await SaveFileAsync(dto.Image, "albums");

        var album = new Album
        {
            Name = dto.Name.Trim(),
            Image = imageUrl,
            OwnerId = userId,
            ReleaseDate = dto.ReleaseDate,
            CreatedAt = DateTime.UtcNow
        };

        _db.Albums.Add(album);
        await _db.SaveChangesAsync();

        return await GetAsync(album.Id, userId, user.Role);
    }

    public async Task<AlbumResponseDto> GetAsync(ulong id, ulong? viewerId = null, string? viewerRole = null)
    {
        var album = await _db.Albums
            .Include(a => a.Owner)
            .Include(a => a.Musics.Where(m => m.DeletedAt == null))
                .ThenInclude(m => m.Owner)
            .Include(a => a.Musics.Where(m => m.DeletedAt == null))
                .ThenInclude(m => m.Genres)
            .Include(a => a.Musics.Where(m => m.DeletedAt == null))
                .ThenInclude(m => m.UserLikes)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new NotFoundException("Альбом не найден");

        var canSeeUnapproved = viewerId == album.OwnerId || viewerRole is "moderator" or "admin";
        return ToDto(album, withTracks: true, viewerId, canSeeUnapproved);
    }

    public async Task<PagedResult<AlbumResponseDto>> GetAllAsync(string? search, ulong? ownerId, int page, int pageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Albums
            .Include(a => a.Owner)
            .Include(a => a.Musics)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(a => a.Name.ToLower().Contains(s) || a.Owner.Nickname.ToLower().Contains(s));
        }

        if (ownerId.HasValue)
            query = query.Where(a => a.OwnerId == ownerId.Value);

        var total = await query.CountAsync();
        var albums = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = albums.Select(a => ToDto(a, withTracks: false)).ToList();
        return new PagedResult<AlbumResponseDto>(items, page, pageSize, total);
    }

    public async Task<AlbumResponseDto> EditAsync(ulong id, AlbumEditDto dto, ulong currentUserId, string currentRole)
    {
        var album = await _db.Albums.FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new NotFoundException("Альбом не найден");

        if (album.OwnerId != currentUserId && currentRole != "admin")
            throw new ForbiddenException("Вы не можете редактировать чужой альбом");

        if (!string.IsNullOrWhiteSpace(dto.Name))
            album.Name = dto.Name.Trim();

        if (dto.ReleaseDate.HasValue)
            album.ReleaseDate = dto.ReleaseDate.Value;

        await _db.SaveChangesAsync();
        return await GetAsync(id, currentUserId, currentRole);
    }

    public async Task DeleteAsync(ulong id, ulong currentUserId, string currentRole)
    {
        var album = await _db.Albums.FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new NotFoundException("Альбом не найден");

        if (album.OwnerId != currentUserId && currentRole != "admin")
            throw new ForbiddenException("Вы не можете удалить чужой альбом");

        _db.Albums.Remove(album);
        await _db.SaveChangesAsync();
    }

    private async Task<string> SaveFileAsync(IFormFile file, string folder)
    {
        var dir = Path.Combine(_webRoot, "uploads", folder);
        Directory.CreateDirectory(dir);
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        await using var stream = new FileStream(Path.Combine(dir, fileName), FileMode.Create);
        await file.CopyToAsync(stream);
        return $"/uploads/{folder}/{fileName}";
    }

    public static AlbumResponseDto ToDto(Album a, bool withTracks, ulong? viewerId = null, bool canSeeUnapproved = false)
    {
        var visibleTracks = (a.Musics ?? Array.Empty<Music>())
            .Where(m => m.DeletedAt == null && (canSeeUnapproved || m.Status == "approved"))
            .ToList();

        return new AlbumResponseDto(
            a.Id,
            a.Name,
            a.Owner != null
                ? new UserBriefDto(a.Owner.Id, a.Owner.Nickname, a.Owner.Image)
                : new UserBriefDto(a.OwnerId, "Unknown", null),
            a.Image,
            a.ReleaseDate,
            visibleTracks.Count,
            withTracks
                ? visibleTracks.Select(m => TrackService.ToDto(m, viewerId, canSeeUnapproved)).ToList()
                : null
        );
    }
}
