using Dinisify_API.Model;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api")]
public class GuestController : ControllerBase
{

 [HttpPost("/auth/register")]
 public IActionResult register(User user)
    {
        return Ok();
    }
}