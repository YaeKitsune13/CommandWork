using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/music")] 
public class TracksController : ControllerBase
{
    private readonly ITrackService _tracks;

    public TracksController(ITrackService tracks)
    {
        _tracks = tracks;
    }

    // [Authorize]
    [HttpPost]
    [Consumes("multipart/form-data")]
    public Task<IActionResult> Upload([FromForm] TrackUploadDto dto) =>
        Handle(async () =>
        {
            var track = await _tracks.UploadAsync(dto);
            return Ok(new { message = "Вы успешно выложили песню", music = track });
        });

    [HttpGet("meta")]
    public Task<IActionResult> GetMeta([FromQuery] ulong id) =>
        Handle(async () => Ok(await _tracks.GetAsync(id)));

    [HttpGet("sound")]
    public Task<IActionResult> GetSound([FromQuery] ulong id) =>
        Handle(async () =>
        {
            var sound = await _tracks.GetSoundAsync(id);
            return PhysicalFile(sound.PhysicalPath, sound.ContentType, enableRangeProcessing: true);
        });

    // [Authorize]
    [HttpDelete("delete")]
    public Task<IActionResult> Delete([FromQuery] ulong id) =>
        Handle(async () =>
        {
            await _tracks.DeleteAsync(id);
            return Ok(new { message = "Песня удалена!" });
        });

    // [Authorize]
    [HttpPut("edit")]
    public Task<IActionResult> Edit([FromBody] TrackEditDto dto) =>
        Handle(async () =>
        {
            await _tracks.EditAsync(dto);
            return Ok(new { message = "Песня обновлена!" });
        });

    private async Task<IActionResult> Handle(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }
}