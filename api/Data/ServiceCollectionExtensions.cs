using api.Services;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppServices(this IServiceCollection services, IConfiguration config)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITrackService, TrackService>();
        services.AddScoped<IAlbumService, AlbumService>();
        services.AddScoped<IPlaylistService, PlaylistsService>();
        services.AddScoped<ISocialService, SocialService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IDiscoveryService, DiscoveryService>();
        services.AddScoped<ILikeService, LikeService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IComplaintService, ComplaintService>();
        services.AddScoped<IModeratorService, ModeratorService>();

        return services;
    }
}
