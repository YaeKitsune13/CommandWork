using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/admin")]
[Authorize(Roles = "admin")]
[Tags("Admin")]
public class AdminController : ApiControllerBase
{
    private readonly IAdminService _admin;

    public AdminController(IAdminService admin) => _admin = admin;

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Ok(await _admin.GetUsersAsync(search, page, pageSize));

    [HttpPatch("users/{id}/role")]
    public async Task<IActionResult> ChangeRole(ulong id, [FromBody] SetRoleDto dto)
    {
        await _admin.ChangeUserRoleAsync(id, dto.Role);
        return NoContent();
    }

    [HttpPatch("users/{id}/block")]
    public async Task<IActionResult> SetBlock(ulong id, [FromBody] SetBlockDto dto)
    {
        await _admin.SetUserBlockAsync(id, dto.IsBlocked);
        return NoContent();
    }

    [HttpGet("genres")]
    public async Task<IActionResult> GetGenres() =>
        Ok(await _admin.GetGenresAsync());

    [HttpPost("genres")]
    public async Task<IActionResult> CreateGenre([FromBody] CreateGenreDto dto) =>
        StatusCode(StatusCodes.Status201Created, await _admin.CreateGenreAsync(dto));

    [HttpPut("genres/{id}")]
    public async Task<IActionResult> UpdateGenre(ulong id, [FromBody] UpdateGenreDto dto) =>
        Ok(await _admin.UpdateGenreAsync(id, dto));

    [HttpDelete("genres/{id}")]
    public async Task<IActionResult> DeleteGenre(ulong id)
    {
        await _admin.DeleteGenreAsync(id);
        return NoContent();
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics() =>
        Ok(await _admin.GetAnalyticsAsync());
}
