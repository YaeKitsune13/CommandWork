using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IComplaintService 
{
    Task CreateAsync(ComplaintCreateDto dto, ulong reporterId);
    Task<IEnumerable<ComplaintResponseDto>> GetAllAsync();
}

public class ComplaintService : IComplaintService
{
    private readonly CoopProjectContext _db;
    public ComplaintService(CoopProjectContext db) => _db = db;

  public async Task CreateAsync(ComplaintCreateDto dto, ulong reporterId)
{
    var complaint = new Complaint
    {
        ReporterId = reporterId,
        Reason = dto.Reason,
        Status = ComplaintStatuses.Pending,
        CreatedAt = DateTime.UtcNow,
        
        MusicId = null,
        TargetUserId = null,
        CommentId = null
    };

    if (dto.TargetType == ComplaintTargetType.Track)
        complaint.MusicId = dto.TargetId;
    else if (dto.TargetType == ComplaintTargetType.User)
        complaint.TargetUserId = dto.TargetId;
    else if (dto.TargetType == ComplaintTargetType.Comment)
        complaint.CommentId = dto.TargetId;

    _db.Complaints.Add(complaint);
    await _db.SaveChangesAsync();
}
   public async Task<IEnumerable<ComplaintResponseDto>> GetAllAsync()
{
    var complaints = await _db.Complaints.OrderByDescending(c => c.CreatedAt).ToListAsync();

    return complaints.Select(c => new ComplaintResponseDto(
        c.Id,
        c.MusicId != null ? ComplaintTargetType.Track : 
        c.TargetUserId != null ? ComplaintTargetType.User : ComplaintTargetType.Comment,
        c.MusicId ?? c.TargetUserId ?? c.CommentId ?? 0,
        c.Reason,
        "", 
        c.ReporterId,
        Enum.TryParse<ComplaintStatus>(c.Status, true, out var statusEnum) ? statusEnum : ComplaintStatus.pending, 
        c.CreatedAt
    ));
}
}