using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddJwtAuth();
builder.Services.AddAppServices(builder.Configuration);
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}app.UseCors("AllowSpecificOrigins");
app.UseRouting();
app.UseMiddleware<ExceptionMiddleware>(); 
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();