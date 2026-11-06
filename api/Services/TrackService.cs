using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface ITrackService
{
    Task<PagedResult<TrackResponseDto>> GetCatalogAsync(string? search, ulong? genreId, ulong? albumId, ulong? ownerId, int page, int pageSize, ulong? viewerId);
    Task<PagedResult<TrackResponseDto>> GetByUserAsync(ulong ownerId, string? status, int page, int pageSize, ulong? viewerId, string? viewerRole);
    Task<TrackResponseDto> UploadAsync(TrackUploadDto dto, ulong ownerId);
    Task<TrackResponseDto> GetAsync(ulong id, ulong? viewerId = null, string? viewerRole = null);
    Task<TrackSoundDto> GetSoundAsync(ulong id, ulong? viewerId = null, string? viewerRole = null);
    Task DeleteAsync(ulong id, ulong currentUserId, string currentRole);
    Task<TrackResponseDto> EditAsync(ulong id, TrackEditDto dto, ulong currentUserId, string currentRole);
}

public class TrackService : ITrackService
{
    private static readonly Dictionary<string, string> AudioTypes = new()
    {
        [".mp3"] = "audio/mpeg",
        [".wav"] = "audio/wav",
        [".ogg"] = "audio/ogg",
        [".flac"] = "audio/flac"
    };

    private static readonly HashSet<string> ImageExtensions = new() { ".jpg", ".jpeg", ".png", ".webp" };

    private readonly CoopProjectContext _db;
    private readonly string _webRoot;

    public TrackService(CoopProjectContext db, IWebHostEnvironment env)
    {
        _db = db;
        _webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
    }

    private IQueryable<Music> BaseQuery => _db.Musics
        .Where(m => m.DeletedAt == null)
        .Include(m => m.Owner)
        .Include(m => m.Album)
        .Include(m => m.Genres)
        .Include(m => m.UserLikes)
        .Include(m => m.Comments)
        .Include(m => m.UserListeneds);

