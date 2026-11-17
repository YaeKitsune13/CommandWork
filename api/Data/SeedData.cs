using api.Data;
using api.Entities;
using Microsoft.AspNetCore.Identity;

namespace api.Data;

public static class SeedData
{
    public static void Run(CoopProjectContext db)
    {
        // если тестовые данные уже есть, выходим
        var already = db.Users.Where(u => u.Email == "user1@test.com").FirstOrDefault();
        if (already != null)
        {
            return;
        }

        var hasher = new PasswordHasher<User>();

        var u1 = new User { Email = "user1@test.com", Nickname = "user1", Role = "user", Privacy = "public" };
        var u2 = new User { Email = "user2@test.com", Nickname = "user2", Role = "user", Privacy = "public" };
        var u3 = new User { Email = "user3@test.com", Nickname = "user3", Role = "user", Privacy = "public" };
        var u4 = new User { Email = "private@test.com", Nickname = "private_user", Role = "user", Privacy = "private" };

        u1.PasswordHash = hasher.HashPassword(u1, "123456");
        u2.PasswordHash = hasher.HashPassword(u2, "123456");
        u3.PasswordHash = hasher.HashPassword(u3, "123456");
        u4.PasswordHash = hasher.HashPassword(u4, "123456");

        db.Users.AddRange(u1, u2, u3, u4);
        db.SaveChanges(); 

        db.Follows.AddRange(
            new Follow { FollowerId = u1.Id, FollowingId = u2.Id, Status = "accepted", CreatedAt = DateTime.UtcNow },
            new Follow { FollowerId = u1.Id, FollowingId = u3.Id, Status = "accepted", CreatedAt = DateTime.UtcNow },
            new Follow { FollowerId = u2.Id, FollowingId = u1.Id, Status = "accepted", CreatedAt = DateTime.UtcNow },
            new Follow { FollowerId = u3.Id, FollowingId = u4.Id, Status = "pending", CreatedAt = DateTime.UtcNow },
            new Follow { FollowerId = u2.Id, FollowingId = u4.Id, Status = "accepted", CreatedAt = DateTime.UtcNow }
        );
        db.SaveChanges();
    }
}