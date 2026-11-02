namespace api.Dtos;

public record ReactionSummaryDto(ulong MusicId, int Likes, int Dislikes, string? MyReaction);

public record LikedTrackDto(
    ulong Id,
    string Name,
    string ArtistName,
    string? Image,
    uint? DurationSec,
    DateTime LikedAt);

public record CommentTextDto(string Text);

public record CommentDto(
    ulong Id,
    ulong MusicId,
    ulong UserId,
    string? Nickname,
    string? UserImage,
    string Text,
    DateTime CreatedAt,
    DateTime UpdatedAt);
