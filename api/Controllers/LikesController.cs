using System.Security.Claims;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/music")]
[Tags("Likes")]
public class LikesController : ControllerBase
{
    private readonly ILikeService _likes;

    public LikesController(ILikeService likes) => _likes = likes;

    private ulong CurrentId =>
        ulong.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new ForbiddenException("Не авторизован");

    private ulong? CurrentIdOrNull =>
        ulong.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    [Authorize(Policy = "Registered")]
    [HttpPost("{id}/like")]
    public async Task<IActionResult> Like(ulong id) =>
        Ok(await _likes.SetReactionAsync(id, CurrentId, "like"));

    [Authorize(Policy = "Registered")]
    [HttpPost("{id}/dislike")]
    public async Task<IActionResult> Dislike(ulong id) =>
        Ok(await _likes.SetReactionAsync(id, CurrentId, "dislike"));

    [Authorize(Policy = "Registered")]
    [HttpDelete("{id}/like")]
    public async Task<IActionResult> RemoveReaction(ulong id) =>
        Ok(await _likes.RemoveReactionAsync(id, CurrentId));

    [AllowAnonymous]
    [HttpGet("{id}/likes")]
    public async Task<IActionResult> GetSummary(ulong id) =>
        Ok(await _likes.GetSummaryAsync(id, CurrentIdOrNull));

    [Authorize(Policy = "Registered")]
    [HttpGet("liked")]
    public async Task<IActionResult> GetLiked() =>
        Ok(await _likes.GetLikedAsync(CurrentId));
}
