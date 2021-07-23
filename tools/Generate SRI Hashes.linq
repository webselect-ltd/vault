<Query Kind="Program">
  <Namespace>System.Security.Cryptography</Namespace>
</Query>

void Main()
{
    Directory.SetCurrentDirectory(Path.GetDirectoryName(Util.CurrentQueryPath));
    
    var distPath = @"..\Vault\wwwroot\js\dist";
    var viewsPath = @"..\Vault\Views\Home";
    
    var views = new Dictionary<string, string>();

    var files = Directory.GetFiles(distPath, "*.min.js");

    var regex = new Regex("integrity=\"sha512-.*?\"");

    foreach (var file in files)
    {
        var bytes = File.ReadAllBytes(file);

        var algorithm = SHA512.Create();

        var hashedBytes = algorithm.ComputeHash(bytes);

        var hash = Convert.ToBase64String(hashedBytes);

        $"sha512-{hash}".Dump(Path.GetFileName(file));
        
        var viewPath = $@"{viewsPath}\{Path.GetFileName(file).Replace(".min.js", string.Empty)}.cshtml".Dump();

        var content = File.ReadAllText(viewPath);

        var updatedContent = regex.Replace(content, $"integrity=\"sha512-{hash}\"");
        
        // updatedContent.Dump();
        
        File.WriteAllText(viewPath, updatedContent);
    }
}