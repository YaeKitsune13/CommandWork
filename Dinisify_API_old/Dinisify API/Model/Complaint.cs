using System;
using System.Collections.Generic;

namespace Dinisify_API.Model;

/// <summary>
/// target_id — полиморфная ссылка; отдельный FK не создаётся, т.к. target_type определяет таблицу
/// </summary>
public partial class Complaint
{
    public ulong Id { get; set; }

    public ulong ReporterId { get; set; }

    public string TargetType { get; set; } = null!;

    public ulong TargetId { get; set; }

    public string Reason { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual User Reporter { get; set; } = null!;
}
