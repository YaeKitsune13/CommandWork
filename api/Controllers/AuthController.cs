using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/auth")]
[Tags("Auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var token = await _auth.RegisterAsync(dto);
        return StatusCode(StatusCodes.Status201Created, new TokenDto(token));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var token = await _auth.LoginAsync(dto);
        return Ok(new TokenDto(token));
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var resetToken = await _auth.ForgotPasswordAsync(dto.Email);
        return Ok(new
        {
            message = "Если такой email зарегистрирован, запрос обработан",
            resetToken,
            token = resetToken // на случай если старый фронт ждёт поле token
        });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
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
        var id = CurrentIdOrNull;
        var role = CurrentRole;

        if (id is null)
        {
            return Ok(new
            {
                id = (ulong?)null,
                nickname = "Гость",
                name = "Гость",
                role = "guest",
                isGuest = true
            });
        }

        var nickname = User.Identity?.Name ?? "";
        return Ok(new
        {
            id,
            nickname,
            name = nickname,
            role,
            isGuest = false
        });
    }
}
