using api.Data;
using api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public interface IAuthService
{
    Task<bool> RegisterAsync(RegisterDto dto);
    Task<string?> LoginAsync(LoginDto dto);
}


public class AuthService : IAuthService
{
    private readonly CoopProjectContext _db;
    private readonly PasswordHasher<User> _hasher = new();

    public AuthService(CoopProjectContext db) => _db = db;

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
}
