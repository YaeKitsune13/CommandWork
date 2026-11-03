using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/auth")]
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

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        var token = await _auth.ForgotPasswordAsync(dto.Email);

        if (token is null)
        {
            return Ok(new { message = "Если такой email зарегистрирован, запрос обработан" });
        }

        return Ok(new { token, message = "Токен сброса пароля успешно сгенерирован" });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        await _auth.ResetPasswordAsync(dto);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("guest")]
    public IActionResult Guest() => Ok(new TokenDto(JWTSetup.CreateGuestToken()));

   [Authorize]
[HttpGet("me")]
public IActionResult Me()
{
    var idText = User.FindFirstValue(ClaimTypes.NameIdentifier);
    var role = User.FindFirstValue(ClaimTypes.Role);

    if (!ulong.TryParse(idText, out var id))
    {
        return Ok(new { isGuest = true, id = (ulong?)null, name = "Гость", role = role ?? "guest" });
    }

    return Ok(new { isGuest = false, id, name = User.Identity!.Name, role });
}
}
