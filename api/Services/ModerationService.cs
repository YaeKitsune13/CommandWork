using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IModeratorService
{
    Task<IEnumerable<ComplaintResponseDto>> GetAllComplaintsAsync();
    Task ResolveComplaintAsync(ulong complaintId, ulong moderatorId);
    Task<IEnumerable<MusicModerationResponseDto>> GetPendingMusicAsync();
    Task ReviewMusicAsync(MusicReviewDto dto, ulong moderatorId);
    Task SetUserBlockStatusAsync(UserBlockDto dto);
}

public class ModeratorService : IModeratorService
{
    private readonly CoopProjectContext _db;
    public ModeratorService(CoopProjectContext db) => _db = db;

    public async Task<IEnumerable<ComplaintResponseDto>> GetAllComplaintsAsync()
    {
        var complaints = await _db.Complaints.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return complaints.Select(c => new ComplaintResponseDto(
            c.Id,
            c.MusicId != null ? ComplaintTargetType.Track : c.TargetUserId != null ? ComplaintTargetType.User : ComplaintTargetType.Comment,
            c.MusicId ?? c.TargetUserId ?? c.CommentId ?? 0,
            c.Reason,
            null,
            c.ReporterId,
            Enum.TryParse<ComplaintStatus>(c.Status, true, out var st) ? st : ComplaintStatus.Pending,
            c.CreatedAt
        ));
    }

    public async Task ResolveComplaintAsync(ulong complaintId, ulong moderatorId)
    {
        var complaint = await _db.Complaints.FindAsync(complaintId) 
            ?? throw new KeyNotFoundException("Жалоба не найдена");

        complaint.Status = ComplaintStatuses.Resolved; 
        complaint.ResolvedBy = moderatorId;
        complaint.ResolvedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<IEnumerable<MusicModerationResponseDto>> GetPendingMusicAsync()
    {
        return await _db.Musics
            .Where(m => m.Status == "pending")
            .Include(m => m.Artist)
            .Select(m => new MusicModerationResponseDto(
                m.Id, m.Name, m.FileUrl, m.Artist.Name, m.Status, m.CreatedAt
            )).ToListAsync();
    }

    public async Task ReviewMusicAsync(MusicReviewDto dto, ulong moderatorId)
    {
        var music = await _db.Musics.FindAsync(dto.MusicId) 
            ?? throw new KeyNotFoundException("Трек не найден");

        music.Status = dto.IsApproved ? "approved" : "rejected";
        music.RejectionReason = dto.IsApproved ? null : dto.RejectionReason;
        music.ModeratedBy = moderatorId;
        music.ModeratedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task SetUserBlockStatusAsync(UserBlockDto dto)
    {
        var user = await _db.Users.FindAsync(dto.UserId) 
            ?? throw new KeyNotFoundException("Пользователь не найден");
        user.IsBlocked = dto.IsBlocked;
        await _db.SaveChangesAsync();
    }
}