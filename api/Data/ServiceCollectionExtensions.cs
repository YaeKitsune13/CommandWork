using Microsoft.EntityFrameworkCore;
using api.Entities;
using api.Data;
using api.Services;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppServices(this IServiceCollection services, IConfiguration config)
    {
        var cs = config.GetConnectionString("Default");

        services.AddDbContext<CoopProjectContext>(o =>
            o.UseMySql(cs, new MySqlServerVersion(new Version(8, 0, 36))));

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITrackService, TrackService>();

        return services;
    }
}