using System.ComponentModel.DataAnnotations;

namespace api.Dtos;

public class TrackUploadDto
{
    [Required(ErrorMessage = "Название обязательно")]
    [StringLength(255)]
    public string Name { get; set; } = null!;

    public ulong? AlbumId { get; set; }

    public List<ulong>? GenreIds { get; set; }

    [Required(ErrorMessage = "Файл не прикреплён")]
    public IFormFile AudioFile { get; set; } = null!;

    public IFormFile? Image { get; set; }
}

public class TrackEditDto
{
    public ulong? Id { get; set; }

    [StringLength(255)]
    public string? Name { get; set; }

    public ulong? AlbumId { get; set; }

    public List<ulong>? GenreIds { get; set; }
}

public record TrackAlbumBriefDto(ulong Id, string Name);

public record TrackStatsDto(int Likes, int Dislikes, int Comments, int Listens);

public class TrackResponseDto
{
    public ulong Id { get; set; }
    public string Name { get; set; } = null!;
    public UserBriefDto Owner { get; set; } = null!;
    public TrackAlbumBriefDto? Album { get; set; }
    public List<GenreDto> Genres { get; set; } = new();
    public string FileUrl { get; set; } = null!;
    public string StreamUrl => $"/api/tracks/{Id}/stream";
    public string? Image { get; set; }
    public uint? DurationSec { get; set; }
    public string Status { get; set; } = null!;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public TrackStatsDto Stats { get; set; } = new(0, 0, 0, 0);
    public string? MyReaction { get; set; }
}

public record TrackSoundDto(string PhysicalPath, string ContentType);
