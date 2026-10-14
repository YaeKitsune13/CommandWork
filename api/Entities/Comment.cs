using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class Comment
{
    public ulong Id { get; set; }

    public ulong MusicId { get; set; }

    public ulong UserId { get; set; }

    public string Text { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// мягкое удаление
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();

    public virtual Music Music { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
