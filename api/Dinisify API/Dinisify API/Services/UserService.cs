using Dinisify_API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public interface IUserService
{
    Task<User?> ValidateCredentialsAsync(string? email, string? phone, string password);
}

public class UserService : IUserService
{
    private readonly CoopProjectContext _db;
    private readonly PasswordHasher<User> _hasher = new();

    public UserService(CoopProjectContext db)
    {
        _db = db;
    }

    public async Task<User?> ValidateCredentialsAsync(string? email, string? phone, string password)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            (email != null && u.Email == email) ||
            (phone != null && u.Phone == phone));

        if (user is null || user.IsBlocked)
            return null;

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);

        return result == PasswordVerificationResult.Success ? user : null;
    }
}
