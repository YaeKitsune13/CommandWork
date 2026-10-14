using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class Complaint
{
    public ulong Id { get; set; }

    public ulong ReporterId { get; set; }

    public ulong? MusicId { get; set; }

    public ulong? TargetUserId { get; set; }

    public ulong? CommentId { get; set; }

    public string Reason { get; set; } = null!;

    public string Status { get; set; } = null!;

    /// <summary>
    /// модератор, рассмотревший жалобу
    /// </summary>
    public ulong? ResolvedBy { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Comment? Comment { get; set; }

    public virtual Music? Music { get; set; }

    public virtual User Reporter { get; set; } = null!;

    public virtual User? ResolvedByNavigation { get; set; }

    public virtual User? TargetUser { get; set; }
}
