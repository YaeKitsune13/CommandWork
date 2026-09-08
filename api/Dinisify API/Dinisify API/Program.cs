var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.Use(async (context, next) =>
{
    var sw = System.Diagnostics.Stopwatch.StartNew();
    await next();
    sw.Stop();

    Console.WriteLine($"{DateTime.Now:HH:mm:ss} | {context.Response.StatusCode} | {sw.ElapsedMilliseconds}ms | {context.Request.Method} {context.Request.Path}");
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapGet("/api/ping", () => Results.Ok("Сервер Активен"));
app.Run();
