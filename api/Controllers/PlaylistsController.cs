using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/playlists")]
[Tags("Playlists")]
public class PlaylistsController : ApiControllerBase
{
    private readonly IPlaylistService _playlists;

    public PlaylistsController(IPlaylistService playlists) => _playlists = playlists;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetPublic(
        [FromQuery] string? search,
        [FromQuery] ulong? ownerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Ok(await _playlists.GetPublicAsync(search, ownerId, page, pageSize, CurrentIdOrNull));

    [Authorize(Policy = "Registered")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _playlists.GetMineAsync(CurrentId, page, pageSize));

    [AllowAnonymous]
    [HttpGet("{id:ulong}")]
    public async Task<IActionResult> Get(ulong id) =>
        Ok(await _playlists.GetAsync(id, CurrentIdOrNull, CurrentRole));

    [Authorize(Policy = "Registered")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PlaylistCreateDto dto) =>
        StatusCode(StatusCodes.Status201Created, await _playlists.CreateAsync(dto, CurrentId));

    [Authorize(Policy = "Registered")]
    [HttpPut("{id:ulong}")]
    public async Task<IActionResult> Edit(ulong id, [FromBody] PlaylistEditDto dto) =>
        Ok(await _playlists.EditAsync(id, dto, CurrentId));

    [Authorize(Policy = "Registered")]
    [HttpDelete("{id:ulong}")]
    public async Task<IActionResult> Delete(ulong id)
    {
        await _playlists.DeleteAsync(id, CurrentId, CurrentRole);
        return NoContent();
    }

    [Authorize(Policy = "Registered")]
    [HttpPost("{id:ulong}/tracks")]
    public async Task<IActionResult> AddTrack(ulong id, [FromBody] PlaylistAddTrackDto dto) =>
        Ok(await _playlists.AddTrackAsync(id, dto, CurrentId));

    [Authorize(Policy = "Registered")]
    [HttpDelete("{id:ulong}/tracks/{trackId:ulong}")]
    public async Task<IActionResult> RemoveTrack(ulong id, ulong trackId)
    {
        await _playlists.RemoveTrackAsync(id, trackId, CurrentId);
        return NoContent();
    }

    [Authorize(Policy = "Registered")]
    [HttpPut("{id:ulong}/tracks/{trackId:ulong}/position")]
    public async Task<IActionResult> MoveTrack(ulong id, ulong trackId, [FromQuery] int position) =>
        Ok(await _playlists.MoveTrackAsync(id, trackId, position, CurrentId));

    [Authorize(Policy = "Registered")]
    [HttpPut("{id:ulong}/tracks/{trackId:ulong}")]
    public async Task<IActionResult> MoveTrackBody(ulong id, ulong trackId, [FromBody] PlaylistMoveTrackDto dto) =>
        Ok(await _playlists.MoveTrackAsync(id, trackId, dto.Position, CurrentId));

    [Authorize(Policy = "Registered")]
    [HttpPost("{id:ulong}/collaborators")]
    public async Task<IActionResult> AddCollaborator(ulong id, [FromBody] PlaylistCollaboratorDto dto) =>
        Ok(await _playlists.AddCollaboratorAsync(id, dto, CurrentId));

    [Authorize(Policy = "Registered")]
    [HttpDelete("{id:ulong}/collaborators/{userId:ulong}")]
    public async Task<IActionResult> RemoveCollaborator(ulong id, ulong userId)
    {
        await _playlists.RemoveCollaboratorAsync(id, userId, CurrentId);
        return NoContent();
    }
}
