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
    [HttpGet("api/tracks/{musicId:ulong}/comments")]
    [HttpGet("api/music/{musicId:ulong}/comments")]
    public async Task<IActionResult> Get(ulong musicId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await _comments.GetAsync(musicId, page, pageSize));

    [Authorize(Policy = "Registered")]
    [HttpPost("api/tracks/{musicId:ulong}/comments")]
    [HttpPost("api/music/{musicId:ulong}/comments")]
    public async Task<IActionResult> Create(ulong musicId, [FromBody] CommentTextDto dto) =>
        StatusCode(StatusCodes.Status201Created, await _comments.CreateAsync(musicId, CurrentId, dto.Text));

    [Authorize(Policy = "Registered")]
    [HttpPut("api/comments/{id:ulong}")]
    public async Task<IActionResult> Edit(ulong id, [FromBody] CommentTextDto dto) =>
        Ok(await _comments.EditAsync(id, CurrentId, dto.Text));

    [Authorize(Policy = "Registered")]
    [HttpDelete("api/comments/{id:ulong}")]
    public async Task<IActionResult> Delete(ulong id)
    {
        await _comments.DeleteAsync(id, CurrentId, CurrentRole);
        return NoContent();
    }
}
