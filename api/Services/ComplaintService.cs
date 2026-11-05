using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IComplaintService
{
    Task<ComplaintResponseDto> CreateAsync(ComplaintCreateDto dto, ulong reporterId);
}

public class ComplaintService : IComplaintService
{
    private readonly CoopProjectContext _db;
    public ComplaintService(CoopProjectContext db) => _db = db;

    public async Task<ComplaintResponseDto> CreateAsync(ComplaintCreateDto dto, ulong reporterId)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new BadRequestException("Укажите причину жалобы");

        var type = dto.TargetType?.Trim().ToLowerInvariant();
        if (type is not ("track" or "user" or "comment"))
            throw new BadRequestException("targetType должен быть track, user или comment");

        var complaint = new Complaint
        {
            ReporterId = reporterId,
            Reason = dto.Reason.Trim(),
            Description = dto.Description?.Trim(),
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        if (type == "track")
        {
            if (!await _db.Musics.AnyAsync(m => m.Id == dto.TargetId && m.DeletedAt == null))
                throw new NotFoundException("Трек не найден");
            if (await _db.Complaints.AnyAsync(c => c.ReporterId == reporterId && c.MusicId == dto.TargetId))
                throw new ConflictException("Вы уже отправляли жалобу на этот трек");
            complaint.MusicId = dto.TargetId;
        }
        else if (type == "user")
        {
            if (!await _db.Users.AnyAsync(u => u.Id == dto.TargetId && u.DeletedAt == null))
                throw new NotFoundException("Пользователь не найден");
            if (await _db.Complaints.AnyAsync(c => c.ReporterId == reporterId && c.TargetUserId == dto.TargetId))
                throw new ConflictException("Вы уже отправляли жалобу на этого пользователя");
            complaint.TargetUserId = dto.TargetId;
        }
        else
        {
            if (!await _db.Comments.AnyAsync(c => c.Id == dto.TargetId && c.DeletedAt == null))
                throw new NotFoundException("Комментарий не найден");
            if (await _db.Complaints.AnyAsync(c => c.ReporterId == reporterId && c.CommentId == dto.TargetId))
                throw new ConflictException("Вы уже отправляли жалобу на этот комментарий");
            complaint.CommentId = dto.TargetId;
        }

        _db.Complaints.Add(complaint);
        await _db.SaveChangesAsync();

        var saved = await _db.Complaints
            .Include(c => c.Reporter)
            .Include(c => c.Music)
            .Include(c => c.TargetUser)
            .Include(c => c.Comment)
            .FirstAsync(c => c.Id == complaint.Id);

        return ModeratorService.ToComplaintDto(saved);
    }
}
