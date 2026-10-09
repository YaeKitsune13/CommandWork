using Microsoft.EntityFrameworkCore;
using api.Entities;
using api.Data;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppServices(this IServiceCollection services, IConfiguration config)
    {
        var cs = config.GetConnectionString("Default");

        services.AddDbContext<CoopProjectContext>(o => o.UseMySql(cs, ServerVersion.AutoDetect(cs)));
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
