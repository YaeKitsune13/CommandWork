using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IPlaylistService
{
    Task<IEnumerable<PlaylistResponseDto>> GetPublicAsync(string? search);
    Task<IEnumerable<PlaylistResponseDto>> GetMineAsync(ulong userId);
    Task<PlaylistResponseDto> GetAsync(ulong id, ulong? userId);
    Task<PlaylistResponseDto> CreateAsync(PlaylistCreateDto dto, ulong userId);
    Task EditAsync(ulong id, PlaylistEditDto dto, ulong userId);
    Task DeleteAsync(ulong id, ulong userId);

    Task AddTrackAsync(ulong id, PlaylistAddTrackDto dto, ulong userId);
    Task RemoveTrackAsync(ulong id, ulong trackId, ulong userId);
    Task MoveTrackAsync(ulong id, ulong trackId, int newPosition, ulong userId);

    Task AddCollaboratorAsync(ulong id, PlaylistCollaboratorDto dto, ulong userId);
    Task RemoveCollaboratorAsync(ulong id, ulong collaboratorId, ulong userId);
}

public class PlaylistsService : IPlaylistService
{
    private const string Public = "public";
    private const string Private = "private";
    private const string Editor = "editor";
    private const string Viewer = "viewer";

    private readonly CoopProjectContext _db;

    public PlaylistsService(CoopProjectContext db) => _db = db;

    private IQueryable<Playlist> Alive => _db.Playlists.Where(p => p.DeletedAt == null);


