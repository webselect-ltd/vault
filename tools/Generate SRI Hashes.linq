<Query Kind="Program">
  <Namespace>System.Security.Cryptography</Namespace>
</Query>

void Main()
{
    Directory.SetCurrentDirectory(Path.GetDirectoryName(Util.CurrentQueryPath));
    
    var distPath = @"..\Vault\wwwroot\js\dist";
    
    var files = Directory.GetFiles(distPath, "*.js");

    foreach (var file in files)
    {
        var bytes = File.ReadAllBytes(file);

        var algorithm = SHA512.Create();

        var hashedBytes = algorithm.ComputeHash(bytes);

        var hash = Convert.ToBase64String(hashedBytes);

        $"sha512-{hash}".Dump(Path.GetFileName(file));
    }
}