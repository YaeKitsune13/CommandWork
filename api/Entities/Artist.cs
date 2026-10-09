using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class Artist
{
    public ulong Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Image { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Album> Albums { get; set; } = new List<Album>();

    public virtual ICollection<Music> Musics { get; set; } = new List<Music>();
}
