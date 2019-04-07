<Query Kind="Program">
  <Namespace>System.Security.Cryptography</Namespace>
</Query>

void Main()
{
    var path = @"C:\Src\vault\Vault\bin\Release\netcoreapp2.2\publish\wwwroot\js\dist\main.js";

    var bytes = File.ReadAllBytes(path);
    
    var algorithm = SHA512.Create();

    var hashedBytes = algorithm.ComputeHash(bytes);
    
    var hash = Convert.ToBase64String(hashedBytes);

    $"sha512-{hash}".Dump();
}
