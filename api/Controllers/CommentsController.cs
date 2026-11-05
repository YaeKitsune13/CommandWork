using System.Security.Claims;
using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Tags("Comments")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _comments;

    public CommentsController(ICommentService comments) => _comments = comments;

    private ulong CurrentId =>
        ulong.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new ForbiddenException("Не авторизован");

    [AllowAnonymous]
    [HttpGet("api/music/{musicId}/comments")]
    public async Task<IActionResult> Get(ulong musicId, int page = 1, int pageSize = 20) =>
        Ok(await _comments.GetAsync(musicId, page, pageSize));

    [Authorize(Policy = "Registered")]
    [HttpPost("api/music/{musicId}/comments")]
    public async Task<IActionResult> Create(ulong musicId, CommentTextDto dto) =>
        Ok(await _comments.CreateAsync(musicId, CurrentId, dto.Text));

    [Authorize(Policy = "Registered")]
    [HttpPut("api/comments/{id}")]
    public async Task<IActionResult> Edit(ulong id, CommentTextDto dto) =>
        Ok(await _comments.EditAsync(id, CurrentId, dto.Text));

    [Authorize(Policy = "Registered")]
    [HttpDelete("api/comments/{id}")]
    public async Task<IActionResult> Delete(ulong id)
    {
        await _comments.DeleteAsync(id, CurrentId, User.FindFirstValue(ClaimTypes.Role) ?? "");
        return NoContent();
    }
}
