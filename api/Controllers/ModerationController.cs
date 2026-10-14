using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace api.Controller;

[ApiController]
[Route("api/moderator")]
[Authorize(Roles = "moderator,admin")] 
public class ModeratorController : ControllerBase
{
    private readonly IModeratorService _service;

    public ModeratorController(IComplaintService oldComp, IModeratorService service) 
    {
        _service = service;
    }

    [HttpGet("complaints")]
    public async Task<IActionResult> GetComplaints() => Ok(await _service.GetAllComplaintsAsync());

    [HttpPut("complaints/{id}/resolve")]
    public async Task<IActionResult> ResolveComplaint(ulong id)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !ulong.TryParse(userIdStr, out ulong modId)) return Unauthorized();

        await _service.ResolveComplaintAsync(id, modId);
        return Ok(new { message = "Жалоба обработана" });
    }

    [HttpGet("music/pending")]
    public async Task<IActionResult> GetPendingMusic() => Ok(await _service.GetPendingMusicAsync());

    [HttpPut("music/review")]
    public async Task<IActionResult> ReviewMusic([FromBody] MusicReviewDto dto)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !ulong.TryParse(userIdStr, out ulong modId)) return Unauthorized();

        await _service.ReviewMusicAsync(dto, modId);
        return Ok(new { message = "Решение сохранено" });
    }

    [HttpPut("users/block")]
    public async Task<IActionResult> SetBlock([FromBody] UserBlockDto dto)
    {
        await _service.SetUserBlockStatusAsync(dto);
        return Ok(new { message = "Статус блокировки обновлен" });
    }
}