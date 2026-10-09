using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class Album
{
    public ulong Id { get; set; }

    public string Name { get; set; } = null!;

    public ulong ArtistId { get; set; }

    /// <summary>
    /// пользователь, создавший альбом
    /// </summary>
    public ulong OwnerId { get; set; }

    public string? Image { get; set; }

    public DateOnly? ReleaseDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Artist Artist { get; set; } = null!;

    public virtual ICollection<Music> Musics { get; set; } = new List<Music>();

    public virtual User Owner { get; set; } = null!;
}
