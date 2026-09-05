using System;
using System.Collections.Generic;

namespace Dinisify_API.Model;

public partial class Comment
{
    public ulong Id { get; set; }

    public ulong MusicId { get; set; }

    public ulong UserId { get; set; }

    public string Text { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual Music Music { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
