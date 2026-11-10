namespace api.Dtos;

public record FollowResponseDto(
    ulong FollowerId,
    ulong FollowingId,
    string Status,
    DateTime CreatedAt);

public record FollowUserItemDto(
    UserBriefDto User,
    string Status,
    DateTime CreatedAt);
