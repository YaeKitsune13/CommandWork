using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Tags("Comments")]
public class CommentsController : ApiControllerBase
{
    private readonly ICommentService _comments;

    public CommentsController(ICommentService comments) => _comments = comments;

    [AllowAnonymous]
    [HttpGet("api/tracks/{musicId}/comments")]
    [HttpGet("api/music/{musicId}/comments")]
    public async Task<IActionResult> Get(ulong musicId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _comments.GetAsync(musicId, page, pageSize));

    [Authorize(Policy = "Registered")]
    [HttpPost("api/tracks/{musicId}/comments")]
    [HttpPost("api/music/{musicId}/comments")]
    public async Task<IActionResult> Create(ulong musicId, [FromBody] CommentTextDto dto) =>
        StatusCode(StatusCodes.Status201Created, await _comments.CreateAsync(musicId, CurrentId, dto.Text));

    [Authorize(Policy = "Registered")]
    [HttpPut("api/comments/{id}")]
    public async Task<IActionResult> Edit(ulong id, [FromBody] CommentTextDto dto) =>
        Ok(await _comments.EditAsync(id, CurrentId, dto.Text));

    [Authorize(Policy = "Registered")]
    [HttpDelete("api/comments/{id}")]
    public async Task<IActionResult> Delete(ulong id)
    {
        await _comments.DeleteAsync(id, CurrentId, CurrentRole);
        return NoContent();
    }
}
