using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class Music
{
    public ulong Id { get; set; }

    public string Name { get; set; } = null!;

    public ulong ArtistId { get; set; }

    /// <summary>
    /// пользователь, загрузивший трек
    /// </summary>
    public ulong OwnerId { get; set; }

    public ulong? AlbumId { get; set; }

    public string FileUrl { get; set; } = null!;

    public string? Image { get; set; }

    public uint? DurationSec { get; set; }

    public string Status { get; set; } = null!;

    public string? RejectionReason { get; set; }

    /// <summary>
    /// модератор, принявший решение
    /// </summary>
    public ulong? ModeratedBy { get; set; }

    public DateTime? ModeratedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// мягкое удаление
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    public virtual Album? Album { get; set; }

    public virtual Artist Artist { get; set; } = null!;

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();

    public virtual User? ModeratedByNavigation { get; set; }

    public virtual User Owner { get; set; } = null!;

    public virtual ICollection<PlaylistTrack> PlaylistTracks { get; set; } = new List<PlaylistTrack>();

    public virtual ICollection<UserLike> UserLikes { get; set; } = new List<UserLike>();

    public virtual ICollection<UserListened> UserListeneds { get; set; } = new List<UserListened>();

    public virtual ICollection<MusicGenre> Genres { get; set; } = new List<MusicGenre>();
}
