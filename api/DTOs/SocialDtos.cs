namespace api.Dtos;

public record FollowResponseDto(
    ulong FollowerId,
    ulong FollowingId,
    string Status,
    DateTime CreatedAt);

public record FollowUserItemDto(
    ulong Id,
    string? Nickname,
    string? Image,
    string Status,
    DateTime CreatedAt);
