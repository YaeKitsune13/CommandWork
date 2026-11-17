public class NotFoundException(string message) : Exception(message);
public class ForbiddenException(string message, string code = "forbidden") : Exception(message)
{
    public string Code { get; } = code;
}
public class ConflictException(string message, Dictionary<string, string[]>? fields = null) : Exception(message)
{
    public Dictionary<string, string[]> Fields { get; } = fields ?? new();
}
public class BadRequestException(string message, Dictionary<string, string[]>? fields = null) : Exception(message)
{
    public Dictionary<string, string[]> Fields { get; } = fields ?? new();
}
public class UnauthorizedException(string message = "Не авторизован") : Exception(message);

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _log;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> log)
    {
        _next = next;
        _log = log;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await _next(ctx);
        }
        catch (Exception ex)
        {
            var (status, code, fields) = ex switch
            {
                NotFoundException or KeyNotFoundException =>
                    (StatusCodes.Status404NotFound, "not_found", new Dictionary<string, string[]>()),
                UnauthorizedException =>
                    (StatusCodes.Status401Unauthorized, "unauthorized", new Dictionary<string, string[]>()),
                ForbiddenException f =>
                    (StatusCodes.Status403Forbidden, f.Code, new Dictionary<string, string[]>()),
                UnauthorizedAccessException =>
                    (StatusCodes.Status403Forbidden, "forbidden", new Dictionary<string, string[]>()),
                ConflictException c =>
                    (StatusCodes.Status409Conflict, "conflict", c.Fields),
                BadRequestException b =>
                    (StatusCodes.Status400BadRequest, b.Fields.Count > 0 ? "validation" : "bad_request", b.Fields),
                ArgumentException =>
                    (StatusCodes.Status400BadRequest, "bad_request", new Dictionary<string, string[]>()),
                _ =>
                    (StatusCodes.Status500InternalServerError, "server_error", new Dictionary<string, string[]>())
            };

            if (status == StatusCodes.Status500InternalServerError)
                _log.LogError(ex, "Необработанная ошибка");

            ctx.Response.StatusCode = status;
            await ctx.Response.WriteAsJsonAsync(new
            {
                error = status == StatusCodes.Status500InternalServerError ? "Внутренняя ошибка сервера" : ex.Message,
                details = status == StatusCodes.Status500InternalServerError ? ex.Message : null,
                code,
                fields
            });
        }
    }
}
