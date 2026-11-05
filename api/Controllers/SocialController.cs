using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/users")]
[Tags("Social")]
public class SocialController : ApiControllerBase
{
    private readonly ISocialService _social;

    public SocialController(ISocialService social) => _social = social;

    [Authorize(Policy = "Registered")]
    [HttpPost("{id}/follow")]
    public async Task<IActionResult> Follow(ulong id) =>
        StatusCode(StatusCodes.Status201Created, await _social.FollowAsync(id, CurrentId));

    [Authorize(Policy = "Registered")]
    [HttpDelete("{id}/follow")]
    public async Task<IActionResult> Unfollow(ulong id)
    {
        await _social.UnfollowAsync(id, CurrentId);
        return NoContent();
    }

    [Authorize(Policy = "Registered")]
    [HttpPut("{id}/followers/{followerId}")]
    public async Task<IActionResult> AcceptFollow(ulong id, ulong followerId)
    {
        await _social.AcceptFollowAsync(id, followerId, CurrentId);
        return NoContent();
    }

    [Authorize(Policy = "Registered")]
    [HttpDelete("{id}/followers/{followerId}")]
    public async Task<IActionResult> RejectOrRemoveFollower(ulong id, ulong followerId)
    {
        await _social.RejectOrRemoveFollowerAsync(id, followerId, CurrentId);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("{id}/followers")]
    public async Task<IActionResult> GetFollowers(ulong id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _social.GetFollowersAsync(id, page, pageSize));

    [AllowAnonymous]
    [HttpGet("{id}/following")]
    public async Task<IActionResult> GetFollowing(ulong id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _social.GetFollowingAsync(id, page, pageSize));

    [Authorize(Policy = "Registered")]
    [HttpGet("{id}/follow-requests")]
    public async Task<IActionResult> GetFollowRequests(ulong id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _social.GetFollowRequestsAsync(id, CurrentId, page, pageSize));
}
