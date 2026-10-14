public class NotFoundException(string message) : Exception(message);     // 404
public class ForbiddenException(string message) : Exception(message);    // 403
public class ConflictException(string message) : Exception(message);     // 409
public class BadRequestException(string message) : Exception(message);   // 400

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
            var status = ex switch
            {
                NotFoundException => StatusCodes.Status404NotFound,
                ForbiddenException => StatusCodes.Status403Forbidden,
                ConflictException => StatusCodes.Status409Conflict,
                BadRequestException => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status500InternalServerError
            };

            if (status == 500) _log.LogError(ex, "Необработанная ошибка");

            ctx.Response.StatusCode = status;
            await ctx.Response.WriteAsJsonAsync(new
            {
                error = status == 500 ? "Внутренняя ошибка сервера" : ex.Message
            });
        }
    }
}
