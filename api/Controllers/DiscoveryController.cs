using System.Security.Claims;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api")]
public class DiscoveryController : ControllerBase
{
    private readonly IDiscoveryService _discovery;

    public DiscoveryController(IDiscoveryService discovery) => _discovery = discovery;

    private ulong? CurrentId =>
        ulong.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    [AllowAnonymous]
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string query) =>
        Ok(await _discovery.SearchAsync(query));

    [AllowAnonymous]
    [HttpGet("charts")]
    public async Task<IActionResult> GetCharts(
        [FromQuery] string? period = "week",
        [FromQuery] ulong? genreId = null,
        [FromQuery] int limit = 50) =>
        Ok(await _discovery.GetChartsAsync(period, genreId, limit));

    [AllowAnonymous]
    [HttpGet("recommendations")]
    public async Task<IActionResult> GetRecommendations([FromQuery] int limit = 20) =>
        Ok(await _discovery.GetRecommendationsAsync(CurrentId, limit));
}
