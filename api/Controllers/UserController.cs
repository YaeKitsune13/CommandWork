using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/users")]
[Tags("Users")]
public class UsersController : ApiControllerBase
{
    private readonly IUserService _users;
    private readonly ITrackService _tracks;
    private readonly IAlbumService _albums;
    private readonly IPlaylistService _playlists;
    private readonly ILikeService _likes;

    public UsersController(
        IUserService users,
        ITrackService tracks,
        IAlbumService albums,
        IPlaylistService playlists,
        ILikeService likes)
    {
        _users = users;
        _tracks = tracks;
        _albums = albums;
        _playlists = playlists;
        _likes = likes;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> SearchUsers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _users.SearchUsersAsync(search, page, pageSize));

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(ulong id) =>
        Ok(await _users.GetProfileAsync(id, CurrentIdOrNull, CurrentRole));

    [Authorize(Policy = "Registered")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProfile(ulong id, [FromBody] UpdateProfileDto dto) =>
        Ok(await _users.UpdateProfileAsync(id, dto, CurrentId, CurrentRole));

    [Authorize(Policy = "Registered")]
    [HttpPut("{id}/password")]
    public async Task<IActionResult> ChangePassword(ulong id, [FromBody] ChangePasswordDto dto)
    {
        await _users.ChangePasswordAsync(id, dto, CurrentId);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("{id}/tracks")]
    public async Task<IActionResult> GetUserTracks(ulong id, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _tracks.GetByUserAsync(id, status, page, pageSize, CurrentIdOrNull, CurrentRole));

    [AllowAnonymous]
    [HttpGet("{id}/albums")]
    public async Task<IActionResult> GetUserAlbums(ulong id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _albums.GetAllAsync(null, id, page, pageSize));

    [AllowAnonymous]
    [HttpGet("{id}/playlists")]
    public async Task<IActionResult> GetUserPlaylists(ulong id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        CurrentIdOrNull == id
            ? Ok(await _playlists.GetMineAsync(id, page, pageSize))
            : Ok(await _playlists.GetPublicAsync(null, id, page, pageSize, CurrentIdOrNull));

    [Authorize(Policy = "Registered")]
    [HttpGet("{id}/likes")]
    public async Task<IActionResult> GetUserLikes(ulong id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (CurrentId != id && CurrentRole != "admin")
            throw new ForbiddenException("Понравившиеся треки доступны только владельцу");
        return Ok(await _likes.GetLikedAsync(id, page, pageSize));
    }

    [Authorize(Policy = "Registered")]
    [HttpPost("{id}/history")]
    public async Task<IActionResult> RecordListen(ulong id, [FromBody] RecordListenDto dto)
    {
        await _users.RecordListenAsync(id, dto.MusicId, CurrentId);
        return NoContent();
    }

    [Authorize(Policy = "Registered")]
    [HttpGet("{id}/history")]
    public async Task<IActionResult> GetHistory(ulong id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _users.GetHistoryAsync(id, CurrentId, CurrentRole, page, pageSize));
}
