using System;
using System.Collections.Generic;

namespace Dinisify_API.Model;

public partial class Album
{
    public ulong Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Author { get; set; }

    public string? Image { get; set; }

    public DateOnly? Date { get; set; }

    public virtual ICollection<Music> Musics { get; set; } = new List<Music>();
}
