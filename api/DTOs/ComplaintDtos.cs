namespace api.Dtos;

public record ComplaintCreateDto(
    string TargetType,
    ulong TargetId,
    string Reason,
    string? Description
);

public record ComplaintTargetBriefDto(ulong Id, string Title);

public record ComplaintResponseDto(
    ulong Id,
    string TargetType,
    ComplaintTargetBriefDto Target,
    string Reason,
    string? Description,
    UserBriefDto Reporter,
    string Status,
    DateTime CreatedAt,
    UserBriefDto? ResolvedBy = null,
    DateTime? ResolvedAt = null
);
