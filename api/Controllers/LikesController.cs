using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/tracks")]
[Route("api/music")]
[Tags("Likes")]
public class LikesController : ApiControllerBase
{
    private readonly ILikeService _likes;

    public LikesController(ILikeService likes) => _likes = likes;

    [Authorize(Policy = "Registered")]
    [HttpPut("{id}/reaction")]
    public async Task<IActionResult> SetReaction(ulong id, [FromBody] SetReactionDto dto) =>
        Ok(await _likes.SetReactionAsync(id, CurrentId, dto.Type));

    [Authorize(Policy = "Registered")]
    [HttpPost("{id}/like")]
    public async Task<IActionResult> Like(ulong id) =>
        Ok(await _likes.SetReactionAsync(id, CurrentId, "like"));

    [Authorize(Policy = "Registered")]
    [HttpPost("{id}/dislike")]
    public async Task<IActionResult> Dislike(ulong id) =>
        Ok(await _likes.SetReactionAsync(id, CurrentId, "dislike"));

    [Authorize(Policy = "Registered")]
    [HttpDelete("{id}/reaction")]
    [HttpDelete("{id}/like")]
    public async Task<IActionResult> RemoveReaction(ulong id) =>
        Ok(await _likes.RemoveReactionAsync(id, CurrentId));

    [AllowAnonymous]
    [HttpGet("{id}/reactions")]
    [HttpGet("{id}/likes")]
    public async Task<IActionResult> GetSummary(ulong id) =>
        Ok(await _likes.GetSummaryAsync(id, CurrentIdOrNull));

    [Authorize(Policy = "Registered")]
    [HttpGet("liked")]
    public async Task<IActionResult> GetLiked([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _likes.GetLikedAsync(CurrentId, page, pageSize));
}
