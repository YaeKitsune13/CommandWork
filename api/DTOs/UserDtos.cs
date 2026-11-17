namespace api.Dtos;

public record UserBriefDto(ulong Id, string Nickname, string? Image);

public record UserStatsDto(int Tracks, int Followers, int Following);

public record UserProfileDto(
    ulong Id,
    string Nickname,
    string? Image,
    string Privacy,
    string? Role,
    string? Email,
    string? Phone,
    DateTime? CreatedAt,
    UserStatsDto? Stats = null,
    string? FollowStatus = null,
    bool IsMe = false,
    bool IsRestricted = false,
    bool IsBlocked = false);

public record UpdateProfileDto(
    string? Email,
    string? Phone,
    string? Nickname,
    string? Image,
    string? Privacy);

public record ChangePasswordDto(string OldPassword, string NewPassword);

public record RecordListenDto(ulong MusicId);

public record HistoryItemDto(
    ulong Id,
    DateTime ListenedAt,
    TrackResponseDto Track);

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total);
