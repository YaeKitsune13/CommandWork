using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/albums")]
[Tags("Albums")]
public class AlbumsController : ControllerBase
{
    private readonly IAlbumService _albums;

    public AlbumsController(IAlbumService albums)
    {
        _albums = albums;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] string? search) =>
        Handle(async () => Ok(await _albums.GetAllAsync(search)));

    [HttpGet("{id}")]
    public Task<IActionResult> Get([FromRoute] ulong id) =>
        Handle(async () => Ok(await _albums.GetAsync(id)));
[HttpPost]
[Consumes("multipart/form-data")]
public async Task<IActionResult> Create([FromForm] AlbumCreateDto dto)
{
    var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userIdStr) || !ulong.TryParse(userIdStr, out ulong userId))
    {
        return Unauthorized();
    }

    var album = await _albums.CreateAsync(dto, userId);
    return Ok(new { message = "Альбом успешно создан", album });
}
    [HttpPut("edit")]
    public Task<IActionResult> Edit([FromBody] AlbumEditDto dto) =>
        Handle(async () =>
        {
            await _albums.EditAsync(dto);
            return Ok(new { message = "Альбом обновлен" });
        });

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete([FromRoute] ulong id) =>
        Handle(async () =>
        {
            await _albums.DeleteAsync(id);
            return Ok(new { message = "Альбом удален" });
        });

    private async Task<IActionResult> Handle(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }
}