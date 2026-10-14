using System.ComponentModel.DataAnnotations;

namespace api.Dtos;

public record SetRoleDto([Required] string Role);

public record SetBlockDto(bool IsBlocked);

public record GenreDto(ulong Id, string Name);

public record CreateGenreDto([Required] string Name);

public record UpdateGenreDto([Required] string Name);

public record AdminAnalyticsDto(
    int TotalUsers,
    int TotalTracks,
    int TotalListens,
    int PendingTracksCount,
    int PendingComplaintsCount);
