using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api")]
[Tags("Discovery")]
public class DiscoveryController : ApiControllerBase
{
    private readonly IDiscoveryService _discovery;
    private readonly IAdminService _admin;

    public DiscoveryController(IDiscoveryService discovery, IAdminService admin)
    {
        _discovery = discovery;
        _admin = admin;
    }

    [AllowAnonymous]
    [HttpGet("genres")]
    public async Task<IActionResult> GetGenres() =>
        Ok(await _admin.GetGenresAsync());

    [AllowAnonymous]
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? query, [FromQuery] int limit = 10) =>
        Ok(await _discovery.SearchAsync(query, CurrentIdOrNull, limit));

    [AllowAnonymous]
    [HttpGet("charts")]
    public async Task<IActionResult> GetCharts(
        [FromQuery] string? period = "week",
        [FromQuery] ulong? genreId = null,
        [FromQuery] int limit = 50) =>
        Ok(await _discovery.GetChartsAsync(period, genreId, limit, CurrentIdOrNull));

    [AllowAnonymous]
    [HttpGet("recommendations")]
    public async Task<IActionResult> GetRecommendations([FromQuery] int limit = 20) =>
        Ok(await _discovery.GetRecommendationsAsync(CurrentIdOrNull, limit));
}
