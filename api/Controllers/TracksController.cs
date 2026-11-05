using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/tracks")]
[Route("api/music")]
[Tags("Tracks")]
public class TracksController : ApiControllerBase
{
    private readonly ITrackService _tracks;
    private readonly IUserService _users;

    public TracksController(ITrackService tracks, IUserService users)
    {
        _tracks = tracks;
        _users = users;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetCatalog(
        [FromQuery] string? search,
        [FromQuery] ulong? genreId,
        [FromQuery] ulong? albumId,
        [FromQuery] ulong? ownerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Ok(await _tracks.GetCatalogAsync(search, genreId, albumId, ownerId, page, pageSize, CurrentIdOrNull));

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(ulong id) =>
        Ok(await _tracks.GetAsync(id, CurrentIdOrNull, CurrentRole));

    [AllowAnonymous]
    [HttpGet("meta")]
    public async Task<IActionResult> GetMeta([FromQuery] ulong id) =>
        Ok(await _tracks.GetAsync(id, CurrentIdOrNull, CurrentRole));

    [AllowAnonymous]
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(ulong userId, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _tracks.GetByUserAsync(userId, status, page, pageSize, CurrentIdOrNull, CurrentRole));

    [AllowAnonymous]
    [HttpGet("{id}/stream")]
    public async Task<IActionResult> Stream(ulong id)
    {
        var sound = await _tracks.GetSoundAsync(id, CurrentIdOrNull, CurrentRole);
        return PhysicalFile(sound.PhysicalPath, sound.ContentType, enableRangeProcessing: true);
    }

    [AllowAnonymous]
    [HttpGet("sound")]
    public async Task<IActionResult> GetSound([FromQuery] ulong id) => await Stream(id);

    [Authorize(Policy = "Registered")]
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload([FromForm] TrackUploadDto dto)
    {
        var track = await _tracks.UploadAsync(dto, CurrentId);
        return StatusCode(StatusCodes.Status201Created, track);
    }

    [Authorize(Policy = "Registered")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Edit(ulong id, [FromBody] TrackEditDto dto) =>
        Ok(await _tracks.EditAsync(id, dto, CurrentId, CurrentRole));

    [Authorize(Policy = "Registered")]
    [HttpPut("edit")]
    public async Task<IActionResult> EditLegacy([FromBody] TrackEditDto dto)
    {
        if (!dto.Id.HasValue) throw new BadRequestException("Не указан id трека");
        return Ok(await _tracks.EditAsync(dto.Id.Value, dto, CurrentId, CurrentRole));
    }

    [Authorize(Policy = "Registered")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(ulong id)
    {
        await _tracks.DeleteAsync(id, CurrentId, CurrentRole);
        return NoContent();
    }

    [Authorize(Policy = "Registered")]
    [HttpDelete("delete")]
    public async Task<IActionResult> DeleteLegacy([FromQuery] ulong id)
    {
        await _tracks.DeleteAsync(id, CurrentId, CurrentRole);
        return NoContent();
    }

    [Authorize(Policy = "Registered")]
    [HttpPost("{id}/listen")]
    public async Task<IActionResult> RecordListen(ulong id)
    {
        await _users.RecordListenAsync(CurrentId, id, CurrentId);
        return NoContent();
    }
}
