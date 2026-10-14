namespace api.Entities;

public enum ComplaintTargetType { Track, User, Comment }

public enum ComplaintStatus 
{ 
    pending, 
    reviewed,    
    resolved     
}

public static class ComplaintStatuses
{
    public const string Pending = "Pending";
    public const string Reviewed = "Reviewed";
    public const string Resolved = "Resolved";
}

public partial class Complaint
{
    public ulong Id { get; set; }
    public ulong ReporterId { get; set; }
    
    public ulong? MusicId { get; set; }
    public ulong? TargetUserId { get; set; }
    public ulong? CommentId { get; set; }

    public string Reason { get; set; } = null!;
    
    public string Status { get; set; } = ComplaintStatuses.Pending;

    public ulong? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Comment? Comment { get; set; }
    public virtual Music? Music { get; set; }
    public virtual User Reporter { get; set; } = null!;
    public virtual User? ResolvedByNavigation { get; set; }
    public virtual User? TargetUser { get; set; }
}