namespace Dinisify_API.Model
{
    public class MusicEdit
    {
        public ulong Id { get; set; }
        public string Name { get; set; }
        public string Author { get; set; }
        public ulong OwnerId { get; set; }
        public ulong? AlbumId { get; set; }
        public string Status { get; set; }
        public string? RejectionReason { get; set; }
    }
}