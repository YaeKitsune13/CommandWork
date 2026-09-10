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

    private static readonly string FakeHash =
        new PasswordHasher<User>().HashPassword(new User(), Guid.NewGuid().ToString());

    public UserService(CoopProjectContext db)
    {
        _db = db;
    }

    public async Task<User?> ValidateCredentialsAsync(string? email, string? phone, string password)
    {
        User? user = null;
        if (!string.IsNullOrWhiteSpace(email))
            user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        else if (!string.IsNullOrWhiteSpace(phone))
            user = await _db.Users.FirstOrDefaultAsync(u => u.Phone == phone);

        if (user is null || user.IsBlocked)
            return null;

        if (user is null || user.IsBlocked)
        {
            _hasher.VerifyHashedPassword(new User(), FakeHash, password); // "съедаем" время
            return null;
        }
        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (result == PasswordVerificationResult.Failed)
            return null;

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _hasher.HashPassword(user, password);
            await _db.SaveChangesAsync();
        }

        return user;
    }
}
