using Microsoft.EntityFrameworkCore;
using api.Entities;
using api.Data;
using api.Services;
using api.Controller;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppServices(this IServiceCollection services, IConfiguration config)
    {
        // AddDbContext отсюда убираем, он уже настроен в Program.cs

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITrackService, TrackService>();
        services.AddScoped<IAlbumService, AlbumService>(); 
        services.AddScoped<ISocialService, SocialService>();

        return services;
    }
}
