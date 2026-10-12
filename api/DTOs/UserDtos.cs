public record UserProfileDto(
    ulong Id,
    string? Nickname,
    string? Image,
    string Privacy,
    string? Role,
    string? Email,
    string? Phone,
    DateTime? CreatedAt);

public record UpdateProfileDto(
    string? Email,
    string? Phone,
    string? Nickname,
    string? Image,
    string? Privacy);

public record ChangePasswordDto(string OldPassword, string NewPassword);

public record HistoryItemDto(
    ulong Id,
    ulong MusicId,
    string TrackName,
    string? ArtistName,
    uint? DurationSec,
    DateTime ListenedAt);

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total);