    public async Task<IEnumerable<PlaylistResponseDto>> GetPublicAsync(string? search)
    {
        var query = Alive.AsNoTracking()
            .Include(p => p.User)
            .Include(p => p.PlaylistTracks)
            .Where(p => p.Privacy == Public);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search));

        var list = await query.ToListAsync();
        return list.Select(p => ToDto(p, withDetails: false));
    }

    public async Task<IEnumerable<PlaylistResponseDto>> GetMineAsync(ulong userId)
    {
        var list = await Alive.AsNoTracking()
            .Include(p => p.User)
            .Include(p => p.PlaylistTracks)
            .Where(p => p.UserId == userId || p.PlaylistCollaborators.Any(c => c.UserId == userId))
            .ToListAsync();
        return list.Select(p => ToDto(p, withDetails: false));
    }

    public async Task<PlaylistResponseDto> GetAsync(ulong id, ulong? userId)
    {
        var playlist = await Alive.AsNoTracking()
            .Include(p => p.User)
            .Include(p => p.PlaylistCollaborators)
            .Include(p => p.PlaylistTracks).ThenInclude(t => t.Music).ThenInclude(m => m.Artist)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException("Плейлист не найден!");

        var isMember = userId is not null &&
            (playlist.UserId == userId || playlist.PlaylistCollaborators.Any(c => c.UserId == userId));

        // приватный плейлист для чужих — делаем вид, что его нет
        if (playlist.Privacy == Private && !isMember)
            throw new KeyNotFoundException("Плейлист не найден!");

        return ToDto(playlist, withDetails: true);
    }


    public async Task<PlaylistResponseDto> CreateAsync(PlaylistCreateDto dto, ulong userId)
    {
        var playlist = new Playlist
        {
            Name = dto.Name.Trim(),
            Description = dto.Description,
            UserId = userId,
            Privacy = dto.IsPublic ? Public : Private
        };

        _db.Playlists.Add(playlist);
        await _db.SaveChangesAsync();
        await _db.Entry(playlist).Reference(p => p.User).LoadAsync();
        return ToDto(playlist, withDetails: false);
    }

    public async Task EditAsync(ulong id, PlaylistEditDto dto, ulong userId)
    {
        var playlist = await GetForEditAsync(id, userId);

        if (!string.IsNullOrWhiteSpace(dto.Name)) playlist.Name = dto.Name.Trim();
        if (dto.Description is not null) playlist.Description = dto.Description;

        if (dto.IsPublic.HasValue)
        {
            if (playlist.UserId != userId)
                throw new UnauthorizedAccessException("Менять приватность может только владелец");
            playlist.Privacy = dto.IsPublic.Value ? Public : Private;
        }

        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(ulong id, ulong userId)
    {
        var playlist = await Alive.FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException("Плейлист не найден!");

        if (playlist.UserId != userId)
            throw new UnauthorizedAccessException("Удалить плейлист может только владелец");

        playlist.DeletedAt = DateTime.UtcNow; 
        await _db.SaveChangesAsync();
    }


    public async Task AddTrackAsync(ulong id, PlaylistAddTrackDto dto, ulong userId)
    {
        var playlist = await GetForEditAsync(id, userId);

        var trackOk = await _db.Musics.AnyAsync(m =>
            m.Id == dto.TrackId && m.DeletedAt == null && m.Status == "approved");
        if (!trackOk)
            throw new KeyNotFoundException("Трек не найден!");

        var items = await _db.PlaylistTracks
            .Where(t => t.PlaylistId == id)
            .OrderBy(t => t.Position)
            .ToListAsync();

        if (items.Any(t => t.MusicId == dto.TrackId))
            throw new ArgumentException("Трек уже есть в плейлисте");

        var position = dto.Position ?? items.Count + 1;
        if (position < 1 || position > items.Count + 1)
            throw new ArgumentException($"Позиция должна быть от 1 до {items.Count + 1}");

        foreach (var t in items.Where(t => t.Position >= position))
            t.Position++;

        _db.PlaylistTracks.Add(new PlaylistTrack
        {
            PlaylistId = playlist.Id,
            MusicId = dto.TrackId,
            Position = (uint)position,
            AddedBy = userId
        });
        await _db.SaveChangesAsync();
    }

    public async Task RemoveTrackAsync(ulong id, ulong trackId, ulong userId)
    {
        await GetForEditAsync(id, userId);

        var items = await _db.PlaylistTracks
            .Where(t => t.PlaylistId == id)
            .OrderBy(t => t.Position)
            .ToListAsync();

        var target = items.FirstOrDefault(t => t.MusicId == trackId)
            ?? throw new KeyNotFoundException("Трека нет в плейлисте!");

        _db.PlaylistTracks.Remove(target);
        items.Remove(target);

        for (var i = 0; i < items.Count; i++)
            items[i].Position = (uint)(i + 1);

        await _db.SaveChangesAsync();
    }

    public async Task MoveTrackAsync(ulong id, ulong trackId, int newPosition, ulong userId)
    {
        await GetForEditAsync(id, userId);

        var items = await _db.PlaylistTracks
            .Where(t => t.PlaylistId == id)
            .OrderBy(t => t.Position)
            .ToListAsync();

        var target = items.FirstOrDefault(t => t.MusicId == trackId)
            ?? throw new KeyNotFoundException("Трека нет в плейлисте!");

        if (newPosition < 1 || newPosition > items.Count)
            throw new ArgumentException($"Позиция должна быть от 1 до {items.Count}");

        items.Remove(target);
        items.Insert(newPosition - 1, target);

        for (var i = 0; i < items.Count; i++)
            items[i].Position = (uint)(i + 1);

        await _db.SaveChangesAsync();
    }


    public async Task AddCollaboratorAsync(ulong id, PlaylistCollaboratorDto dto, ulong userId)
    {
        var playlist = await Alive.Include(p => p.PlaylistCollaborators)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException("Плейлист не найден!");

        if (playlist.UserId != userId)
            throw new UnauthorizedAccessException("Соавторов назначает только владелец");

        var role = dto.Role?.Trim().ToLowerInvariant();
        if (role != Editor && role != Viewer)
            throw new ArgumentException("Роль должна быть \"editor\" или \"viewer\"");

        if (dto.UserId == userId)
            throw new ArgumentException("Нельзя назначить соавтором самого себя");
        if (!await _db.Users.AnyAsync(u => u.Id == dto.UserId && u.DeletedAt == null))
            throw new KeyNotFoundException("Пользователь не найден!");

        var existing = playlist.PlaylistCollaborators.FirstOrDefault(c => c.UserId == dto.UserId);
        if (existing is not null)
            existing.Role = role; 
        else
            playlist.PlaylistCollaborators.Add(new PlaylistCollaborator
            {
                PlaylistId = id,
                UserId = dto.UserId,
                Role = role
            });

        await _db.SaveChangesAsync();
    }

    public async Task RemoveCollaboratorAsync(ulong id, ulong collaboratorId, ulong userId)
    {
        var playlist = await Alive.Include(p => p.PlaylistCollaborators)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException("Плейлист не найден!");

        if (playlist.UserId != userId && collaboratorId != userId)
            throw new UnauthorizedAccessException("Недостаточно прав");

        var collab = playlist.PlaylistCollaborators.FirstOrDefault(c => c.UserId == collaboratorId)
            ?? throw new KeyNotFoundException("Соавтор не найден!");

        _db.PlaylistCollaborators.Remove(collab);
        await _db.SaveChangesAsync();
    }


    private async Task<Playlist> GetForEditAsync(ulong id, ulong userId)
    {
        var playlist = await Alive.Include(p => p.PlaylistCollaborators)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException("Плейлист не найден!");

        var collab = playlist.PlaylistCollaborators.FirstOrDefault(c => c.UserId == userId);
        var isOwner = playlist.UserId == userId;

        if (!isOwner && collab is null)
        {
            if (playlist.Privacy == Private)
                throw new KeyNotFoundException("Плейлист не найден!");
            throw new UnauthorizedAccessException("Нет прав на редактирование");
        }
        if (!isOwner && collab!.Role != Editor)
            throw new UnauthorizedAccessException("У вас роль «зритель», редактировать нельзя");

        return playlist;
    }

    private static PlaylistResponseDto ToDto(Playlist p, bool withDetails) => new(
        p.Id,
        p.Name,
        p.Description,
        p.Privacy == Public,
        p.UserId,
        p.User?.Nickname,
        p.PlaylistTracks?.Count ?? 0,
        withDetails
            ? p.PlaylistTracks
                .Where(t => t.Music.DeletedAt == null && t.Music.Status == "approved")
                .OrderBy(t => t.Position)
                .Select(t => new PlaylistTrackDto(
                    (int)t.Position,
                    new TrackResponseDto
                    {
                        Id = t.Music.Id,
                        Name = t.Music.Name,
                        ArtistId = t.Music.ArtistId,
                        ArtistName = t.Music.Artist?.Name,
                        FileUrl = t.Music.FileUrl
                    })).ToList()
            : null,
        withDetails
            ? p.PlaylistCollaborators
                .Select(c => new PlaylistCollaboratorResponseDto(c.UserId, c.Role)).ToList()
            : null
    );
}
