namespace api.Dtos;

public record SetReactionDto(string Type);

public record ReactionSummaryDto(ulong TrackId, int Likes, int Dislikes, string? MyReaction);

public record CommentTextDto(string Text);

public record CommentDto(
    ulong Id,
    ulong TrackId,
    UserBriefDto User,
    string Text,
    DateTime CreatedAt,
    DateTime UpdatedAt);
