using api.Dtos;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/complaints")]
[Tags("Complaints")]
public class ComplaintsController : ApiControllerBase
{
    private readonly IComplaintService _service;

    public ComplaintsController(IComplaintService service) => _service = service;

    [Authorize(Policy = "Registered")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ComplaintCreateDto dto) =>
        StatusCode(StatusCodes.Status201Created, await _service.CreateAsync(dto, CurrentId));
}
