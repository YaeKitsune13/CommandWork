using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected ulong? CurrentIdOrNull =>
        ulong.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    protected ulong CurrentId =>
        CurrentIdOrNull ?? throw new UnauthorizedException("Не авторизован");

    protected string CurrentRole =>
        User.FindFirstValue(ClaimTypes.Role) ?? "guest";
}
