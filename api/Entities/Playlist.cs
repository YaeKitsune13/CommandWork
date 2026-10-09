using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class Playlist
{
    public ulong Id { get; set; }

    public string Name { get; set; } = null!;

    /// <summary>
    /// владелец плейлиста
    /// </summary>
    public ulong UserId { get; set; }

    public string Privacy { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// мягкое удаление
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<PlaylistCollaborator> PlaylistCollaborators { get; set; } = new List<PlaylistCollaborator>();

    public virtual ICollection<PlaylistTrack> PlaylistTracks { get; set; } = new List<PlaylistTrack>();

    public virtual User User { get; set; } = null!;
}
