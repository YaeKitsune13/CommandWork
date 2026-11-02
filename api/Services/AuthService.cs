using System.Security.Cryptography;
using System.Text;
using api.Data;
using api.Entities;
using api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public interface IAuthService
{
    Task<bool> RegisterAsync(RegisterDto dto);
    Task<string?> LoginAsync(LoginDto dto);
    Task<string?> ForgotPasswordAsync(string email);
    Task ResetPasswordAsync(ResetPasswordDto dto);
}

public class AuthService : IAuthService
{
    private readonly CoopProjectContext _db;
    private readonly PasswordHasher<User> _hasher = new();
    private readonly IConfiguration _cfg;

    public AuthService(CoopProjectContext db, IConfiguration cfg)
    {
        _db = db;
        _cfg = cfg;
    }

    public async Task<bool> RegisterAsync(RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return false;

        var user = new User
        {
            Email = dto.Email,
            Nickname = dto.Nickname,
            Role = "user",
            Privacy = "public"
        };
        user.PasswordHash = _hasher.HashPassword(user, dto.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<string?> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user is null || user.IsBlocked || user.DeletedAt != null)
            return null;

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (result == PasswordVerificationResult.Failed)
            return null;

        return JWTSetup.CreateToken(user);
    }

    public async Task<string?> ForgotPasswordAsync(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null && !u.IsBlocked);
        if (user is null) return null;

        var old = await _db.PasswordResetTokens.Where(t => t.UserId == user.Id && t.UsedAt == null).ToListAsync();
        foreach (var t in old) t.UsedAt = DateTime.UtcNow;

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = Hash(token),
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        // Возвращаем готовый токен (или полную ссылку), чтобы фронтенд мог сразу его использовать
        return token;
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token))
            throw new BadRequestException("Токен не передан");
        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
            throw new BadRequestException("Новый пароль минимум 6 символов");

        var hash = Hash(dto.Token);
        var entry = await _db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
            ?? throw new BadRequestException("Ссылка недействительна или устарела");

        entry.User.PasswordHash = _hasher.HashPassword(entry.User, dto.NewPassword);
        entry.User.UpdatedAt = DateTime.UtcNow;
        entry.UsedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
}
