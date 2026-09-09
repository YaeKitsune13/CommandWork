using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("/api/[controller]")]
public class Autharization : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email)
            || string.IsNullOrWhiteSpace(request.Phone))
        {
            return Ok();
        }
        return Ok();
    }
}

public class LoginRequest {
    public string Email { get; set; }
    public string Phone { get; set; }
    public string Password { get; set; }
}
