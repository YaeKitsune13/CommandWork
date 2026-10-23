using System.ComponentModel.DataAnnotations;

namespace api.Dtos;

public class TrackUploadDto
{
    [Required(ErrorMessage = "Название обязательно")]
    [StringLength(200)]
    public string Name { get; set; } = null!;

    [Required(ErrorMessage = "Артист обязателен")]
    public ulong ArtistId { get; set; }

    [Required]
    public ulong OwnerId { get; set; }

    public ulong? AlbumId { get; set; }

    [Required(ErrorMessage = "Файл не прикреплён")]
    public IFormFile AudioFile { get; set; } = null!;

    public IFormFile? Image { get; set; }
}

/// <summary>
/// Редактирование владельцем. Статус и причина отказа сюда не входят,
/// их меняет только модерация (ModerationService).
/// </summary>
public class TrackEditDto
{
    [Required]
    public ulong Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = null!;

    [Required]
    public ulong ArtistId { get; set; }

    public ulong? AlbumId { get; set; }
}

public class TrackResponseDto
{
    public ulong Id { get; set; }
    public string Name { get; set; } = null!;
    public ulong ArtistId { get; set; }
    public ulong OwnerId { get; set; }
    public ulong? AlbumId { get; set; }
    public string FileUrl { get; set; } = null!;
    public string? Image { get; set; }
    public uint? DurationSec { get; set; }
    public string Status { get; set; } = null!;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public record TrackSoundDto(string PhysicalPath, string ContentType);