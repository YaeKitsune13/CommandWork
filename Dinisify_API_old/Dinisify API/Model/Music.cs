using System;
using System.Collections.Generic;

namespace Dinisify_API.Model;

public partial class Music
{
    public ulong Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Author { get; set; }

    public ulong OwnerId { get; set; }

    public ulong? AlbumId { get; set; }

    public string FileUrl { get; set; } = null!;

    public string? Image { get; set; }

    public string Status { get; set; } = null!;

    public string? RejectionReason { get; set; }

    public DateTime Date { get; set; }

    public virtual Album? Album { get; set; }

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual User Owner { get; set; } = null!;

    public virtual ICollection<PlaylistTrack> PlaylistTracks { get; set; } = new List<PlaylistTrack>();

    public virtual ICollection<UserLike> UserLikes { get; set; } = new List<UserLike>();

    public virtual ICollection<UserListened> UserListeneds { get; set; } = new List<UserListened>();

    public virtual ICollection<MusicGenre> Genres { get; set; } = new List<MusicGenre>();
}