    public async Task<PagedResult<TrackResponseDto>> GetCatalogAsync(
        string? search, ulong? genreId, ulong? albumId, ulong? ownerId, int page, int pageSize, ulong? viewerId)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = BaseQuery.AsNoTracking().Where(m => m.Status == "approved");

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(m => m.Name.ToLower().Contains(s) || m.Owner.Nickname.ToLower().Contains(s));
        }

        if (genreId.HasValue)
            query = query.Where(m => m.Genres.Any(g => g.Id == genreId.Value));

        if (albumId.HasValue)
            query = query.Where(m => m.AlbumId == albumId.Value);

        if (ownerId.HasValue)
            query = query.Where(m => m.OwnerId == ownerId.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(m => ToDto(m, viewerId, canSeeInternal: false)).ToList();
        return new PagedResult<TrackResponseDto>(dtos, page, pageSize, total);
    }

    public async Task<PagedResult<TrackResponseDto>> GetByUserAsync(
        ulong ownerId, string? status, int page, int pageSize, ulong? viewerId, string? viewerRole)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == ownerId && u.DeletedAt == null))
            throw new NotFoundException("Пользователь не найден");

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var isOwnerOrStaff = viewerId == ownerId || viewerRole is "moderator" or "admin";
        var query = BaseQuery.AsNoTracking().Where(m => m.OwnerId == ownerId);

        if (!isOwnerOrStaff)
        {
            query = query.Where(m => m.Status == "approved");
        }
        else if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim().ToLowerInvariant();
            query = query.Where(m => m.Status == st);
        }

        var total = await query.CountAsync();
        var tracks = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = tracks.Select(m => ToDto(m, viewerId, isOwnerOrStaff)).ToList();
        return new PagedResult<TrackResponseDto>(dtos, page, pageSize, total);
    }

    public async Task<TrackResponseDto> UploadAsync(TrackUploadDto dto, ulong ownerId)
    {
        if (dto.AudioFile is null || dto.AudioFile.Length == 0)
            throw new BadRequestException("Файл не прикреплён");

        var audioExt = Path.GetExtension(dto.AudioFile.FileName).ToLowerInvariant();
        if (!AudioTypes.ContainsKey(audioExt))
            throw new BadRequestException("Неподдерживаемый формат аудио (mp3, wav, ogg, flac)");

        if (dto.Image != null &&
            !ImageExtensions.Contains(Path.GetExtension(dto.Image.FileName).ToLowerInvariant()))
            throw new BadRequestException("Неподдерживаемый формат картинки (jpg, png, webp)");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == ownerId && u.DeletedAt == null)
            ?? throw new NotFoundException("Пользователь не найден");

        if (user.IsBlocked)
            throw new ForbiddenException("Ваш аккаунт заблокирован", "blocked");

        await ValidateAlbumAsync(dto.AlbumId, ownerId);

        var genres = new List<MusicGenre>();
        if (dto.GenreIds is { Count: > 0 })
        {
            genres = await _db.MusicGenres.Where(g => dto.GenreIds.Contains(g.Id)).ToListAsync();
        }

        var fileUrl = await SaveFileAsync(dto.AudioFile, "music");
        var duration = ReadDuration(fileUrl)
            ?? throw new BadRequestException("Не удалось прочитать аудиофайл");

        var imageUrl = dto.Image is { Length: > 0 } ? await SaveFileAsync(dto.Image, "images") : null;

        var music = new Music
        {
            Name = dto.Name.Trim(),
            OwnerId = ownerId,
            AlbumId = dto.AlbumId,
            FileUrl = fileUrl,
            Image = imageUrl,
            DurationSec = duration,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            Genres = genres
        };

        _db.Musics.Add(music);
        await _db.SaveChangesAsync();

        return await GetAsync(music.Id, ownerId, user.Role);
    }

    public async Task<TrackResponseDto> GetAsync(ulong id, ulong? viewerId = null, string? viewerRole = null)
    {
        var music = await BaseQuery.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id)
            ?? throw new NotFoundException("Трек не найден");

        var canSeeInternal = viewerId == music.OwnerId || viewerRole is "moderator" or "admin";
        if (music.Status != "approved" && !canSeeInternal)
            throw new NotFoundException("Трек не найден");

        return ToDto(music, viewerId, canSeeInternal);
    }

    public async Task<TrackSoundDto> GetSoundAsync(ulong id, ulong? viewerId = null, string? viewerRole = null)
    {
        var music = await _db.Musics.AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id && m.DeletedAt == null)
            ?? throw new NotFoundException("Трек не найден");

        var canSeeInternal = viewerId == music.OwnerId || viewerRole is "moderator" or "admin";
        if (music.Status != "approved" && !canSeeInternal)
            throw new NotFoundException("Трек не найден");

        var path = GetPhysicalPath(music.FileUrl)
            ?? throw new NotFoundException("Аудиофайл на сервере отсутствует");

        var ext = Path.GetExtension(path).ToLowerInvariant();
        return new TrackSoundDto(path, AudioTypes.GetValueOrDefault(ext, "application/octet-stream"));
    }

    public async Task DeleteAsync(ulong id, ulong currentUserId, string currentRole)
    {
        var music = await _db.Musics.FirstOrDefaultAsync(m => m.Id == id && m.DeletedAt == null)
            ?? throw new NotFoundException("Трек не найден");

        var isStaff = currentRole is "moderator" or "admin";
        if (music.OwnerId != currentUserId && !isStaff)
            throw new ForbiddenException("Вы не можете удалить чужой трек");

        music.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<TrackResponseDto> EditAsync(ulong id, TrackEditDto dto, ulong currentUserId, string currentRole)
    {
        var music = await BaseQuery.FirstOrDefaultAsync(m => m.Id == id)
            ?? throw new NotFoundException("Трек не найден");

        if (music.OwnerId != currentUserId && currentRole != "admin")
            throw new ForbiddenException("Вы не можете редактировать чужой трек");

        if (!string.IsNullOrWhiteSpace(dto.Name))
            music.Name = dto.Name.Trim();

        if (dto.AlbumId.HasValue)
        {
            await ValidateAlbumAsync(dto.AlbumId, music.OwnerId);
            music.AlbumId = dto.AlbumId;
        }

        if (dto.GenreIds is not null)
        {
            var genres = await _db.MusicGenres.Where(g => dto.GenreIds.Contains(g.Id)).ToListAsync();
            music.Genres.Clear();
            foreach (var g in genres) music.Genres.Add(g);
        }

        await _db.SaveChangesAsync();
        return ToDto(music, currentUserId, canSeeInternal: true);
    }

    private async Task ValidateAlbumAsync(ulong? albumId, ulong ownerId)
    {
        if (albumId is null) return;
        var album = await _db.Albums.FirstOrDefaultAsync(a => a.Id == albumId.Value)
            ?? throw new BadRequestException("Альбом не найден");

        if (album.OwnerId != ownerId)
            throw new ForbiddenException("Нельзя добавить трек в чужой альбом");
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

    private string? GetPhysicalPath(string relativeUrl)
    {
        var full = Path.GetFullPath(Path.Combine(_webRoot, relativeUrl.TrimStart('/')));
        if (!full.StartsWith(Path.GetFullPath(_webRoot), StringComparison.Ordinal)) return null;
        return File.Exists(full) ? full : null;
    }

    private uint? ReadDuration(string fileUrl)
    {
        var path = GetPhysicalPath(fileUrl);
        if (path == null) return null;

        try
        {
            using var tagFile = TagLib.File.Create(path);
            return (uint)Math.Round(tagFile.Properties.Duration.TotalSeconds);
        }
        catch
        {
            return null;
        }
    }

    public static TrackResponseDto ToDto(Music m, ulong? viewerId = null, bool canSeeInternal = false)
    {
        var likes = m.UserLikes?.Count(l => l.Type == "like") ?? 0;
        var dislikes = m.UserLikes?.Count(l => l.Type == "dislike") ?? 0;
        var comments = m.Comments?.Count(c => c.DeletedAt == null) ?? 0;
        var listens = m.UserListeneds?.Count ?? 0;

        string? myReaction = null;
        if (viewerId.HasValue && m.UserLikes != null)
        {
            myReaction = m.UserLikes.FirstOrDefault(l => l.UserId == viewerId.Value)?.Type;
        }

        return new TrackResponseDto
        {
            Id = m.Id,
            Name = m.Name,
            Owner = m.Owner != null
                ? new UserBriefDto(m.Owner.Id, m.Owner.Nickname, m.Owner.Image)
                : new UserBriefDto(m.OwnerId, "Unknown", null),
            Album = m.Album != null ? new TrackAlbumBriefDto(m.Album.Id, m.Album.Name) : null,
            Genres = m.Genres?.Select(g => new GenreDto(g.Id, g.Name)).ToList() ?? new(),
            FileUrl = m.FileUrl,
            Image = m.Image,
            DurationSec = m.DurationSec,
            Status = m.Status,
            RejectionReason = canSeeInternal && m.Status == "rejected" ? m.RejectionReason : null,
            CreatedAt = m.CreatedAt,
            Stats = new TrackStatsDto(likes, dislikes, comments, listens),
            MyReaction = myReaction
        };
    }
}
