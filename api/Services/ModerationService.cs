using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IModeratorService
{
    Task<PagedResult<ComplaintResponseDto>> GetAllComplaintsAsync(string? status, int page, int pageSize);
    Task<ComplaintResponseDto> ResolveComplaintAsync(ulong complaintId, ulong moderatorId, string status = "resolved");
    Task<PagedResult<TrackResponseDto>> GetPendingMusicAsync(int page, int pageSize);
    Task<TrackResponseDto> ReviewMusicAsync(ulong musicId, MusicReviewDto dto, ulong moderatorId);
    Task SetUserBlockStatusAsync(ulong targetUserId, bool isBlocked, string moderatorRole);
}

public class ModeratorService : IModeratorService
{
    private readonly CoopProjectContext _db;
    public ModeratorService(CoopProjectContext db) => _db = db;

    public async Task<PagedResult<ComplaintResponseDto>> GetAllComplaintsAsync(string? status, int page, int pageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Complaints
            .AsNoTracking()
            .Include(c => c.Reporter)
            .Include(c => c.ResolvedByNavigation)
            .Include(c => c.Music)
            .Include(c => c.TargetUser)
            .Include(c => c.Comment)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim().ToLowerInvariant();
            query = query.Where(c => c.Status == st);
        }

        var total = await query.CountAsync();
        var list = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ComplaintResponseDto>(list.Select(ToComplaintDto).ToList(), page, pageSize, total);
    }

    public async Task<ComplaintResponseDto> ResolveComplaintAsync(ulong complaintId, ulong moderatorId, string status = "resolved")
    {
        var st = status?.Trim().ToLowerInvariant() ?? "resolved";
        if (st is not ("reviewed" or "resolved"))
            throw new BadRequestException("Статус должен быть reviewed или resolved");

        var complaint = await _db.Complaints
            .Include(c => c.Reporter)
            .Include(c => c.Music)
            .Include(c => c.TargetUser)
            .Include(c => c.Comment)
            .FirstOrDefaultAsync(c => c.Id == complaintId)
            ?? throw new NotFoundException("Жалоба не найдена");

        complaint.Status = st;
        complaint.ResolvedBy = moderatorId;
        complaint.ResolvedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _db.Entry(complaint).Reference(c => c.ResolvedByNavigation).LoadAsync();
        return ToComplaintDto(complaint);
    }

    public async Task<PagedResult<TrackResponseDto>> GetPendingMusicAsync(int page, int pageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Musics
            .AsNoTracking()
            .Include(m => m.Owner)
            .Include(m => m.Album)
            .Include(m => m.Genres)
            .Where(m => m.DeletedAt == null && m.Status == "pending");

        var total = await query.CountAsync();
        var tracks = await query
            .OrderBy(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = tracks.Select(m => TrackService.ToDto(m, null, canSeeInternal: true)).ToList();
        return new PagedResult<TrackResponseDto>(items, page, pageSize, total);
    }

    public async Task<TrackResponseDto> ReviewMusicAsync(ulong musicId, MusicReviewDto dto, ulong moderatorId)
    {
        var music = await _db.Musics
            .Include(m => m.Owner)
            .Include(m => m.Album)
            .Include(m => m.Genres)
            .FirstOrDefaultAsync(m => m.Id == musicId && m.DeletedAt == null)
            ?? throw new NotFoundException("Трек не найден");

        var newStatus = dto.Status?.Trim().ToLowerInvariant()
            ?? (dto.IsApproved == true ? "approved" : "rejected");

        if (newStatus is not ("approved" or "rejected"))
            throw new BadRequestException("Статус должен быть approved или rejected");

        if (newStatus == "rejected" && string.IsNullOrWhiteSpace(dto.RejectionReason))
            throw new BadRequestException("При отклонении трека необходимо указать причину (rejectionReason)");

        music.Status = newStatus;
        music.RejectionReason = newStatus == "approved" ? null : dto.RejectionReason?.Trim();
        music.ModeratedBy = moderatorId;
        music.ModeratedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return TrackService.ToDto(music, moderatorId, canSeeInternal: true);
    }

    public async Task SetUserBlockStatusAsync(ulong targetUserId, bool isBlocked, string moderatorRole)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == targetUserId && u.DeletedAt == null)
            ?? throw new NotFoundException("Пользователь не найден");

        if (moderatorRole != "admin" && user.Role is "moderator" or "admin")
            throw new ForbiddenException("Модератор не может заблокировать другого модератора или администратора");

        user.IsBlocked = isBlocked;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public static ComplaintResponseDto ToComplaintDto(Complaint c)
    {
        string targetType;
        ComplaintTargetBriefDto target;

        if (c.MusicId.HasValue)
        {
            targetType = "track";
            target = new ComplaintTargetBriefDto(c.MusicId.Value, c.Music?.Name ?? $"Трек #{c.MusicId.Value}");
        }
        else if (c.TargetUserId.HasValue)
        {
            targetType = "user";
            target = new ComplaintTargetBriefDto(c.TargetUserId.Value, c.TargetUser?.Nickname ?? $"Пользователь #{c.TargetUserId.Value}");
        }
        else
        {
            targetType = "comment";
            var text = c.Comment?.Text ?? "";
            if (text.Length > 100) text = text[..100] + "...";
            target = new ComplaintTargetBriefDto(c.CommentId ?? 0, text);
        }

        return new ComplaintResponseDto(
            c.Id,
            targetType,
            target,
            c.Reason,
            c.Description,
            c.Reporter != null
                ? new UserBriefDto(c.Reporter.Id, c.Reporter.Nickname, c.Reporter.Image)
                : new UserBriefDto(c.ReporterId, "Unknown", null),
            c.Status,
            c.CreatedAt,
            c.ResolvedByNavigation != null
                ? new UserBriefDto(c.ResolvedByNavigation.Id, c.ResolvedByNavigation.Nickname, c.ResolvedByNavigation.Image)
                : null,
            c.ResolvedAt
        );
    }
}
