using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/albums")]
[Tags("Albums")]
public class AlbumsController : ApiControllerBase
{
    private readonly IAlbumService _albums;

    public AlbumsController(IAlbumService albums) => _albums = albums;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] ulong? ownerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Ok(await _albums.GetAllAsync(search, ownerId, page, pageSize));

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(ulong id) =>
        Ok(await _albums.GetAsync(id, CurrentIdOrNull, CurrentRole));

    [Authorize(Policy = "Registered")]
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] AlbumCreateDto dto)
    {
        var album = await _albums.CreateAsync(dto, CurrentId);
        return StatusCode(StatusCodes.Status201Created, album);
    }

    [Authorize(Policy = "Registered")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Edit(ulong id, [FromBody] AlbumEditDto dto) =>
        Ok(await _albums.EditAsync(id, dto, CurrentId, CurrentRole));

    [Authorize(Policy = "Registered")]
    [HttpPut("edit")]
    public async Task<IActionResult> EditLegacy([FromBody] AlbumEditDto dto)
    {
        if (!dto.Id.HasValue) throw new BadRequestException("Не указан id альбома");
        return Ok(await _albums.EditAsync(dto.Id.Value, dto, CurrentId, CurrentRole));
    }

    [Authorize(Policy = "Registered")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(ulong id)
    {
        await _albums.DeleteAsync(id, CurrentId, CurrentRole);
        return NoContent();
    }
}
