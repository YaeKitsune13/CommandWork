using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;


public static class JWTSetup
{
    public static readonly SymmetricSecurityKey Key =
        new(Encoding.UTF8.GetBytes("super-secret-key-for-learning-project-2026!"));

    public static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(2);

    public static IServiceCollection AddJwtAuth(this IServiceCollection services)
    {
        services.AddAuthentication("Bearer")
            .AddJwtBearer(o =>
            {
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = "my-api",
                    ValidAudience = "my-client",
                    IssuerSigningKey = Key
                };
            });
        services.AddAuthorizationBuilder()
            .AddPolicy("Registered", p => p.RequireRole("user", "moderator", "admin"));
        return services;
    }

    public static string CreateToken(api.Entities.User user) =>
        new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = "my-api",
            Audience = "my-client",
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Nickname ?? user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            }),
            Expires = DateTime.UtcNow.Add(TokenLifetime),
            SigningCredentials = new SigningCredentials(Key, SecurityAlgorithms.HmacSha256)
        });

    public static string? RefreshToken(ClaimsPrincipal principal)
    {
        var id = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = principal.FindFirstValue(ClaimTypes.Role);
        if (id is null || role is null or "guest") return null;

        if (long.TryParse(principal.FindFirstValue("exp"), out var exp))
        {
            var left = DateTimeOffset.FromUnixTimeSeconds(exp) - DateTimeOffset.UtcNow;
            if (left > TokenLifetime / 2) return null;
        }

        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = "my-api",
            Audience = "my-client",
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, id),
                new Claim(ClaimTypes.Name, principal.FindFirstValue(ClaimTypes.Name) ?? ""),
                new Claim(ClaimTypes.Role, role)
            }),
            Expires = DateTime.UtcNow.Add(TokenLifetime),
            SigningCredentials = new SigningCredentials(Key, SecurityAlgorithms.HmacSha256)
        });
    }

    public static string CreateGuestToken() =>
        new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = "my-api",
            Audience = "my-client",
            Subject = new ClaimsIdentity(new[]
            {
                    new Claim(ClaimTypes.Name, "guest"),
                    new Claim(ClaimTypes.Role, "guest")
            }),
            Expires = DateTime.UtcNow.AddHours(2),
            SigningCredentials = new SigningCredentials(Key, SecurityAlgorithms.HmacSha256)
        });
}
