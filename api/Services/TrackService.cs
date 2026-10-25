using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface ITrackService
{
    Task<TrackResponseDto> UploadAsync(TrackUploadDto dto);
    Task<TrackResponseDto> GetAsync(ulong id);
    Task<TrackSoundDto> GetSoundAsync(ulong id);
    Task DeleteAsync(ulong id);
    Task EditAsync(TrackEditDto dto);
}

/// <summary>
/// Ошибки: KeyNotFoundException -> 404, ArgumentException -> 400 (ловит контроллер).
/// </summary>
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

    private IQueryable<Music> Alive => _db.Musics.Where(m => m.DeletedAt == null);

    public async Task<TrackResponseDto> UploadAsync(TrackUploadDto dto)
    {
        if (dto.AudioFile.Length == 0)
            throw new ArgumentException("Файл не прикреплён");

        var audioExt = Path.GetExtension(dto.AudioFile.FileName).ToLowerInvariant();
        if (!AudioTypes.ContainsKey(audioExt))
            throw new ArgumentException("Неподдерживаемый формат аудио (mp3, wav, ogg, flac)");

        if (dto.Image != null &&
            !ImageExtensions.Contains(Path.GetExtension(dto.Image.FileName).ToLowerInvariant()))
            throw new ArgumentException("Неподдерживаемый формат картинки (jpg, png, webp)");

        await EnsureRelationsExistAsync(dto.ArtistId, dto.AlbumId);

        if (!await _db.Users.AnyAsync(u => u.Id == dto.OwnerId))
            throw new ArgumentException("Пользователь не найден");

        var fileUrl = await SaveFileAsync(dto.AudioFile, "music");
        var imageUrl = dto.Image is { Length: > 0 } ? await SaveFileAsync(dto.Image, "images") : null;

        var music = new Music
        {
            Name = dto.Name,
            ArtistId = dto.ArtistId,
            OwnerId = dto.OwnerId,
            AlbumId = dto.AlbumId,
            FileUrl = fileUrl,
            Image = imageUrl,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.Musics.Add(music);
        await _db.SaveChangesAsync();
        return ToDto(music);
    }

    public async Task<TrackResponseDto> GetAsync(ulong id)
    {
        var music = await Alive.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id)
            ?? throw new KeyNotFoundException("Не найдена песня!");
        return ToDto(music);
    }

    public async Task<TrackSoundDto> GetSoundAsync(ulong id)
    {
        var music = await Alive.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id)
            ?? throw new KeyNotFoundException("Песня не найдена!");

        var path = GetPhysicalPath(music.FileUrl)
            ?? throw new KeyNotFoundException("Файл на сервере отсутствует");

        var ext = Path.GetExtension(path).ToLowerInvariant();
        return new TrackSoundDto(path, AudioTypes.GetValueOrDefault(ext, "application/octet-stream"));
    }

    public async Task DeleteAsync(ulong id)
    {
        var music = await Alive.FirstOrDefaultAsync(m => m.Id == id)
            ?? throw new KeyNotFoundException("Песня не найдена!");

        music.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task EditAsync(TrackEditDto dto)
    {
        var music = await Alive.FirstOrDefaultAsync(m => m.Id == dto.Id)
            ?? throw new KeyNotFoundException("Песня не найдена!");

        await EnsureRelationsExistAsync(dto.ArtistId, dto.AlbumId);

        music.Name = dto.Name;
        music.ArtistId = dto.ArtistId;
        music.AlbumId = dto.AlbumId;

        await _db.SaveChangesAsync();
    }


    private async Task EnsureRelationsExistAsync(ulong artistId, ulong? albumId)
    {
        if (!await _db.Artists.AnyAsync(a => a.Id == artistId))
            throw new ArgumentException("Артист не найден");

        if (albumId != null && !await _db.Albums.AnyAsync(a => a.Id == albumId))
            throw new ArgumentException("Альбом не найден");
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
        if (!full.StartsWith(Path.GetFullPath(_webRoot), StringComparison.Ordinal)) return null; // path traversal
        return File.Exists(full) ? full : null;
    }

    private static TrackResponseDto ToDto(Music m) => new()
    {
        Id = m.Id,
        Name = m.Name,
        ArtistId = m.ArtistId,
        OwnerId = m.OwnerId,
        AlbumId = m.AlbumId,
        FileUrl = m.FileUrl,
        Image = m.Image,
        DurationSec = m.DurationSec,
        Status = m.Status,
        RejectionReason = m.RejectionReason,
        CreatedAt = m.CreatedAt
    };
}