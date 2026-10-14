using Microsoft.EntityFrameworkCore;
using api.Entities;
using api.Data;
using api.Services;
using api.Controller;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppServices(this IServiceCollection services, IConfiguration config)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITrackService, TrackService>();
        services.AddScoped<IAlbumService, AlbumService>(); 
        services.AddScoped<ISocialService, SocialService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IDiscoveryService, DiscoveryService>();

        return services;
    }
}
