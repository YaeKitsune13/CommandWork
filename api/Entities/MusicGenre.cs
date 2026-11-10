using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class MusicGenre
{
    public ulong Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Music> Musics { get; set; } = new List<Music>();
}
