using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IPlaylistService
{
    Task<PagedResult<PlaylistResponseDto>> GetPublicAsync(string? search, ulong? ownerId, int page, int pageSize, ulong? viewerId);
    Task<PagedResult<PlaylistResponseDto>> GetMineAsync(ulong userId, int page, int pageSize);
    Task<PlaylistResponseDto> GetAsync(ulong id, ulong? userId, string? userRole = null);
    Task<PlaylistResponseDto> CreateAsync(PlaylistCreateDto dto, ulong userId);
    Task<PlaylistResponseDto> EditAsync(ulong id, PlaylistEditDto dto, ulong userId);
    Task DeleteAsync(ulong id, ulong userId, string userRole);

    Task<PlaylistResponseDto> AddTrackAsync(ulong id, PlaylistAddTrackDto dto, ulong userId);
    Task RemoveTrackAsync(ulong id, ulong trackId, ulong userId);
    Task<PlaylistResponseDto> MoveTrackAsync(ulong id, ulong trackId, int newPosition, ulong userId);

    Task<PlaylistResponseDto> AddCollaboratorAsync(ulong id, PlaylistCollaboratorDto dto, ulong userId);
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

    public async Task<PagedResult<PlaylistResponseDto>> GetPublicAsync(
        string? search, ulong? ownerId, int page, int pageSize, ulong? viewerId)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = Alive.AsNoTracking()
            .Include(p => p.User)
            .Include(p => p.PlaylistCollaborators)
            .Include(p => p.PlaylistTracks).ThenInclude(t => t.Music)
            .Where(p => p.Privacy == Public);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s));
        }

        if (ownerId.HasValue)
            query = query.Where(p => p.UserId == ownerId.Value);

        var total = await query.CountAsync();
        var list = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = list.Select(p => ToDto(p, withDetails: false, viewerId)).ToList();
        return new PagedResult<PlaylistResponseDto>(items, page, pageSize, total);
    }

    public async Task<PagedResult<PlaylistResponseDto>> GetMineAsync(ulong userId, int page, int pageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = Alive.AsNoTracking()
            .Include(p => p.User)
            .Include(p => p.PlaylistCollaborators)
            .Include(p => p.PlaylistTracks).ThenInclude(t => t.Music)
            .Where(p => p.UserId == userId || p.PlaylistCollaborators.Any(c => c.UserId == userId));

        var total = await query.CountAsync();
        var list = await query
            .OrderByDescending(p => p.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = list.Select(p => ToDto(p, withDetails: false, userId)).ToList();
        return new PagedResult<PlaylistResponseDto>(items, page, pageSize, total);
    }

    public async Task<PlaylistResponseDto> GetAsync(ulong id, ulong? userId, string? userRole = null)
    {
        var playlist = await Alive.AsNoTracking()
            .Include(p => p.User)
            .Include(p => p.PlaylistCollaborators).ThenInclude(c => c.User)
            .Include(p => p.PlaylistTracks)
                .ThenInclude(t => t.Music)
                .ThenInclude(m => m.Owner)
            .Include(p => p.PlaylistTracks)
                .ThenInclude(t => t.Music)
                .ThenInclude(m => m.Album)
            .Include(p => p.PlaylistTracks)
                .ThenInclude(t => t.Music)
                .ThenInclude(m => m.Genres)
            .Include(p => p.PlaylistTracks)
                .ThenInclude(t => t.Music)
                .ThenInclude(m => m.UserLikes)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundException("Плейлист не найден");

        var isMember = userId is not null &&
            (playlist.UserId == userId || playlist.PlaylistCollaborators.Any(c => c.UserId == userId));
        var isStaff = userRole is "moderator" or "admin";

        if (playlist.Privacy == Private && !isMember && !isStaff)
            throw new NotFoundException("Плейлист не найден");

        return ToDto(playlist, withDetails: true, userId);
    }

    public async Task<PlaylistResponseDto> CreateAsync(PlaylistCreateDto dto, ulong userId)
    {
        var privacy = !string.IsNullOrWhiteSpace(dto.Privacy)
            ? dto.Privacy.Trim().ToLowerInvariant()
            : (dto.IsPublic ? Public : Private);

        if (privacy is not (Public or Private))
            throw new BadRequestException("Приватность должна быть public или private");

        var playlist = new Playlist
        {
            Name = dto.Name.Trim(),
            Description = dto.Description,
            UserId = userId,
            Privacy = privacy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Playlists.Add(playlist);
        await _db.SaveChangesAsync();

        return await GetAsync(playlist.Id, userId);
    }

    public async Task<PlaylistResponseDto> EditAsync(ulong id, PlaylistEditDto dto, ulong userId)
    {
        var playlist = await GetForEditAsync(id, userId);

        if (!string.IsNullOrWhiteSpace(dto.Name))
            playlist.Name = dto.Name.Trim();

        if (dto.Description is not null)
            playlist.Description = dto.Description;

        var newPrivacy = dto.Privacy?.Trim().ToLowerInvariant()
            ?? (dto.IsPublic.HasValue ? (dto.IsPublic.Value ? Public : Private) : null);

        if (newPrivacy is not null)
        {
            if (playlist.UserId != userId)
                throw new ForbiddenException("Менять приватность может только владелец");
            if (newPrivacy is not (Public or Private))
                throw new BadRequestException("Приватность должна быть public или private");
            playlist.Privacy = newPrivacy;
        }

        playlist.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetAsync(id, userId);
    }

    public async Task DeleteAsync(ulong id, ulong userId, string userRole)
    {
        var playlist = await Alive.FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundException("Плейлист не найден");

        if (playlist.UserId != userId && userRole != "admin")
            throw new ForbiddenException("Удалить плейлист может только владелец");

        playlist.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<PlaylistResponseDto> AddTrackAsync(ulong id, PlaylistAddTrackDto dto, ulong userId)
    {
        var playlist = await GetForEditAsync(id, userId);

        var trackOk = await _db.Musics.AnyAsync(m =>
            m.Id == dto.TrackId && m.DeletedAt == null && m.Status == "approved");
        if (!trackOk)
            throw new NotFoundException("Трек не найден");

        var items = await _db.PlaylistTracks
            .Where(t => t.PlaylistId == id)
            .OrderBy(t => t.Position)
            .ToListAsync();

        if (items.Any(t => t.MusicId == dto.TrackId))
            throw new ConflictException("Трек уже есть в плейлисте");

        var position = dto.Position ?? items.Count + 1;
        if (position < 1 || position > items.Count + 1)
            throw new BadRequestException($"Позиция должна быть от 1 до {items.Count + 1}");

        foreach (var t in items.Where(t => t.Position >= position))
            t.Position++;

        _db.PlaylistTracks.Add(new PlaylistTrack
        {
            PlaylistId = playlist.Id,
            MusicId = dto.TrackId,
            Position = (uint)position,
            AddedBy = userId,
            AddedAt = DateTime.UtcNow
        });

        playlist.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetAsync(id, userId);
    }

    public async Task RemoveTrackAsync(ulong id, ulong trackId, ulong userId)
    {
        var playlist = await GetForEditAsync(id, userId);

        var items = await _db.PlaylistTracks
            .Where(t => t.PlaylistId == id)
            .OrderBy(t => t.Position)
            .ToListAsync();

        var target = items.FirstOrDefault(t => t.MusicId == trackId)
            ?? throw new NotFoundException("Трека нет в плейлисте");

        _db.PlaylistTracks.Remove(target);
        items.Remove(target);

        for (var i = 0; i < items.Count; i++)
            items[i].Position = (uint)(i + 1);

        playlist.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<PlaylistResponseDto> MoveTrackAsync(ulong id, ulong trackId, int newPosition, ulong userId)
    {
        var playlist = await GetForEditAsync(id, userId);

        var items = await _db.PlaylistTracks
            .Where(t => t.PlaylistId == id)
            .OrderBy(t => t.Position)
            .ToListAsync();

        var target = items.FirstOrDefault(t => t.MusicId == trackId)
            ?? throw new NotFoundException("Трека нет в плейлисте");

        if (newPosition < 1 || newPosition > items.Count)
            throw new BadRequestException($"Позиция должна быть от 1 до {items.Count}");

        items.Remove(target);
        items.Insert(newPosition - 1, target);

        for (var i = 0; i < items.Count; i++)
            items[i].Position = (uint)(i + 1);

        playlist.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetAsync(id, userId);
    }

    public async Task<PlaylistResponseDto> AddCollaboratorAsync(ulong id, PlaylistCollaboratorDto dto, ulong userId)
    {
        var playlist = await Alive.Include(p => p.PlaylistCollaborators)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundException("Плейлист не найден");

        if (playlist.UserId != userId)
            throw new ForbiddenException("Соавторов назначает только владелец");

        var role = dto.Role?.Trim().ToLowerInvariant();
        if (role != Editor && role != Viewer)
            throw new BadRequestException("Роль должна быть editor или viewer");

        if (dto.UserId == userId)
            throw new BadRequestException("Нельзя назначить соавтором самого себя");

        if (!await _db.Users.AnyAsync(u => u.Id == dto.UserId && u.DeletedAt == null))
            throw new NotFoundException("Пользователь не найден");

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

        playlist.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetAsync(id, userId);
    }

    public async Task RemoveCollaboratorAsync(ulong id, ulong collaboratorId, ulong userId)
    {
        var playlist = await Alive.Include(p => p.PlaylistCollaborators)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundException("Плейлист не найден");

        if (playlist.UserId != userId && collaboratorId != userId)
            throw new ForbiddenException("Недостаточно прав");

        var collab = playlist.PlaylistCollaborators.FirstOrDefault(c => c.UserId == collaboratorId)
            ?? throw new NotFoundException("Соавтор не найден");

        _db.PlaylistCollaborators.Remove(collab);
        await _db.SaveChangesAsync();
    }

    private async Task<Playlist> GetForEditAsync(ulong id, ulong userId)
    {
        var playlist = await Alive.Include(p => p.PlaylistCollaborators)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundException("Плейлист не найден");

        var collab = playlist.PlaylistCollaborators.FirstOrDefault(c => c.UserId == userId);
        var isOwner = playlist.UserId == userId;

        if (!isOwner && collab is null)
        {
            if (playlist.Privacy == Private)
                throw new NotFoundException("Плейлист не найден");
            throw new ForbiddenException("Нет прав на редактирование");
        }

        if (!isOwner && collab!.Role != Editor)
            throw new ForbiddenException("У вас роль зрителя, редактировать нельзя");

        return playlist;
    }

    public static PlaylistResponseDto ToDto(Playlist p, bool withDetails, ulong? viewerId = null)
    {
        string? myRole = null;
        if (viewerId.HasValue)
        {
            if (p.UserId == viewerId.Value) myRole = "owner";
            else myRole = p.PlaylistCollaborators?.FirstOrDefault(c => c.UserId == viewerId.Value)?.Role;
        }

        var visibleTracks = (p.PlaylistTracks ?? Array.Empty<PlaylistTrack>())
            .Where(t => t.Music != null && t.Music.DeletedAt == null && t.Music.Status == "approved")
            .OrderBy(t => t.Position)
            .ToList();

        return new PlaylistResponseDto(
            p.Id,
            p.Name,
            p.Description,
            p.Privacy,
            p.Privacy == Public,
            p.User != null
                ? new UserBriefDto(p.User.Id, p.User.Nickname, p.User.Image)
                : new UserBriefDto(p.UserId, "Unknown", null),
            visibleTracks.Count,
            myRole,
            p.CreatedAt,
            p.UpdatedAt,
            withDetails
                ? visibleTracks.Select(t => new PlaylistTrackDto(
                    (int)t.Position,
                    TrackService.ToDto(t.Music, viewerId))).ToList()
                : null,
            withDetails
                ? p.PlaylistCollaborators?.Select(c => new PlaylistCollaboratorResponseDto(
                    c.User != null
                        ? new UserBriefDto(c.User.Id, c.User.Nickname, c.User.Image)
                        : new UserBriefDto(c.UserId, "Unknown", null),
                    c.Role)).ToList()
                : null
        );
    }
}
