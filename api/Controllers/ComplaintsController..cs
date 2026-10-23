using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace api.Controller;

[ApiController]
[Route("api/complaints")]
public class ComplaintsController : ControllerBase
{
    private readonly IComplaintService _service;

    public ComplaintsController(IComplaintService service) => _service = service;

    [HttpPost]
    [Authorize]
    public Task<IActionResult> Create([FromBody] ComplaintCreateDto dto) =>
        Handle(async () =>
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!ulong.TryParse(userIdStr, out ulong userId)) return Unauthorized();

            await _service.CreateAsync(dto, userId);
            return Ok(new { message = "Жалоба принята и будет рассмотрена" });
        });

    [HttpGet]
    public Task<IActionResult> GetAll() =>
        Handle(async () => Ok(await _service.GetAllAsync()));

    private async Task<IActionResult> Handle(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}