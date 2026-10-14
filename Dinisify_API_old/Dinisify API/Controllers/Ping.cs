using Dinisify_API.Model;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api")]
public class Ping : ControllerBase
{

[HttpGet("/api/ping")]
public IActionResult pinger()
{
    return Ok("Работает");
}
}