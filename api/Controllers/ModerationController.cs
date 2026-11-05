using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/moderator")]
[Authorize(Roles = "moderator,admin")]
[Tags("Moderation")]
public class ModeratorController : ApiControllerBase
{
    private readonly IModeratorService _service;

    public ModeratorController(IModeratorService service) => _service = service;

    [HttpGet("complaints")]
    public async Task<IActionResult> GetComplaints([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _service.GetAllComplaintsAsync(status, page, pageSize));

    [HttpPut("complaints/{id:ulong}/resolve")]
    public async Task<IActionResult> ResolveComplaint(ulong id, [FromBody] ResolveComplaintDto? dto) =>
        Ok(await _service.ResolveComplaintAsync(id, CurrentId, dto?.Status ?? "resolved"));

    [HttpGet("tracks/pending")]
    [HttpGet("music/pending")]
    public async Task<IActionResult> GetPendingMusic([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _service.GetPendingMusicAsync(page, pageSize));

    [HttpPut("tracks/{id:ulong}/review")]
    public async Task<IActionResult> ReviewTrack(ulong id, [FromBody] MusicReviewDto dto) =>
        Ok(await _service.ReviewMusicAsync(id, dto, CurrentId));

    [HttpPut("music/review")]
    public async Task<IActionResult> ReviewMusicLegacy([FromBody] MusicReviewDto dto)
    {
        if (!dto.MusicId.HasValue) throw new BadRequestException("Не указан musicId");
        return Ok(await _service.ReviewMusicAsync(dto.MusicId.Value, dto, CurrentId));
    }

    [HttpPatch("users/{id:ulong}/block")]
    public async Task<IActionResult> BlockUser(ulong id, [FromBody] UserBlockDto dto)
    {
        await _service.SetUserBlockStatusAsync(id, dto.IsBlocked, CurrentRole);
        return NoContent();
    }

    [HttpPut("users/block")]
    public async Task<IActionResult> SetBlockLegacy([FromBody] UserBlockDto dto)
    {
        if (!dto.UserId.HasValue) throw new BadRequestException("Не указан userId");
        await _service.SetUserBlockStatusAsync(dto.UserId.Value, dto.IsBlocked, CurrentRole);
        return NoContent();
    }
}
