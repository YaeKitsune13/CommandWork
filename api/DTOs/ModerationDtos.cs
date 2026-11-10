namespace api.Dtos;

public record MusicReviewDto(
    ulong? MusicId,
    string? Status,
    bool? IsApproved,
    string? RejectionReason);

public record ResolveComplaintDto(string Status = "resolved");

public record UserBlockDto(ulong? UserId, bool IsBlocked);
