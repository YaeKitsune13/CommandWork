using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IAlbumService
{
    Task<AlbumResponseDto> CreateAsync(AlbumCreateDto dto, ulong userId); 
    
    Task<AlbumResponseDto> GetAsync(ulong id);
    Task<IEnumerable<AlbumResponseDto>> GetAllAsync(string? search);
    Task EditAsync(AlbumEditDto dto);
    Task DeleteAsync(ulong id);
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

    private IQueryable<Album> Alive => _db.Albums; 

    public async Task<AlbumResponseDto> CreateAsync(AlbumCreateDto dto, ulong userId)
    {
        if (!await _db.Artists.AnyAsync(a => a.Id == dto.ArtistId))
            throw new ArgumentException("Артист не найден");

        string? imageUrl = null;
        if (dto.Image is { Length: > 0 })
            imageUrl = await SaveFileAsync(dto.Image, "albums");

        var album = new Album
        {
            Name = dto.Name,
            ArtistId = dto.ArtistId,
            Image = imageUrl,
            OwnerId = userId,
            ReleaseDate = DateOnly.FromDateTime(dto.ReleaseDate)
        };

        _db.Albums.Add(album);
        await _db.SaveChangesAsync();
        return ToDto(album);
    }

    public async Task<AlbumResponseDto> GetAsync(ulong id)
    {
        var album = await Alive
            .Include(a => a.Musics)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("Альбом не найден!");
        
        return ToDto(album);
    }

    public async Task<IEnumerable<AlbumResponseDto>> GetAllAsync(string? search)
    {
        var query = Alive.AsNoTracking();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(a => a.Name.Contains(search));

        var albums = await query.ToListAsync();
        return albums.Select(ToDto);
    }

    public async Task EditAsync(AlbumEditDto dto)
    {
        var album = await Alive.FirstOrDefaultAsync(a => a.Id == dto.Id)
            ?? throw new KeyNotFoundException("Альбом не найден!");

        if (!await _db.Artists.AnyAsync(a => a.Id == dto.ArtistId))
            throw new ArgumentException("Артист не найден");

        album.Name = dto.Name;
        album.ArtistId = dto.ArtistId;
        
        if (dto.ReleaseDate.HasValue) 
            album.ReleaseDate = DateOnly.FromDateTime(dto.ReleaseDate.Value);

        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(ulong id)
    {
        var album = await _db.Albums.FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("Альбом не найден!");

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

    private static AlbumResponseDto ToDto(Album a)
    {
        DateTime releaseDateTime = a.ReleaseDate?.ToDateTime(TimeOnly.MinValue) ?? DateTime.MinValue;

        return new AlbumResponseDto(
            a.Id,
            a.Name,
            a.ArtistId,
            a.Image,
            releaseDateTime,
            a.Musics?.Select(m => new TrackResponseDto {
                Id = m.Id,
                Name = m.Name,
                FileUrl = m.FileUrl
            }).ToList()
        );
    }
}