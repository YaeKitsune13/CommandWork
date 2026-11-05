using Scalar.AspNetCore;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found in appsettings.json.");

builder.Services.AddJwtAuth();
builder.Services.AddAppServices(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()
              .WithExposedHeaders("X-Refreshed-Token");
    });
});

builder.Services.AddScoped<ITrackService, TrackService>();
builder.Services.AddScoped<IAlbumService, AlbumService>();
builder.Services.AddScoped<IComplaintService, ComplaintService>();
builder.Services.AddScoped<IModeratorService, ModeratorService>();
builder.Services.AddScoped<IPlaylistService, PlaylistsService>();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<CoopProjectContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 36))
    ));

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        // options.DisableAgent();
    });
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CoopProjectContext>();
    SeedData.Run(db);
}
else
{
    app.UseHttpsRedirection();
}
app.UseMiddleware<ExceptionMiddleware>();
app.UseRouting();
app.UseCors("AllowSpecificOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.Use(async (ctx, next) =>
{
    if (ctx.User.Identity?.IsAuthenticated == true)
    {
        var fresh = JWTSetup.RefreshToken(ctx.User);
        if (fresh is not null)
            ctx.Response.OnStarting(() =>
            {
                ctx.Response.Headers["X-Refreshed-Token"] = fresh;
                return Task.CompletedTask;
            });
    }
    await next();
});

app.MapGet("/info", async (IWebHostEnvironment env) =>
{
    var path = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "spec.html");
    if (!File.Exists(path))
        path = Path.Combine(env.ContentRootPath, "spec.html");

    if (!File.Exists(path))
        return Results.NotFound("Файл spec.html не найден в контейнере");

    var html = await File.ReadAllTextAsync(path);
    return Results.Content(html, "text/html; charset=utf-8");
}).AllowAnonymous();

app.MapControllers();

app.Lifetime.ApplicationStarted.Register(() =>
{
    if (app.Environment.IsDevelopment())
    {
        Console.WriteLine("Scalar: http://localhost:5000/scalar/v1");
    }
});

app.Run();
