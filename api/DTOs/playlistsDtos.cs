using System.ComponentModel.DataAnnotations;

namespace api.Dtos;

public class PlaylistCreateDto
{
    [Required, MaxLength(50)]
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Privacy { get; set; }
    public bool IsPublic { get; set; } = true;
}

public class PlaylistEditDto
{
    [MaxLength(50)]
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Privacy { get; set; }
    public bool? IsPublic { get; set; }
}

public class PlaylistAddTrackDto
{
    [Required]
    public ulong TrackId { get; set; }
    public int? Position { get; set; }
}

public class PlaylistMoveTrackDto
{
    [Required]
    public int Position { get; set; }
}

public class PlaylistCollaboratorDto
{
    [Required]
    public ulong UserId { get; set; }
    public string Role { get; set; } = "editor";
}

public record PlaylistTrackDto(int Position, TrackResponseDto Track);

public record PlaylistCollaboratorResponseDto(UserBriefDto User, string Role);

public record PlaylistResponseDto(
    ulong Id,
    string Name,
    string? Description,
    string Privacy,
    bool IsPublic,
    UserBriefDto Owner,
    int TracksCount,
    string? MyRole,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<PlaylistTrackDto>? Tracks = null,
    List<PlaylistCollaboratorResponseDto>? Collaborators = null
);
