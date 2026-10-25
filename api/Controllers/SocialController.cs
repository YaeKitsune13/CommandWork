using System.Security.Claims;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/users")]
public class SocialController : ControllerBase
{
    private readonly ISocialService _social;

    public SocialController(ISocialService social) => _social = social;

    private ulong CurrentId =>
        ulong.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new ForbiddenException("Не авторизован");

    // POST api/users/{id}/follow
    [Authorize(Policy = "Registered")]
    [HttpPost("{id}/follow")]
    public async Task<IActionResult> Follow(ulong id) =>
        Ok(await _social.FollowAsync(id, CurrentId));

    // DELETE api/users/{id}/follow
    [Authorize(Policy = "Registered")]
    [HttpDelete("{id}/follow")]
    public async Task<IActionResult> Unfollow(ulong id)
    {
        await _social.UnfollowAsync(id, CurrentId);
        return NoContent();
    }

    // PUT api/users/{id}/followers/{followerId}
    [Authorize(Policy = "Registered")]
    [HttpPut("{id}/followers/{followerId}")]
    public async Task<IActionResult> AcceptFollow(ulong id, ulong followerId)
    {
        await _social.AcceptFollowAsync(id, followerId, CurrentId);
        return NoContent();
    }

    // GET api/users/{id}/followers
    [AllowAnonymous]
    [HttpGet("{id}/followers")]
    public async Task<IActionResult> GetFollowers(ulong id) =>
        Ok(await _social.GetFollowersAsync(id));

    // GET api/users/{id}/following
    [AllowAnonymous]
    [HttpGet("{id}/following")]
    public async Task<IActionResult> GetFollowing(ulong id) =>
        Ok(await _social.GetFollowingAsync(id));
}
