using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface ICommentService
{
    Task<PagedResult<CommentDto>> GetAsync(ulong musicId, int page, int pageSize);
    Task<CommentDto> CreateAsync(ulong musicId, ulong userId, string text);
    Task<CommentDto> EditAsync(ulong commentId, ulong userId, string text);
    Task DeleteAsync(ulong commentId, ulong userId, string role);
}

public class CommentService : ICommentService
{
    private const int MaxLength = 1000;

    private readonly CoopProjectContext _db;
    public CommentService(CoopProjectContext db) => _db = db;

    public async Task<PagedResult<CommentDto>> GetAsync(ulong musicId, int page, int pageSize)
    {
        await EnsureTrackAsync(musicId);

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Comments.Where(c => c.MusicId == musicId && c.DeletedAt == null);
        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CommentDto(
                c.Id, c.MusicId, c.UserId,
                c.User.Nickname, c.User.Image,
                c.Text, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        return new PagedResult<CommentDto>(items, page, pageSize, total);
    }

    public async Task<CommentDto> CreateAsync(ulong musicId, ulong userId, string text)
    {
        text = ValidateText(text);
        await EnsureTrackAsync(musicId);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null)
            ?? throw new NotFoundException("Пользователь не найден");
        if (user.IsBlocked)
            throw new ForbiddenException("Вы заблокированы и не можете комментировать");

        var comment = new Comment
        {
            MusicId = musicId,
            UserId = userId,
            Text = text,
            CreatedAt = DateTime.UtcNow
        };
        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        return new CommentDto(comment.Id, musicId, userId, user.Nickname, user.Image,
            comment.Text, comment.CreatedAt, comment.UpdatedAt);
    }

    public async Task<CommentDto> EditAsync(ulong commentId, ulong userId, string text)
    {
        text = ValidateText(text);

        var comment = await _db.Comments.Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == commentId && c.DeletedAt == null)
            ?? throw new NotFoundException("Комментарий не найден");

        if (comment.UserId != userId)
            throw new ForbiddenException("Можно редактировать только свои комментарии");

        comment.Text = text;
        comment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new CommentDto(comment.Id, comment.MusicId, comment.UserId,
            comment.User.Nickname, comment.User.Image,
            comment.Text, comment.CreatedAt, comment.UpdatedAt);
    }

    public async Task DeleteAsync(ulong commentId, ulong userId, string role)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId && c.DeletedAt == null)
            ?? throw new NotFoundException("Комментарий не найден");

        var isStaff = role is "moderator" or "admin";
        if (comment.UserId != userId && !isStaff)
            throw new ForbiddenException("Нельзя удалить чужой комментарий");

        comment.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static string ValidateText(string? text)
    {
        text = text?.Trim();
        if (string.IsNullOrEmpty(text))
            throw new BadRequestException("Комментарий не может быть пустым");
        if (text.Length > MaxLength)
            throw new BadRequestException($"Максимум {MaxLength} символов");
        return text;
    }

    private async Task EnsureTrackAsync(ulong musicId)
    {
        if (!await _db.Musics.AnyAsync(m => m.Id == musicId && m.DeletedAt == null))
            throw new NotFoundException("Трек не найден");
    }
}
