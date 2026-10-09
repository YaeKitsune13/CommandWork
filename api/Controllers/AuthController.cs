using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var ok = await _auth.RegisterAsync(dto);
        return ok ? Ok() : Conflict("Email занят");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var token = await _auth.LoginAsync(dto);
        return token is null ? Unauthorized() : Ok(new TokenDto(token));
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var name = User.Identity!.Name;
        var role = User.FindFirstValue(ClaimTypes.Role);

        return Ok(new { id, name, role });
    }

    // [Authorize(Roles = "admin")]
    // [HttpGet("admin-only")]
    // public IActionResult AdminOnly() => Ok("Привет, админ");
}
