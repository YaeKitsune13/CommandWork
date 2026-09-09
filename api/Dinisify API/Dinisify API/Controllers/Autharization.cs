using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly JwtTokenGenerator _tokenGenerator;
    private readonly IUserService _userService;

    public AuthController(JwtTokenGenerator tokenGenerator, IUserService userService)
    {
        _tokenGenerator = tokenGenerator;
        _userService = userService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) && string.IsNullOrWhiteSpace(request.Phone))
        {
            return BadRequest("Укажите email или телефон");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Пароль обязателен");
        }

        var user = await _userService.ValidateCredentialsAsync(
            request.Email, request.Phone, request.Password);

        if (user is null)
        {
            return Unauthorized("Неверные учётные данные");
        }

        var token = _tokenGenerator.GenerateToken(user.Id, user.Username);
        return Ok(new { token });
    }
}

public class LoginRequest
{
    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? Phone { get; set; }

    [Required]
    public string Password { get; set; } = string.Empty;
}
