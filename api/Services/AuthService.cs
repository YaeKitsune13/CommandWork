using System.Security.Cryptography;
using System.Text;
using api;
using api.Data;
using api.Dtos;
using api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface IAuthService
{
    Task<string> RegisterAsync(RegisterDto dto);
    Task<string> LoginAsync(LoginDto dto);
    Task<string?> ForgotPasswordAsync(string email);
    Task ResetPasswordAsync(ResetPasswordDto dto);
}

public class AuthService : IAuthService
{
    private readonly CoopProjectContext _db;
    private readonly PasswordHasher<User> _hasher = new();

    public AuthService(CoopProjectContext db) => _db = db;

    public async Task<string> RegisterAsync(RegisterDto dto)
    {
        var fields = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains('@'))
            fields["email"] = ["Некорректный email"];

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            fields["password"] = ["Пароль должен быть минимум 6 символов"];

        var nickname = dto.Nickname?.Trim() ?? "";
        if (nickname.Length < 2 || nickname.Length > 100)
            fields["nickname"] = ["Никнейм должен быть от 2 до 100 символов"];

        if (fields.Count > 0)
            throw new BadRequestException("Ошибка валидации", fields);

        var email = dto.Email.Trim();
        var phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();

        if (await _db.Users.AnyAsync(u => u.Email == email))
            fields["email"] = ["Этот email уже занят"];

        if (await _db.Users.AnyAsync(u => u.Nickname == nickname))
            fields["nickname"] = ["Этот никнейм уже занят"];

        if (phone != null && await _db.Users.AnyAsync(u => u.Phone == phone))
            fields["phone"] = ["Этот телефон уже занят"];

        if (fields.Count > 0)
            throw new ConflictException("Пользователь с такими данными уже существует", fields);

        var user = new User
        {
            Email = email,
            Nickname = nickname,
            Phone = phone,
            Role = "user",
            Privacy = "public",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        user.PasswordHash = _hasher.HashPassword(user, dto.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return JWTSetup.CreateToken(user);
    }

    public async Task<string> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.DeletedAt == null)
            ?? throw new UnauthorizedException("Неверный email или пароль");

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (result == PasswordVerificationResult.Failed)
            throw new UnauthorizedException("Неверный email или пароль");

        if (user.IsBlocked)
            throw new ForbiddenException("Аккаунт заблокирован", "blocked");

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
