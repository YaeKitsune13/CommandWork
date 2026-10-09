using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Lifetime.ApplicationStarted.Register(() =>
{
    if (app.Environment.IsDevelopment())
        Console.WriteLine("Scalar: http://localhost:5140/scalar/v1");
});

app.Run();
