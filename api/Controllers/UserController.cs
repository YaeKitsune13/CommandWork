using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _users;

    public UsersController(IUserService users) => _users = users;

    private ulong? CurrentId =>
        ulong.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    private string? CurrentRole => User.FindFirstValue(ClaimTypes.Role);

    // GET api/users/{id}: гостю можно
    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(ulong id) =>
        Ok(await _users.GetProfileAsync(id, CurrentId, CurrentRole));

    // PUT api/users/{id}: профиль и приватность
    [Authorize(Policy = "Registered")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProfile(ulong id, UpdateProfileDto dto) =>
        Ok(await _users.UpdateProfileAsync(id, dto, CurrentId!.Value, CurrentRole!));

    // PUT api/users/{id}/password
    [Authorize(Policy = "Registered")]
    [HttpPut("{id}/password")]
    public async Task<IActionResult> ChangePassword(ulong id, ChangePasswordDto dto)
    {
        await _users.ChangePasswordAsync(id, dto, CurrentId!.Value);
        return NoContent();
    }

    // GET api/users/{id}/history?page=1&pageSize=20
    [Authorize(Policy = "Registered")]
    [HttpGet("{id}/history")]
    public async Task<IActionResult> GetHistory(ulong id, int page = 1, int pageSize = 20) =>
        Ok(await _users.GetHistoryAsync(id, CurrentId!.Value, CurrentRole!, page, pageSize));
}
