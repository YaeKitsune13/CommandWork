public class MusicUpload
    {
        public string Name { get; set; }
        public string Author { get; set; }
        public ulong OwnerId { get; set; }
        public ulong AlbumId { get; set; }
        public IFormFile AudioFile { get; set; }   
        public IFormFile Image { get; set; }      
    }
