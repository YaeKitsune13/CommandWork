using System.Security.Claims;
using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/playlists")]
[Tags("Playlists")]
public class PlaylistsController : ControllerBase
{
    private readonly IPlaylistService _playlists;

    public PlaylistsController(IPlaylistService playlists) => _playlists = playlists;


    [HttpGet]
    public Task<IActionResult> GetPublic([FromQuery] string? search) =>
        Handle(async () => Ok(await _playlists.GetPublicAsync(search)));

    [HttpGet("{id}")]
    public Task<IActionResult> Get([FromRoute] ulong id) =>
        Handle(async () => Ok(await _playlists.GetAsync(id, GetUserId())));


    [Authorize]
    [HttpGet("my")]
    public Task<IActionResult> GetMine() =>
        Handle(async () => Ok(await _playlists.GetMineAsync(GetUserId()!.Value)));

    [Authorize]
    [HttpPost]
    public Task<IActionResult> Create([FromBody] PlaylistCreateDto dto) =>
        Handle(async () =>
        {
            var playlist = await _playlists.CreateAsync(dto, GetUserId()!.Value);
            return Ok(new { message = "Плейлист создан", playlist });
        });

    [Authorize]
    [HttpPut("{id}")]
    public Task<IActionResult> Edit([FromRoute] ulong id, [FromBody] PlaylistEditDto dto) =>
        Handle(async () =>
        {
            await _playlists.EditAsync(id, dto, GetUserId()!.Value);
            return Ok(new { message = "Плейлист обновлен" });
        });

    [Authorize]
    [HttpDelete("{id}")]
    public Task<IActionResult> Delete([FromRoute] ulong id) =>
        Handle(async () =>
        {
            await _playlists.DeleteAsync(id, GetUserId()!.Value);
            return Ok(new { message = "Плейлист удален" });
        });


    [Authorize]
    [HttpPost("{id}/tracks")]
    public Task<IActionResult> AddTrack([FromRoute] ulong id, [FromBody] PlaylistAddTrackDto dto) =>
        Handle(async () =>
        {
            await _playlists.AddTrackAsync(id, dto, GetUserId()!.Value);
            return Ok(new { message = "Трек добавлен в плейлист" });
        });

    [Authorize]
    [HttpDelete("{id}/tracks/{trackId}")]
    public Task<IActionResult> RemoveTrack([FromRoute] ulong id, [FromRoute] ulong trackId) =>
        Handle(async () =>
        {
            await _playlists.RemoveTrackAsync(id, trackId, GetUserId()!.Value);
            return Ok(new { message = "Трек удален из плейлиста" });
        });

    [Authorize]
    [HttpPut("{id}/tracks/{trackId}/position")]
    public Task<IActionResult> MoveTrack([FromRoute] ulong id, [FromRoute] ulong trackId, [FromQuery] int position) =>
        Handle(async () =>
        {
            await _playlists.MoveTrackAsync(id, trackId, position, GetUserId()!.Value);
            return Ok(new { message = "Позиция трека изменена" });
        });


    [Authorize]
    [HttpPost("{id}/collaborators")]
    public Task<IActionResult> AddCollaborator([FromRoute] ulong id, [FromBody] PlaylistCollaboratorDto dto) =>
        Handle(async () =>
        {
            await _playlists.AddCollaboratorAsync(id, dto, GetUserId()!.Value);
            return Ok(new { message = "Соавтор назначен" });
        });

    [Authorize]
    [HttpDelete("{id}/collaborators/{userId}")]
    public Task<IActionResult> RemoveCollaborator([FromRoute] ulong id, [FromRoute] ulong userId) =>
        Handle(async () =>
        {
            await _playlists.RemoveCollaboratorAsync(id, userId, GetUserId()!.Value);
            return Ok(new { message = "Соавтор удален" });
        });


    private ulong? GetUserId()
    {
        var str = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return ulong.TryParse(str, out var id) ? id : null;
    }

    private async Task<IActionResult> Handle(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ex.Message); }
    }
}